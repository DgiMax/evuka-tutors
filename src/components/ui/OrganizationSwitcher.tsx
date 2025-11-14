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

// ✅ 1. Import Link and icons
import Link from "next/link";
import { Building, Plus, Search } from "lucide-react";

const PERSONAL_ACCOUNT_VALUE = "__personal__";

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

    if (value === PERSONAL_ACCOUNT_VALUE) {
      router.push("/");
    } else {
      router.push(`/${value}/`);
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
          "w-full min-w-[200px] sm:w-auto justify-between border-gray-300",
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
              {organizations.map((org) => (
                <SelectItem
                  key={org.organization_slug}
                  value={org.organization_slug}
                >
                  {org.organization_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}

        {/* ✅ 2. Add new section for actions */}
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