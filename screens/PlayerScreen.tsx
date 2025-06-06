
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useLibrary } from '../contexts/LibraryContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatTime } from '../utils/fileProcessor';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import PlayIcon from '../components/icons/PlayIcon';
import PauseIcon from '../components/icons/PauseIcon';
import NextIcon from '../components/icons/NextIcon';
import PreviousIcon from '../components/icons/PreviousIcon';
import RewindIcon from '../components/icons/RewindIcon';
import FastForwardIcon from '../components/icons/FastForwardIcon';
import SpeedIcon from '../components/icons/SpeedIcon';
import TimerIcon from '../components/icons/TimerIcon';
import VolumeUpIcon from '../components/icons/VolumeUpIcon'; 
import VolumeOffIcon from '../components/icons/VolumeOffIcon'; 
import Modal from '../components/common/Modal';
import { SleepTimerValue, DynamicSpeedSettings } from '../types';
import { MAX_SPEED_OPTIONS, INITIAL_SPEED_OPTIONS, RAMP_UP_PERCENTAGE_OPTIONS, UPDATE_INTERVAL_OPTIONS, DEFAULT_GLOBAL_SETTINGS } from '../constants';

const PlayerScreen: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { isLoadingBooks: isLoadingBookFilesContext, activeBookFiles, getBookById, updateBookSettings } = useLibrary();
  const { settings: globalSettings, setSleepTimer, updateDefaultDynamicSpeed } = useSettings();
  
  const {
    book,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    isLoading: isLoadingAudio,
    volume,
    isMuted,
    effectiveSpeedSettings,
    totalBookProgress,
    currentTrackProgress,
    togglePlayPause,
    seek,
    seekTo,
    nextTrack,
    previousTrack,
    changeSpeed,
    toggleMute,
    handleVolumeChange,
    toggleDynamicSpeed,
  } = useAudioPlayer({ bookId });

  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isDynamicSettingsModalOpen, setIsDynamicSettingsModalOpen] = useState(false);
  
  const [localDynamicSettings, setLocalDynamicSettings] = useState<DynamicSpeedSettings>(globalSettings.defaultDynamicSpeed);

  useEffect(() => {
    if (book) {
        setLocalDynamicSettings({
            ...DEFAULT_GLOBAL_SETTINGS.defaultDynamicSpeed, // Base defaults
            ...(book.userSettings || {}) // Override with book specifics
        });
    } else {
        setLocalDynamicSettings(globalSettings.defaultDynamicSpeed); // Fallback to global if no book
    }
  }, [book, globalSettings.defaultDynamicSpeed]);


  if (isLoadingBookFilesContext && !book) { 
    return <div className="text-center py-20 text-xl text-secondary-700 dark:text-secondary-300">Loading book details...</div>;
  }

  if (!book) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-4 text-secondary-800 dark:text-secondary-100">Book not found</h2>
        <Button onClick={() => navigate('/library')}>Back to Library</Button>
      </div>
    );
  }

  const bookFilesAvailable = bookId && activeBookFiles.get(bookId) && book.tracks.every(t => activeBookFiles.get(bookId!)![t.id]);
  if (!bookFilesAvailable && book.tracks.length > 0) {
     return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4 text-secondary-800 dark:text-secondary-100">Audio files for this book are not loaded.</h2>
            <p className="mb-4 text-secondary-600 dark:text-secondary-400">Please re-add the book from your library if playback fails.</p>
            <Button onClick={() => navigate('/library')}>Back to Library</Button>
        </div>
     );
  }


  const handleDynamicSettingsChange = <K extends keyof DynamicSpeedSettings,>(field: K, value: DynamicSpeedSettings[K]) => {
    setLocalDynamicSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveDynamicSettings = () => {
    if (bookId) {
      updateBookSettings(bookId, localDynamicSettings); 
      // Manually trigger updates in useAudioPlayer hook if settings changed
      // This is a bit complex as direct hook state update from here isn't clean.
      // The hook itself re-reads book settings on book change.
      // For immediate effect:
      if(effectiveSpeedSettings.isEnabled !== localDynamicSettings.isEnabled) {
        toggleDynamicSpeed(); // This will use the new settings from context/book.userSettings
      }
      // If dynamic speed is enabled, set playback to initial speed
      if(localDynamicSettings.isEnabled) {
        changeSpeed(localDynamicSettings.initialSpeed); // This also updates effectiveSpeedSettings
      }
    }
    setIsDynamicSettingsModalOpen(false);
  };

  const currentEffectiveSpeed = effectiveSpeedSettings.isEnabled ? playbackSpeed : (effectiveSpeedSettings.initialSpeed);


  return (
    <div className="max-w-2xl mx-auto p-4 bg-white dark:bg-secondary-800 shadow-2xl rounded-lg">
      <div className="flex flex-col items-center">
        <img
          src={book.coverImageDataBase64 || `https://picsum.photos/seed/${book.id}/300/300`}
          alt={`${book.title} cover`}
          className="w-64 h-64 md:w-80 md:h-80 rounded-lg shadow-lg object-cover mb-6"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-secondary-900 dark:text-secondary-100 mb-1 truncate w-full px-2" title={book.title}>
          {book.title}
        </h1>
        <h2 className="text-md md:text-lg text-secondary-600 dark:text-secondary-400 mb-4 text-center truncate w-full px-2" title={currentTrack?.name}>
          {currentTrack?.name || 'Loading track...'}
        </h2>

        <div className="w-full mb-2 px-2">
            <div className="flex justify-between text-xs text-secondary-500 dark:text-secondary-400 mb-1">
                <span>Book Progress</span>
                <span>{totalBookProgress.toFixed(0)}%</span>
            </div>
            <ProgressBar progress={totalBookProgress} height="h-1" />
        </div>

        <div className="w-full mb-4 px-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="w-full h-2 bg-secondary-200 dark:bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-primary-500 disabled:opacity-50"
            disabled={isLoadingAudio || duration === 0}
          />
          <div className="flex justify-between text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-6 w-full">
          <Button variant="ghost" onClick={() => seek(-30)} aria-label="Rewind 30 seconds" className="p-2" disabled={isLoadingAudio}>
            <RewindIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </Button>
          <Button variant="ghost" onClick={previousTrack} aria-label="Previous track" className="p-2" disabled={isLoadingAudio || book.tracks.length <=1}>
            <PreviousIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </Button>
          <Button
            variant="primary"
            onClick={togglePlayPause}
            className="p-3 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoadingAudio}
          >
            {isPlaying ? <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10" /> : <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
          </Button>
          <Button variant="ghost" onClick={nextTrack} aria-label="Next track" className="p-2" disabled={isLoadingAudio || book.tracks.length <=1}>
            <NextIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </Button>
          <Button variant="ghost" onClick={() => seek(30)} aria-label="Fast-forward 30 seconds" className="p-2" disabled={isLoadingAudio}>
            <FastForwardIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </Button>
        </div>

        <div className="flex items-center justify-between w-full px-2 sm:px-6 mb-4">
            <div className="flex items-center">
                <Button variant="ghost" onClick={toggleMute} className="p-2 mr-1" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                </Button>
                <input 
                    type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} 
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1.5 bg-secondary-200 dark:bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-primary-500"
                    aria-label="Volume"
                />
            </div>

          <Button variant="ghost" onClick={() => setIsSpeedModalOpen(true)} className="p-2 flex items-center text-sm">
            <SpeedIcon className="w-5 h-5 mr-1" /> {currentEffectiveSpeed.toFixed(2)}x
          </Button>
          
          <Button variant="ghost" onClick={() => setIsTimerModalOpen(true)} className="p-2">
            <TimerIcon className={`w-6 h-6 ${globalSettings.sleepTimerDuration ? 'text-primary-500' : ''}`} />
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setIsDynamicSettingsModalOpen(true)} className="p-2 text-sm mb-4 text-primary-600 dark:text-primary-400 hover:underline">
            {effectiveSpeedSettings.isEnabled ? 'Dynamic Speed: ON' : 'Dynamic Speed: OFF'} (Configure)
        </Button>
      </div>

      <Modal isOpen={isSpeedModalOpen} onClose={() => setIsSpeedModalOpen(false)} title="Set Playback Speed">
        <div className="grid grid-cols-3 gap-2">
          {MAX_SPEED_OPTIONS.map(speed => (
            <Button
              key={speed}
              variant={currentEffectiveSpeed === speed && !effectiveSpeedSettings.isEnabled ? 'primary' : 'secondary'}
              onClick={() => {
                changeSpeed(speed); // This will disable dynamic speed and set initialSpeed in effectiveSpeedSettings
                setIsSpeedModalOpen(false);
              }}
            >
              {speed.toFixed(2)}x
            </Button>
          ))}
        </div>
         <Button 
            onClick={() => {
                toggleDynamicSpeed();
                setIsSpeedModalOpen(false);
            }} 
            className="w-full mt-4"
            variant={effectiveSpeedSettings.isEnabled ? "danger" : "primary"}
        >
            {effectiveSpeedSettings.isEnabled ? 'Disable Dynamic Speed' : 'Enable Dynamic Speed'}
        </Button>
      </Modal>

      <Modal isOpen={isTimerModalOpen} onClose={() => setIsTimerModalOpen(false)} title="Sleep Timer">
        <div className="space-y-3">
          {[
            { label: 'Off', value: SleepTimerValue.Off },
            { label: '15 minutes', value: SleepTimerValue.FifteenMinutes },
            { label: '30 minutes', value: SleepTimerValue.ThirtyMinutes },
            { label: '45 minutes', value: SleepTimerValue.FortyFiveMinutes },
            { label: 'End of chapter', value: SleepTimerValue.EndOfChapter },
          ].map(timer => (
            <Button
              key={timer.value}
              variant={globalSettings.sleepTimerDuration === timer.value ? 'primary' : 'secondary'}
              onClick={() => {
                setSleepTimer(timer.value === SleepTimerValue.Off ? null : timer.value);
                setIsTimerModalOpen(false);
              }}
              className="w-full"
            >
              {timer.label}
            </Button>
          ))}
        </div>
      </Modal>

        <Modal isOpen={isDynamicSettingsModalOpen} onClose={() => setIsDynamicSettingsModalOpen(false)} title="Dynamic Speed Settings" size="lg">
            <div className="space-y-4 text-secondary-700 dark:text-secondary-300">
                <div className="flex items-center">
                    <input type="checkbox" id="isEnabled" checked={localDynamicSettings.isEnabled} onChange={(e) => handleDynamicSettingsChange('isEnabled', e.target.checked)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:focus:ring-offset-secondary-800"/>
                    <label htmlFor="isEnabled" className="ml-2 block text-sm font-medium">Enable Dynamic Speed</label>
                </div>
                <div>
                    <label htmlFor="initialSpeed" className="block text-sm font-medium">Initial Speed ({localDynamicSettings.initialSpeed.toFixed(2)}x)</label>
                    <select id="initialSpeed" value={localDynamicSettings.initialSpeed} onChange={(e) => handleDynamicSettingsChange('initialSpeed', parseFloat(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!localDynamicSettings.isEnabled}>
                        {INITIAL_SPEED_OPTIONS.map(s => <option key={`init-${s}`} value={s}>{s.toFixed(2)}x</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="maxSpeed" className="block text-sm font-medium">Maximum Speed ({localDynamicSettings.maxSpeed.toFixed(2)}x)</label>
                     <select id="maxSpeed" value={localDynamicSettings.maxSpeed} onChange={(e) => handleDynamicSettingsChange('maxSpeed', parseFloat(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!localDynamicSettings.isEnabled}>
                        {MAX_SPEED_OPTIONS.map(s => <option key={`max-${s}`} value={s}>{s.toFixed(2)}x</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="rampUpTargetPercentage" className="block text-sm font-medium">Ramp-up Target ({localDynamicSettings.rampUpTargetPercentage}%)</label>
                    <select id="rampUpTargetPercentage" value={localDynamicSettings.rampUpTargetPercentage} onChange={(e) => handleDynamicSettingsChange('rampUpTargetPercentage', parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!localDynamicSettings.isEnabled}>
                        {RAMP_UP_PERCENTAGE_OPTIONS.map(p => <option key={`ramp-${p}`} value={p}>{p}%</option>)}
                    </select>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">Percentage of book duration to reach max speed.</p>
                </div>
                <div>
                    <label htmlFor="updateInterval" className="block text-sm font-medium">Speed Update Interval ({localDynamicSettings.updateInterval}s)</label>
                    <select id="updateInterval" value={localDynamicSettings.updateInterval} onChange={(e) => handleDynamicSettingsChange('updateInterval', parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!localDynamicSettings.isEnabled}>
                        {UPDATE_INTERVAL_OPTIONS.map(i => <option key={`interval-${i}`} value={i}>{i}s</option>)}
                    </select>
                </div>
                <Button onClick={saveDynamicSettings} className="w-full mt-6">Save Settings for this Book</Button>
            </div>
        </Modal>
    </div>
  );
};

export default PlayerScreen;
