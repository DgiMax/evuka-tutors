"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api/axios";
import {
  Loader2,
  Search,
  Users,
  UserCheck,
  Clock,
  Building, // ✅ NEW: Added Building icon for empty state
  Send,
} from "lucide-react";
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
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// --- Interfaces (Unchanged) ---
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

// ✅ NEW: Reusable Empty State component (themed)
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-muted/50 p-4">
    <Building className="h-8 w-8 text-muted-foreground" />
    <p className="text-muted-foreground mt-2 text-center">{message}</p>
  </div>
);

export default function OrgDiscoveryClient() {
  const [orgs, setOrgs] = useState<OrgPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { user } = useAuth();

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

        const res = await api.get(
          `/community/discover/?${params.toString()}`
        );
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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Discover Organizations
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse and join communities to start learning and collaborating.
          </p>
        </div>

        <div className="relative mb-8 max-w-xl mx-auto">
          <Input
            placeholder="Search for an organization..."
            className="pl-10 h-12 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {/* ✅ UPDATED: Added check for orgs.length > 0 */}
        {!isLoading && orgs.length > 0 && (
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

        {/* ✅ UPDATED: Added empty state when not loading and no orgs */}
        {!isLoading && orgs.length === 0 && (
          <EmptyState
            message={
              debouncedSearch
                ? `No organizations found matching "${debouncedSearch}".`
                : "No organizations are available at this time."
            }
          />
        )}
      </div>
    </div>
  );
}

// --- Org Card Sub-component (Themed) ---
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
    <Card className="rounded-md overflow-hidden flex flex-col transition-all hover:shadow-md p-0 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={org.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground uppercase">
                {fallback}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate leading-tight">
              {org.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1 shrink-0">
                <Users className="h-4 w-4" /> {org.stats.tutors} Tutors
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Users className="h-4 w-4" /> {org.stats.students} Students
              </span>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-0 min-h-[60px]">
          {org.description || "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="mt-auto bg-muted/50 p-6 border-t border-border">
        <JoinButton
          org={org}
          onRequestSent={onRequestSent}
          isAuth={isAuth}
        />
      </CardFooter>
    </Card>
  );
}

// --- Join Button / Dialog Sub-component (Themed) ---
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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        organization: org.slug,
        message: message,
      };
      await api.post("/community/request-join/", payload);
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
      <Button variant="outline" className="w-full" disabled>
        <UserCheck className="mr-2 h-4 w-4" /> Member
      </Button>
    );
  }

  // 2. User has a pending request
  if (org.has_pending_request) {
    return (
      <Button variant="outline" className="w-full" disabled>
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