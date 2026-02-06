"use client";

import { useEffect } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";

interface OrgContextUpdaterProps {
  slug: string | null;
}

const RESERVED_SLUGS = ["organizations", "profile", "discover", "onboarding", "settings", "dashboard"];

export default function OrgContextUpdater({ slug }: OrgContextUpdaterProps) {
  const { activeSlug, setActiveSlug, setActiveRole, setIsVerifying } = useActiveOrg();

  useEffect(() => {
    const isReserved = RESERVED_SLUGS.includes(slug || "");
    const validatedSlug = isReserved ? null : slug;

    if (!validatedSlug) {
      if (activeSlug !== null) {
        setActiveSlug(null);
        setActiveRole(null);
        setIsVerifying(false);
      }
    }
  }, [slug, activeSlug, setActiveSlug, setActiveRole, setIsVerifying]);

  return null;
}