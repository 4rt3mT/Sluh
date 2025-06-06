
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { GlobalSettings, DynamicSpeedSettings } from '../types';
import Button from '../components/common/Button';
import { DEFAULT_GLOBAL_SETTINGS, INITIAL_SPEED_OPTIONS, MAX_SPEED_OPTIONS, RAMP_UP_PERCENTAGE_OPTIONS, UPDATE_INTERVAL_OPTIONS } from '../constants';

const SettingsScreen: React.FC = () => {
  const { settings, updateTheme, updateDefaultDynamicSpeed } = useSettings();
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings); 
  }, [settings]);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalSettings(prev => ({ ...prev, theme: event.target.value as GlobalSettings['theme'] }));
  };

  const handleDynamicSpeedChange = <K extends keyof DynamicSpeedSettings>(
    field: K,
    value: DynamicSpeedSettings[K] // value comes from parseFloat/parseInt or e.target.checked
  ) => {
    // For numeric fields, if value is NaN (e.g., from failed parseFloat),
    // we prevent updating the state to avoid errors with .toFixed() etc.
    // The input field will effectively revert to its last valid numeric state.
    if (typeof localSettings.defaultDynamicSpeed[field] === 'number' && isNaN(Number(value))) {
      return; // Do not update state if new value is NaN for a number field
    }

    setLocalSettings(prev => ({
      ...prev,
      defaultDynamicSpeed: {
        ...prev.defaultDynamicSpeed,
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    updateTheme(localSettings.theme);
    updateDefaultDynamicSpeed(localSettings.defaultDynamicSpeed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  
  const handleResetToDefaults = () => {
    setLocalSettings(DEFAULT_GLOBAL_SETTINGS);
  };

  const selectInputClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm leading-tight border border-secondary-300 dark:border-secondary-600 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-60 disabled:cursor-not-allowed";


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-secondary-800 dark:text-secondary-100 mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Theme Settings */}
        <section>
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-200 mb-3">Appearance</h2>
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow">
            <label htmlFor="theme" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Theme
            </label>
            <select
              id="theme"
              value={localSettings.theme}
              onChange={handleThemeChange}
              className={selectInputClasses}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </section>

        {/* Default Dynamic Speed Settings */}
        <section>
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-200 mb-3">Default Dynamic Speed</h2>
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow space-y-4">
            <div>
              <label htmlFor="defaultIsEnabled" className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                <input 
                  type="checkbox" 
                  id="defaultIsEnabled" 
                  checked={localSettings.defaultDynamicSpeed.isEnabled} 
                  onChange={(e) => handleDynamicSpeedChange('isEnabled', e.target.checked)}
                  className="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:focus:ring-offset-secondary-800"
                />
                Enable Dynamic Speed by Default
              </label>
            </div>

            <div>
              <label htmlFor="defaultInitialSpeed" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Initial Speed ({localSettings.defaultDynamicSpeed.initialSpeed.toFixed(2)}x)</label>
              <input
                type="number"
                id="defaultInitialSpeed"
                value={localSettings.defaultDynamicSpeed.initialSpeed}
                onChange={(e) => handleDynamicSpeedChange('initialSpeed', parseFloat(e.target.value))}
                className={selectInputClasses}
                disabled={!localSettings.defaultDynamicSpeed.isEnabled}
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="defaultMaxSpeed" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Maximum Speed ({localSettings.defaultDynamicSpeed.maxSpeed.toFixed(2)}x)</label>
              <input
                type="number"
                id="defaultMaxSpeed"
                value={localSettings.defaultDynamicSpeed.maxSpeed}
                onChange={(e) => handleDynamicSpeedChange('maxSpeed', parseFloat(e.target.value))}
                className={selectInputClasses}
                disabled={!localSettings.defaultDynamicSpeed.isEnabled}
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="defaultRampUpTarget" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Ramp-up Target ({localSettings.defaultDynamicSpeed.rampUpTargetPercentage}%)</label>
              <input
                type="number"
                id="defaultRampUpTarget"
                value={localSettings.defaultDynamicSpeed.rampUpTargetPercentage}
                onChange={(e) => handleDynamicSpeedChange('rampUpTargetPercentage', parseInt(e.target.value, 10))}
                className={selectInputClasses}
                disabled={!localSettings.defaultDynamicSpeed.isEnabled}
                step="1"
                min="0" // Optional: add min/max for better UX
                max="100"
              />
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">Percentage of book duration to reach max speed.</p>
            </div>

            <div>
              <label htmlFor="defaultUpdateInterval" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Speed Update Interval ({localSettings.defaultDynamicSpeed.updateInterval}s)</label>
              <input
                type="number"
                id="defaultUpdateInterval"
                value={localSettings.defaultDynamicSpeed.updateInterval}
                onChange={(e) => handleDynamicSpeedChange('updateInterval', parseInt(e.target.value, 10))}
                className={selectInputClasses}
                disabled={!localSettings.defaultDynamicSpeed.isEnabled}
                step="1"
                min="1" // Optional: sensible min
              />
            </div>
          </div>
        </section>
        
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-secondary-200 dark:border-secondary-700">
            <Button onClick={handleSave} variant="primary" size="lg" className="w-full sm:w-auto">
                Save Settings
            </Button>
            <Button onClick={handleResetToDefaults} variant="secondary" size="md" className="mt-4 sm:mt-0 w-full sm:w-auto">
                Reset to Defaults
            </Button>
        </div>
        {isSaved && <p className="mt-4 text-green-600 dark:text-green-400 text-center">Settings saved successfully!</p>}
      </div>
    </div>
  );
};

export default SettingsScreen;
