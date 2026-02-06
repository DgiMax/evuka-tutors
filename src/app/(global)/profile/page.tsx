"use client";

import { useAuth } from "@/context/AuthContext";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api/axios";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Camera,
  AlertTriangle,
  User,
  BookOpen,
  Building,
  LifeBuoy,
  Mail,
  LogOut,
  ShieldAlert,
  Trash2,
  Save,
  X,
  AlertCircle
} from "lucide-react";

import RequestsInvitationsList from "@/components/dashboard/RequestsInvitationsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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
  user: string;
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

const Loader2 = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95%] sm:max-w-[420px] p-0 gap-0 border-border/80 rounded-md bg-background overflow-hidden [&>button]:hidden transition-all duration-300 top-[5%] md:top-[10%] translate-y-0 shadow-none"
      >
        <DialogHeader className="px-4 md:px-6 py-4 border-b bg-muted/50 flex flex-row items-center justify-between shrink-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-red-100/50 flex items-center justify-center shrink-0 border border-red-200/60">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            <DialogTitle className="text-base md:text-lg font-bold tracking-tight text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogClose className="rounded-md p-2 hover:bg-muted transition -mr-2">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DialogClose>
        </DialogHeader>

        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                Are you sure you want to proceed with this action?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-md p-3 flex gap-3 items-start">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-[11px] text-red-700 font-bold uppercase tracking-wider leading-normal">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 mt-auto">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest border-border shadow-none bg-background"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoading}
            className="h-11 md:h-10 w-full sm:w-auto px-6 rounded-md font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-none bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProfileSkeleton = () => (
  <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4 space-y-4">
          <div className="bg-card border border-border p-6 rounded-md flex flex-col items-center">
            <Skeleton circle width={140} height={140} />
            <Skeleton width={120} height={24} className="mt-4" />
            <Skeleton width={80} height={16} className="mt-2" />
          </div>
        </aside>
        <main className="flex-1 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-md">
              <Skeleton width={150} height={24} className="mb-6" />
              <div className="space-y-4">
                <Skeleton height={40} />
                <Skeleton height={100} />
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  </SkeletonTheme>
);

