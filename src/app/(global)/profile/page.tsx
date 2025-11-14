"use client";

// --- Imports ---
import { useAuth } from "@/context/AuthContext"
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { useRouter } from "next/navigation"
import Image from "next/image"
import api from "@/lib/api/axios"; // Your configured axios instance
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react"
import { toast } from "sonner"
import { 
  Settings, LogOut, ShieldAlert, Trash2, Camera, AlertTriangle,
  User, BookOpen, Building, LifeBuoy, Mail // ✅ 1. Add Mail icon
} from "lucide-react";
// ✅ 2. Import the new component
import RequestsInvitationsList from "@/components/dashboard/RequestsInvitationsList";

// --- Types ---
// ... (existing types: Subject, Membership, TutorProfileData, ProfileFormData) ...
interface Subject {
  name: string;
  slug: string;
}
interface Membership {
  id: number;
  organization_name: string;
  role: string;
}
interface TutorProfileData {
  user: string; // username
  display_name: string;
  headline: string;
  bio: string;
  profile_image: string | null;
  intro_video: string | null;
  education: string;
  subjects_list: Subject[];
  memberships: Membership[];
  is_verified: boolean;
}
type ProfileFormData = {
  display_name: string;
  headline: string;
  bio: string;
  education: string;
  subjects: string;
  profile_image_file: File | null;
  profile_image_preview: string | null;
  intro_video_file: File | null;
  intro_video_preview: string | null;
};


