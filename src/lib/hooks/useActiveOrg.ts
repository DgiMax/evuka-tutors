import { useContext } from 'react';
import { ActiveContext } from '@/context/ActiveContext';

export const useActiveOrg = () => {
  const context = useContext(ActiveContext);
  if (!context) {
    throw new Error('useActiveOrg must be used within an ActiveOrgProvider');
  }
  return context;
};