import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 0.72,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    blink.start();

    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      blink.stop();
      clearTimeout(timer);
    };
  }, [logoOpacity, onFinish]);

  return (
    <LinearGradient colors={['#00695C', '#00897B', '#26A69A']} style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity }]}>
        <Image source={require('../assets/images/App_logo.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.appSlogan}>Namaz, Dua ve Kıble Rehberiniz</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logo: {
    width: 190,
    height: 190,
    tintColor: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
  },
  appSlogan: {
    fontSize: 18,
    color: '#E0F2F1',
    textAlign: 'center',
  },
});

