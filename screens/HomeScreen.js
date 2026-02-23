import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ImageBackground, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useLocalization } from '../context/LocalizationContext';
import { useAppTheme } from '../hooks/use-app-theme';
import { LocationContext } from '../context/LocationContext';
import { getUnreadNotificationCount } from '../services/Notificationrenewalhelper';
import { fetchDailyContent } from '../services/DailyContentService';
import {
  getImportantDaysForYear,
  listScheduledNotifications,
  removeNotificationListeners,
  scheduleImportantDayNotificationsForYear,
  schedulePrayerNotifications,
  setupNotificationListeners,
  syncInAppNotifications,
} from '../services/notificationService';

import { getNextPrayer, getPrayerTimes, getPrayerTimesByCity } from '../services/prayerTimesAPI';

const { width } = Dimensions.get('window');
const HEADER_IMAGES = [
  require('../assets/images/header_cami.jpg'),
  require('../assets/images/header_cami2.jpg'),
  require('../assets/images/header_cami3.jpg'),
  require('../assets/images/header_cami4.jpg'),
];

const LOCATION_STORAGE_KEYS = {
  USE_MANUAL: 'use_manual_location',
  CITY: 'manual_location_city',
  DISTRICT: 'manual_location_district',
};

export default function HomeScreen() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { fullLocation, location } = useContext(LocationContext);
  const [displayLocation, setDisplayLocation] = useState('Türkiye');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Anlık geri sayım için state
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  // Header slider için
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Günlük hadis ve dua
  const [dailyDua, setDailyDua] = useState(null);
  const [dailyHadis, setDailyHadis] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  
  // Modal states
  const [showDuaModal, setShowDuaModal] = useState(false);
  const [showHadisModal, setShowHadisModal] = useState(false);
  
  // Favori durumları
  const [isDuaFavorite, setIsDuaFavorite] = useState(false);
  const [isHadisFavorite, setIsHadisFavorite] = useState(false);

  // ViewShot ref'leri
  const duaViewShotRef = useRef(null);
  const hadisViewShotRef = useRef(null);

  // ✅ Bildirim sistemi
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const theme = useAppTheme();
  const { t } = useLocalization();
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDisplayLocation(fullLocation || 'Türkiye');
  }, [fullLocation]);

  // Anlık geri sayım güncellemesi
  useEffect(() => {
    if (!nextPrayer) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const [targetHours, targetMinutes] = nextPrayer.time.split(':').map(Number);
      
      // Hedef vakti oluştur
      const target = new Date();
      target.setHours(targetHours, targetMinutes, 0, 0);
      
      // Eğer hedef geçmişse, yarına al
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      
      // Farkı hesapla
      const diff = target - now;
      
      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const totalSeconds = Math.floor(diff / 1000);
      const remainingHours = Math.floor(totalSeconds / 3600);
      const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
      const remainingSeconds = totalSeconds % 60;
      
      setCountdown({ 
        hours: remainingHours, 
        minutes: remainingMinutes, 
        seconds: remainingSeconds 
      });
    };
    
    // İlk güncelleme
    updateCountdown();
    
    // Her saniye güncelle
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [nextPrayer, currentTime]);

  // Header resim slider - her 5 saniyede bir değiş
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % HEADER_IMAGES.length
      );
    }, 60000); // 60 saniye

    return () => clearInterval(interval);
  }, []);

  // Bildirim listener'larını kur
  useEffect(() => {
    const listeners = setupNotificationListeners();

    return () => {
      if (listeners) {
        removeNotificationListeners(listeners);
      }
    };
  }, []);

  // Günlük hadis ve duayı yükle
  useEffect(() => {
    loadDailyContent();
  }, []);

  // Favori durumlarını kontrol et
  useEffect(() => {
    if (dailyDua) checkIfFavorite('dua', dailyDua.title);
    if (dailyHadis) checkIfFavorite('hadis', dailyHadis.title);
  }, [dailyDua, dailyHadis]);

  // ✅ Bildirimleri yükle - Her focus'ta ve her 3 saniyede bir
  useEffect(() => {
    // İlk yüklemede badge'i kontrol et
    loadNotificationCount();
    
    // Sayfa her açıldığında badge'i güncelle
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('HomeScreen focus oldu, badge guncelleniyor');
      if (prayerTimes) {
        const importantDays = await getImportantDaysForYear(new Date().getFullYear());
        await syncInAppNotifications({ prayerTimes, importantDays });
      }
      loadNotificationCount();
    });
    
    // Her 3 saniyede bir badge'i kontrol et (arka plan bildirimleri için)
    const interval = setInterval(() => {
      loadNotificationCount();
    }, 3000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation, prayerTimes, loadNotificationCount]);

  // Okunmamis bildirim sayisini yukle
  const loadNotificationCount = useCallback(async () => {
    try {
      const unread = await getUnreadNotificationCount();
      setUnreadNotificationCount(unread);
      console.log(`[HomeScreen] Badge: ${unread} okunmamis bildirim`);
    } catch (error) {
      console.error('[HomeScreen] Badge hatasi:', error);
      setUnreadNotificationCount(0);
    }
  }, []);

  const loadDailyContent = async () => {
    try {
      setContentLoading(true);
      const content = await fetchDailyContent();
      
      if (content) {
        setDailyDua(content.dua);
        setDailyHadis(content.hadis);
        console.log('✅ Günlük içerik başarıyla yüklendi');
      }
    } catch (error) {
      console.error('❌ Günlük içerik yüklenirken hata:', error);
      Alert.alert(
        t('home.dailyContentLoadErrorTitle'),
        t('home.dailyContentLoadError'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setContentLoading(false);
    }
  };

  // Favori kontrol
  const checkIfFavorite = async (type, title) => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      if (favorites) {
        const favList = JSON.parse(favorites);
        const isFav = favList.some(item => item.type === type && item.title === title);
        if (type === 'dua') setIsDuaFavorite(isFav);
        if (type === 'hadis') setIsHadisFavorite(isFav);
      }
    } catch (error) {
      console.error('Favori kontrol hatası:', error);
    }
  };

  // Favorilere ekle/çıkar
  const toggleFavorite = async (type, content) => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      let favList = favorites ? JSON.parse(favorites) : [];
      
      const existingIndex = favList.findIndex(
        item => item.type === type && item.title === content.title
      );

      if (existingIndex >= 0) {
        // Favorilerden çıkar
        favList.splice(existingIndex, 1);
        Alert.alert(t('common.success'), t('home.favoriteRemoved'));
        if (type === 'dua') setIsDuaFavorite(false);
        if (type === 'hadis') setIsHadisFavorite(false);
      } else {
        // Favorilere ekle
        favList.push({
          type,
          title: content.title,
          content: content,
          addedAt: new Date().toISOString()
        });
        Alert.alert(t('common.success'), t('home.favoriteAdded'));
        if (type === 'dua') setIsDuaFavorite(true);
        if (type === 'hadis') setIsHadisFavorite(true);
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(favList));
    } catch (error) {
      console.error('Favori ekleme hatası:', error);
      Alert.alert(t('common.error'), t('home.favoriteError'));
    }
  };

  // Paylaşma fonksiyonu - JPEG formatında
  const handleShare = async (type, content, viewShotRef) => {
    try {
      if (!viewShotRef.current) {
        Alert.alert(t('common.error'), t('home.shareImagePrepareError'));
        return;
      }

      // ViewShot ile JPEG olarak kaydet
      const uri = await viewShotRef.current.capture();
      
      // Paylaş
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: type === 'dua' ? '🤲 Günün Duası' : '📖 Günün Hadisi',
        });
      } else {
        Alert.alert(t('common.error'), t('home.shareNotAvailable'));
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      Alert.alert(t('common.error'), t('home.shareError'));
    }
  };

  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getLocationPreference = useCallback(async () => {
    const useManual = (await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.USE_MANUAL)) === 'true';
    const manualCity = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.CITY);
    const manualDistrict = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.DISTRICT);

    return {
      useManual,
      city: manualCity || '',
      district: manualDistrict || '',
    };
  }, []);

  const fetchPrayerTimes = useCallback(async () => {
    try {
      setLoading(true);

      const preference = await getLocationPreference();
      let times = null;
      let locationLabel = fullLocation || 'Türkiye';

      if (preference.useManual && preference.city) {
        times = await getPrayerTimesByCity(preference.city, preference.district);
        locationLabel = [preference.district, preference.city].filter(Boolean).join(', ');
      } else if (location?.coords) {
        const { latitude, longitude } = location.coords;
        times = await getPrayerTimes(latitude, longitude);
      }

      if (times) {
        setPrayerTimes(times);
        setDisplayLocation(locationLabel);

        const next = getNextPrayer(times);
        setNextPrayer(next);

        console.log('✅ Namaz vakitleri alındı:', times);
        
        // ✅ YENİ: Bildirimleri planla
        console.log('🔔 Bildirimler planlanıyor...');
        try {
          const scheduled = await schedulePrayerNotifications(times);
          if (scheduled) {
            console.log('✅ Bildirimler başarıyla planlandı');
            
            // Debug: Planlanan bildirimleri listele
            const scheduledList = await listScheduledNotifications();
            console.log(`📊 Toplam ${scheduledList.length} bildirim planlandı`);
          } else {
            console.log('⚠️ Bildirimler planlanamadı (izin yok veya kapalı)');
          }
        } catch (notifError) {
          console.error('Bildirim planlama hatasi:', notifError);
        }

        try {
          const importantDaysEnabled = await AsyncStorage.getItem('important_days_notifications_enabled');
          if (importantDaysEnabled !== 'false') {
            await scheduleImportantDayNotificationsForYear(new Date().getFullYear());
          }

          const importantDays = await getImportantDaysForYear(new Date().getFullYear());
          await syncInAppNotifications({ prayerTimes: times, importantDays });
          await loadNotificationCount();
        } catch (syncError) {
          console.error('Bildirim senkron hatasi:', syncError);
        }
      } else {
        Alert.alert(
          t('home.locationRequiredTitle'),
          t('home.locationRequiredDesc'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('❌ Namaz vakitleri hatası:', error);
      Alert.alert(
        t('home.prayerTimesErrorTitle'), 
        t('home.prayerTimesError'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.ok'), onPress: fetchPrayerTimes }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [fullLocation, getLocationPreference, loadNotificationCount, location]);

  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPrayerTimes();
    });
    return unsubscribe;
  }, [navigation, fetchPrayerTimes]);
  /* const fetchPrayerTimes = async () => {
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
        Alert.alert(
          'Konum Gerekli',
          'Namaz vakitlerini gösterebilmek için konum izni gereklidir.',
          [{ text: 'Tamam' }]
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
  */

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPrayerTimes(),
      loadDailyContent()
    ]);
    setRefreshing(false);
  };

  const getPrayerStatus = () => {
    if (!prayerTimes) return { current: null, next: null };
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'İmsak', time: prayerTimes.Fajr, key: 'Fajr' },
      { name: 'Güneş', time: prayerTimes.Sunrise, key: 'Sunrise' },
      { name: 'Öğle', time: prayerTimes.Dhuhr, key: 'Dhuhr' },
      { name: 'İkindi', time: prayerTimes.Asr, key: 'Asr' },
      { name: 'Akşam', time: prayerTimes.Maghrib, key: 'Maghrib' },
      { name: 'Yatsı', time: prayerTimes.Isha, key: 'Isha' },
    ];

    const prayersInMinutes = prayers.map(prayer => {
      const [hours, minutes] = prayer.time.split(':');
      return {
        ...prayer,
        totalMinutes: parseInt(hours) * 60 + parseInt(minutes)
      };
    });

    let currentPrayer = null;
    let nextPrayerName = null;

    for (let i = prayersInMinutes.length - 1; i >= 0; i--) {
      if (currentMinutes >= prayersInMinutes[i].totalMinutes) {
        currentPrayer = prayersInMinutes[i].name;
        nextPrayerName = prayersInMinutes[(i + 1) % prayersInMinutes.length].name;
        break;
      }
    }

    if (!currentPrayer) {
      currentPrayer = prayersInMinutes[prayersInMinutes.length - 1].name;
      nextPrayerName = prayersInMinutes[0].name;
    }

    return { current: currentPrayer, next: nextPrayerName };
  };

  const { current: currentPrayerName } = getPrayerStatus();

  /*   
  const prayerTimesArray = prayerTimes ? [
    { name: 'İmsak', time: prayerTimes.Fajr?.substring(0, 5), icon: 'weather-night' },
    { name: 'Güneş', time: prayerTimes.Sunrise?.substring(0, 5), icon: 'weather-sunset-up' },
    { name: 'Öğle', time: prayerTimes.Dhuhr?.substring(0, 5), icon: 'white-balance-sunny' },
    { name: 'İkindi', time: prayerTimes.Asr?.substring(0, 5), icon: 'weather-partly-cloudy' },
    { name: 'Akşam', time: prayerTimes.Maghrib?.substring(0, 5), icon: 'weather-sunset-down' },
    { name: 'Yatsı', time: prayerTimes.Isha?.substring(0, 5), icon: 'weather-night' },    
  ] : []; 
  */

   
  const prayerTimesArray = prayerTimes ? [
    { name: 'İmsak', time: prayerTimes.Fajr?.substring(0, 5), icon: '🌟' },
    { name: 'Güneş', time: prayerTimes.Sunrise?.substring(0, 5), icon: '🌄' },
    { name: 'Öğle', time: prayerTimes.Dhuhr?.substring(0, 5), icon: '☀️' },
    { name: 'İkindi', time: prayerTimes.Asr?.substring(0, 5), icon: '🌤' },
    { name: 'Akşam', time: prayerTimes.Maghrib?.substring(0, 5), icon: '🌅' },
    { name: 'Yatsı', time: prayerTimes.Isha?.substring(0, 5), icon: '🌙' },
  ] : []; 
   
 

  // ✅ 5x2 Grid için 10 özellik
  const features = [
    { name: t('home.features.tesbih'), icon: 'counter', screen: 'Tesbih' },
    { name: t('home.features.mosques'), icon: 'mosque', screen: 'NearestMosquesScreen' },
    { name: t('home.features.qibla'), icon: 'compass-outline', screen: 'QiblaScreen' },
    { name: t('home.features.ramadan'), icon: 'moon-waning-crescent', screen: 'RamadanCalendar' },
    { name: t('home.features.dua'), icon: 'hands-pray', screen: 'DuaScreen' },
    { name: t('home.features.hadis'), icon: 'book-open-variant', screen: 'HadisScreen' },
    { name: t('home.features.holyDays'), icon: 'calendar-star', screen: 'ImportantDaysScreen' },
    { name: t('home.features.prayers'), icon: 'clock-outline', screen: null },
    { name: t('home.features.quran'), icon: 'book-open-page-variant', screen: null },
    { name: t('home.features.khutbah'), icon: 'microphone-outline', screen: null },
  ];  
  
  // ✅ 5x2 Grid için 10 özellik
