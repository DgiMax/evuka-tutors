import { createContext, Dispatch, SetStateAction } from 'react';

export interface IActiveOrgContext {
  activeSlug: string | null;
  setActiveSlug: Dispatch<SetStateAction<string | null>>;
  
  // Added these two lines to fix the error
  activeRole: string | null;
  setActiveRole: Dispatch<SetStateAction<string | null>>;
}

export const ActiveContext = createContext<IActiveOrgContext | undefined>(
  undefined
);