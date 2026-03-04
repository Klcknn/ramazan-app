import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
import 'react-native-reanimated';

import { AppearanceProvider, useAppearance } from '../context/AppearanceContext';
import { LocalizationProvider } from '../context/LocalizationContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

function RootNavigator() {
  const { darkMode } = useAppearance();
  const appTheme = darkMode ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={appTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <AppearanceProvider>
        <RootNavigator />
      </AppearanceProvider>
    </LocalizationProvider>
  );
}
