'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useActiveOrg } from '@/lib/hooks/useActiveOrg';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PERSONAL_ACCOUNT_VALUE = '__personal__';

interface OrganizationSwitcherProps {
  triggerClassName?: string;
}

export default function OrganizationSwitcher({ triggerClassName }: OrganizationSwitcherProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeSlug } = useActiveOrg();

  if (loading || !user) return null;

  const organizations = user.organizations ?? []; // ✅ safely handle undefined

  const selectedValue = activeSlug ?? PERSONAL_ACCOUNT_VALUE;

  const handleSelectChange = (value: string) => {
    if (value === selectedValue) return;

    if (value === PERSONAL_ACCOUNT_VALUE) {
      router.push('/');
    } else {
      router.push(`/${value}/`);
    }
  };

  return (
    <Select
      key={activeSlug ?? 'personal'} // ✅ ensures UI updates when slug changes
      value={selectedValue}
      onValueChange={handleSelectChange}
    >
      <SelectTrigger
        className={cn(
          'w-full min-w-[200px] sm:w-auto justify-between border-gray-300',
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
                <SelectItem key={org.organization_slug} value={org.organization_slug}>
                  {org.organization_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
