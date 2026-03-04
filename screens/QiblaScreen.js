import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Magnetometer } from 'expo-sensors';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Dimensions, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { createResponsiveStyles } from '../hooks/responsive-styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../context/LocalizationContext';
import { useAppTheme } from '../hooks/use-app-theme';
import { LocationContext } from '../context/LocationContext';
import { calculateDistanceToKaaba, calculateQiblaDirection } from '../utils/qiblaCalculator';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

export default function QiblaScreen({ navigation }) {
  const { location } = useContext(LocationContext);
  const theme = useAppTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const softScale = clamp(Math.min(screenWidth / 393, screenHeight / 851), 0.92, 1.05);
  const rs = (value, factor = 1) => Math.round(value * (1 + (softScale - 1) * factor));
  const circleSize = clamp(screenWidth * 0.7, 250, 320);
  const headerTopPadding = Math.max(rs(50, 1), insets.top + rs(8, 0.9));
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
      Alert.alert(t('qibla.locationRequiredTitle'), t('qibla.locationRequiredDesc'));
    }

    startMagnetometer();
    return () => stopMagnetometer();
  }, [location]);

  const startMagnetometer = useCallback(async () => {
    const isAvailable = await Magnetometer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(t('common.error'), t('qibla.sensorError'));
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
  const statusReadableColor = isPointingToQibla
    ? '#2E7D32'
    : difference < 30
    ? '#8A5A00'
    : '#B45309';

  return (
    <ImageBackground
      source={require('../assets/images/kabe_background_image.png')}
      style={styles.container}
      imageStyle={styles.screenBackgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.headerBar,
          {
            paddingHorizontal: rs(15, 0.9),
            paddingVertical: rs(14, 0.9),
            paddingTop: headerTopPadding,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: '#FFFFFF', fontSize: rs(20, 1) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>{t('headers.qibla')}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.content, { paddingTop: rs(18, 0.95), paddingHorizontal: rs(18, 0.95), paddingBottom: Math.max(rs(18, 0.95), insets.bottom + rs(10, 0.9)) }]}>
        <View style={[styles.topStatsRow, { marginBottom: rs(16, 0.95), gap: rs(8, 0.9) }]}>
          <View style={[styles.infoCard, styles.topStatCard, { backgroundColor: theme.surface, borderColor: circleColor, borderRadius: rs(14, 0.95), paddingVertical: rs(10, 0.9), paddingHorizontal: rs(10, 0.9) }]}>
            <Text style={[styles.infoLabel, { color: theme.textMuted, fontSize: rs(11, 0.9) }]}>{t('qibla.direction')}</Text>
            <Text style={[styles.infoValue, styles.topInfoValue, { color: theme.text, fontSize: rs(16, 0.95) }]}>{qiblaDirection.toFixed(0)}°</Text>
          </View>

          {/* Mesafe */}
          <View style={[styles.distanceCard, styles.topDistanceCard, { backgroundColor: theme.surface, borderRadius: rs(14, 0.95), paddingVertical: rs(10, 0.9), paddingHorizontal: rs(10, 0.9) }]}>
            <Text style={[styles.distanceLabel, { color: theme.textMuted, fontSize: rs(11, 0.9) }]}>{t('qibla.distance')}</Text>
            <Text style={[styles.distanceText, styles.topDistanceText, { color: theme.text, fontSize: rs(15, 0.95) }]}>
              {distance.toLocaleString('tr-TR')} km
            </Text>
          </View>

          <View style={[styles.infoCard, styles.topStatCard, { backgroundColor: theme.surface, borderColor: circleColor, borderRadius: rs(14, 0.95), paddingVertical: rs(10, 0.9), paddingHorizontal: rs(10, 0.9) }]}>
            <Text style={[styles.infoLabel, { color: theme.textMuted, fontSize: rs(11, 0.9) }]}>{t('qibla.phoneDirection')}</Text>
            <Text style={[styles.infoValue, styles.topInfoValue, { color: theme.text, fontSize: rs(16, 0.95) }]}>{heading.toFixed(0)}°</Text>
          </View>
        </View>

        {/* Pusula Göstergesi */}
        <View style={[styles.compassContainer, { width: circleSize + rs(40, 0.9), height: circleSize + rs(40, 0.9), marginBottom: rs(18, 0.95) }]}>
          {/* Dış Altın Çerçeve - Dinamik Renk */}
          <View style={[styles.outerRing, { 
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: circleColor,
            borderWidth: isPointingToQibla ? rs(12, 0.95) : rs(8, 0.95),
          }]}>
            {/* İç Beyaz Daire */}
            <View style={[styles.compassFace, { width: circleSize - rs(30, 0.95), height: circleSize - rs(30, 0.95), borderRadius: (circleSize - rs(30, 0.95)) / 2 }]}>
              {/* Kıble Bulunduğunda Kabe İkonu */}
              {isPointingToQibla && (
                <View style={styles.kaabaIconContainer}>
                  <Text style={[styles.kaabaIcon, { fontSize: rs(60, 1) }]}>🕋</Text>
                </View>
              )}

              {/* Ana Yön İşaretleri */}
              <View style={[styles.directionLabel, { top: rs(5, 0.9) }]}>
                <Text style={[styles.degreeText, { fontSize: rs(13, 0.95) }]}>0°</Text>
              </View>
              <View style={[styles.directionLabel, { right: rs(5, 0.9) }]}>
                <Text style={[styles.degreeText, { fontSize: rs(13, 0.95) }]}>90°</Text>
              </View>
              <View style={[styles.directionLabel, { bottom: rs(5, 0.9) }]}>
                <Text style={[styles.degreeText, { fontSize: rs(13, 0.95) }]}>180°</Text>
              </View>
              <View style={[styles.directionLabel, { left: rs(5, 0.9) }]}>
                <Text style={[styles.degreeText, { fontSize: rs(13, 0.95) }]}>270°</Text>
              </View>

              {/* Orta Çizgiler */}
              <View style={[styles.centerLine, { width: circleSize - rs(50, 0.95), transform: [{ rotate: '0deg' }] }]} />
              <View style={[styles.centerLine, { width: circleSize - rs(50, 0.95), transform: [{ rotate: '90deg' }] }]} />

              {/* Derece İşaretleri (Her 30°) */}
              {[...Array(12)].map((_, i) => {
                const angle = i * 30;
                return (
                  <View
                    key={i}
                    style={[
                      styles.tickMark,
                      {
                        width: rs(2, 0.9),
                        height: rs(10, 0.9),
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -circleSize * 0.4 }
                        ]
                      }
                    ]}
                  />
                );
              })}

              {/* Pusula İbresi (DÖNER) */}
              <View
                style={[styles.needleContainer, { width: circleSize - rs(40, 0.95), height: circleSize - rs(40, 0.95), transform: [{ rotate: `${arrowRotation}deg` }] }]}
              >
                {/* Kuzey Tarafı (Yeşil) */}
                <View style={[styles.needleNorth, { borderBottomWidth: circleSize * 0.35, borderLeftWidth: rs(12, 0.95), borderRightWidth: rs(12, 0.95), top: rs(10, 0.95) }]} />
                {/* Güney Tarafı (Koyu) */}
                <View style={[styles.needleSouth, { borderTopWidth: circleSize * 0.35, borderLeftWidth: rs(12, 0.95), borderRightWidth: rs(12, 0.95), bottom: rs(10, 0.95) }]} />
              </View>

              {/* Merkez Düğme */}
              <View style={[styles.centerButton, { width: rs(40, 0.95), height: rs(40, 0.95), borderRadius: rs(20, 0.95) }]}>
                <View style={[styles.centerButtonInner, { width: rs(20, 0.95), height: rs(20, 0.95), borderRadius: rs(10, 0.95) }]} />
              </View>
            </View>

            {/* Dış Çerçeve Degrade Efekti */}
            <View style={[styles.outerRingHighlight, { height: circleSize * 0.3, borderTopLeftRadius: circleSize / 2, borderTopRightRadius: circleSize / 2 }]} />
          </View>

          {/* Yön Etiketleri (KUZEY, DOĞU, GÜNEY, BATI) */}
          <View style={[styles.northLabel, { top: -rs(24, 0.9) }]}>
            <Text style={[styles.northText, { fontSize: rs(22, 0.95) }]}>▲</Text>
            <Text style={[styles.directionLabelText, { fontSize: rs(12, 0.95) }]}>{t('qibla.north')}</Text>
          </View>

          <View style={[styles.eastLabel, { right: -rs(12, 0.9) }]}>
            <Text style={[styles.directionLabelText, { fontSize: rs(12, 0.95) }]}>{t('qibla.east')}</Text>
          </View>

          <View style={[styles.southLabel, { bottom: -rs(1, 0.9) }]}>
            <Text style={[styles.directionLabelText, { fontSize: rs(12, 0.95) }]}>{t('qibla.south')}</Text>
          </View>

          <View style={[styles.westLabel, { left: -rs(12, 0.9) }]}>
            <Text style={[styles.directionLabelText, { fontSize: rs(12, 0.95) }]}>{t('qibla.west')}</Text>
          </View>
        </View>

        <View style={[styles.rotationNoteContainer, { borderRadius: rs(10, 0.9), paddingVertical: rs(8, 0.9), paddingHorizontal: rs(12, 0.9), marginBottom: rs(10, 0.9) }]}>
          <Text style={[styles.rotationNoteText, { fontSize: rs(12, 0.95) }]}>{t('qibla.rotatePhone')}</Text>
        </View>

        {/* Durum Mesajı */}
        <View style={[styles.statusCard, { backgroundColor: '#FFFFFF', borderColor: circleColor, borderRadius: rs(12, 0.9), padding: rs(10, 0.9) }]}>
          <Text style={[styles.statusCardText, { color: statusReadableColor, fontSize: rs(13, 0.95), lineHeight: rs(19, 0.95) }]}>
            {isPointingToQibla 
              ? `✅ ${t('qibla.aligned')}` 
              : difference < 30
              ? `🟡 ${t('qibla.near')}`
              : `🔴 ${t('qibla.far')}`
            }
          </Text>
        </View>

        {/* Kalibrasyon */}
        {!isCalibrated && (
          <View style={[styles.calibrationNote, { borderRadius: rs(10, 0.9), padding: rs(12, 0.9), marginTop: rs(10, 0.9) }]}>
            <Text style={[styles.calibrationText, { fontSize: rs(12, 0.95) }]}>⚠️ {t('qibla.calibrating')}</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = createResponsiveStyles({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  screenBackgroundImage: {
    opacity: 0.65,
  },
  content: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  rotationNoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  rotationNoteText: {
    fontSize: 13,
    color: '#E3F2FD',
    textAlign: 'center',
    fontWeight: '500',
  },
  topStatsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  topStatCard: {
    flex: 1,
    marginHorizontal: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
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
  topDistanceCard: {
    flex: 1,
    marginBottom: 0,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
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
  topDistanceText: {
    fontSize: 16,
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
    fontSize: 64,
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
  topInfoValue: {
    fontSize: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
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








