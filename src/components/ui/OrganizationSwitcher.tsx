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
import { Plus, Search } from "lucide-react";

const PERSONAL_ACCOUNT_VALUE = "__personal__";

export default function OrganizationSwitcher({ triggerClassName }: { triggerClassName?: string }) {
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
      return;
    }

    router.push(`/${value}`);
  };

  return (
    <Select key={activeSlug ?? "personal"} value={selectedValue} onValueChange={handleSelectChange}>
      <SelectTrigger className={cn("justify-between truncate rounded-md shadow-none", triggerClassName)}>
        <SelectValue placeholder="Select account..." />
      </SelectTrigger>
      <SelectContent className="rounded-md shadow-none border-border">
        <SelectGroup>
          <SelectItem value={PERSONAL_ACCOUNT_VALUE} className="cursor-pointer">
            {user.username} (Personal)
          </SelectItem>
        </SelectGroup>

        {organizations.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                Organizations
              </SelectLabel>
              <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 scrollbar-track-transparent">
                {organizations
                  .filter((org) => org.organization_slug?.trim())
                  .map((org) => (
                    <SelectItem 
                      key={org.organization_slug} 
                      value={org.organization_slug}
                      disabled={!org.is_published}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="truncate">
                          {org.organization_name.length > 18 ? org.organization_name.slice(0, 18) + "..." : org.organization_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase border border-border px-1 rounded font-bold shrink-0">
                          {org.role === "student" ? "STU" : "TUT"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </div>
            </SelectGroup>
          </>
        )}

        <SelectSeparator />
        <SelectGroup>
          <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
            Actions
          </SelectLabel>
          <div className="space-y-0.5">
            <Link 
              href="/discover/organizations" 
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent transition-colors"
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Discover Organizations</span>
            </Link>
            <Link 
              href="/organizations/create" 
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Organization</span>
            </Link>
          </div>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}