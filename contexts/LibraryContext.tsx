
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Book, Track, DynamicSpeedSettings } from '../types';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { storageService } from '../services/storageService';
import { processFilesForBook } from '../utils/fileProcessor';

interface LibraryContextType {
  books: Book[];
  isLoadingBooks: boolean;
  addBookFromFiles: (files: FileList) => Promise<Book | null>;
  deleteBook: (bookId: string) => void;
  updateBookProgress: (bookId: string, trackIndex: number, time: number, totalPlayedTimeInBook?: number) => void;
  updateBookSettings: (bookId: string, newSettings: Partial<DynamicSpeedSettings>) => void;
  getBookById: (bookId: string) => Book | undefined;
  // This map will hold File objects for the current session to enable playback
  // It's not persisted in localStorage.
  activeBookFiles: Map<string, { [trackId: string]: File, coverFile?: File }>; 
  storeActiveFiles: (bookId: string, trackFiles: { [trackId: string]: File }, coverFile?: File) => void;
  clearActiveFiles: (bookId: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() =>
    storageService.getItem<Book[]>(LOCAL_STORAGE_KEYS.LIBRARY, [])
  );
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [activeBookFiles, setActiveBookFiles] = useState<Map<string, { [trackId: string]: File, coverFile?: File }>>(new Map());

  useEffect(() => {
    // Persist books metadata, but not File objects
    const booksToStore = books.map(book => {
      const { ...bookMeta } = book;
      // Ensure 'tracks' don't have 'file' or 'url' properties for storage
      (bookMeta as any).tracks = book.tracks.map(t => {
        const {file, url, ...trackMeta} = t;
        return trackMeta;
      });
      return bookMeta;
    });
    storageService.setItem(LOCAL_STORAGE_KEYS.LIBRARY, booksToStore);
  }, [books]);

  const storeActiveFiles = useCallback((bookId: string, trackFiles: { [trackId: string]: File }, coverFile?: File) => {
    setActiveBookFiles(prev => new Map(prev).set(bookId, { ...trackFiles, coverFile }));
  }, []);

  const clearActiveFiles = useCallback((bookId: string) => {
    setActiveBookFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(bookId);
      return newMap;
    });
  }, []);

  const addBookFromFiles = useCallback(async (files: FileList): Promise<Book | null> => {
    setIsLoadingBooks(true);
    try {
      const { newBook, bookTrackFiles, bookCoverFile } = await processFilesForBook(files);
      if (newBook) {
        setBooks(prev => {
          // Avoid duplicates if a book with the same title (folder name) is added again.
          // A more robust check might involve content hashing or more unique identifiers.
          const existingBookIndex = prev.findIndex(b => b.title === newBook.title);
          if (existingBookIndex !== -1) {
            // Optionally, update existing book or notify user. For now, replace.
            const updatedBooks = [...prev];
            updatedBooks[existingBookIndex] = newBook;
             if (bookTrackFiles) storeActiveFiles(newBook.id, bookTrackFiles, bookCoverFile);
            return updatedBooks;
          }
          if (bookTrackFiles) storeActiveFiles(newBook.id, bookTrackFiles, bookCoverFile);
          return [...prev, newBook].sort((a,b) => (b.lastPlayedTimestamp || 0) - (a.lastPlayedTimestamp || 0));
        });
        return newBook;
      }
      return null;
    } catch (error) {
      console.error("Error processing book files:", error);
      return null;
    } finally {
      setIsLoadingBooks(false);
    }
  }, [storeActiveFiles]);

  const deleteBook = useCallback((bookId: string) => {
    setBooks(prev => prev.filter(book => book.id !== bookId));
    clearActiveFiles(bookId);
  }, [clearActiveFiles]);

  const updateBookProgress = useCallback((bookId: string, trackIndex: number, time: number) => {
    setBooks(prev =>
      prev.map(book =>
        book.id === bookId
          ? { ...book, currentTrackIndex: trackIndex, currentTrackTime: time, lastPlayedTimestamp: Date.now() }
          : book
      ).sort((a,b) => (b.lastPlayedTimestamp || 0) - (a.lastPlayedTimestamp || 0))
    );
  }, []);
  
  const updateBookSettings = useCallback((bookId: string, newSettings: Partial<DynamicSpeedSettings>) => {
    setBooks(prev =>
      prev.map(book =>
        book.id === bookId
          ? { ...book, userSettings: { ...(book.userSettings || {}), ...newSettings } }
          : book
      )
    );
  }, []);

  const getBookById = useCallback((bookId: string): Book | undefined => {
    return books.find(book => book.id === bookId);
  }, [books]);

  return (
    <LibraryContext.Provider value={{ books, isLoadingBooks, addBookFromFiles, deleteBook, updateBookProgress, updateBookSettings, getBookById, activeBookFiles, storeActiveFiles, clearActiveFiles }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextType => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
