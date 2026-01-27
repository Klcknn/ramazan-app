import { LinearGradient } from 'expo-linear-gradient';
import { Magnetometer } from 'expo-sensors';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { LocationContext } from '../context/LocationContext';
import { calculateDistanceToKaaba, calculateQiblaDirection } from '../utils/qiblaCalculator';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

export default function QiblaScreen() {
  const { location } = useContext(LocationContext);
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [distance, setDistance] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    if (location?.coords) {
      const { latitude, longitude } = location.coords;
      const qibla = calculateQiblaDirection(latitude, longitude);
      const dist = calculateDistanceToKaaba(latitude, longitude);

      setQiblaDirection(qibla);
      setDistance(dist);

      console.log('📍 Konum:', latitude.toFixed(4), longitude.toFixed(4));
      console.log('🕋 Kıble:', qibla.toFixed(1), '°');
      console.log('📏 Mesafe:', dist, 'km');
    } else {
      Alert.alert('Konum Gerekli', 'Kıble yönünü hesaplamak için konum izni gereklidir.');
    }

    startMagnetometer();
    return () => stopMagnetometer();
  }, [location]);

  const startMagnetometer = useCallback(async () => {
    const isAvailable = await Magnetometer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Hata', 'Cihazınızda pusula sensörü yok');
      return;
    }

    Magnetometer.setUpdateInterval(100);

    const sub = Magnetometer.addListener((data) => {
      let angle;

      if (Platform.OS === 'android') {
        angle = Math.atan2(-data.x, data.y);
      } else {
        angle = Math.atan2(data.y, data.x);
      }

      angle = angle * (180 / Math.PI);
      angle = (angle + 360) % 360;
      
      setHeading(angle);
      setIsCalibrated(true);
    });

    setSubscription(sub);
  }, []);

  const stopMagnetometer = useCallback(() => {
    subscription?.remove();
    setSubscription(null);
  }, [subscription]);

  // Kıble okunu döndür (telefonun yönüne göre)
  const arrowRotation = ((qiblaDirection - heading) + 360) % 360;

  // Kıble ile telefon arasındaki fark
  const difference = Math.min(
    Math.abs(qiblaDirection - heading),
    360 - Math.abs(qiblaDirection - heading)
  );

  const isPointingToQibla = difference < 10;
  const circleColor = isPointingToQibla ? '#4CAF50' : difference < 30 ? '#FFC107' : '#FF9800';

  return (
    <LinearGradient colors={['#1565C0', '#1976D2', '#42A5F5']} style={styles.container}>
      <View style={styles.content}>
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={styles.title}>🕋 Kıble Yönü</Text>
          <Text style={styles.subtitle}>Telefonunuzu yavaşça çevirin</Text>
        </View>

        {/* Mesafe */}
        <View style={styles.distanceCard}>
          <Text style={styles.distanceLabel}>Kabe&apos;ye Mesafe</Text>
          <Text style={styles.distanceText}>{distance.toLocaleString('tr-TR')} km</Text>
        </View>

        {/* Pusula Göstergesi */}
        <View style={styles.compassContainer}>
          {/* Dış Altın Çerçeve - Dinamik Renk */}
          <View style={[styles.outerRing, { 
            borderColor: circleColor,
            borderWidth: isPointingToQibla ? 12 : 8,
          }]}>
            {/* İç Beyaz Daire */}
            <View style={styles.compassFace}>
              {/* Kıble Bulunduğunda Kabe İkonu */}
              {isPointingToQibla && (
                <View style={styles.kaabaIconContainer}>
                  <Text style={styles.kaabaIcon}>🕋</Text>
                </View>
              )}

              {/* Ana Yön İşaretleri */}
              <View style={[styles.directionLabel, { top: 5 }]}>
                <Text style={styles.degreeText}>0°</Text>
              </View>
              <View style={[styles.directionLabel, { right: 5 }]}>
                <Text style={styles.degreeText}>90°</Text>
              </View>
              <View style={[styles.directionLabel, { bottom: 5 }]}>
                <Text style={styles.degreeText}>180°</Text>
              </View>
              <View style={[styles.directionLabel, { left: 5 }]}>
                <Text style={styles.degreeText}>270°</Text>
              </View>

              {/* Orta Çizgiler */}
              <View style={[styles.centerLine, { transform: [{ rotate: '0deg' }] }]} />
              <View style={[styles.centerLine, { transform: [{ rotate: '90deg' }] }]} />

              {/* Derece İşaretleri (Her 30°) */}
              {[...Array(12)].map((_, i) => {
                const angle = i * 30;
                return (
                  <View
                    key={i}
                    style={[
                      styles.tickMark,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -CIRCLE_SIZE * 0.4 }
                        ]
                      }
                    ]}
                  />
                );
              })}

              {/* Pusula İbresi (DÖNER) */}
              <View
                style={[
                  styles.needleContainer,
                  {
                    transform: [{ rotate: `${arrowRotation}deg` }]
                  }
                ]}
              >
                {/* Kuzey Tarafı (Yeşil) */}
                <View style={styles.needleNorth} />
                {/* Güney Tarafı (Koyu) */}
                <View style={styles.needleSouth} />
              </View>

              {/* Merkez Düğme */}
              <View style={styles.centerButton}>
                <View style={styles.centerButtonInner} />
              </View>
            </View>

            {/* Dış Çerçeve Degrade Efekti */}
            <View style={styles.outerRingHighlight} />
          </View>

          {/* Yön Etiketleri (KUZEY, DOĞU, GÜNEY, BATI) */}
          <View style={styles.northLabel}>
            <Text style={styles.northText}>▲</Text>
            <Text style={styles.directionLabelText}>KUZEY</Text>
          </View>

          <View style={styles.eastLabel}>
            <Text style={styles.directionLabelText}>DOĞU</Text>
          </View>

          <View style={styles.southLabel}>
            <Text style={styles.directionLabelText}>GÜNEY</Text>
          </View>

          <View style={styles.westLabel}>
            <Text style={styles.directionLabelText}>BATI</Text>
          </View>
        </View>

        {/* Bilgi Kartları */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Kıble Yönü</Text>
            <Text style={styles.infoValue}>{qiblaDirection.toFixed(0)}°</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Telefonun Yönü</Text>
            <Text style={styles.infoValue}>{heading.toFixed(0)}°</Text>
          </View>
        </View>

        {/* Durum Mesajı */}
        <View style={[styles.statusCard, { backgroundColor: circleColor + '30' }]}>
          <Text style={[styles.statusCardText, { color: circleColor }]}>
            {isPointingToQibla 
              ? '✅ Kıble yönüne bakıyorsunuz!' 
              : difference < 30
              ? '🟡 Yaklaşıyorsunuz, biraz daha çevirin'
              : '🔴 Telefonunuzu yavaşça çevirerek kıble yönünü bulun'
            }
          </Text>
        </View>

        {/* Kalibrasyon */}
        {!isCalibrated && (
          <View style={styles.calibrationNote}>
            <Text style={styles.calibrationText}>⚠️ Pusula kalibre ediliyor...</Text>
          </View>
        )}
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
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
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
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 3,
  },
  distanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  compassContainer: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  outerRing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  outerRingHighlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    height: CIRCLE_SIZE * 0.3,
    borderTopLeftRadius: CIRCLE_SIZE / 2,
    borderTopRightRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  compassFace: {
    width: CIRCLE_SIZE - 30,
    height: CIRCLE_SIZE - 30,
    borderRadius: (CIRCLE_SIZE - 30) / 2,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C0A060',
  },
  kaabaIconContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  kaabaIcon: {
    fontSize: 80,
  },
  directionLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  degreeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  centerLine: {
    position: 'absolute',
    width: CIRCLE_SIZE - 50,
    height: 1,
    backgroundColor: '#C0A060',
    opacity: 0.3,
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: '#8B7355',
  },
  needleContainer: {
    position: 'absolute',
    width: CIRCLE_SIZE - 40,
    height: CIRCLE_SIZE - 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  needleNorth: {
    position: 'absolute',
    top: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: CIRCLE_SIZE * 0.35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  needleSouth: {
    position: 'absolute',
    bottom: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: CIRCLE_SIZE * 0.35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#5D4E37',
    opacity: 0.6,
  },
  centerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#B8941E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  centerButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C9A236',
    borderWidth: 1,
    borderColor: '#A68B2E',
  },
  northLabel: {
    position: 'absolute',
    top: -25,
    alignItems: 'center',
  },
  northText: {
    fontSize: 24,
    color: '#FF5252',
    fontWeight: 'bold',
  },
  directionLabelText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eastLabel: {
    position: 'absolute',
    right: -12,
    alignItems: 'center',
  },
  southLabel: {
    position: 'absolute',
    bottom: -1,
    alignItems: 'center',
  },
  westLabel: {
    position: 'absolute',
    left: -12,
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  infoLabel: {
    fontSize: 11,
    color: '#E3F2FD',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 12,
    width: '100%',
  },
  statusCardText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  calibrationNote: {
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  calibrationText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});