/*   const features = [
    { name: 'Tesbih', icon: '📿', screen: 'Tesbih' },
    { name: 'Camiler', icon: '🕌', screen: 'NearestMosquesScreen' },
    { name: 'Kıble', icon: '🧭', screen: 'QiblaScreen' },
    { name: 'Ramazan', icon: '🌙', screen: 'RamadanCalendar' },
    { name: 'Dua', icon: '🤲', screen: 'DuaScreen' },
    { name: 'Hadis', icon: '📖', screen: 'HadisScreen' },
    { name: 'Dini Günler', icon: '📅', screen: 'ImportantDaysScreen' },
    { name: 'Namazlar', icon: '🕋', screen: null },
    { name: 'Kuran', icon: '📜', screen: null },
    { name: 'Zikirler', icon: '💚', screen: null },
  ]; */

  if (loading && !prayerTimes) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={[styles.loadingText, { color: theme.text }]}>{t('common.loading')}</Text>
        <Text style={[styles.loadingSubtext, { color: theme.textMuted }]}>{t('home.checkingLocation')}</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/islamic-pattern.jpg')}
      style={styles.container}
      resizeMode="repeat"
    >
      <ImageBackground 
        source={HEADER_IMAGES[currentImageIndex]} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      >
      <View style={[styles.overlay, theme.darkMode && { backgroundColor: 'rgba(0, 0, 0, 0.48)' }]} />
      <LinearGradient
        colors={theme.darkMode ? ['rgba(10, 64, 58, 0.92)', 'rgba(16, 95, 85, 0.84)', 'rgba(30, 112, 102, 0.78)'] : ['rgba(0, 137, 123, 0.85)', 'rgba(38, 166, 154, 0.75)', 'rgba(77, 182, 172, 0.65)']} 
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.topSection}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formatDate(currentTime)}</Text>
            <Text style={styles.location}>{displayLocation}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NotificationsScreen')}
          >
            {/* <Text style={styles.notificationIcon}>🔔</Text> */}
            <MaterialCommunityIcons name="bell-outline" size={20} color="#FFFFFF"/>
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.bigTime}>{formatTime(currentTime)}</Text>
          <Text style={styles.nextPrayerText}>
            {nextPrayer ? (
              <>
                {nextPrayer.name} Vaktine{' '}
                <Text style={styles.highlight}>
                  {countdown.hours}:{countdown.minutes < 10 ? '0' : ''}{countdown.minutes}
                  <Text style={styles.seconds}>:{countdown.seconds < 10 ? '0' : ''}{countdown.seconds}</Text>
                </Text>{' '}
                kaldı.
              </>
            ) : (
              t('common.loading')
            )}
          </Text>
        </View>

        <View style={styles.prayerTimesContainer}>
          {prayerTimesArray.map((prayer, index) => {
            const isCurrent = prayer.name === currentPrayerName;
            
            return (
              <View key={index} style={[
                styles.prayerCard,
                isCurrent && styles.currentPrayerCard
              ]}>
{/* <MaterialCommunityIcons name={prayer.icon} style={[styles.prayerIcon, isCurrent && styles.currentPrayerIcon]} size={25} color="#FFFFFF" />*/}               
                <Text style={[styles.prayerIcon, isCurrent && styles.currentPrayerIcon]}>{prayer.icon}</Text>            
                <Text style={[
                  styles.prayerName,
                  isCurrent && styles.currentPrayerName
                ]}>
                  {prayer.name}
                </Text>
                <Text style={[
                  styles.prayerTime,
                  isCurrent && styles.currentPrayerTime
                ]}>
                  {prayer.time}
                </Text>
                {isCurrent && (
                  <View style={styles.activePulse} />
                )}
              </View>
            );
          })}
        </View>
      </LinearGradient>
      </ImageBackground>

      <ImageBackground
        source={require('../assets/images/islamic-pattern.jpg')}
        style={styles.patternBackground}
        resizeMode="repeat"
      >
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
          <LinearGradient
            colors={theme.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.featuresTitleContainer}
          >
            <Text style={styles.featuresTitle}>{t('home.allFeatures')}</Text>
          </LinearGradient>
        </View>

        {/* ✅ 5x2 Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity 
              key={index} 
              activeOpacity={0.7}
              onPress={() => {
                if (feature.screen) {
                  navigation.navigate(feature.screen);
                } else {
                  Alert.alert(t('common.soon'), t('home.featureSoon', { name: feature.name }));
                }
              }}
            >
               <LinearGradient colors={['rgba(0, 137, 123, 0.85)', 'rgba(38, 166, 154, 0.75)', 'rgba(77, 182, 172, 0.65)']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.featureCard}>
                <MaterialCommunityIcons name={feature.icon} size={25} color="#FFFFFF" style={{ marginBottom: 8 }} />
                <Text style={styles.featureName}>{feature.name}</Text>
              </LinearGradient>
              {/* 
              <LinearGradient colors={['rgba(0, 137, 123, 0.85)', 'rgba(38, 166, 154, 0.75)', 'rgba(77, 182, 172, 0.65)']} style={styles.featureIconContainer}>
                <MaterialCommunityIcons style={styles.featureIcon} name={feature.icon} size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.featureName}>{feature.name}</Text> 
              */}
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Ortalanmış başlık */}
        <View style={styles.dailyContentSection}>
          <LinearGradient
            colors={theme.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionTitleContainer}
          >
            <Text style={styles.sectionTitle}>{t('home.dailyContent')}</Text>
          </LinearGradient>
          
          {contentLoading ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={[styles.contentLoadingText, { color: theme.textMuted }]}>{t('home.dailyContentLoading')}</Text>
            </View>
          ) : (
            <>
              {dailyDua && (
                <TouchableOpacity 
                  style={[styles.dailyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.9}
                  onPress={() => setShowDuaModal(true)}
                >
                  <View style={styles.dailyCardHeader}>
                  <View style={[styles.dailyCardIconContainer, { backgroundColor: theme.darkMode ? '#1f4a44' : '#E0F2F1' }]}>
                      <Text style={styles.dailyCardIcon}>🤲</Text>
                    </View>
                    <View style={styles.dailyCardTitleContainer}>
                      <Text style={[styles.dailyCardLabel, { color: theme.accent }]}>{t('home.dailyDua')}</Text>
                      <Text style={[styles.dailyCardTitle, { color: theme.text }]} numberOfLines={1}>
                        {dailyDua.title}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dailyCardPreview, { color: theme.textMuted }]} numberOfLines={2}>
                    {dailyDua.turkish}
                  </Text>
                  <View style={styles.dailyCardFooter}>
                    <Text style={[styles.readMoreText, { color: theme.accent }]}>{t('home.readMore')} →</Text>
                  </View>
                </TouchableOpacity>
              )}

              {dailyHadis && (
                <TouchableOpacity 
                  style={[styles.dailyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.9}
                  onPress={() => setShowHadisModal(true)}
                >
                  <View style={styles.dailyCardHeader}>
                    <View style={[styles.dailyCardIconContainer, { backgroundColor: theme.darkMode ? '#4b3f24' : '#FFF8E1' }]}>
                      <Text style={styles.dailyCardIcon}>📖</Text>
                    </View>
                    <View style={styles.dailyCardTitleContainer}>
                      <Text style={[styles.dailyCardLabel, { color: theme.accent }]}>{t('home.dailyHadith')}</Text>
                      <Text style={[styles.dailyCardTitle, { color: theme.text }]} numberOfLines={1}>
                        {dailyHadis.title}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dailyCardPreview, { color: theme.textMuted }]} numberOfLines={2}>
                    {dailyHadis.turkish}
                  </Text>
                  <View style={styles.dailyCardFooter}>
                    <Text style={[styles.dailyCardSource, { color: theme.textMuted }]}>📚 {dailyHadis.source}</Text>
                    <Text style={[styles.readMoreText, { color: theme.accent }]}>{t('home.readMore')} →</Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      </ImageBackground>

      {/* ✅ Dua Modal - Paylaşma ve Favori ile */}
      <Modal
        visible={showDuaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDuaModal(false)}
      >
        {/* ✅ Paylaşılacak görsel - Ekran dışında gizli */}
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ViewShot ref={duaViewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <View style={[styles.shareImageContainer, { backgroundColor: '#E8F5E9' }]}>
              {/* Header */}
              <View style={styles.shareImageHeader}>
                <Text style={styles.shareImageIcon}>🤲</Text>
                <Text style={styles.shareImageTitle}>{t('home.dailyDua')}</Text>
              </View>

              {/* Title */}
              <View style={styles.shareImageTitleBox}>
                <Text style={styles.shareImageTitleText}>{dailyDua?.title}</Text>
              </View>

              {/* Arapça */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>{t('home.shareSectionArabic')}</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageArabic}>{dailyDua?.arabic}</Text>
              </View>

              {/* Okunuş */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>{t('home.shareSectionPronunciation')}</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImagePronunciation}>{dailyDua?.pronunciation}</Text>
              </View>

              {/* Türkçe */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>{t('home.shareSectionTurkishMeaning')}</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageTurkish}>{dailyDua?.turkish}</Text>
              </View>

              {/* Footer */}
              <View style={styles.shareImageFooter}>
                <Text style={styles.shareImageSource}>📚 {dailyDua?.source}</Text>
                <View style={styles.shareImageBranding}>
                  <Text style={styles.shareImageBrandText}>🕌 Vakitçim</Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </View>

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🤲 {dailyDua?.title}</Text>
              <TouchableOpacity onPress={() => setShowDuaModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t('home.modalSectionArabic')}</Text>
                <Text style={styles.modalArabic}>{dailyDua?.arabic}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t('home.modalSectionPronunciation')}</Text>
                <Text style={styles.modalPronunciation}>{dailyDua?.pronunciation}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t('home.modalSectionMeaning')}</Text>
                <Text style={styles.modalTurkish}>{dailyDua?.turkish}</Text>
              </View>
              {dailyDua?.meaning && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>{t('home.modalSectionExplanation')}</Text>
                  <Text style={styles.modalMeaning}>{dailyDua.meaning}</Text>
                </View>
              )}
            </ScrollView>

            {/* ✅ Paylaşma ve Favori Butonları */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.favoriteButton]}
                onPress={() => toggleFavorite('dua', dailyDua)}
              >
                <Text style={styles.actionButtonIcon}>
                  {isDuaFavorite ? '❤️' : '🤍'}
                </Text>
                <Text style={styles.actionButtonText}>
                  {isDuaFavorite ? t('home.favoriteInList') : t('home.addToFavorites')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => handleShare('dua', dailyDua, duaViewShotRef)}
              >
                <Text style={styles.actionButtonIcon}>📤</Text>
                <Text style={styles.actionButtonText}>{t('home.shareAction')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.fullDetailButton}
              onPress={() => {
                setShowDuaModal(false);
                navigation.navigate('DuaScreen');
              }}
            >
              <Text style={styles.fullDetailButtonText}>{t('home.allDuas')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ Hadis Modal - Paylaşma ve Favori ile */}
      <Modal
        visible={showHadisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHadisModal(false)}
      >
        {/* ✅ Paylaşılacak görsel - Ekran dışında gizli */}
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ViewShot ref={hadisViewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <View style={[styles.shareImageContainer, { backgroundColor: '#FFF3E0' }]}>
              {/* Header */}
              <View style={styles.shareImageHeader}>
                <Text style={styles.shareImageIcon}>📖</Text>
                <Text style={styles.shareImageTitle}>{t('home.dailyHadith')}</Text>
              </View>

              {/* Title */}
              <View style={styles.shareImageTitleBox}>
                <Text style={styles.shareImageTitleText}>{dailyHadis?.title}</Text>
              </View>

              {/* Arapça */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>{t('home.shareSectionArabic')}</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageArabic}>{dailyHadis?.arabic}</Text>
              </View>

              {/* Türkçe */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>{t('home.shareSectionTurkishMeaning')}</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageTurkish}>{dailyHadis?.turkish}</Text>
              </View>

              {/* Footer */}
              <View style={styles.shareImageFooter}>
                <Text style={styles.shareImageSource}>📚 {dailyHadis?.source}</Text>
                <View style={styles.shareImageBranding}>
                  <Text style={styles.shareImageBrandText}>🕌 Vakitçim</Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </View>

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📖 {dailyHadis?.title}</Text>
              <TouchableOpacity onPress={() => setShowHadisModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t('home.modalSectionArabic')}</Text>
                <Text style={styles.modalArabic}>{dailyHadis?.arabic}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t('home.modalSectionTurkish')}</Text>
                <Text style={styles.modalTurkish}>{dailyHadis?.turkish}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t('home.modalSectionSource')}</Text>
                <Text style={styles.modalSource}>📚 {dailyHadis?.source}</Text>
              </View>
              {dailyHadis?.explanation && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>{t('home.modalSectionExplanation')}</Text>
                  <Text style={styles.modalMeaning}>{dailyHadis.explanation}</Text>
                </View>
              )}
            </ScrollView>

            {/* ✅ Paylaşma ve Favori Butonları */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.favoriteButton]}
                onPress={() => toggleFavorite('hadis', dailyHadis)}
              >
                <Text style={styles.actionButtonIcon}>
                  {isHadisFavorite ? '❤️' : '🤍'}
                </Text>
                <Text style={styles.actionButtonText}>
                  {isHadisFavorite ? t('home.favoriteInList') : t('home.addToFavorites')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => handleShare('hadis', dailyHadis, hadisViewShotRef)}
              >
                <Text style={styles.actionButtonIcon}>📤</Text>
                <Text style={styles.actionButtonText}>{t('home.shareAction')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.fullDetailButton}
              onPress={() => {
                setShowHadisModal(false);
                navigation.navigate('HadisScreen');
              }}
            >
              <Text style={styles.fullDetailButtonText}>{t('home.allHadiths')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  patternBackground: {
    flex: 1,
    width: '100%',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topSection: {
    paddingTop: 50,
    paddingBottom: 25,
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
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00897B',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 25,
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
    fontSize: 24,
  },
  seconds: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD54F',
    position: 'relative',
    top: -6,
  },
  prayerTimesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prayerCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 12,
    width: (width - 52) / 6, // Sabit genişlik - 6 kart için eşit dağılım
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    minHeight: 75, // Minimum yükseklik
  },
  currentPrayerCard: {
    backgroundColor: '#4CAF50',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    // transform kaldırıldı - kayma problemi çözüldü
  },
  prayerIcon: {
    fontSize: 22,
    marginBottom: 3,
    opacity: 0.85,
  },
  currentPrayerIcon: {
    fontSize: 24,
    opacity: 1,
  },
  prayerName: {
    fontSize: 15,
    color: '#E0F2F1',
    marginBottom: 2,
    fontWeight: '600',
    opacity: 1,
    textAlign: 'center',
  },
  currentPrayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 1,
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 1,
  },
  currentPrayerTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 1,
  },
  activePulse: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  bottomSection: {
    flex: 1,
    marginTop: -20,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  featuresHeader: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 15,
  },
  featuresTitleContainer: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: '#00897B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionTitleContainer: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: '#00897B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  // ✅ 5x2 Grid Styles
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  featureCard: {
    width: (width - 44) / 5, // 5 sütun
    height: 85,
    //backgroundColor: '#FFFFFF',
    backgroundColor: '#00897B',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  featureIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    //backgroundColor: '#E8F5E9',
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureIcon: {
    fontSize: 25,
  },
  featureName: {
    fontSize: 12,
    color: '#FFFFFF',
    //color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
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
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
  },
  dailyContentSection: {
    paddingHorizontal: 20,
    marginTop: 15,
    backgroundColor: 'transparent',
    paddingBottom: 30,
    alignItems: 'center',
  },
  // ✅ Ortalanmış başlık
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  dailyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    width: '100%',
  },
  dailyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyCardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dailyCardIcon: {
    fontSize: 26,
  },
  dailyCardTitleContainer: {
    flex: 1,
  },
  dailyCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00897B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dailyCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  dailyCardPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  dailyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dailyCardSource: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  readMoreText: {
    fontSize: 13,
    color: '#00897B',
    fontWeight: '700',
  },
  contentLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
  },
  contentLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  modalScroll: {
    paddingHorizontal: 20,
    maxHeight: 350,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00897B',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modalArabic: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    lineHeight: 36,
  },
  modalPronunciation: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  modalTurkish: {
    fontSize: 15,
    color: '#333',
    lineHeight: 26,
  },
  modalSource: {
    fontSize: 14,
    color: '#00897B',
    fontWeight: '600',
  },
  modalMeaning: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  // ✅ Yeni: Paylaşma ve Favori Butonları
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  favoriteButton: {
    backgroundColor: '#FFE0E6',
    borderWidth: 1,
    borderColor: '#FFB3C1',
  },
  shareButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  fullDetailButton: {
    backgroundColor: '#00897B',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullDetailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // ✅ Paylaşım Görseli Stilleri
  shareImageContainer: {
    width: 1080,
    padding: 60,
  },
  shareImageHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shareImageIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  shareImageTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00897B',
    letterSpacing: 4,
  },
  shareImageTitleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 20,
    marginBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  shareImageTitleText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  shareImageSection: {
    marginBottom: 40,
  },
  shareImageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  shareImageLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#00897B',
    opacity: 0.4,
  },
  shareImageSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00897B',
    paddingHorizontal: 20,
    letterSpacing: 2,
  },
  shareImageArabic: {
    fontSize: 40,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    lineHeight: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 25,
    borderRadius: 15,
  },
  shareImagePronunciation: {
    fontSize: 28,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 25,
    borderRadius: 15,
  },
  shareImageTurkish: {
    fontSize: 30,
    color: '#333',
    lineHeight: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 25,
    borderRadius: 15,
  },
  shareImageFooter: {
    marginTop: 30,
  },
  shareImageSource: {
    fontSize: 26,
    color: '#00897B',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
  },
  shareImageBranding: {
    paddingTop: 30,
    borderTopWidth: 4,
    borderTopColor: '#00897B',
    alignItems: 'center',
  },
  shareImageBrandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00897B',
    letterSpacing: 3,
  },
});





