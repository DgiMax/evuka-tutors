"use client";

// --- Imports ---
import { useAuth } from "@/context/AuthContext";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api/axios"; // Your configured axios instance
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import {
  Settings,
  LogOut,
  ShieldAlert,
  Trash2,
  Camera,
  AlertTriangle,
  User,
  BookOpen,
  Building,
  LifeBuoy,
  Mail,
  LoaderCircle,
} from "lucide-react";
// ✅ 1. Import new components
import RequestsInvitationsList from "@/components/dashboard/RequestsInvitationsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// --- Types ---
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
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // --- State ---
  const [profileData, setProfileData] = useState<TutorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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
            subjects: data.subjects_list.map((s: Subject) => s.name).join(", "),
            profile_image_file: null,
            profile_image_preview: data.profile_image,
            intro_video_file: null,
            intro_video_preview: data.intro_video || null,
          });
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.log("Profile not found (404), redirecting to onboarding...");
            router.push("/onboarding");
          } else {
            console.error("Failed to fetch profile data:", error);
            setError("Failed to load profile. Please try refreshing the page.");
            toast.error("Failed to load profile. Please try refreshing the page.");
          }
        } finally {
          setLoading(false);
        }
      }
    };
    if (!authLoading && user) {
      fetchProfileData();
    }
  }, [user, authLoading, router]);

  // --- Event Handlers ---

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await logout();
    router.push("/login");
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      if (
        formData.profile_image_preview &&
        formData.profile_image_preview.startsWith("blob:")
      ) {
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
      if (
        formData.intro_video_preview &&
        formData.intro_video_preview.startsWith("blob:")
      ) {
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
    data.append("display_name", formData.display_name);
    data.append("headline", formData.headline);
    data.append("bio", formData.bio);
    data.append("education", formData.education);

    const subjectNames = formData.subjects
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    subjectNames.forEach((name) => {
      data.append("subjects", name);
    });

    if (formData.profile_image_file) {
      data.append("profile_image", formData.profile_image_file);
    }

    if (formData.intro_video_file) {
      data.append("intro_video", formData.intro_video_file);
    }

    try {
      const { data: updatedProfile } = await api.patch<TutorProfileData>(
        "/users/profile/tutor/",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Update state with new data
      setProfileData(updatedProfile);
      setFormData({
        display_name: updatedProfile.display_name,
        headline: updatedProfile.headline,
        bio: updatedProfile.bio,
        education: updatedProfile.education || "",
        subjects: updatedProfile.subjects_list
          .map((s: Subject) => s.name)
          .join(", "),
        profile_image_file: null,
        profile_image_preview: updatedProfile.profile_image,
        intro_video_file: null,
        intro_video_preview: updatedProfile.intro_video || null,
      });

      setIsEditing(false); // Exit edit mode

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      let errorMessage =
        "Failed to update profile. Please check your inputs and try again.";
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

  // --- Loading/Error States (Themed) ---
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  if (!user || !profileData || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // --- Render (Themed) ---
  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          {/* === Left Sidebar (Profile Card) === */}
          <aside className="lg:w-1/4 lg:max-w-xs flex-shrink-0 lg:sticky lg:top-12">
            {/* UPDATED: Uses themed card, border, and radius */}
            <div className="bg-card border border-border p-6 rounded-md space-y-4 flex flex-col items-center">
              <div className="relative w-40 h-40 bg-muted mb-4 overflow-hidden rounded-full">
                <Image
                  src={
                    formData.profile_image_preview ||
                    "https://placehold.co/160x160/f5f7f9/2d3339?text=?"
                  }
                  alt="Profile"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  unoptimized
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
                  <h2 className="text-xl font-semibold text-foreground mb-1 text-center">
                    {profileData.display_name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-1 text-center">
                    @{profileData.user}
                  </p>
                  <p className="text-primary text-sm font-medium mb-3 text-center">
                    {profileData.headline}
                  </p>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed text-center">
                    {profileData.bio}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    // UPDATED: Using themed button (foreground)
                    className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-md"
                  >
                    Edit Profile
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-center text-sm text-muted-foreground">
                    You are in edit mode
                  </p>
                  <p className="text-center text-xs text-muted-foreground/80 mt-1">
                    Save or cancel your changes in the main content area.
                  </p>
                </div>
              )}
            </div>

            {!profileData.is_verified && (
              // UPDATED: Kept warning colors, changed radius
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-md mt-4 flex items-start gap-3 shadow-sm">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p className="text-sm">Your profile is pending verification.</p>
              </div>
            )}
          </aside>

          {/* === Right Content Area === */}
          <main className="flex-1 space-y-8">
            <form onSubmit={handleSubmit}>
              {/* --- Section 1: Public Profile --- */}
              {/* UPDATED: Themed card and radius */}
              <section className="bg-card border border-border p-6 rounded-md">
                {/* UPDATED: Responsive header and themed border/text */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 mb-6 gap-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <User size={20} /> Public Profile
                  </h3>
                  {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          if (profileData) {
                            setFormData({
                              display_name: profileData.display_name,
                              headline: profileData.headline,
                              bio: profileData.bio,
                              education: profileData.education || "",
                              subjects: profileData.subjects_list
                                .map((s: Subject) => s.name)
                                .join(", "),
                              profile_image_file: null,
                              profile_image_preview: profileData.profile_image,
                              intro_video_file: null,
                              intro_video_preview:
                                profileData.intro_video || null,
                            });
                          }
                        }}
                        className="rounded-md w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitLoading}
                        className="rounded-md w-full sm:w-auto"
                      >
                        {submitLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Single-column stack for form fields */}
                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label
                      htmlFor="display_name"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Display Name
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        name="display_name"
                        id="display_name"
                        value={formData.display_name}
                        onChange={handleInputChange}
                        className="rounded-md"
                      />
                    ) : (
                      <p className="text-foreground pt-2">
                        {profileData.display_name}
                      </p>
                    )}
                  </div>

                  {/* Headline */}
                  <div>
                    <label
                      htmlFor="headline"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Headline
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        name="headline"
                        id="headline"
                        value={formData.headline}
                        onChange={handleInputChange}
                        className="rounded-md"
                        placeholder="e.g., Senior Python Developer & Mentor"
                      />
                    ) : (
                      <p className="text-foreground pt-2">
                        {profileData.headline || "Not specified"}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      About Me (Bio)
                    </label>
                    {isEditing ? (
                      <Textarea
                        name="bio"
                        id="bio"
                        rows={5}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="rounded-md"
                      />
                    ) : (
                      <p className="text-foreground pt-2 whitespace-pre-line">
                        {profileData.bio || "Not specified"}
                      </p>
                    )}
                  </div>

                  {/* Education */}
                  <div>
                    <label
                      htmlFor="education"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Education
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        name="education"
                        id="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        className="rounded-md"
                        placeholder="e.g., B.Sc. Computer Science"
                      />
                    ) : (
                      <p className="text-foreground pt-2">
                        {profileData.education || "Not specified"}
                      </p>
                    )}
                  </div>

                  {/* Intro Video */}
                  <div>
                    <label
                      htmlFor="intro_video"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Intro Video
                    </label>
                    {isEditing ? (
                      <>
                        <Input
                          type="file"
                          name="intro_video"
                          id="intro_video"
                          accept="video/mp4,video/webm"
                          onChange={handleVideoChange}
                          // UPDATED: Themed file input
                          className="w-full text-sm text-muted-foreground
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary/10 file:text-primary
                            file:hover:bg-primary/20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a .mp4 or .webm file.
                        </p>

                        {formData.intro_video_preview &&
                          formData.intro_video_file && (
                            <div className="mt-2 rounded-md overflow-hidden border border-border bg-black">
                              <p className="text-sm text-background bg-foreground/80 px-3 py-1">
                                New Video Preview
                              </p>
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
                          <div className="mt-2 rounded-md overflow-hidden border border-border bg-black">
                            <video
                              key={formData.intro_video_preview}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-auto"
                            >
                              <source
                                src={formData.intro_video_preview}
                                type="video/mp4"
                              />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <p className="text-foreground pt-2">Not specified</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* --- Section 2: Expertise & Subjects --- */}
              <section className="bg-card border border-border p-6 rounded-md mt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen size={20} /> Expertise & Subjects
                </h3>
                {isEditing ? (
                  <div className="form-group">
                    <label
                      htmlFor="subjects"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Subjects
                    </label>
                    <Input
                      type="text"
                      name="subjects"
                      id="subjects"
                      value={formData.subjects}
                      onChange={handleInputChange}
                      className="rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter subjects separated by a comma (e.g., React, Python,
                      Django)
                    </p>
                  </div>
                ) : profileData.subjects_list.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileData.subjects_list.map((subject) => (
                      // UPDATED: Uses theme secondary (Teal)
                      <span
                        key={subject.slug}
                        className="bg-secondary/20 text-secondary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    You have not added any subjects yet.
                  </p>
                )}
              </section>
            </form>{" "}
            {/* End of the one big form */}
            {/* --- Section 3: Affiliations (Not part of the form) --- */}
            <section className="bg-card border border-border p-6 rounded-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building size={20} /> Affiliations
              </h3>
              {profileData.memberships.length > 0 ? (
                <ul className="space-y-3">
                  {profileData.memberships.map((membership) => (
                    <li
                      key={membership.id}
                      className="flex justify-between items-center border-b border-border pb-2 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {membership.organization_name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {membership.role}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  You are not a member of any organization.
                </p>
              )}
            </section>
            {/* --- Section 4: NEW REQUESTS & INVITATIONS --- */}
            <section className="bg-card border border-border p-6 rounded-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Mail size={20} /> Requests & Invitations
              </h3>
              <RequestsInvitationsList />
            </section>
            {/* --- Section 5: Account Settings (Not part of the form) --- */}
            <section className="bg-card border border-border p-6 rounded-md">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <LifeBuoy size={20} /> Account Settings
              </h3>
              <div className="space-y-4">
                {/* Change Password */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-border gap-2">
                  <p className="text-muted-foreground text-sm">
                    Update your password for better security.
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-md flex-shrink-0 w-full sm:w-auto"
                  >
                    <ShieldAlert size={14} className="mr-1.5" /> Change Password
                  </Button>
                </div>

                {/* Sign Out */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-border gap-2">
                  <p className="text-muted-foreground text-sm">
                    Sign out safely from this device.
                  </p>
                  <Button
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    variant="outline" // Using outline, but with warning colors
                    size="sm"
                    className="rounded-md flex-shrink-0 w-full sm:w-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-200"
                  >
                    <LogOut size={14} className="mr-1.5" />{" "}
                    {signOutLoading ? "Signing Out..." : "Sign Out"}
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-2">
                  <p className="text-muted-foreground text-sm">
                    Permanently remove your account and all data.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-md flex-shrink-0 w-full sm:w-auto bg-destructive/10 hover:bg-destructive/20 text-destructive"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Delete Account
                  </Button>
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
  );
}