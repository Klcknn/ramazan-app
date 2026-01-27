import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  // Animasyon referansları
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const dotsAnim1 = useRef(new Animated.Value(0)).current;
  const dotsAnim2 = useRef(new Animated.Value(0)).current;
  const dotsAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ana animasyon dizisi
    Animated.sequence([
      // 1. Logo fade in ve scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 8,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      // 2. Logo rotasyon efekti
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // 3. Text slide in
      Animated.spring(textSlideAnim, {
        toValue: 0,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Sürekli pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer efekti
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Loading dots animasyonu
    const dotAnimation = (animValue, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    dotAnimation(dotsAnim1, 0);
    dotAnimation(dotsAnim2, 200);
    dotAnimation(dotsAnim3, 400);

    // 5 saniye sonra ana sayfaya geç
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Rotasyon interpolation
  const rotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Shimmer interpolation
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <LinearGradient
      colors={['#00695C', '#00897B', '#26A69A']}
      style={styles.container}
    >
      {/* Arka plan dekoratif daireler */}
      <View style={styles.backgroundCircles}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo - Animasyonlu İkon */}
        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: rotation }
              ],
            },
          ]}
        >
          {/* İç daire - daha küçük */}
          <View style={styles.innerCircle}>
            <Text style={styles.logoIcon}>🕌</Text>
          </View>

          {/* Shimmer overlay efekti */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />

          {/* Dekoratif yıldızlar */}
          <View style={[styles.starDecor, styles.star1]}>
            <Text style={styles.starIcon}>✨</Text>
          </View>
          <View style={[styles.starDecor, styles.star2]}>
            <Text style={styles.starIcon}>✨</Text>
          </View>
          <View style={[styles.starDecor, styles.star3]}>
            <Text style={styles.starIcon}>🌙</Text>
          </View>
        </Animated.View>

        {/* Uygulama Adı - Slide animasyonlu */}
        <Animated.View
          style={{
            transform: [{ translateY: textSlideAnim }],
            opacity: fadeAnim,
          }}
        >
          <Text style={styles.appName}>İslami Hayat</Text>
          <Text style={styles.appSlogan}>Namaz, Dua ve Kıble Rehberiniz</Text>

          {/* Alt çizgi dekorasyonu */}
          <View style={styles.underlineContainer}>
            <View style={styles.underline} />
            <View style={styles.underlineDot} />
            <View style={styles.underline} />
          </View>
        </Animated.View>

        {/* Loading Indicator - Animasyonlu noktalar */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              {
                opacity: dotsAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: dotsAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                opacity: dotsAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: dotsAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                opacity: dotsAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: dotsAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Alt Bilgi */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.footerText}>Konum izni isteniyor...</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height / 2,
    right: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  innerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 70,
  },
  shimmerOverlay: {
    position: 'absolute',
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  starDecor: {
    position: 'absolute',
  },
  star1: {
    top: 10,
    right: 15,
  },
  star2: {
    bottom: 15,
    left: 10,
  },
  star3: {
    top: 15,
    left: 15,
  },
  starIcon: {
    fontSize: 20,
  },
  appName: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSlogan: {
    fontSize: 15,
    color: '#E0F2F1',
    marginBottom: 25,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  underlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
  },
  underline: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
  },
  underlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD54F',
    marginHorizontal: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#E0F2F1',
    fontWeight: '500',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
});