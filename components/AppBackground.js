import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';

const THEME_COLORS = {
  light: {
    default: ['#f3faf8', '#eef7f6'],
    pattern: ['#ecf7f3', '#dff1ea'],
    gradient: ['#e6f7f4', '#d7f0ec', '#cdeae5'],
  },
  dark: {
    default: ['#0f1d1c', '#132523'],
    pattern: ['#102120', '#18302d'],
    gradient: ['#102726', '#163836', '#1e4a46'],
  },
};

export default function AppBackground() {
  const { darkMode, backgroundTheme } = useAppearance();
  const mode = darkMode ? 'dark' : 'light';
  const colors = THEME_COLORS[mode][backgroundTheme] || THEME_COLORS[mode].default;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient colors={colors} style={styles.fill} />
      {backgroundTheme === 'pattern' && (
        <View style={styles.patternLayer}>
          <View style={[styles.patternDot, styles.dotOne, darkMode && styles.patternDotDark]} />
          <View style={[styles.patternDot, styles.dotTwo, darkMode && styles.patternDotDark]} />
          <View style={[styles.patternDot, styles.dotThree, darkMode && styles.patternDotDark]} />
          <View style={[styles.patternRing, darkMode && styles.patternRingDark]} />
        </View>
      )}
      {darkMode && <View style={styles.darkOverlay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  patternDot: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(12, 133, 108, 0.08)',
  },
  patternDotDark: {
    backgroundColor: 'rgba(127, 255, 222, 0.08)',
  },
  dotOne: {
    top: 64,
    right: 24,
  },
  dotTwo: {
    top: 260,
    left: -24,
  },
  dotThree: {
    bottom: 120,
    right: -16,
  },
  patternRing: {
    position: 'absolute',
    top: 180,
    right: 80,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(12, 133, 108, 0.16)',
  },
  patternRingDark: {
    borderColor: 'rgba(127, 255, 222, 0.18)',
  },
});

