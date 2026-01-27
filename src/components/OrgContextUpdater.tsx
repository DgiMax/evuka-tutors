"use client";

import { useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";

interface OrgContextUpdaterProps {
  slug: string | null;
}

const RESERVED_SLUGS = ["organizations", "profile", "discover", "onboarding", "settings"];

export default function OrgContextUpdater({ slug }: OrgContextUpdaterProps) {
  const { activeSlug, setActiveSlug, setActiveRole } = useActiveOrg();
  const { user } = useAuth();

  useEffect(() => {
    const validatedSlug = RESERVED_SLUGS.includes(slug || "") ? null : slug;

    if (activeSlug !== validatedSlug) {
      setActiveSlug(validatedSlug);

      if (!validatedSlug) {
        setActiveRole(null);
      } else if (user?.organizations) {
        const org = user.organizations.find((o) => o.organization_slug === validatedSlug);
        setActiveRole(org?.role || "student");
      }
    }
  }, [slug, activeSlug, setActiveSlug, setActiveRole, user]);

  return null;
}