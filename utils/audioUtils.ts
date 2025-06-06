
import { Book, Track } from '../types';

export const setupMediaSession = (
  book: Book,
  currentTrack: Track,
  handlers: {
    onPlay: () => void;
    onPause: () => void;
    onSeekBackward: () => void;
    onSeekForward: () => void;
    onPreviousTrack: () => void;
    onNextTrack: () => void;
  }
) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: book.title,
      album: book.title,
      artwork: book.coverImageDataBase64
        ? [{ src: book.coverImageDataBase64, sizes: '512x512', type: 'image/jpeg' }] // Assuming JPEG, adjust if type is known
        : [{ src: `https://picsum.photos/seed/${book.id}/512/512`, sizes: '512x512', type: 'image/jpeg' }]
    });

    navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    navigator.mediaSession.setActionHandler('seekbackward', handlers.onSeekBackward); // e.g., 10s
    navigator.mediaSession.setActionHandler('seekforward', handlers.onSeekForward);   // e.g., 10s
    navigator.mediaSession.setActionHandler('previoustrack', handlers.onPreviousTrack);
    navigator.mediaSession.setActionHandler('nexttrack', handlers.onNextTrack);
  }
};

export const clearMediaSession = () => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }
};
