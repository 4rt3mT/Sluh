
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GlobalSettings, DynamicSpeedSettings } from '../types';
import { DEFAULT_GLOBAL_SETTINGS, LOCAL_STORAGE_KEYS } from '../constants';
import { storageService } from '../services/storageService';

interface SettingsContextType {
  settings: GlobalSettings;
  updateTheme: (theme: GlobalSettings['theme']) => void;
  updateDefaultDynamicSpeed: (newSpeedSettings: Partial<DynamicSpeedSettings>) => void;
  setSleepTimer: (duration: number | null) => void;
  isDarkMode: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(() =>
    storageService.getItem<GlobalSettings>(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_GLOBAL_SETTINGS)
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    storageService.setItem(LOCAL_STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    };

    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  const updateTheme = useCallback((theme: GlobalSettings['theme']) => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const updateDefaultDynamicSpeed = useCallback((newSpeedSettings: Partial<DynamicSpeedSettings>) => {
    setSettings(prev => ({
      ...prev,
      defaultDynamicSpeed: { ...prev.defaultDynamicSpeed, ...newSpeedSettings },
    }));
  }, []);

  const setSleepTimer = useCallback((duration: number | null) => {
    setSettings(prev => ({ ...prev, sleepTimerDuration: duration }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateTheme, updateDefaultDynamicSpeed, setSleepTimer, isDarkMode }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
