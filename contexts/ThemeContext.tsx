import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentTheme, SeasonalTheme, SEASONAL_THEMES } from '@/constants/themes';

type ThemeContextType = {
  currentTheme: SeasonalTheme;
  setTheme: (themeId: string) => void;
  availableThemes: SeasonalTheme[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<SeasonalTheme>(getCurrentTheme());

  // Check for seasonal theme changes daily
  useEffect(() => {
    const checkForSeasonalTheme = () => {
      const seasonalTheme = getCurrentTheme();
      if (seasonalTheme.id !== currentTheme.id) {
        setCurrentTheme(seasonalTheme);
      }
    };

    // Check when component mounts
    checkForSeasonalTheme();

    // Check daily for seasonal theme changes
    const interval = setInterval(checkForSeasonalTheme, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentTheme.id]);

  const setTheme = (themeId: string) => {
    const theme = SEASONAL_THEMES.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        currentTheme, 
        setTheme, 
        availableThemes: SEASONAL_THEMES 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}