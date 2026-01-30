import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { LocationContext } from '../context/LocationContext';
import { fetchDailyContent } from '../services/DailyContentService';
import { removeNotificationListeners, setupNotificationListeners } from '../services/notificationService';
import { getNextPrayer, getPrayerTimes } from '../services/prayerTimesAPI';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { fullLocation, location } = useContext(LocationContext);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationListeners, setNotificationListeners] = useState(null);
  
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
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bildirim listener'larını kur
  useEffect(() => {
    const listeners = setupNotificationListeners();
    setNotificationListeners(listeners);

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
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 [HomeScreen] Sayfa focus oldu, badge güncelleniyor');
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
  }, [navigation]);

  // ✅ Okunmamış bildirim sayısını yükle
  const loadNotificationCount = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const unread = notifications.filter(n => !n.read).length;
        setUnreadNotificationCount(unread);
        console.log(`🔔 [HomeScreen] Badge: ${unread} okunmamış bildirim`);
      } else {
        setUnreadNotificationCount(0);
        console.log('🔔 [HomeScreen] Badge: Bildirim yok');
      }
    } catch (error) {
      console.error('❌ [HomeScreen] Badge hatası:', error);
      setUnreadNotificationCount(0);
    }
  };

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
        'Bilgi',
        'Günlük hadis ve dua yüklenemedi. Lütfen internet bağlantınızı kontrol edin.',
        [{ text: 'Tamam' }]
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
        Alert.alert('Başarılı', 'Favorilerden kaldırıldı');
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
        Alert.alert('Başarılı', 'Favorilere eklendi');
        if (type === 'dua') setIsDuaFavorite(true);
        if (type === 'hadis') setIsHadisFavorite(true);
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(favList));
    } catch (error) {
      console.error('Favori ekleme hatası:', error);
      Alert.alert('Hata', 'Favorilere eklenirken bir hata oluştu');
    }
  };

  // Paylaşma fonksiyonu - JPEG formatında
  const handleShare = async (type, content, viewShotRef) => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Hata', 'Görsel hazırlanamadı');
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
        Alert.alert('Hata', 'Paylaşım özelliği bu cihazda kullanılamıyor');
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  };

  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, [location]);
  
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
    { name: 'Tesbih', icon: 'counter', screen: 'Tesbih' },
    { name: 'Camiler', icon: 'mosque', screen: 'NearestMosquesScreen' },
    { name: 'Kıble', icon: 'compass-outline', screen: 'QiblaScreen' },
    { name: 'Ramazan', icon: 'moon-waning-crescent', screen: 'RamadanCalendar' },
    { name: 'Dua', icon: 'hands-pray', screen: 'DuaScreen' },
    { name: 'Hadis', icon: 'book-open-variant', screen: 'HadisScreen' },
    { name: 'Dini Günler', icon: 'calendar-star', screen: 'ImportantDaysScreen' },
    { name: 'Namazlar', icon: 'clock-outline', screen: null },
    { name: 'Kuran', icon: 'book-open-page-variant', screen: null },
    { name: 'Hutbe', icon: 'microphone-outline', screen: null },
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
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.topSection}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formatDate(currentTime)}</Text>
            <Text style={styles.location}>{fullLocation}</Text>
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
                  {nextPrayer.remaining.hours} saat {nextPrayer.remaining.minutes} dakika
                </Text>{' '}
                kaldı.
              </>
            ) : (
              'Namaz vakitleri yükleniyor...'
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
                  Alert.alert('Yakında', `${feature.name} özelliği çok yakında eklenecek!`);
                }
              }}
            >
               <LinearGradient colors={['#00897B', '#26A69A', '#4DB6AC']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.featureCard}>
                <MaterialCommunityIcons name={feature.icon} size={25} color="#FFFFFF" style={{ marginBottom: 8 }} />
                <Text style={styles.featureName}>{feature.name}</Text>
              </LinearGradient>
              {/* 
              <LinearGradient colors={['#00897B', '#26A69A', '#4DB6AC']} style={styles.featureIconContainer}>
                <MaterialCommunityIcons style={styles.featureIcon} name={feature.icon} size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.featureName}>{feature.name}</Text> 
              */}
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Ortalanmış başlık */}
        <View style={styles.dailyContentSection}>
          <Text style={styles.sectionTitle}>GÜNÜN İÇERİĞİ</Text>
          
          {contentLoading ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator size="small" color="#00897B" />
              <Text style={styles.contentLoadingText}>Günlük içerik yükleniyor...</Text>
            </View>
          ) : (
            <>
              {dailyDua && (
                <TouchableOpacity 
                  style={styles.dailyCard}
                  activeOpacity={0.9}
                  onPress={() => setShowDuaModal(true)}
                >
                  <View style={styles.dailyCardHeader}>
                    <View style={[styles.dailyCardIconContainer, { backgroundColor: '#E0F2F1' }]}>
                      <Text style={styles.dailyCardIcon}>🤲</Text>
                    </View>
                    <View style={styles.dailyCardTitleContainer}>
                      <Text style={styles.dailyCardLabel}>GÜNÜN DUASI</Text>
                      <Text style={styles.dailyCardTitle} numberOfLines={1}>
                        {dailyDua.title}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dailyCardPreview} numberOfLines={2}>
                    {dailyDua.turkish}
                  </Text>
                  <View style={styles.dailyCardFooter}>
                    <Text style={styles.readMoreText}>Tamamını Oku →</Text>
                  </View>
                </TouchableOpacity>
              )}

              {dailyHadis && (
                <TouchableOpacity 
                  style={styles.dailyCard}
                  activeOpacity={0.9}
                  onPress={() => setShowHadisModal(true)}
                >
                  <View style={styles.dailyCardHeader}>
                    <View style={[styles.dailyCardIconContainer, { backgroundColor: '#FFF8E1' }]}>
                      <Text style={styles.dailyCardIcon}>📖</Text>
                    </View>
                    <View style={styles.dailyCardTitleContainer}>
                      <Text style={styles.dailyCardLabel}>GÜNÜN HADİSİ</Text>
                      <Text style={styles.dailyCardTitle} numberOfLines={1}>
                        {dailyHadis.title}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dailyCardPreview} numberOfLines={2}>
                    {dailyHadis.turkish}
                  </Text>
                  <View style={styles.dailyCardFooter}>
                    <Text style={styles.dailyCardSource}>📚 {dailyHadis.source}</Text>
                    <Text style={styles.readMoreText}>Tamamını Oku →</Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

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
                <Text style={styles.shareImageTitle}>GÜNÜN DUASI</Text>
              </View>

              {/* Title */}
              <View style={styles.shareImageTitleBox}>
                <Text style={styles.shareImageTitleText}>{dailyDua?.title}</Text>
              </View>

              {/* Arapça */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>Arapça</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageArabic}>{dailyDua?.arabic}</Text>
              </View>

              {/* Okunuş */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>Okunuşu</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImagePronunciation}>{dailyDua?.pronunciation}</Text>
              </View>

              {/* Türkçe */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>Türkçe Meali</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageTurkish}>{dailyDua?.turkish}</Text>
              </View>

              {/* Footer */}
              <View style={styles.shareImageFooter}>
                <Text style={styles.shareImageSource}>📚 {dailyDua?.source}</Text>
                <View style={styles.shareImageBranding}>
                  <Text style={styles.shareImageBrandText}>🕌 İslami Hayat</Text>
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
                <Text style={styles.modalSectionLabel}>ARAPÇA</Text>
                <Text style={styles.modalArabic}>{dailyDua?.arabic}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>OKUNUŞU</Text>
                <Text style={styles.modalPronunciation}>{dailyDua?.pronunciation}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>ANLAMI</Text>
                <Text style={styles.modalTurkish}>{dailyDua?.turkish}</Text>
              </View>
              {dailyDua?.meaning && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>AÇIKLAMA</Text>
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
                  {isDuaFavorite ? 'Favorilerde' : 'Favorilere Ekle'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => handleShare('dua', dailyDua, duaViewShotRef)}
              >
                <Text style={styles.actionButtonIcon}>📤</Text>
                <Text style={styles.actionButtonText}>Paylaş</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.fullDetailButton}
              onPress={() => {
                setShowDuaModal(false);
                navigation.navigate('DuaScreen');
              }}
            >
              <Text style={styles.fullDetailButtonText}>Tüm Duaları Gör</Text>
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
                <Text style={styles.shareImageTitle}>GÜNÜN HADİSİ</Text>
              </View>

              {/* Title */}
              <View style={styles.shareImageTitleBox}>
                <Text style={styles.shareImageTitleText}>{dailyHadis?.title}</Text>
              </View>

              {/* Arapça */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>Arapça</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageArabic}>{dailyHadis?.arabic}</Text>
              </View>

              {/* Türkçe */}
              <View style={styles.shareImageSection}>
                <View style={styles.shareImageSectionHeader}>
                  <View style={styles.shareImageLine} />
                  <Text style={styles.shareImageSectionTitle}>Türkçe Meali</Text>
                  <View style={styles.shareImageLine} />
                </View>
                <Text style={styles.shareImageTurkish}>{dailyHadis?.turkish}</Text>
              </View>

              {/* Footer */}
              <View style={styles.shareImageFooter}>
                <Text style={styles.shareImageSource}>📚 {dailyHadis?.source}</Text>
                <View style={styles.shareImageBranding}>
                  <Text style={styles.shareImageBrandText}>🕌 İslami Hayat</Text>
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
                <Text style={styles.modalSectionLabel}>ARAPÇA</Text>
                <Text style={styles.modalArabic}>{dailyHadis?.arabic}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>TÜRKÇE</Text>
                <Text style={styles.modalTurkish}>{dailyHadis?.turkish}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>KAYNAK</Text>
                <Text style={styles.modalSource}>📚 {dailyHadis?.source}</Text>
              </View>
              {dailyHadis?.explanation && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>AÇIKLAMA</Text>
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
                  {isHadisFavorite ? 'Favorilerde' : 'Favorilere Ekle'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => handleShare('hadis', dailyHadis, hadisViewShotRef)}
              >
                <Text style={styles.actionButtonIcon}>📤</Text>
                <Text style={styles.actionButtonText}>Paylaş</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.fullDetailButton}
              onPress={() => {
                setShowHadisModal(false);
                navigation.navigate('HadisScreen');
              }}
            >
              <Text style={styles.fullDetailButtonText}>Tüm Hadisleri Gör</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  featuresHeader: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
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
    marginTop: 25,
  },
  // ✅ Ortalanmış başlık
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
    marginBottom: 15,
    textAlign: 'center', // Ortalandı
  },
  dailyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  },
  contentLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    paddingTop: 20,
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