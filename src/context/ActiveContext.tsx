import { createContext, Dispatch, SetStateAction } from 'react';

interface IActiveOrgContext {
  activeSlug: string | null;
  setActiveSlug: Dispatch<SetStateAction<string | null>>;
}

export const ActiveContext = createContext<IActiveOrgContext | undefined>(
  undefined
);