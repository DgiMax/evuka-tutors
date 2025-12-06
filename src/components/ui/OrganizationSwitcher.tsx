"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Link from "next/link";
import { Building, Plus, Search } from "lucide-react";

const PERSONAL_ACCOUNT_VALUE = "__personal__";

// Define domains. Fallback to production URLs if Env vars are missing.
const STUDENT_DOMAIN = process.env.NEXT_PUBLIC_STUDENT_URL || "https://e-vuka.com";
const TUTOR_DOMAIN = process.env.NEXT_PUBLIC_TUTOR_URL || "https://tutors.e-vuka.com";

interface OrganizationSwitcherProps {
  triggerClassName?: string;
}

export default function OrganizationSwitcher({
  triggerClassName,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeSlug } = useActiveOrg();

  if (loading || !user) return null;

  const organizations = user.organizations ?? [];
  const selectedValue = activeSlug ?? PERSONAL_ACCOUNT_VALUE;

  const handleSelectChange = (value: string) => {
    if (value === selectedValue) return;

    // 1. Handle Personal Account Switch
    if (value === PERSONAL_ACCOUNT_VALUE) {
      // Logic: If on tutor domain, maybe force them to student domain for personal? 
      // For now, we assume personal dashboard exists on the current domain.
      router.push("/");
      return;
    }

    // 2. Find the target organization details
    const targetOrg = organizations.find((org) => org.organization_slug === value);

    if (!targetOrg) {
      // Fallback if org not found in context (shouldn't happen)
      router.push(`/${value}/`);
      return;
    }

    // 3. Determine Target Domain based on Role
    const isStudentRole = targetOrg.role === "student";
    const targetBaseUrl = isStudentRole ? STUDENT_DOMAIN : TUTOR_DOMAIN;

    // 4. Check if we are ALREADY on that domain
    // We strip protocols/slashes to compare strictly domain parts or full origins
    const currentOrigin = window.location.origin; // e.g., "https://tutors.e-vuka.com"
    
    // Helper to normalize URLs for comparison (remove trailing slashes)
    const normalize = (url: string) => url.replace(/\/$/, "");

    if (normalize(currentOrigin) === normalize(targetBaseUrl)) {
      // SAME DOMAIN: Use Client-Side Navigation (Faster)
      router.push(`/${value}/`);
    } else {
      // DIFFERENT DOMAIN: Use Hard Redirect
      window.location.href = `${targetBaseUrl}/${value}/`;
    }
  };

  return (
    <Select
      key={activeSlug ?? "personal"}
      value={selectedValue}
      onValueChange={handleSelectChange}
    >
      <SelectTrigger
        className={cn(
          "justify-between truncate", 
          triggerClassName
        )}
        aria-label="Select account or organization"
      >
        <SelectValue placeholder="Select account..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={PERSONAL_ACCOUNT_VALUE}>
            {user.username} (Personal)
          </SelectItem>
        </SelectGroup>

        {organizations.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Organizations</SelectLabel>
              {organizations
                .filter(
                  (org) =>
                    org.organization_slug && org.organization_slug.trim() !== ""
                )
                .map((org) => (
                  <SelectItem
                    key={org.organization_slug}
                    value={org.organization_slug}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                        <span>
                          {org.organization_name.length > 14
                            ? org.organization_name.slice(0, 14) + "..."
                            : org.organization_name}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase border px-1 rounded">
                            {org.role === 'student' ? 'STU' : 'TUT'}
                        </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectGroup>
          </>
        )}

        {/* Action links */}
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Actions</SelectLabel>
          <Link
            href="/discover/organizations"
            className={cn(
              "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors",
              "focus:bg-accent focus:text-accent-foreground hover:bg-accent"
            )}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Discover Organizations</span>
          </Link>
          <Link
            href="/create-org"
            className={cn(
              "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors",
              "focus:bg-accent focus:text-accent-foreground hover:bg-accent"
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Organization</span>
          </Link>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}