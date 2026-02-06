import { createContext, Dispatch, SetStateAction } from 'react';

export interface IActiveOrgContext {
  activeSlug: string | null;
  setActiveSlug: Dispatch<SetStateAction<string | null>>;
  activeRole: string | null;
  setActiveRole: Dispatch<SetStateAction<string | null>>;
  isVerifying: boolean;
  setIsVerifying: Dispatch<SetStateAction<boolean>>;
}

export const ActiveContext = createContext<IActiveOrgContext | undefined>(undefined);