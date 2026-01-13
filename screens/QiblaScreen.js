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

        {/* Ana Gösterge */}
        <View style={styles.indicatorContainer}>
          {/* Çember */}
          <View
            style={[
              styles.circle,
              {
                borderColor: circleColor,
                borderWidth: isPointingToQibla ? 12 : 6,
              }
            ]}
          >
            <View style={styles.innerCircle}>
              {isPointingToQibla ? (
                <>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={styles.statusText}>DOĞRU YÖN</Text>
                </>
              ) : (
                <>
                  <Text style={styles.kaabaIcon}>🕋</Text>
                  <Text style={styles.degreeText}>{difference.toFixed(0)}°</Text>
                  <Text style={styles.statusText}>Çevirin</Text>
                </>
              )}
            </View>
          </View>

          {/* Kuzey İşareti (Sabit - Üstte) */}
          <View style={styles.northIndicator}>
            <Text style={styles.northText}>▲</Text>
            <Text style={styles.northLabel}>KUZEY</Text>
          </View>

          {/* Kıble Oku (DÖNMELİ) */}
          <View
            style={[
              styles.qiblaArrow,
              {
                transform: [{ rotate: `${arrowRotation}deg` }]
              }
            ]}
          >
            <View style={styles.arrowContainer}>
              <View style={styles.arrowHead} />
              <View style={styles.arrowBody} />
            </View>
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
  indicatorContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#FFC107',
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  kaabaIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  checkmark: {
    fontSize: 80,
    color: '#4CAF50',
    marginBottom: 10,
  },
  degreeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  northIndicator: {
    position: 'absolute',
    top: -40,
    alignItems: 'center',
  },
  northText: {
    fontSize: 30,
    color: '#FF5252',
    fontWeight: 'bold',
  },
  northLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: -5,
  },
  qiblaArrow: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4CAF50',
  },
  arrowBody: {
    width: 8,
    height: 40,
    backgroundColor: '#4CAF50',
    marginTop: -2,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
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
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
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