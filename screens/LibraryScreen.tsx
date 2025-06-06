
import React, { useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../contexts/LibraryContext';
import { Book } from '../types';
import Button from '../components/common/Button';
import AddIcon from '../components/icons/AddIcon';
import DeleteIcon from '../components/icons/DeleteIcon';
import ProgressBar from '../components/common/ProgressBar';
import { formatTime } from '../utils/fileProcessor';
import PlayIcon from '../components/icons/PlayIcon';

const LibraryScreen: React.FC = () => {
  const { books, addBookFromFiles, deleteBook, isLoadingBooks } = useLibrary();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddBookClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newBook = await addBookFromFiles(event.target.files);
      if (newBook) {
        // Optionally navigate to the new book's player screen or show success message
        console.log("New book added:", newBook.title);
      }
      event.target.value = ''; // Reset file input
    }
  };

  const calculateProgressPercentage = (book: Book): number => {
    if (!book.totalDuration || book.totalDuration === 0) return 0;
    let timeListened = 0;
    for (let i = 0; i < book.currentTrackIndex; i++) {
      timeListened += book.tracks[i]?.duration || 0;
    }
    timeListened += book.currentTrackTime || 0;
    return (timeListened / book.totalDuration) * 100;
  };

  const getTimeListened = (book: Book): number => {
     let timeListened = 0;
    for (let i = 0; i < book.currentTrackIndex; i++) {
      timeListened += book.tracks[i]?.duration || 0;
    }
    timeListened += book.currentTrackTime || 0;
    return timeListened;
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-secondary-100">My Library</h1>
        <Button onClick={handleAddBookClick} variant="primary" disabled={isLoadingBooks}>
          <AddIcon className="w-5 h-5 mr-2" />
          {isLoadingBooks ? 'Processing...' : 'Add Book'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          // @ts-ignore: webkitdirectory is a non-standard attribute
          webkitdirectory="true"
          directory="true"
          multiple
        />
      </div>

      {isLoadingBooks && <p className="text-center text-secondary-600 dark:text-secondary-400">Loading new book metadata, this may take a moment...</p>}

      {books.length === 0 && !isLoadingBooks ? (
        <div className="text-center py-10">
          <img src="https://picsum.photos/seed/empty-library/300/200" alt="Empty library" className="mx-auto mb-4 rounded-lg opacity-70" />
          <p className="text-xl text-secondary-600 dark:text-secondary-400">Your library is empty.</p>
          <p className="text-secondary-500 dark:text-secondary-400">Click "Add Book" to start listening.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
              <img
                src={book.coverImageDataBase64 || `https://picsum.photos/seed/${book.id}/400/300`}
                alt={`${book.title} cover`}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigate(`/player/${book.id}`)}
              />
              <div className="p-4 flex flex-col flex-grow">
                <h2 
                  className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate mb-1 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => navigate(`/player/${book.id}`)}
                  title={book.title}
                >
                  {book.title}
                </h2>
                <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">
                  {book.tracks.length} track{book.tracks.length === 1 ? '' : 's'} &bull; Total: {formatTime(book.totalDuration)}
                </div>
                
                <div className="mt-auto">
                  <ProgressBar progress={calculateProgressPercentage(book)} height="h-1.5" className="mb-1" />
                  <div className="text-xs text-secondary-600 dark:text-secondary-300 flex justify-between">
                    <span>{formatTime(getTimeListened(book))}</span>
                    <span>{calculateProgressPercentage(book).toFixed(0)}%</span>
                  </div>
                   <div className="mt-3 flex justify-between items-center">
                     <Button size="sm" variant="primary" onClick={() => navigate(`/player/${book.id}`)} className="flex items-center">
                        <PlayIcon className="w-4 h-4 mr-1" /> Play
                     </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      aria-label="Delete book"
                    >
                      <DeleteIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryScreen;
