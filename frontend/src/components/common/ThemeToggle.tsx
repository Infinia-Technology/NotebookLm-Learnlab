import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { IconButton } from './IconButton';

/**
 * ThemeToggle component allowing users to switch between light and dark modes.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      icon={theme === 'light' ? <Moon /> : <Sun />}
      onClick={toggleTheme}
      variant="ghost"
      size="md"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="text-[var(--gpt-text-secondary)] hover:text-[var(--gpt-text-primary)]"
    />
  );
};

export default ThemeToggle;
