'use client';

import { useEffect } from 'react';
import { useActiveOrg } from '@/lib/hooks/useActiveOrg';

interface OrgContextUpdaterProps {
  slug: string | null;
}

export default function OrgContextUpdater({ slug }: OrgContextUpdaterProps) {
  const { activeSlug, setActiveSlug } = useActiveOrg();

  useEffect(() => {
    if (activeSlug !== slug) {
      console.log('[OrgContextUpdater] Syncing context to slug:', { from: activeSlug, to: slug });
      setActiveSlug(slug);
    }
  }, [slug, activeSlug, setActiveSlug]);

  return null;
}
