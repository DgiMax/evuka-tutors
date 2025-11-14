"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api/axios";
import { Loader2, Search, Users, UserCheck, Clock, Building, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation"; // ✅ FIX 1: Added missing import

// --- Interfaces ---
interface OrgPublic {
  id: number;
  name: string;
  slug: string;
  description: string;
  branding: {
    logo_url?: string;
  };
  stats: {
    tutors: number;
    students: number;
  };
  is_member: boolean;
  has_pending_request: boolean;
}

export default function OrgDiscoveryClient() {
  const [orgs, setOrgs] = useState<OrgPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { user } = useAuth(); // Get current user

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);

        // Use the new API path
        const res = await api.get(`/community/api/discover/?${params.toString()}`);
        setOrgs(res.data.results || res.data); // Handle pagination
      } catch (error) {
        toast.error("Failed to load organizations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgs();
  }, [debouncedSearch]);

  // Callback for when a join request is successful
  const handleRequestSent = (slug: string) => {
    setOrgs(
      orgs.map((o) =>
        o.slug === slug ? { ...o, has_pending_request: true } : o
      )
    );
  };

  return (
    <div className="container mx-auto p-6 md:p-10">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Discover Organizations
        </h1>
        <p className="text-lg text-gray-600">
          Browse and join communities to start learning and collaborating.
        </p>
      </div>

      <div className="relative mb-8 max-w-xl mx-auto">
        <Input
          placeholder="Search for an organization..."
          className="pl-10 h-12 rounded-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // ✅ FIX 2: Corrected typo
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orgs.map((org) => (
            <OrgCard
              key={org.slug}
              org={org}
              onRequestSent={() => handleRequestSent(org.slug)}
              isAuth={!!user}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Org Card Sub-component ---
function OrgCard({
  org,
  onRequestSent,
  isAuth,
}: {
  org: OrgPublic;
  onRequestSent: () => void;
  isAuth: boolean;
}) {
  const logoUrl = org.branding?.logo_url;
  const fallback = org.name.charAt(0);

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col transition-all hover:shadow">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={org.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-500">
                {fallback}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{org.name}</h2>
            <div className="flex gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {org.stats.tutors} Tutors
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {org.stats.students} Students
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm line-clamp-3 mb-6 min-h-[60px]">
          {org.description || "No description provided."}
        </p>
      </div>

      <div className="mt-auto bg-gray-50 p-6 border-t border-gray-100">
        <JoinButton
          org={org}
          onRequestSent={onRequestSent}
          isAuth={isAuth}
        />
      </div>
    </div>
  );
}

// --- Join Button / Dialog Sub-component ---
function JoinButton({
  org,
  onRequestSent,
  isAuth,
}: {
  org: OrgPublic;
  onRequestSent: () => void;
  isAuth: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // router is now defined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        organization: org.slug,
        message: message,
      };
      // API call to the new endpoint
      await api.post("/community/api/request-join/", payload);
      toast.success(`Request sent to ${org.name}!`);
      onRequestSent();
      setOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to send request. You may have one pending already."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 1. User is already a member
  if (org.is_member) {
    return (
      <Button variant="outline" className="w-full bg-white" disabled>
        <UserCheck className="mr-2 h-4 w-4" /> Member
      </Button>
    );
  }

  // 2. User has a pending request
  if (org.has_pending_request) {
    return (
      <Button variant="outline" className="w-full bg-white" disabled>
        <Clock className="mr-2 h-4 w-4" /> Request Pending
      </Button>
    );
  }

  // 3. User is not logged in
  if (!isAuth) {
    return (
      <Button
        className="w-full"
        onClick={() => router.push("/login?next=/discover/organizations")}
      >
        Login to Join
      </Button>
    );
  }

  // 4. User is logged in and can request to join
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Request to Join</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request to Join {org.name}</DialogTitle>
          <DialogDescription>
            Send a message to the organization admins with your request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Label htmlFor="message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm a certified tutor specializing in... and I'd love to join your community."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}