// --- Main Page Component ---
export default function TutorProfilePage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  // --- State ---
  const [profileData, setProfileData] = useState<TutorProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData | null>(null);

  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          setLoading(true);
          setError(null);
          const { data } = await api.get<TutorProfileData>(
            "/users/profile/tutor/"
          );
          setProfileData(data);
          
          setFormData({
            display_name: data.display_name,
            headline: data.headline,
            bio: data.bio,
            education: data.education || "",
            subjects: data.subjects_list.map((s: Subject) => s.name).join(', '),
            profile_image_file: null,
            profile_image_preview: data.profile_image,
            intro_video_file: null,
            intro_video_preview: data.intro_video || null
          });

        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.log("Profile not found (404), redirecting to onboarding...");
            router.push("/onboarding");
          } else {
            console.error("Failed to fetch profile data:", error)
            setError("Failed to load profile. Please try refreshing the page.");
            toast.error("Failed to load profile. Please try refreshing the page.");
          }
        } finally {
          setLoading(false)
        }
      }
    }
    if (!authLoading && user) {
        fetchProfileData()
    }
  }, [user, authLoading, router]) 

  // --- Event Handlers ---

  const handleSignOut = async () => {
    setSignOutLoading(true)
    await logout()
    router.push("/login")
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (formData) {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && formData) {
      const file = e.target.files[0];
      if (formData.profile_image_preview && formData.profile_image_preview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.profile_image_preview);
      }
      setFormData({
        ...formData,
        profile_image_file: file,
        profile_image_preview: URL.createObjectURL(file),
      });
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && formData) {
      const file = e.target.files[0];
      if (formData.intro_video_preview && formData.intro_video_preview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.intro_video_preview);
      }
      setFormData({
        ...formData,
        intro_video_file: file,
        intro_video_preview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSubmitLoading(true);

    const data = new FormData();
    data.append('display_name', formData.display_name);
    data.append('headline', formData.headline);
    data.append('bio', formData.bio);
    data.append('education', formData.education);
    
    const subjectNames = formData.subjects
                          .split(',')
                          .map(s => s.trim())
                          .filter(s => s.length > 0);
    subjectNames.forEach(name => {
      data.append('subjects', name);
    });

    if (formData.profile_image_file) {
      data.append('profile_image', formData.profile_image_file);
    }
    
    if (formData.intro_video_file) {
      data.append('intro_video', formData.intro_video_file);
    }

    try {
      const { data: updatedProfile } = await api.patch<TutorProfileData>(
        '/users/profile/tutor/', 
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      // Update state with new data
      setProfileData(updatedProfile);
      setFormData({
        display_name: updatedProfile.display_name,
        headline: updatedProfile.headline,
        bio: updatedProfile.bio,
        education: updatedProfile.education || "",
        subjects: updatedProfile.subjects_list.map((s: Subject) => s.name).join(', '),
        profile_image_file: null,
        profile_image_preview: updatedProfile.profile_image,
        intro_video_file: null,
        intro_video_preview: updatedProfile.intro_video || null
      });
    
      setIsEditing(false); // Exit edit mode
      
      toast.success("Profile updated successfully!");

    } catch (error: any) {
      console.error("Failed to update profile:", error);
      
      let errorMessage = "Failed to update profile. Please check your inputs and try again.";
      if (error.response && error.response.data) {
        const errors = error.response.data;
        if (errors.intro_video) {
          errorMessage = `Video Error: ${errors.intro_video[0]}`;
        } else if (errors.subjects) {
          errorMessage = `Subjects Error: ${errors.subjects[0]}`;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        }
      }
      toast.error(errorMessage);

    } finally {
      setSubmitLoading(false);
    }
  };
  // --- END UPDATED 'handleSubmit' ---

  // --- Loading/Error States (Unchanged) ---
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading Profile...</p>
      </div>
    )
  }

  if (!user || !profileData || !formData) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-600">Loading...</p>
        </div>
    );
  } 
  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-red-600">{error}</p>
        </div>
    );
  }


  // --- Render ---
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

          {/* === Left Sidebar (Profile Card) === */}
          <aside className="lg:w-1/4 lg:max-w-xs flex-shrink-0 lg:sticky lg:top-12">
            <div className="bg-white border border-gray-200 p-6 rounded space-y-4 flex flex-col items-center">
              
              <div className="relative w-40 h-40 bg-gray-200 mb-4 overflow-hidden rounded-full">
                <Image
                  src={formData.profile_image_preview || "https://placehold.co/160x160/CCCCCC/666666?text=?"}
                  alt="Profile"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <label 
                    htmlFor="profile_image_file" 
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer text-white opacity-0 hover:opacity-100 transition-opacity rounded-full"
                  >
                    <Camera size={24} />
                    <input 
                      type="file" 
                      id="profile_image_file" 
                      name="profile_image_file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {!isEditing ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">{profileData.display_name}</h2>
                  <p className="text-gray-600 text-sm mb-1 text-center">@{profileData.user}</p>
                  <p className="text-blue-600 text-sm font-medium mb-3 text-center">{profileData.headline}</p>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed text-center">{profileData.bio}</p>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gray-800 hover:bg-black text-white font-medium py-2 px-4 transition text-sm rounded"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-center text-sm text-gray-500">You are in edit mode</p>
                  <p className="text-center text-xs text-gray-400 mt-1">
                    Save or cancel your changes in the main content area.
                  </p>
                </div>
              )}
            </div>

            {!profileData.is_verified && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg mt-4 flex items-start gap-3 shadow-sm">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p className="text-sm">Your profile is pending verification.</p>
              </div>
            )}
          </aside>

          {/* === Right Content Area === */}
          <main className="flex-1 space-y-8">
            
            <form onSubmit={handleSubmit}>

              {/* --- Section 1: Public Profile --- */}
              <section className="bg-white border border-gray-200 p-6 rounded">
                
                {/* Section Header */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User size={20} /> Public Profile
                  </h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          if (profileData) {
                            setFormData({
                              display_name: profileData.display_name,
                              headline: profileData.headline,
                              bio: profileData.bio,
                              education: profileData.education || "",
                              subjects: profileData.subjects_list.map((s: Subject) => s.name).join(', '),
                              profile_image_file: null,
                              profile_image_preview: profileData.profile_image,
                              intro_video_file: null,
                              intro_video_preview: profileData.intro_video || null
                            });
                          }
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 transition text-sm rounded-md"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 transition text-sm rounded-md disabled:opacity-50"
                      >
                        {submitLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Single-column stack for form fields */}
                <div className="space-y-6">
                  
                  {/* Display Name */}
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="display_name"
                        id="display_name"
                        value={formData.display_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 pt-2">{profileData.display_name}</p>
                    )}
                  </div>

                  {/* Headline */}
                  <div>
                    <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="headline"
                        id="headline"
                        value={formData.headline}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Senior Python Developer & Mentor"
                      />
                    ) : (
                      <p className="text-gray-900 pt-2">{profileData.headline || "Not specified"}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">About Me (Bio)</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        id="bio"
                        rows={5}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 pt-2 whitespace-pre-line">{profileData.bio || "Not specified"}</p>
                    )}
                  </div>

                  {/* Education */}
                  <div>
                    <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="education"
                        id="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., B.Sc. Computer Science"
                      />
                    ) : (
                      <p className="text-gray-900 pt-2">{profileData.education || "Not specified"}</p>
                    )}
                  </div>

                  {/* Intro Video */}
                  <div>
                    <label htmlFor="intro_video" className="block text-sm font-medium text-gray-700 mb-1">Intro Video</label>
                    {isEditing ? (
                      <>
                        <input
                          type="file"
                          name="intro_video"
                          id="intro_video"
                          accept="video/mp4,video/webm"
                          onChange={handleVideoChange}
                          className="w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload a .mp4 or .webm file.</p>
                        
                        {formData.intro_video_preview && formData.intro_video_file && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-black">
                            <p className="text-sm text-white bg-gray-700 px-3 py-1">New Video Preview</p>
                            <video 
                              key={formData.intro_video_preview}
                              controls
                              playsInline
                              src={formData.intro_video_preview}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {formData.intro_video_preview ? (
                          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-black">
                            <video 
                              key={formData.intro_video_preview}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-auto"
                            >
                              <source src={formData.intro_video_preview} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <p className="text-gray-900 pt-2">Not specified</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* --- Section 2: Expertise & Subjects --- */}
              <section className="bg-white border border-gray-200 p-6 rounded mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={20} /> Expertise & Subjects
                </h3>
                {isEditing ? (
                  <div className="form-group">
                    <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                    <input
                      type="text"
                      name="subjects"
                      id="subjects"
                      value={formData.subjects}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter subjects separated by a comma (e.g., React, Python, Django)</p>
                  </div>
                ) : (
                  profileData.subjects_list.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.subjects_list.map((subject) => (
                        <span key={subject.slug} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">You have not added any subjects yet.</p>
                  )
                )}
              </section>
            
            </form> {/* End of the one big form */}


            {/* --- Section 3: Affiliations (Not part of the form) --- */}
            <section className="bg-white border border-gray-200 p-6 rounded">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building size={20} /> Affiliations
              </h3>
              {profileData.memberships.length > 0 ? (
                <ul className="space-y-3">
                  {profileData.memberships.map((membership) => (
                    <li key={membership.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-800">{membership.organization_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{membership.role}</p>
                        </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">You are not a member of any organization.</p>
              )}
            </section>

            {/* ✅ --- Section 4: NEW REQUESTS & INVITATIONS --- ✅ */}
            <section className="bg-white border border-gray-200 p-6 rounded">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail size={20} /> Requests & Invitations
              </h3>
              <RequestsInvitationsList />
            </section>
            
            {/* --- Section 5: Account Settings (Not part of the form) --- */}
            <section className="bg-white border border-gray-200 p-6 rounded">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LifeBuoy size={20} /> Account Settings
              </h3>
              <div className="space-y-4">
                
                {/* Change Password */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200 gap-2">
                  <p className="text-gray-700 text-sm">Update your password for better security.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium py-2 px-3 transition whitespace-nowrap flex-shrink-0 rounded flex items-center gap-1.5"
                  >
                    <ShieldAlert size={14} /> Change Password
                  </button>
                </div>

                {/* Sign Out */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200 gap-2">
                  <p className="text-gray-700 text-sm">Sign out safely from this device.</p>
                  <button
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 text-xs font-medium py-2 px-3 transition whitespace-nowrap disabled:opacity-50 flex-shrink-0 rounded flex items-center gap-1.5"
                  >
                    <LogOut size={14} /> {signOutLoading ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-2">
                  <p className="text-gray-700 text-sm">Permanently remove your account and all data.</p>
                  <button className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium py-2 px-3 transition whitespace-nowrap flex-shrink-0 rounded flex items-center gap-1.5">
                    <Trash2 size={14} /> Delete Account
                  </button>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Modal */}
      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}