import { useEffect, useState } from 'react';
import './ThemeToggle.css';

const STORAGE_KEY = 'irin-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') return 'dark';
  if (saved === 'classic' || saved === 'light') return 'classic';

  return 'classic';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'classic' : 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme === 'dark' ? 'dark mode' : 'classic mode'}`}
      title={`Switch to ${nextTheme === 'dark' ? 'dark mode' : 'classic mode'}`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-label">{theme === 'dark' ? 'Classic' : 'Dark'}</span>
    </button>
  );
}
