
export interface Track {
  id: string;
  name: string;
  path: string; // relative path within the book folder, used for sorting and identification
  duration: number; // in seconds
  file?: File; // The actual file, available after selection for current session
  url?: string; // Object URL, created when needed for playback
}

export interface DynamicSpeedSettings {
  initialSpeed: number; // e.g., 1.0
  maxSpeed: number; // e.g., 2.0 (for 200%)
  rampUpTargetPercentage: number; // e.g., 50 (for 50%)
  updateInterval: number; // in seconds, e.g., 10
  isEnabled: boolean; // whether dynamic speed up is active
}

export interface Book {
  id: string;
  title: string;
  tracks: Track[];
  coverImageDataBase64?: string; // Base64 encoded cover image
  totalDuration: number; // sum of track durations, in seconds
  currentTrackIndex: number;
  currentTrackTime: number; // progress in current track, in seconds
  lastPlayedTimestamp?: number; // For sorting by recently played
  userSettings?: Partial<DynamicSpeedSettings>; // Per-book override for dynamic speed
}

export interface GlobalSettings {
  theme: 'light' | 'dark' | 'system';
  defaultDynamicSpeed: DynamicSpeedSettings;
  sleepTimerDuration: number | null; // in minutes, null if not set
}

export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'ogg', 'wav', 'flac'];
export const COVER_ART_FILENAMES = ['cover.jpg', 'cover.jpeg', 'folder.jpg', 'folder.jpeg'];

export enum SleepTimerValue {
  Off = 0,
  FifteenMinutes = 15,
  ThirtyMinutes = 30,
  FortyFiveMinutes = 45,
  EndOfChapter = -1, // Special value for end of chapter
}
