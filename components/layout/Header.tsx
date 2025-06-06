
import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { APP_NAME } from '../../constants';
import SunIcon from '../icons/SunIcon'; // Create this icon
import MoonIcon from '../icons/MoonIcon'; // Create this icon
import SettingsIcon from '../icons/SettingsIcon';
import LibraryIcon from '../icons/LibraryIcon';

const Header: React.FC = () => {
  const { settings, updateTheme, isDarkMode } = useSettings();

  const toggleTheme = () => {
    if (settings.theme === 'light') updateTheme('dark');
    else if (settings.theme === 'dark') updateTheme('light');
    else { // system
      updateTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
    }
  };

  return (
    <header className="bg-white dark:bg-secondary-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/library" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          {APP_NAME}
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/library" className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 rounded-md flex items-center space-x-1">
            <LibraryIcon className="w-5 h-5" />
            <span>Library</span>
          </Link>
          <Link to="/settings" className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 rounded-md">
            <SettingsIcon className="w-6 h-6" />
          </Link>
          <button
            onClick={toggleTheme}
            className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 rounded-md"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
