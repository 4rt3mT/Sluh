
import React, { useEffect, ReactNode } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export const ThemeManager: React.FC<{children: ReactNode}> = ({ children }) => {
  const { settings } = useSettings(); // Accesses the isDarkMode state managed by SettingsContext

  // The actual logic for applying the theme class ('dark' or removing it)
  // and updating isDarkMode is now handled within SettingsContext.
  // This component primarily ensures that SettingsContext is initialized and its effect runs.
  
  useEffect(() => {
    // Effect in SettingsContext handles DOM changes.
    // This component can be used for other theme-related logic if needed,
    // or simply to ensure the context is part of the tree.
  }, [settings.theme]);

  return <>{children}</>;
};
