import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';
import { getNextPrayer, getPrayerTimes } from '../services/prayerTimesAPI';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ← refreshing state = useState(false)
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { fullLocation, location } = useContext(LocationContext);
  
  // Şu anki tarih ve saat
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tarih formatı
  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
  };

  // Saat formatı
  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, []);
  
  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      
      if (location?.coords) {
        const { latitude, longitude } = location.coords;
        const times = await getPrayerTimes(latitude, longitude);
        setPrayerTimes(times);
        
        const next = getNextPrayer(times);
        setNextPrayer(next);
        
        console.log('✅ Namaz vakitleri alındı:', times);
      } else {
        // Konum yok
        Alert.alert(
          'Konum Gerekli',
          'Namaz vakitlerini gösterebilmek için konum izni gereklidir.',
          [
            { text: 'Tamam' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Namaz vakitleri hatası:', error);
      Alert.alert(
        'Hata', 
        'Namaz vakitleri alınamadı. Tekrar denemek ister misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Tekrar Dene', onPress: fetchPrayerTimes }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh fonksiyonu
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrayerTimes();
    setRefreshing(false);
  };

  // Mevcut namaz vaktini belirle
  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'İmsak', time: prayerTimes.Fajr, key: 'Fajr' },
      { name: 'Güneş', time: prayerTimes.Sunrise, key: 'Sunrise' },
      { name: 'Öğle', time: prayerTimes.Dhuhr, key: 'Dhuhr' },
      { name: 'İkindi', time: prayerTimes.Asr, key: 'Asr' },
      { name: 'Akşam', time: prayerTimes.Maghrib, key: 'Maghrib' },
      { name: 'Yatsı', time: prayerTimes.Isha, key: 'Isha' },
    ];

    // Her vakti dakikaya çevir
    const prayersInMinutes = prayers.map(prayer => {
      const [hours, minutes] = prayer.time.split(':');
      return {
        ...prayer,
        totalMinutes: parseInt(hours) * 60 + parseInt(minutes)
      };
    });

    // Mevcut vakti bul (içinde bulunduğumuz vakit)
    for (let i = prayersInMinutes.length - 1; i >= 0; i--) {
      if (currentTime >= prayersInMinutes[i].totalMinutes) {
        return prayersInMinutes[i].name;
      }
    }

    return null;
  };

  const currentPrayerName = getCurrentPrayer();

  // Namaz vakitleri listesi
  const prayerTimesArray = prayerTimes ? [
    { name: 'İmsak', time: prayerTimes.Fajr?.substring(0, 5), icon: '✨' },
    { name: 'Güneş', time: prayerTimes.Sunrise?.substring(0, 5), icon: '🌅' },
    { name: 'Öğle', time: prayerTimes.Dhuhr?.substring(0, 5), icon: '☀️' },
    { name: 'İkindi', time: prayerTimes.Asr?.substring(0, 5), icon: '🌤️' },
    { name: 'Akşam', time: prayerTimes.Maghrib?.substring(0, 5), icon: '🌆' },
    { name: 'Yatsı', time: prayerTimes.Isha?.substring(0, 5), icon: '🌙' },
  ] : [];

  // Özellikler
  const features = [
    { name: 'Tesbih', icon: '📿', screen: 'Tesbih' }, // Tesbih ekranı eklendi.
    { name: 'Yakın Camiler', icon: '🕌', screen: 'NearestMosquesScreen' }, // Yakın Camiler ekranı eklendi.
    { name: 'Kıble', icon: '🧭', screen: 'Qibla' },  // Kıble ekranı eklendi.
    { name: 'Ramazan Takvimi', icon: '📅', screen: 'RamadanCalendar' }, // RamazanCalendar ekranı eklendi.
    { name: 'Dua', icon: '🤲', screen: 'DuaScreen' }, // Dua ekranı eklendi.
    { name: 'Hadis', icon: '📖' },
  ];

  if (loading && !prayerTimes) {  // İlk yükleme alanı
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={styles.loadingText}>Namaz vakitleri yükleniyor...</Text>
        <Text style={styles.loadingSubtext}>Konumunuz kontrol ediliyor</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00897B', '#26A69A', '#4DB6AC']}
        style={styles.topSection}
      >
        {/* Üst Bilgi */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formatDate(currentTime)}</Text>
            <Text style={styles.location}>{fullLocation}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Büyük Saat ve Vakit Bilgisi */}
        <View style={styles.timeContainer}>
          <Text style={styles.bigTime}>{formatTime(currentTime)}</Text>
          <Text style={styles.nextPrayerText}>
            {nextPrayer ? (
              <>
                {nextPrayer.name} Vaktine{' '}
                <Text style={styles.highlight}>
                  {nextPrayer.remaining.hours} saat {nextPrayer.remaining.minutes} dakika
                </Text>{' '}
                kaldı.
              </>
            ) : (
              'Namaz vakitleri yükleniyor...'
            )}
          </Text>
        </View>

        {/* Namaz Vakitleri */}
        <View style={styles.prayerTimesContainer}>
        {prayerTimesArray.map((prayer, index) => {
          const isCurrent = prayer.name === currentPrayerName;
          const isNext = prayer.name === nextPrayer?.name;
          
          return (
            <View key={index} style={[ styles.prayerCard, isCurrent && styles.currentPrayerCard, isNext && styles.nextPrayerCard ]}>
              <Text style={styles.prayerIcon}>{prayer.icon}</Text>
              <Text style={[
                styles.prayerName,
                (isCurrent || isNext) && styles.highlightedText
              ]}>
                {prayer.name}
              </Text>
              <Text style={[
                styles.prayerTime,
                (isCurrent || isNext) && styles.highlightedText
              ]}>
                {prayer.time}
              </Text>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>●</Text>
                </View>
              )}
          </View>
  );
})}
        </View>
      </LinearGradient>

      {/* Alt Kısım - Özellikler */}
      <ScrollView 
          style={styles.bottomSection} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00897B']}
              tintColor="#00897B"
              title="Yenileniyor..."
              titleColor="#666"
            />
          }
        >
        <View style={styles.featuresHeader}>
          <View style={styles.dragHandle} />
          <Text style={styles.featuresTitle}>TÜM ÖZELLİKLER</Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.featureCard}
              activeOpacity={0.7}
              onPress={() => {
                if (feature.screen) {
                  navigation.navigate(feature.screen);
                } else {
                  Alert.alert('Yakında', `${feature.name} özelliği çok yakında eklenecek!`);
                }
              }}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureName}>{feature.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Boşluk (scroll için) */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topSection: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  date: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  location: {
    fontSize: 14,
    color: '#E0F2F1',
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  bigTime: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  nextPrayerText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#FFD54F',
  },
  prayerTimesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prayerCard: {
    alignItems: 'center',
    flex: 1,
  },
  prayerIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  prayerName: {
    fontSize: 12,
    color: '#E0F2F1',
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSection: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  featuresHeader: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 15,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 3,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666'
  },
  currentPrayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  nextPrayerCard: {
    backgroundColor: 'rgba(255, 213, 79, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  highlightedText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#4CAF50',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
  }
});