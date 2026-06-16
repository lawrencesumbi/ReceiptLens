// context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// 1. Define your color palettes
export const Colors = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    card: '#f6f6fa',
    primary: '#007AFF',
    border: '#CCCCCC',
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    card: '#1E1E1E',
    primary: '#0A84FF',
    border: '#333333',
  },
};

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;                // 'light' | 'dark' | 'system'
  setTheme: (theme: ThemeType) => void;
  colors: typeof Colors.light;     // The actual active colors to use in styling
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'

  // Load saved theme on initialization
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    };
    loadTheme();
  }, []);

  // Setter function that also saves to storage
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('user-theme', newTheme);
  };

  // Determine if dark mode is active based on current state
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  
  // Pick active color palette
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};