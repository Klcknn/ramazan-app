import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  DARK_MODE: 'appearance_dark_mode',
  BACKGROUND_THEME: 'appearance_background_theme',
};

const DEFAULT_VALUE = {
  darkMode: false,
  backgroundTheme: 'default',
  isLoaded: false,
  setDarkMode: async () => {},
  setBackgroundTheme: async () => {},
};

const AppearanceContext = createContext(DEFAULT_VALUE);

export const AppearanceProvider = ({ children }) => {
  const [darkMode, setDarkModeState] = useState(false);
  const [backgroundTheme, setBackgroundThemeState] = useState('default');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [storedDarkMode, storedBackgroundTheme] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_THEME),
        ]);

        if (!mounted) return;
        setDarkModeState(storedDarkMode === 'true');
        if (storedBackgroundTheme) {
          setBackgroundThemeState(storedBackgroundTheme);
        }
      } catch (error) {
        console.error('Appearance ayarlari yuklenemedi:', error);
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const setDarkMode = async (value) => {
    const nextValue = Boolean(value);
    setDarkModeState(nextValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(nextValue));
    } catch (error) {
      console.error('Dark mode ayari kaydedilemedi:', error);
    }
  };

  const setBackgroundTheme = async (value) => {
    const allowed = ['default', 'pattern', 'gradient'];
    const nextValue = allowed.includes(value) ? value : 'default';
    setBackgroundThemeState(nextValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_THEME, nextValue);
    } catch (error) {
      console.error('Arkaplan temasi kaydedilemedi:', error);
    }
  };

  const value = useMemo(
    () => ({
      darkMode,
      backgroundTheme,
      isLoaded,
      setDarkMode,
      setBackgroundTheme,
    }),
    [backgroundTheme, darkMode, isLoaded]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export const useAppearance = () => useContext(AppearanceContext);

