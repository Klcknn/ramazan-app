import { useMemo } from 'react';
import { useAppearance } from '../context/AppearanceContext';

export const useAppTheme = () => {
  const { darkMode } = useAppearance();

  return useMemo(
    () => ({
      darkMode,
      background: darkMode ? '#0f1d1c' : '#f5f7f7',
      surface: darkMode ? '#1a2b29' : '#ffffff',
      surfaceSoft: darkMode ? '#233936' : '#f1f5f4',
      text: darkMode ? '#f2f7f6' : '#1f2937',
      textMuted: darkMode ? '#9fb4b0' : '#64748b',
      border: darkMode ? '#32514c' : '#dbe4e2',
      accent: '#14b8a6',
      success: '#4caf50',
      headerGradient: darkMode ? ['#0f5f55', '#16796d', '#2b8c80'] : ['#00897B', '#26A69A', '#4DB6AC'],
      switchTrackOff: darkMode ? '#3a4d4a' : '#d0d0d0',
      switchThumbOn: '#ffffff',
      switchThumbOff: darkMode ? '#8aa29d' : '#f5f5f5',
    }),
    [darkMode]
  );
};

