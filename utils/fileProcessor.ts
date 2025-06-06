
import { Book, Track, SUPPORTED_AUDIO_FORMATS, COVER_ART_FILENAMES, DynamicSpeedSettings } from '../types';
import { DEFAULT_DYNAMIC_SPEED_SETTINGS } from '../constants';

const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

const readImageAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectURL = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(objectURL); // Clean up
    };
    audio.onerror = (e) => {
      console.error("Error loading audio metadata for", file.name, e);
      resolve(0); // Resolve with 0 if error
      URL.revokeObjectURL(objectURL);
    };
    audio.src = objectURL;
  });
};

export const processFilesForBook = async (
  fileList: FileList
): Promise<{ newBook: Book | null; bookTrackFiles: { [trackId: string]: File } | null; bookCoverFile?: File }> => {
  const files = Array.from(fileList);
  if (files.length === 0) return { newBook: null, bookTrackFiles: null };

  const audioFiles: File[] = [];
  let coverFile: File | undefined;

  files.forEach(file => {
    const extension = getFileExtension(file.name);
    if (SUPPORTED_AUDIO_FORMATS.includes(extension)) {
      audioFiles.push(file);
    } else if (COVER_ART_FILENAMES.includes(file.name.toLowerCase())) {
      if (!coverFile || file.name.toLowerCase() === 'cover.jpg' || file.name.toLowerCase() === 'cover.jpeg') { // Prioritize cover.jpg/jpeg
        coverFile = file;
      }
    }
  });

  if (audioFiles.length === 0) return { newBook: null, bookTrackFiles: null };

  // Sort audio files by their relative path (which includes filename) for chapter order
  // This provides a basic alphanumeric sort. For "Chapter 1, Chapter 2, Chapter 10", natural sort is better.
  audioFiles.sort((a, b) => 
    (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
  
  const bookTitle = files[0].webkitRelativePath?.split('/')[0] || 'Untitled Book';
  const bookId = `${bookTitle.replace(/\s+/g, '-')}-${Date.now()}`;

  const tracks: Track[] = [];
  const bookTrackFiles: { [trackId: string]: File } = {};
  let totalDuration = 0;

  for (const file of audioFiles) {
    const duration = await getAudioDuration(file);
    const trackId = `${bookId}-track-${tracks.length}-${file.name.replace(/\s+/g, '-')}`;
    tracks.push({
      id: trackId,
      name: file.name,
      path: file.webkitRelativePath || file.name,
      duration: duration,
      // 'file' and 'url' will be handled by context/player for current session
    });
    bookTrackFiles[trackId] = file;
    totalDuration += duration;
  }

  let coverImageDataBase64: string | undefined;
  if (coverFile) {
    try {
      coverImageDataBase64 = await readImageAsBase64(coverFile);
    } catch (error) {
      console.error("Error reading cover image:", error);
    }
  }
  
  // Default settings for a new book, can be overridden by global or per-book settings later.
  const userSettings: DynamicSpeedSettings = { ...DEFAULT_DYNAMIC_SPEED_SETTINGS };

  const newBook: Book = {
    id: bookId,
    title: bookTitle,
    tracks,
    coverImageDataBase64,
    totalDuration,
    currentTrackIndex: 0,
    currentTrackTime: 0,
    lastPlayedTimestamp: Date.now(),
    userSettings, // New books get default dynamic speed settings
  };

  return { newBook, bookTrackFiles, bookCoverFile: coverFile };
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return [h, m > 9 ? m : '0' + m, s > 9 ? s : '0' + s].join(':');
  }
  return [m > 9 ? m : '0' + m, s > 9 ? s : '0' + s].join(':');
};
