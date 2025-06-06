
import { DynamicSpeedSettings, GlobalSettings } from './types';

export const APP_NAME = "NeuroSluh";

export const DEFAULT_DYNAMIC_SPEED_SETTINGS: DynamicSpeedSettings = {
  initialSpeed: 1.0,
  maxSpeed: 2.0,
  rampUpTargetPercentage: 50,
  updateInterval: 10, // seconds
  isEnabled: true,
};

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  theme: 'system',
  defaultDynamicSpeed: DEFAULT_DYNAMIC_SPEED_SETTINGS,
  sleepTimerDuration: null,
};

export const LOCAL_STORAGE_KEYS = {
  LIBRARY: 'neurosluh_library',
  SETTINGS: 'neurosluh_settings',
};

export const MAX_SPEED_OPTIONS = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
export const INITIAL_SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];
export const RAMP_UP_PERCENTAGE_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const UPDATE_INTERVAL_OPTIONS = [5, 10, 15, 20, 30]; // seconds
