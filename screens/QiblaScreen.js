import { LinearGradient } from 'expo-linear-gradient';
import { Magnetometer } from 'expo-sensors';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { LocationContext } from '../context/LocationContext';
import { calculateDistanceToKaaba, calculateQiblaDirection } from '../utils/qiblaCalculator';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;

export default function QiblaScreen() {
  const { location } = useContext(LocationContext);
  const [magnetometer, setMagnetometer] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [distance, setDistance] = useState(0);
  const [subscription, setSubscription] = useState(null);
  
  const compassRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Konum varsa Kıble yönünü hesapla
    if (location?.coords) {
      const { latitude, longitude } = location.coords;
      const qibla = calculateQiblaDirection(latitude, longitude);
      const dist = calculateDistanceToKaaba(latitude, longitude);
      
      setQiblaDirection(qibla);
      setDistance(dist);
      
      console.log('🕋 Kıble yönü:', qibla.toFixed(2), '°');
      console.log('📏 Kabe mesafesi:', dist, 'km');
    } else {
      Alert.alert('Konum Gerekli', 'Kıble yönünü hesaplamak için konum izni gereklidir.');
    }

    // Magnetometre başlat
    _subscribe();

    return () => {
      _unsubscribe();
    };
  }, [location]);

  const _subscribe = () => {
    Magnetometer.setUpdateInterval(100); // Her 100ms güncelle
    
    const sub = Magnetometer.addListener((data) => {
      let angle = _angle(data);
      
      // Animasyonlu dönüş
      Animated.spring(compassRotation, {
        toValue: -angle,
        useNativeDriver: true,
        friction: 8,
      }).start();
      
      setMagnetometer(angle);
    });
    
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const _angle = (magnetometer) => {
    if (magnetometer) {
      let { x, y } = magnetometer;
      
      if (Math.atan2(y, x) >= 0) {
        return Math.atan2(y, x) * (180 / Math.PI);
      } else {
        return (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
      }
    }
    return 0;
  };

  // Kıble ok yönü (pusula + kıble farkı)
  const qiblaArrowRotation = compassRotation.interpolate({
    inputRange: [0, 360],
    outputRange: [`${qiblaDirection}deg`, `${qiblaDirection + 360}deg`],
  });

  return (
    <LinearGradient
      colors={['#1565C0', '#1976D2', '#42A5F5']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={styles.title}>🕋 Kıble Yönü</Text>
          <Text style={styles.subtitle}>Kabe&apos;ye olan yön ve mesafe</Text>
        </View>

        {/* Mesafe Bilgisi */}
        <View style={styles.distanceCard}>
          <Text style={styles.distanceLabel}>Kabe&apos;ye Mesafe</Text>
          <Text style={styles.distanceText}>{distance.toLocaleString('tr-TR')} km</Text>
        </View>

        {/* Pusula */}
        <View style={styles.compassContainer}>
          <Animated.View
            style={[
              styles.compass,
              {
                transform: [{ rotate: compassRotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })}]
              }
            ]}
          >
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
              {/* Dış Çember */}
              <Circle
                cx={COMPASS_SIZE / 2}
                cy={COMPASS_SIZE / 2}
                r={COMPASS_SIZE / 2 - 10}
                stroke="#FFFFFF"
                strokeWidth="4"
                fill="rgba(255, 255, 255, 0.1)"
              />

              {/* İç Çember */}
              <Circle
                cx={COMPASS_SIZE / 2}
                cy={COMPASS_SIZE / 2}
                r={COMPASS_SIZE / 2 - 40}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
                fill="transparent"
              />

              {/* Yön İşaretleri */}
              {/* Kuzey (N) */}
              <G>
                <Line
                  x1={COMPASS_SIZE / 2}
                  y1={20}
                  x2={COMPASS_SIZE / 2}
                  y2={50}
                  stroke="#FF5252"
                  strokeWidth="4"
                />
                <SvgText
                  x={COMPASS_SIZE / 2}
                  y={70}
                  fontSize="24"
                  fontWeight="bold"
                  fill="#FF5252"
                  textAnchor="middle"
                >
                  K
                </SvgText>
              </G>

              {/* Doğu (E) */}
              <G>
                <Line
                  x1={COMPASS_SIZE - 50}
                  y1={COMPASS_SIZE / 2}
                  x2={COMPASS_SIZE - 20}
                  y2={COMPASS_SIZE / 2}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />
                <SvgText
                  x={COMPASS_SIZE - 60}
                  y={COMPASS_SIZE / 2 + 8}
                  fontSize="20"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  D
                </SvgText>
              </G>

              {/* Güney (S) */}
              <G>
                <Line
                  x1={COMPASS_SIZE / 2}
                  y1={COMPASS_SIZE - 50}
                  x2={COMPASS_SIZE / 2}
                  y2={COMPASS_SIZE - 20}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />
                <SvgText
                  x={COMPASS_SIZE / 2}
                  y={COMPASS_SIZE - 55}
                  fontSize="20"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  G
                </SvgText>
              </G>

              {/* Batı (W) */}
              <G>
                <Line
                  x1={20}
                  y1={COMPASS_SIZE / 2}
                  x2={50}
                  y2={COMPASS_SIZE / 2}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />
                <SvgText
                  x={60}
                  y={COMPASS_SIZE / 2 + 8}
                  fontSize="20"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  B
                </SvgText>
              </G>

              {/* Derece İşaretleri */}
              {[...Array(36)].map((_, i) => {
                const angle = (i * 10) * (Math.PI / 180);
                const x1 = COMPASS_SIZE / 2 + Math.sin(angle) * (COMPASS_SIZE / 2 - 45);
                const y1 = COMPASS_SIZE / 2 - Math.cos(angle) * (COMPASS_SIZE / 2 - 45);
                const x2 = COMPASS_SIZE / 2 + Math.sin(angle) * (COMPASS_SIZE / 2 - 35);
                const y2 = COMPASS_SIZE / 2 - Math.cos(angle) * (COMPASS_SIZE / 2 - 35);
                
                return (
                  <Line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={i % 9 === 0 ? "2" : "1"}
                  />
                );
              })}
            </Svg>
          </Animated.View>

          {/* Kıble Ok (Ortada Sabit) */}
          <Animated.View
            style={[
              styles.qiblaArrow,
              {
                transform: [{ rotate: qiblaArrowRotation }]
              }
            ]}
          >
            <Svg width={80} height={80} viewBox="0 0 80 80">
              {/* Yeşil Ok */}
              <Path
                d="M 40 10 L 50 35 L 40 30 L 30 35 Z"
                fill="#4CAF50"
                stroke="#2E7D32"
                strokeWidth="2"
              />
              {/* Ok Gövdesi */}
              <Line
                x1="40"
                y1="30"
                x2="40"
                y2="60"
                stroke="#4CAF50"
                strokeWidth="4"
              />
              {/* Kabe İkonu */}
              <SvgText
                x="40"
                y="22"
                fontSize="16"
                textAnchor="middle"
              >
                🕋
              </SvgText>
            </Svg>
          </Animated.View>
        </View>

        {/* Derece Gösterimi */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Kıble Yönü</Text>
            <Text style={styles.infoValue}>{qiblaDirection.toFixed(1)}°</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pusula Yönü</Text>
            <Text style={styles.infoValue}>{magnetometer.toFixed(1)}°</Text>
          </View>
        </View>

        {/* Kalibrasyon Uyarısı */}
        <View style={styles.calibrationNote}>
          <Text style={styles.calibrationText}>
            💡 En doğru sonuç için telefonunuzu düz tutun ve metal objelerden uzak durun
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  distanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  distanceLabel: {
    fontSize: 14,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 5,
  },
  distanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
  },
  qiblaArrow: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#E3F2FD',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calibrationNote: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  calibrationText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
  },
});