// components/TutorOnboardingForm.tsx

"use client";

import { 
  useState, 
  ChangeEvent, 
  KeyboardEvent, 
  Dispatch, 
  SetStateAction, 
  ElementType 
} from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Edit2, 
  Upload, 
  User, 
  Video, 
  X, 
  BookOpen, 
  GraduationCap 
} from 'lucide-react';

// --- Form Data State Type ---
type FormData = {
  profileImage: File | null;
  displayName: string;
  headline: string;
  bio: string;
  videoUrl: string;
  subjects: string[];
  education: string;
};

// --- Prop Types for Helper Components ---
type ImageUploaderProps = {
  imagePreview: string | null;
  setImagePreview: Dispatch<SetStateAction<string | null>>;
  setFormData: Dispatch<SetStateAction<FormData>>;
};

type SubjectInputProps = {
  subjects: string[];
  setSubjects: (newSubjects: string[]) => void;
};

type VideoPreviewerProps = {
  videoUrl: string;
};

type FormInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon: ElementType; 
  placeholder?: string;
};

// --- Helper: Image Uploader Component ---
const ImageUploader = ({ 
  imagePreview, 
  setImagePreview, 
  setFormData 
}: ImageUploaderProps) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      setFormData((prev: FormData) => ({ ...prev, profileImage: file }));
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev: FormData) => ({ ...prev, profileImage: null }));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-32 w-32">
        {imagePreview ? (
          <>
            <img 
              src={imagePreview} 
              alt="Profile Preview" 
              className="h-full w-full rounded-full object-cover" 
            />
            <label 
              htmlFor="profileImage" 
              className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-500 p-2 text-white shadow hover:bg-blue-600"
            >
              <Edit2 className="h-4 w-4" />
            </label>
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-0 right-0 -mr-2 -mt-2 cursor-pointer rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <label 
            htmlFor="profileImage" 
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100"
          >
            <Upload className="h-8 w-8" />
            <span className="mt-1 text-sm">Upload Photo</span>
          </label>
        )}
      </div>
      <input
        id="profileImage"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

// --- Helper: Subject Tag Input ---
const SubjectInput = ({ subjects, setSubjects }: SubjectInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!subjects.includes(inputValue.trim())) {
        setSubjects([...subjects, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setSubjects(subjects.filter((sub: string) => sub !== subjectToRemove));
  };

  return (
    <div>
      <label htmlFor="subjects" className="block text-sm font-medium text-gray-700">
        Subjects Taught (press Enter to add)
      </label>
      <div className="mt-1 flex flex-wrap gap-2 rounded border border-gray-300 p-2">
        {subjects.map((sub: string) => (
          <span 
            key={sub} 
            className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-sm text-blue-700"
          >
            {sub}
            <button
              type="button"
              onClick={() => removeSubject(sub)}
              className="rounded-full hover:bg-blue-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={subjects.length === 0 ? "e.g., React, Django, Next.js" : ""}
          className="min-w-[100px] flex-1 border-none p-1 text-sm outline-none focus:ring-0"
        />
      </div>
    </div>
  );
};

// --- Helper: Video Previewer ---
const VideoPreviewer = ({ videoUrl }: VideoPreviewerProps) => {
  let embedUrl = '';
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    const videoId = videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop();
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  if (!embedUrl) {
    return (
      <div className="mt-2 flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Enter a valid YouTube URL to preview.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 aspect-video w-full">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="Introductory Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded"
      ></iframe>
    </div>
  );
};


// --- Main Form Component ---
export default function TutorOnboardingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    profileImage: null,
    displayName: '',
    headline: '',
    bio: '',
    videoUrl: '',
    subjects: [],
    education: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { submitTutorProfile } = useAuth();
  const router = useRouter();

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setSubjects = (newSubjects: string[]) => {
    setFormData((prev) => ({ ...prev, subjects: newSubjects }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // The 'formData' state already has all our data
      await submitTutorProfile(formData);
      
      // Success!
      alert("Profile Created! Redirecting to your dashboard...");
      
      // The auth context has already refreshed the user,
      // so the protected layout will now let them pass.
      router.push('/dashboard'); 

    } catch (err: any) {
      console.error("Profile submission failed:", err);
      // Handle errors from the API
      if (err.response && err.response.data) {
        // Convert Django errors to a string
        const errorMsg = Object.values(err.response.data).flat().join(' ');
        setSubmitError(errorMsg || "Failed to submit profile. Please try again.");
      } else {
        setSubmitError("An unknown error occurred. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  // --- Common Input Component ---
  const FormInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    icon: Icon, 
    placeholder = "" 
  }: FormInputProps) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded border border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>
  );
  
  // --- Step 1: Essentials (Now with 2-column layout on desktop) ---
  const Step1 = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Column 1: Image Uploader */}
      <div className="md:col-span-1">
        <ImageUploader 
          imagePreview={imagePreview} 
          setImagePreview={setImagePreview} 
          setFormData={setFormData}
        />
      </div>
      
      {/* Column 2: Form Fields */}
      <div className="space-y-6 md:col-span-2">
        <FormInput
          id="displayName"
          label="Display Name"
          value={formData.displayName}
          onChange={handleInputChange}
          icon={User}
          placeholder="e.g., Jane D."
        />
        <FormInput
          id="headline"
          label="Headline"
          value={formData.headline}
          onChange={handleInputChange}
          icon={GraduationCap}
          placeholder="e.g., Senior Django & React Developer"
        />
      </div>
    </div>
  );

  // --- Step 2: Details (Single column is best for these fields) ---
  const Step2 = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Detailed Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell students about your teaching style, experience, and passion..."
          className="mt-1 w-full rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <FormInput
        id="videoUrl"
        label="Introductory Video (Optional)"
        value={formData.videoUrl}
        onChange={handleInputChange}
        icon={Video}
        placeholder="e.g., https://www.youtube.com/watch?v=..."
      />
      {formData.videoUrl && <VideoPreviewer videoUrl={formData.videoUrl} />}
    </div>
  );

  // --- Step 3: Expertise (Single column is best for these fields) ---
  const Step3 = () => (
    <div className="space-y-6">
      <SubjectInput subjects={formData.subjects} setSubjects={setSubjects} />
      <FormInput
        id="education"
        label="Top Education"
        value={formData.education}
        onChange={handleInputChange}
        icon={BookOpen}
        placeholder="e.g., B.Sc. Computer Science at University of Nairobi"
      />
    </div>
  );

  return (
    // --- Main Container: Width increased to max-w-2xl ---
    <div className="mx-auto w-full max-w-2xl rounded border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      {/* --- Header --- */}
      <h2 className="text-2xl font-semibold text-gray-800">Create Your Tutor Profile</h2>
      <p className="mt-1 text-sm text-gray-500">Step {step} of 3</p>

      {/* --- Progress Bar --- */}
      <div className="mt-6 overflow-hidden rounded bg-gray-200">
        <div 
          className="h-2 rounded bg-blue-500 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>
      
      <form className="mt-8" onSubmit={handleSubmit}>
        <div> 
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </div>

        {submitError && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          {step < 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1 rounded border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="submit"
              disabled={isSubmitting} // <-- 7. Disable button while submitting
              className="flex items-center gap-1 rounded border border-transparent bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : (
                <>
                  Finish & Submit
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}