export default function TutorProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<TutorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          setLoading(true);
          const { data } = await api.get<TutorProfileData>("/users/profile/tutor/");
          setProfileData(data);
          setFormData({
            display_name: data.display_name,
            headline: data.headline,
            bio: data.bio,
            education: data.education || "",
            subjects: data.subjects_list.map((s) => s.name).join(", "),
            profile_image_file: null,
            profile_image_preview: data.profile_image,
            intro_video_file: null,
            intro_video_preview: data.intro_video || null,
          });
        } catch (error: any) {
          if (error.response?.status === 404) router.push("/onboarding");
          else toast.error("Failed to load profile.");
        } finally {
          setLoading(false);
        }
      }
    };
    if (!authLoading && user) fetchProfileData();
  }, [user, authLoading, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (formData) setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && formData) {
      const file = e.target.files[0];
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

    const data = new FormData();
    data.append("display_name", formData.display_name);
    data.append("headline", formData.headline);
    data.append("bio", formData.bio);
    data.append("education", formData.education);

    formData.subjects.split(",").forEach((name) => {
      if (name.trim()) data.append("subjects", name.trim());
    });

    if (formData.profile_image_file) data.append("profile_image", formData.profile_image_file);
    if (formData.intro_video_file) data.append("intro_video", formData.intro_video_file);

    try {
      const { data: updated } = await api.patch<TutorProfileData>("/users/profile/tutor/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileData(updated);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error("Update failed. Please check file sizes or inputs.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (authLoading || loading) return <ProfileSkeleton />;
  if (!user || !profileData || !formData) return null;

  return (
    <div className="bg-[#EFFAFC] min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="lg:w-1/4 flex-shrink-0">
            <div className="bg-card border border-border p-6 rounded-md flex flex-col items-center shadow-none">
              <div className="relative w-36 h-36 bg-muted mb-6 overflow-hidden rounded-full border-4 border-background">
                <Image
                  src={formData.profile_image_preview || "/avatar-placeholder.png"}
                  alt="Profile"
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                  unoptimized
                />
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer text-white opacity-0 hover:opacity-100 transition-opacity">
                    <Camera size={20} />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground leading-tight">{profileData.display_name}</h2>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">@{profileData.user}</p>
                <p className="text-xs text-muted-foreground font-medium pt-2">{profileData.headline}</p>
              </div>

              <div className="w-full pt-6">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="w-full h-10 rounded-md font-bold text-xs uppercase tracking-widest shadow-none">
                    Edit Profile
                  </Button>
                ) : (
                  <Badge variant="outline" className="w-full justify-center py-2 border-primary/20 text-primary bg-primary/5 rounded-md">
                    Editing Mode
                  </Badge>
                )}
              </div>
            </div>

            {!profileData.is_verified && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mt-4 flex items-start gap-3 shadow-none">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold uppercase tracking-tight leading-normal">Verification Pending</p>
              </div>
            )}
          </aside>

          <main className="flex-1 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="bg-card border border-border p-6 rounded-md shadow-none relative">
                <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <User size={16} className="text-primary" /> Public Identity
                  </h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-md h-8 text-xs font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors">
                        <X size={14} className="mr-1" /> Cancel
                      </Button>
                      <Button type="submit" disabled={submitLoading} size="sm" className="rounded-md h-8 text-xs font-bold uppercase tracking-widest shadow-none">
                        {submitLoading ? "..." : <><Save size={14} className="mr-1" /> Save</>}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Display Name</label>
                    {isEditing ? <Input name="display_name" value={formData.display_name} onChange={handleInputChange} className="h-10 rounded-md border-border shadow-none" /> : <p className="text-sm font-semibold ml-1">{profileData.display_name}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Headline</label>
                    {isEditing ? <Input name="headline" value={formData.headline} onChange={handleInputChange} className="h-10 rounded-md border-border shadow-none" /> : <p className="text-sm font-semibold ml-1">{profileData.headline || "None"}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">About Me (Bio)</label>
                    {isEditing ? <Textarea name="bio" rows={4} value={formData.bio} onChange={handleInputChange} className="rounded-md border-border shadow-none resize-none" /> : <p className="text-sm leading-relaxed ml-1 opacity-80">{profileData.bio || "No bio added yet."}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-1 pt-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Education Credentials</label>
                    {isEditing ? <Input name="education" value={formData.education} onChange={handleInputChange} className="h-10 rounded-md border-border shadow-none" /> : <p className="text-sm font-semibold ml-1">{profileData.education || "Not specified"}</p>}
                  </div>
                </div>
              </section>

              <section className="bg-card border border-border p-6 rounded-md shadow-none">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" /> Expertise
                </h3>
                {isEditing ? (
                  <div className="space-y-1">
                    <Input name="subjects" value={formData.subjects} onChange={handleInputChange} className="h-10 rounded-md border-border shadow-none" />
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-2 ml-1">Comma separated (e.g. Physics, Math, SEO)</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profileData.subjects_list.map((s) => (
                      <span key={s.slug} className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </form>

            <section className="bg-card border border-border p-6 rounded-md shadow-none">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                <Building size={16} className="text-primary" /> Affiliations
              </h3>
              <div className="space-y-3">
                {profileData.memberships.map((m) => (
                  <div key={m.id} className="flex justify-between items-center border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm font-bold">{m.organization_name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">{m.role}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-card border border-border p-6 rounded-md shadow-none">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                <Mail size={16} className="text-primary" /> Invitations
              </h3>
              <RequestsInvitationsList />
            </section>

            <section className="bg-card border border-border p-6 rounded-md shadow-none">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
                <LifeBuoy size={16} className="text-primary" /> Security
              </h3>
              <div className="divide-y divide-border/50">
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Change Password</p>
                    <p className="text-xs text-muted-foreground">Keep your account secure.</p>
                  </div>
                  <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="rounded-md font-bold text-[10px] uppercase shadow-none">
                    <ShieldAlert size={14} className="mr-2" /> Update
                  </Button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Session Control</p>
                    <p className="text-xs text-muted-foreground">Sign out of this session.</p>
                  </div>
                  <Button onClick={() => logout()} variant="outline" size="sm" className="rounded-md font-bold text-[10px] uppercase shadow-none border-amber-200 text-amber-700 hover:bg-amber-50">
                    <LogOut size={14} className="mr-2" /> Exit
                  </Button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-red-600">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">Deactivate your profile.</p>
                    <div className="pt-1">
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-100 uppercase tracking-tight">
                          Under Development
                        </span>
                    </div>
                  </div>
                  <Button 
                    disabled 
                    variant="outline" 
                    size="sm" 
                    className="rounded-md font-bold text-[10px] uppercase shadow-none border-red-100 text-red-400 cursor-not-allowed opacity-60"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
           setIsDeleteModalOpen(false);
        }}
        title="Delete Account"
        description="Permanently remove your account and all associated data from the Evuka Ecosystem."
      />
    </div>
  );
}