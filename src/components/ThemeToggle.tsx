'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Ensure the component is mounted before rendering the switch to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="dark-mode-switch">
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </Label>
      <Switch
        id="dark-mode-switch"
        checked={isDarkMode}
        onCheckedChange={toggleTheme}
      />
    </div>
  );
}
