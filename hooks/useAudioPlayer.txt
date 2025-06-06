import { useState, useEffect, useRef, useCallback } from 'react';
import { Book, Track, DynamicSpeedSettings, SleepTimerValue } from '../types';
import { useLibrary } from '../contexts/LibraryContext';
import { useSettings } from '../contexts/SettingsContext';
import { DEFAULT_GLOBAL_SETTINGS } from '../constants';
import { setupMediaSession, clearMediaSession } from '../utils/audioUtils';

interface UseAudioPlayerProps {
  bookId?: string;
}

export const useAudioPlayer = ({ bookId }: UseAudioPlayerProps) => {
  const { getBookById, updateBookProgress, activeBookFiles, updateBookSettings } = useLibrary();
  const { settings: globalSettings, setSleepTimer: setGlobalSleepTimerContext } = useSettings();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const [book, setBook] = useState<Book | null>(null);
  const currentBookRef = useRef<Book | null>(null); 

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrackIndexRef = useRef(0); 

  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false); 

  const [currentTime, setCurrentTime] = useState(0);
  const desiredSeekTimeRef = useRef(0); 

  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Actual speed of audio element
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(true);

  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const dynamicSpeedIntervalRef = useRef<number | null>(null);
  const sleepTimerTimeoutRef = useRef<number | null>(null);
  
  const [effectiveSpeedSettings, setEffectiveSpeedSettings] = useState<DynamicSpeedSettings>(globalSettings.defaultDynamicSpeed);
  const [totalPlayedTimeInBook, setTotalPlayedTimeInBook] = useState(0);
	
  const prevTrackKeyRef = useRef<string | null>(null);

  const objectUrlCacheRef = useRef<Map<string, string>>(new Map()); // Cache: stableFileKey -> blobURL  
  
  const lastProgressUpdateTimeRef = useRef(0);
  const lastUpdatedTimeToPersistenceRef = useRef(-1);

  
	// Функция для сохранения прогресса
	const saveCurrentProgress = useCallback(() => {
		const bookToSave = currentBookRef.current; // Используем ref для доступа к актуальной книге
		const audio = audioRef.current;
		const currentTrackIdx = currentTrackIndexRef.current; // Используем ref
		const isLoadingState = isLoadingRef.current; // Используем ref

		if (bookId && bookToSave && audio && !isLoadingState && 
			currentTrackIdx >= 0 && currentTrackIdx < bookToSave.tracks.length) {
			
			const trackForDuration = bookToSave.tracks[currentTrackIdx];
			const currentTimeToSave = audio.currentTime;

			if (trackForDuration && currentTimeToSave >= 0 && currentTimeToSave <= (trackForDuration.duration || Infinity)) {
				if (Math.abs(currentTimeToSave - lastUpdatedTimeToPersistenceRef.current) > 0.5) { // Только если время изменилось достаточно
					// console.log(`Saving progress: book ${bookId}, track ${currentTrackIdx}, time ${currentTimeToSave.toFixed(2)}`);
					updateBookProgress(bookId, currentTrackIdx, currentTimeToSave);
					lastUpdatedTimeToPersistenceRef.current = currentTimeToSave;
				}
			}
		}
	}, [bookId, updateBookProgress]); // updateBookProgress из context должен быть стабильным (useCallback)
	  
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { currentBookRef.current = book; }, [book]);
  useEffect(() => { currentTrackIndexRef.current = currentTrackIndex; }, [currentTrackIndex]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.preload = "auto"; 

    return () => { 
      if (audio) {
        audio.pause();
        audio.removeAttribute('src'); 
        if (currentObjectUrlRef.current) {
          URL.revokeObjectURL(currentObjectUrlRef.current);
          currentObjectUrlRef.current = null;
        }
      }
      clearMediaSession();
      if (dynamicSpeedIntervalRef.current) clearInterval(dynamicSpeedIntervalRef.current);
      if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (bookId) {
      const fetchedBook = getBookById(bookId);
      if (fetchedBook) {
        setBook(fetchedBook);
        const initialTrackIndex = fetchedBook.currentTrackIndex || 0;
        setCurrentTrackIndex(initialTrackIndex);
        desiredSeekTimeRef.current = fetchedBook.currentTrackTime || 0;
        setCurrentTime(fetchedBook.currentTrackTime || 0);

        let accumulatedTime = 0;
        for(let i = 0; i < initialTrackIndex; i++) {
          accumulatedTime += fetchedBook.tracks[i]?.duration || 0;
        }
        accumulatedTime += (fetchedBook.currentTrackTime || 0);
        setTotalPlayedTimeInBook(accumulatedTime);

        const baseSettings = globalSettings.defaultDynamicSpeed;
        const bookUserSettings = fetchedBook.userSettings;
        const mergedSettings: DynamicSpeedSettings = {
            initialSpeed: bookUserSettings?.initialSpeed ?? baseSettings.initialSpeed,
            maxSpeed: bookUserSettings?.maxSpeed ?? baseSettings.maxSpeed,
            rampUpTargetPercentage: bookUserSettings?.rampUpTargetPercentage ?? baseSettings.rampUpTargetPercentage,
            updateInterval: bookUserSettings?.updateInterval ?? baseSettings.updateInterval,
            isEnabled: bookUserSettings?.isEnabled ?? baseSettings.isEnabled,
        };
        setEffectiveSpeedSettings(mergedSettings);

        if (mergedSettings.isEnabled) {
            setPlaybackSpeed(mergedSettings.initialSpeed);
        } else {
            setPlaybackSpeed(mergedSettings.initialSpeed); // When dynamic is off, initialSpeed effectively stores the manual speed
        }

      } else {
        setBook(null); 
        setCurrentTrack(null);
        setCurrentTrackIndex(0);
        setCurrentTime(0);
        setDuration(0);
        setIsLoading(false);
      }
    } else { 
        setBook(null);
        setCurrentTrack(null);
        setCurrentTrackIndex(0);
        setCurrentTime(0);
        setDuration(0);
        setIsLoading(false);
         if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
             if (currentObjectUrlRef.current) {
                URL.revokeObjectURL(currentObjectUrlRef.current);
                currentObjectUrlRef.current = null;
            }
        }
    }
  }, [bookId, getBookById, globalSettings.defaultDynamicSpeed]);


  useEffect(() => {
    const audio = audioRef.current;
	
	const getFileStableKey = (file: File): string => {
        return `${file.name}-${file.size}-${file.lastModified}`;
    };
	
    if (!audio || !book || currentTrackIndex < 0 || currentTrackIndex >= book.tracks.length) {
        if (audio?.src) {
            audio.pause();
            audio.removeAttribute('src');
        }
        // If currentObjectUrlRef.current holds a URL not in our cache, it was likely a one-off.
        // The main cache cleanup on unmount is more critical.
        if (currentObjectUrlRef.current && !Array.from(objectUrlCacheRef.current.values()).includes(currentObjectUrlRef.current)) {
            URL.revokeObjectURL(currentObjectUrlRef.current);
        }
		currentObjectUrlRef.current = null;

        setIsLoading(false);
        setCurrentTrack(null);
        setDuration(0);
        setCurrentTime(0); // Reset current time
        prevTrackKeyRef.current = null;
        return;
    }

    const trackToLoad = book.tracks[currentTrackIndex];
    const currentTrackKey = `${book.id}/${trackToLoad.id}`; // Key for book+track combo

    const bookFilesMap = activeBookFiles.get(book.id);
    const trackFile = bookFilesMap && trackToLoad ? bookFilesMap[trackToLoad.id] : null;
	
	
    let newAudioSrcToSet: string | null = null;
    let newObjectUrlCreated = false; // Flag to know if we just created a URL for the cache

    if (trackFile) {
        const fileKey = getFileStableKey(trackFile);
        if (objectUrlCacheRef.current.has(fileKey)) {
            newAudioSrcToSet = objectUrlCacheRef.current.get(fileKey)!;
            // console.log(`Using cached blob URL for ${fileKey}: ${newAudioSrcToSet}`);
        } else {
            const newBlobUrl = URL.createObjectURL(trackFile);
            objectUrlCacheRef.current.set(fileKey, newBlobUrl);
            newAudioSrcToSet = newBlobUrl;
            newObjectUrlCreated = true;
            // console.log(`Created AND cached new blob URL for ${fileKey}: ${newAudioSrcToSet}`);
        }
    } else if (trackToLoad.url) { // Fallback to direct URL if present
        newAudioSrcToSet = trackToLoad.url;
    }
    
    if (!newAudioSrcToSet) {
        console.error(`No file or URL for track: ${trackToLoad.name}. Book ID: ${book.id}`);
        setIsLoading(false);
        setCurrentTrack(trackToLoad);
        setDuration(0);
        setCurrentTime(desiredSeekTimeRef.current); // Use desired seek time

        if (audio.src) audio.pause();
        // Similar to Block 1, manage currentObjectUrlRef if clearing audio.src
        if (currentObjectUrlRef.current && !Array.from(objectUrlCacheRef.current.values()).includes(currentObjectUrlRef.current)) {
            URL.revokeObjectURL(currentObjectUrlRef.current);
        }
        audio.removeAttribute('src');
        currentObjectUrlRef.current = null;
        prevTrackKeyRef.current = currentTrackKey; // Mark attempt to load this key
        return;
    }

    if (prevTrackKeyRef.current !== currentTrackKey) {
        // This is a completely new track (or book), so full UI reset for track info is expected.
        // console.log(`New track key detected. Full reload. New key: ${currentTrackKey}, Previous key: ${prevTrackKeyRef.current}`);
        setCurrentTrack(trackToLoad);
        setIsLoading(true);
        setDuration(0); // Will show 00:00 briefly
        setCurrentTime(desiredSeekTimeRef.current); // Apply desired seek time
        audio.pause();

        audio.src = newAudioSrcToSet;
        if (newAudioSrcToSet.startsWith("blob:")) {
            currentObjectUrlRef.current = newAudioSrcToSet;
        } else {
            currentObjectUrlRef.current = null; // Not a blob URL we manage
        }
        prevTrackKeyRef.current = currentTrackKey;
        audio.load();
    } else {
        // Same track key. UI for track name, duration etc. should ideally not flicker.
        // Update track metadata in UI if it changed (e.g. name)
         if (currentTrack?.id !== trackToLoad.id || currentTrack?.name !== trackToLoad.name) {
            setCurrentTrack(trackToLoad);
        }

        if (audio.src !== newAudioSrcToSet) {
            // The blob URL string itself changed, even if the logical track is the same.
            // This is what the cache is designed to prevent from causing reloads if the *content* is same.
            // If newAudioSrcToSet came from cache, this condition means audio.src was something else (or null).
            // If newAudioSrcToSet was just created, this means audio.src was different.
            // console.warn(`Same track key, but audio.src URL changed. Refreshing src only. Old: ${audio.src}, New: ${newAudioSrcToSet}`);
            audio.pause();

            audio.src = newAudioSrcToSet;
            if (newAudioSrcToSet.startsWith("blob:")) {
                currentObjectUrlRef.current = newAudioSrcToSet;
            } else {
                currentObjectUrlRef.current = null;
            }
            audio.load(); // Load the new source
            // NO setIsLoading(true) or setDuration(0) here to prevent UI flicker
        } else {
            // audio.src is already correctly set to newAudioSrcToSet. No action needed for audio element.
            // If a blob URL was just created but it turned out audio.src was already the same (e.g. race condition or quick re-render)
            // the newObjectUrlCreated flag isn't strictly needed here because the cache handles duplicates.
            // console.log(`Same track key, and audio.src is already up-to-date: ${audio.src}`);
            if (isLoading && audio.readyState >= HTMLMediaElement.HAVE_METADATA && !audio.error) {
                setIsLoading(false); // Ensure loading indicator is removed if audio is ready
            }
        }
    }

  }, [book, currentTrackIndex, activeBookFiles, getBookById]);


  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.src && !isLoadingRef.current) {
      if (audio.error) {
        console.error("Cannot play, audio element in error state:", audio.error);
        setIsPlaying(false);
        return;
      }
      if (audio.readyState >= 2) { 
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
              console.error("Error from audio.play() promise:", e);
              setIsPlaying(false);
            });
        }
      } else {
        console.warn("Audio not ready to play, readyState:", audio.readyState);
        setIsLoading(true); 
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
	  saveCurrentProgress();
    }
  }, [saveCurrentProgress]);
  
  const nextTrackInternal = useCallback(() => {
    saveCurrentProgress(); // Добавлено сохранение прогресса
    const currentBook = currentBookRef.current;
    if (!currentBook) return;
    if (currentTrackIndexRef.current < currentBook.tracks.length - 1) {
        desiredSeekTimeRef.current = 0;
        setCurrentTime(0);
        setCurrentTrackIndex(prev => prev + 1);
    } else {
        pause(); // Вызывает обновленный pause, который сохраняет прогресс
        if (globalSettings.sleepTimerDuration === SleepTimerValue.EndOfChapter) {
            setGlobalSleepTimerContext(null);
        }
    }
}, [pause, globalSettings.sleepTimerDuration, setGlobalSleepTimerContext, saveCurrentProgress]); // Обновлены зависимости


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadataEvent = () => {
      if (!audioRef.current) return;
      const newDuration = audioRef.current.duration;
      setDuration(newDuration);
      
      let timeToSet = desiredSeekTimeRef.current;
      if (timeToSet >= newDuration || timeToSet < 0 || isNaN(timeToSet)) {
        timeToSet = 0;
      }
      audioRef.current.currentTime = timeToSet;
      setCurrentTime(timeToSet); 

      setIsLoading(false);
      if (isPlayingRef.current) {
        play();
      }
    };

    const handleTimeUpdateEvent = () => {
		if (!audioRef.current || !currentBookRef.current) return;
		const newCurrentTime = audioRef.current.currentTime;
		setCurrentTime(newCurrentTime); // Обновление UI

		let currentTotalPlayed = 0;
		for (let i = 0; i < currentTrackIndexRef.current; i++) {
			currentTotalPlayed += currentBookRef.current.tracks[i]?.duration || 0;
		}
		currentTotalPlayed += newCurrentTime;
		setTotalPlayedTimeInBook(currentTotalPlayed); // Обновление UI общего прогресса

		// Логика для вызова saveCurrentProgress (реже)
		const now = Date.now();
		const audioDuration = audioRef.current.duration;
		const nearEnd = audioDuration > 0 && newCurrentTime > audioDuration - 5; // Близко к концу трека (5 сек)
		
		// Обновляем прогресс каждые 5 секунд, или если время значительно изменилось (после перемотки), или близко к концу
		if ( (now - lastProgressUpdateTimeRef.current > 5000 || nearEnd) && isPlayingRef.current) {
			saveCurrentProgress();
			lastProgressUpdateTimeRef.current = now;
		}
	};
	
	

	
	
	
    const handleEndedEvent = () => nextTrackInternal();
    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);
    const handleErrorEvent = (event: Event) => {
      const mediaError = (event.target as HTMLAudioElement).error;
      console.error("Audio playback error:", mediaError?.code, mediaError?.message, event);
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleWaitingEvent = () => setIsLoading(true);
    const handleCanPlayEvent = () => {
      setIsLoading(false);
      if (isPlayingRef.current && audioRef.current && audioRef.current.paused) {
        play();
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadataEvent);
    audio.addEventListener('timeupdate', handleTimeUpdateEvent);
    audio.addEventListener('ended', handleEndedEvent);
    audio.addEventListener('play', handlePlayEvent);
    audio.addEventListener('pause', handlePauseEvent);
    audio.addEventListener('error', handleErrorEvent);
    audio.addEventListener('waiting', handleWaitingEvent);
    audio.addEventListener('canplay', handleCanPlayEvent); 

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadataEvent);
      audio.removeEventListener('timeupdate', handleTimeUpdateEvent);
      audio.removeEventListener('ended', handleEndedEvent);
      audio.removeEventListener('play', handlePlayEvent);
      audio.removeEventListener('pause', handlePauseEvent);
      audio.removeEventListener('error', handleErrorEvent);
      audio.removeEventListener('waiting', handleWaitingEvent);
      audio.removeEventListener('canplay', handleCanPlayEvent);
    };
  }, [play, pause, nextTrackInternal]); 


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      const newTime = Math.max(0, Math.min(time, duration));
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      desiredSeekTimeRef.current = newTime; 
    } else if (audio) { // Duration might not be known yet, but user wants to seek
      const newTime = Math.max(0, time);
      setCurrentTime(newTime); // Update UI optimistically
      desiredSeekTimeRef.current = newTime; // Store for when metadata loads
    }
  }, [duration]);

  const previousTrackInternal = useCallback(() => { 
	saveCurrentProgress();
    const currentBook = currentBookRef.current;
    if (currentBook && currentTrackIndexRef.current > 0) {
      desiredSeekTimeRef.current = 0; 
      setCurrentTime(0); 
      setCurrentTrackIndex(prev => prev - 1);
    } else if (currentBook && currentTrackIndexRef.current === 0) {
      seekTo(0); 
    }
  }, [seekTo,saveCurrentProgress]);


  useEffect(() => {
    if (book && currentTrack && isPlaying !== undefined) { 
      setupMediaSession(book, currentTrack, {
        onPlay: play,
        onPause: pause,
        onSeekBackward: () => seek(-30),
        onSeekForward: () => seek(30),
        onPreviousTrack: previousTrackInternal, 
        onNextTrack: nextTrackInternal,       
      });
    } else {
      clearMediaSession();
    }
    return () => clearMediaSession();
  }, [book, currentTrack, isPlaying, play, pause, previousTrackInternal, nextTrackInternal]);



	// Ensure the component unmount cleanup revokes all cached Object URLs
	useEffect(() => {
		// audioRef.current is captured in the closure of the returned function
		const audioInstance = audioRef.current;

		return () => { 
      saveCurrentProgress(); // Сохраняем прогресс при размонтировании

      if (audioInstance) {
        audioInstance.pause();
        audioInstance.removeAttribute('src'); 
      }
		  // ... (остальная часть cleanup: clearMediaSession, clearIntervals, revokeObjectUrls из кэша)
		  // Важно, чтобы objectUrlCacheRef.current.forEach(...) для revokeObjectURL остался
		  objectUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
		  objectUrlCacheRef.current.clear();
		  currentObjectUrlRef.current = null; // Также очищаем этот ref

		  clearMediaSession();
		  if (dynamicSpeedIntervalRef.current) clearInterval(dynamicSpeedIntervalRef.current);
		  if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
		};
	// Добавляем saveCurrentProgress в зависимости, если он используется в cleanup
	// Но т.к. saveCurrentProgress сам по себе useCallback с зависимостями,
	// его нужно передавать в массив зависимостей эффекта очистки.
	}, [saveCurrentProgress]); // Зависимость для unmount effect
  
  
  useEffect(() => {
    if (dynamicSpeedIntervalRef.current) {
      clearInterval(dynamicSpeedIntervalRef.current);
      dynamicSpeedIntervalRef.current = null;
    }
    if (isPlaying && book && effectiveSpeedSettings.isEnabled && book.totalDuration > 0 && audioRef.current) {
      dynamicSpeedIntervalRef.current = window.setInterval(() => {
        // Читаем актуальную скорость напрямую из audio элемента или используем initialSpeed как базу
        const currentAudioElementPlaybackRate = audioRef.current?.playbackRate || effectiveSpeedSettings.initialSpeed;

        const { initialSpeed, maxSpeed, rampUpTargetPercentage } = effectiveSpeedSettings;
        const rampUpDuration = book.totalDuration * (rampUpTargetPercentage / 100);
        
        let newCalculatedSpeed = initialSpeed; // По умолчанию начинаем с начальной скорости

        if (rampUpDuration > 0) {
            if (totalPlayedTimeInBook < rampUpDuration) {
                const progressInRamp = totalPlayedTimeInBook / rampUpDuration;
                const speedRange = maxSpeed - initialSpeed;
                newCalculatedSpeed = initialSpeed + (speedRange * progressInRamp);
            } else {
                newCalculatedSpeed = maxSpeed; // Достигли или превысили время для ramp-up
            }
        } else {
             // Если rampUpDuration 0 (или цель 0%), сразу используем maxSpeed, если уже играем, иначе initialSpeed.
             // Однако, логичнее всегда начинать с initialSpeed и переходить к maxSpeed, если rampUpTargetPercentage = 0.
             // Для простоты, если нет ramp up, остаемся на initial или сразу max в зависимости от totalPlayedTimeInBook
             newCalculatedSpeed = (totalPlayedTimeInBook > 0 && rampUpTargetPercentage === 0) ? maxSpeed : initialSpeed;
             if (rampUpTargetPercentage > 0 && totalPlayedTimeInBook >= rampUpDuration) newCalculatedSpeed = maxSpeed; // Явное условие для >0%
        }
        
        newCalculatedSpeed = Math.min(Math.max(newCalculatedSpeed, initialSpeed), maxSpeed);

        // Сравниваем с текущей скоростью audio элемента, а не со state playbackSpeed
        if (audioRef.current && Math.abs(audioRef.current.playbackRate - newCalculatedSpeed) > 0.015) { // Немного увеличил порог
            setPlaybackSpeed(newCalculatedSpeed);
        }
      }, effectiveSpeedSettings.updateInterval * 1000);
    }
    return () => {
      if (dynamicSpeedIntervalRef.current) {
        clearInterval(dynamicSpeedIntervalRef.current);
        dynamicSpeedIntervalRef.current = null;
      }
    };
  // Убрали playbackSpeed из зависимостей, чтобы избежать цикла через него.
  // totalPlayedTimeInBook обновляется часто, это нормально для этого эффекта.
}, [isPlaying, book, effectiveSpeedSettings, totalPlayedTimeInBook, /* Добавил audioRef.current.playbackRate косвенно через currentAudioElementPlaybackRate, но т.к. это ref, его нет в deps. */]);


