
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barClassName?: string;
  height?: string; // e.g., 'h-2', 'h-4'
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  barClassName = 'bg-primary-600 dark:bg-primary-500',
  height = 'h-2',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full bg-secondary-200 dark:bg-secondary-700 rounded-full ${height} ${className}`}>
      <div
        className={`rounded-full ${height} ${barClassName} transition-all duration-300 ease-out`}
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
