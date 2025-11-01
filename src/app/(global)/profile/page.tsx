"use client"

// Use real imports for the Next.js app
import { useAuth } from "@/context/AuthContext"
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { useRouter } from "next/navigation"
import Image from "next/image"
import api from "@/lib/api/axios"; // Your configured axios instance

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react"
import { 
  Settings, LogOut, ShieldAlert, Trash2, Camera, AlertTriangle 
} from "lucide-react";

// --- Types for Tutor Profile ---
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
  intro_video_url: string;
  education: string;
  subjects_list: Subject[];
  memberships: Membership[];
  is_verified: boolean;
}

// Type for the form, which includes a file object and subjects as a string
type ProfileFormData = {
  display_name: string;
  headline: string;
  bio: string;
  intro_video_url: string;
  education: string;
  subjects: string; // Comma-separated string for editing
  profile_image_file: File | null; // For file upload
  profile_image_preview: string | null; // For image preview
};

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
    // If auth is done loading and there's no user, redirect to login
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchProfileData = async () => {
      // Only fetch if the user is authenticated
      if (user) {
        try {
          setLoading(true);
          setError(null);
          
          // Use the correct endpoint: /users/profile/tutor/
          const { data } = await api.get<TutorProfileData>(
            "/users/profile/tutor/"
          );
          
          setProfileData(data);
          // Initialize form data
          setFormData({
            display_name: data.display_name,
            headline: data.headline,
            bio: data.bio,
            intro_video_url: data.intro_video_url || "",
            education: data.education || "",
            subjects: data.subjects_list.map((s: Subject) => s.name).join(', '),
            profile_image_file: null,
            profile_image_preview: data.profile_image
          });
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            // Profile not found, redirect to onboarding as requested
            console.log("Profile not found (404), redirecting to onboarding...");
            router.push("/onboarding");
          } else {
            // Handle other errors (e.g., 500, network error)
            console.error("Failed to fetch profile data:", error)
            setError("Failed to load profile. Please try refreshing the page.");
            // You could show a toast message here instead of an alert
            alert("Failed to load profile. Please try refreshing the page.");
          }
        } finally {
          setLoading(false)
        }
      }
    }
    // Only run fetch if auth is done and user exists
    if (!authLoading && user) {
        fetchProfileData()
    }
  }, [user, authLoading, router]) // Run when user object or auth state changes

  // --- Event Handlers ---

  const handleSignOut = async () => {
    setSignOutLoading(true)
    await logout()
    // Redirect to login after sign out
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
      // Revoke old object URL to prevent memory leaks
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSubmitLoading(true);

    // We MUST use FormData to send files
    const data = new FormData();
    data.append('display_name', formData.display_name);
    data.append('headline', formData.headline);
    data.append('bio', formData.bio);
    data.append('intro_video_url', formData.intro_video_url);
    data.append('education', formData.education);
    // Send comma-separated string, backend serializer will handle it
    data.append('subjects', formData.subjects); 

    if (formData.profile_image_file) {
      data.append('profile_image', formData.profile_image_file);
    }

    try {
      // Send a PATCH request with multipart/form-data to the correct endpoint
      const { data: updatedProfile } = await api.patch<TutorProfileData>(
        '/users/profile/tutor/', 
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update state with new data
      setProfileData(updatedProfile);
      setFormData({
        display_name: updatedProfile.display_name,
        headline: updatedProfile.headline,
        bio: updatedProfile.bio,
        intro_video_url: updatedProfile.intro_video_url || "",
        education: updatedProfile.education || "",
        subjects: updatedProfile.subjects_list.map((s: Subject) => s.name).join(', '),
        profile_image_file: null,
        profile_image_preview: updatedProfile.profile_image
      });
      setIsEditing(false); // Exit edit mode
      // You could show a success toast here
      alert("Profile updated successfully!");

    } catch (error) {
      console.error("Failed to update profile:", error);
      // Show a user-friendly error
      alert("Failed to update profile. Please check your inputs and try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Loading State ---
  // Show loading while auth is checking or profile is fetching
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading Profile...</p>
      </div>
    )
  }

  // If loading is done and there's still no user or profile (e.g., redirecting)
  if (!user || !profileData || !formData) {
     // This state is usually brief as the useEffect hooks will redirect
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-600">Loading...</p>
        </div>
    );
  }
  
  // Show error message if fetching failed
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
        <div className="flex flex-col lg:flex-row gap-8">

          {/* === Left Sidebar (Profile Card) === */}
          <aside className="lg:w-1/3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-4">
              
              <div className="relative w-40 h-40 bg-gray-200 mb-4 overflow-hidden mx-auto rounded-full">
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
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer text-white opacity-0 hover:opacity-100 transition-opacity"
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
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{profileData.bio}</p>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gray-800 hover:bg-black text-white font-medium py-2 px-4 transition text-sm rounded-md"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-sm text-gray-500">You are in edit mode</p>
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 transition text-sm rounded-md disabled:opacity-50"
                  >
                    {submitLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 transition text-sm rounded-md"
                  >
                    Cancel
                  </button>
                </>
              )}
            </form>

            {!profileData.is_verified && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg mt-4 flex items-start gap-3 shadow-sm">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p className="text-sm">Your profile is pending verification. Students cannot see your profile until it is approved by an admin.</p>
              </div>
            )}
          </aside>

          {/* === Right Content Area === */}
          <main className="flex-1 space-y-8">
            
            {/* --- Profile Details Form --- */}
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-0">Profile Details</h3>

              {/* Display Name */}
              <div className="form-group">
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
                  <p className="text-gray-800">{profileData.display_name}</p>
                )}
              </div>

              {/* Headline */}
              <div className="form-group">
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
                  <p className="text-gray-800">{profileData.headline}</p>
                )}
              </div>

              {/* Bio */}
              <div className="form-group">
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
                  <p className="text-gray-800 whitespace-pre-line">{profileData.bio}</p>
                )}
              </div>

              {/* Education */}
              <div className="form-group">
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="education"
                    id="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., B.Sc. Computer Science, University of Example"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.education || "Not specified"}</p>
                )}
              </div>

              {/* Intro Video */}
              <div className="form-group">
                <label htmlFor="intro_video_url" className="block text-sm font-medium text-gray-700 mb-1">Intro Video URL</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="intro_video_url"
                    id="intro_video_url"
                    value={formData.intro_video_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., https://youtube.com/watch?v=..."
                  />
                ) : (
                  <p className="text-gray-800">{profileData.intro_video_url || "Not specified"}</p>
                )}
              </div>
            </form>

            {/* --- My Subjects --- */}
            <section className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Subjects</h3>
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
            
            {/* --- My Organizations --- */}
            <section className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Organizations</h3>
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

            {/* --- Account Settings (from your example) --- */}
            <section className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Settings size={20} /> Account Settings</h3>
              <div className="space-y-4">
                {/* Change Password */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200 gap-2">
                  <p className="text-gray-700 text-sm">Update your password for better security.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium py-2 px-3 transition whitespace-nowrap flex-shrink-0 rounded-md flex items-center gap-1.5"
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
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 text-xs font-medium py-2 px-3 transition whitespace-nowrap disabled:opacity-50 flex-shrink-0 rounded-md flex items-center gap-1.5"
                  >
                    <LogOut size={14} /> {signOutLoading ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-2">
                  <p className="text-gray-700 text-sm">Permanently remove your account and all data.</p>
                  <button className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium py-2 px-3 transition whitespace-nowrap flex-shrink-0 rounded-md flex items-center gap-1.5">
                    <Trash2 size={14} /> Delete Account
                  </button>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* This will render your real modal component */}
      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