// Отдельный useEffect для применения playbackSpeed к audio элементу.
// Это гарантирует, что playbackRate обновляется только когда состояние playbackSpeed действительно изменилось.
useEffect(() => {
  if (audioRef.current) {
    if (audioRef.current.playbackRate !== playbackSpeed) {
        audioRef.current.playbackRate = playbackSpeed;
    }
  }
}, [playbackSpeed]); // Зависит только от playbackSpeed state


  useEffect(() => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
    const sleepTimerValue = globalSettings.sleepTimerDuration;
    if (isPlaying && sleepTimerValue !== null && sleepTimerValue !== SleepTimerValue.Off) {
      if (sleepTimerValue !== SleepTimerValue.EndOfChapter) { 
        sleepTimerTimeoutRef.current = window.setTimeout(() => { 
          pause();
          setGlobalSleepTimerContext(null); 
        }, sleepTimerValue * 60 * 1000);
      }
    }
    return () => {
      if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    };
  }, [isPlaying, globalSettings.sleepTimerDuration, pause, setGlobalSleepTimerContext]);

  const seek = useCallback((timeDelta: number) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      let newTime = audio.currentTime + timeDelta;
      newTime = Math.max(0, Math.min(newTime, duration));
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      desiredSeekTimeRef.current = newTime;
    } else if (audio) { // If duration isn't known, still try to update desired seek
        let newTime = currentTime + timeDelta; // Use state currentTime as fallback
        newTime = Math.max(0, newTime);
        setCurrentTime(newTime);
        desiredSeekTimeRef.current = newTime;
    }
  }, [duration, currentTime]); // Added currentTime for the fallback case
  
  const togglePlayPause = useCallback(() => {
    const currentBookVal = currentBookRef.current;
    if (isPlayingRef.current) {
      pause();
    } else {
      if (audioRef.current && audioRef.current.ended && currentBookVal && currentTrackIndexRef.current === currentBookVal.tracks.length - 1) {
        seekTo(0); 
      }
      play();
    }
  }, [play, pause, seekTo]);


  const changeSpeed = useCallback((newManualSpeed: number) => {
    const currentBookVal = currentBookRef.current;
    if (!currentBookVal || !bookId) return;

    // Persist this manual speed choice and ensure dynamic is off
    const newBookUserSettings: DynamicSpeedSettings = {
        ...(currentBookVal.userSettings || globalSettings.defaultDynamicSpeed),
        initialSpeed: newManualSpeed, // This becomes the new 'base' or manual speed
        isEnabled: false, // Manual speed selection disables dynamic speed
    };
    updateBookSettings(bookId, newBookUserSettings);
    // The main book-loading useEffect will react to this change in book.userSettings,
    // then update effectiveSpeedSettings and call setPlaybackSpeed(newManualSpeed).
  }, [bookId, updateBookSettings, globalSettings.defaultDynamicSpeed]);

  const toggleDynamicSpeed = useCallback(() => {
    const currentBookVal = currentBookRef.current;
    if (!currentBookVal || !bookId) return;

    const currentBookEffectiveSettings = { // Start with current book's full settings profile
        ...(currentBookVal.userSettings ?? globalSettings.defaultDynamicSpeed)
    };

    const newIsEnabled = !currentBookEffectiveSettings.isEnabled;

    const newBookUserSettings: Partial<DynamicSpeedSettings> = {
        // Persist all existing dynamic parameters, only flip isEnabled
        initialSpeed: currentBookEffectiveSettings.initialSpeed,
        maxSpeed: currentBookEffectiveSettings.maxSpeed,
        rampUpTargetPercentage: currentBookEffectiveSettings.rampUpTargetPercentage,
        updateInterval: currentBookEffectiveSettings.updateInterval,
        isEnabled: newIsEnabled,
    };
    updateBookSettings(bookId, newBookUserSettings);
    // The main book-loading useEffect will react, update effectiveSpeedSettings,
    // and set playbackSpeed to newBookUserSettings.initialSpeed if newIsEnabled is true.
  }, [bookId, updateBookSettings, globalSettings.defaultDynamicSpeed]);


  const toggleMute = useCallback(() => { setIsMuted(prev => !prev); }, []);
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
        setIsMuted(true);
    }
  }, [isMuted]);

  const currentTrackProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bookTotalDuration = book?.totalDuration || 0;
  const totalBookProgressValue = bookTotalDuration > 0 ? (totalPlayedTimeInBook / bookTotalDuration) * 100 : 0;

  return {
    book,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed, 
    isLoading,
    volume,
    isMuted,
    effectiveSpeedSettings, 
    totalBookProgress: totalBookProgressValue,
    currentTrackProgress,
    
    togglePlayPause,
    seek,
    seekTo,
    nextTrack: nextTrackInternal, 
    previousTrack: previousTrackInternal,
    changeSpeed,
    toggleMute,
    handleVolumeChange,
    toggleDynamicSpeed,
  };
};

