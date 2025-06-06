
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeManager } from './components/ThemeManager';
import LibraryScreen from './screens/LibraryScreen';
import PlayerScreen from './screens/PlayerScreen';
import SettingsScreen from './screens/SettingsScreen';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ThemeManager>
        <LibraryProvider>
          <HashRouter>
            <MainLayout>
              <Routes>
                <Route path="/library" element={<LibraryScreen />} />
                <Route path="/player/:bookId" element={<PlayerScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="*" element={<Navigate to="/library" replace />} />
              </Routes>
            </MainLayout>
          </HashRouter>
        </LibraryProvider>
      </ThemeManager>
    </SettingsProvider>
  );
};

export default App;
