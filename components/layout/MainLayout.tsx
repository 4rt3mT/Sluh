
import React, { ReactNode } from 'react';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-secondary-100 dark:bg-secondary-900 transition-colors duration-300">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-white dark:bg-secondary-800 text-center py-4 border-t border-secondary-200 dark:border-secondary-700">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          NeuroSluh &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;
