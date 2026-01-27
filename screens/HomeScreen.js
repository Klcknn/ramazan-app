import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationContext } from '../context/LocationContext';
import { fetchDailyContent } from '../services/DailyContentService';
import { initializeNotifications } from '../services/Notificationrenewalhelper ';
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
        
        // ✅ DEĞİŞİKLİK: schedulePrayerNotifications yerine initializeNotifications
        await initializeNotifications(times);
        
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

  const prayerTimesArray = prayerTimes ? [
    { name: 'İmsak', time: prayerTimes.Fajr?.substring(0, 5), icon: '🌟' },
    { name: 'Güneş', time: prayerTimes.Sunrise?.substring(0, 5), icon: '🌄' },
    { name: 'Öğle', time: prayerTimes.Dhuhr?.substring(0, 5), icon: '☀️' },
    { name: 'İkindi', time: prayerTimes.Asr?.substring(0, 5), icon: '🌤' },
    { name: 'Akşam', time: prayerTimes.Maghrib?.substring(0, 5), icon: '🌅' },
    { name: 'Yatsı', time: prayerTimes.Isha?.substring(0, 5), icon: '🌙' },
  ] : [];

  // 3x3 Grid için özellikler
  const features = [
    { name: 'Tesbih', icon: '📿', screen: 'Tesbih' },
    { name: 'Yakın Camiler', icon: '🕌', screen: 'NearestMosquesScreen' },
    { name: 'Kıble', icon: '🧭', screen: 'QiblaScreen' },
    { name: 'Ramazan', icon: '🌙', screen: 'RamadanCalendar' },
    { name: 'Dua', icon: '🤲', screen: 'DuaScreen' },
    { name: 'Hadis', icon: '📖', screen: 'HadisScreen' },
    { name: 'Dini Günler', icon: '📅', screen: 'ImportantDaysScreen' },
    { name: 'Namazlar', icon: '🕋', screen: null },
    { name: 'Kuran', icon: '📜', screen: null },
  ];

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
        style={styles.topSection}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formatDate(currentTime)}</Text>
            <Text style={styles.location}>{fullLocation}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
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

        {/* Prayer Times - Sadece aktif olan ÇOK BELİRGİN */}
        <View style={styles.prayerTimesContainer}>
          {prayerTimesArray.map((prayer, index) => {
            const isCurrent = prayer.name === currentPrayerName;
            
            return (
              <View key={index} style={[
                styles.prayerCard,
                isCurrent && styles.currentPrayerCard
              ]}>
                <Text style={[styles.prayerIcon, isCurrent && styles.currentPrayerIcon]}>
                  {prayer.icon}
                </Text>
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

        {/* 3x3 Grid Özellikler */}
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
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureName}>{feature.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Günlük İçerik Kartları */}
        <View style={styles.dailyContentSection}>
          <Text style={styles.sectionTitle}>GÜNÜN İÇERİĞİ</Text>
          
          {contentLoading ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator size="small" color="#00897B" />
              <Text style={styles.contentLoadingText}>Günlük içerik yükleniyor...</Text>
            </View>
          ) : (
            <>
              {/* Günlük Dua */}
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

              {/* Günlük Hadis */}
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

      {/* Dua Modal */}
      <Modal
        visible={showDuaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDuaModal(false)}
      >
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

      {/* Hadis Modal */}
      <Modal
        visible={showHadisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHadisModal(false)}
      >
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
  },
  notificationIcon: {
    fontSize: 20,
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
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    marginBottom: 2,
  },
  currentPrayerCard: {
    backgroundColor: '#4CAF50',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.12 }],
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 5,
  },
  prayerIcon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.8,
  },
  currentPrayerIcon: {
    fontSize: 26,
    opacity: 1,
  },
  prayerName: {
    fontSize: 13,
    color: '#E0F2F1',
    marginBottom: 3,
    fontWeight: '700',
    opacity: 1,
  },
  currentPrayerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 1,
  },
  prayerTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 1,
  },
  currentPrayerTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 1,
  },
  activePulse: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  featureCard: {
    width: (width - 50) / 3,
    height: 105,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureName: {
    fontSize: 11,
    color: '#333',
    fontWeight: '700',
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
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
  },
  dailyContentSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
    marginBottom: 15,
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
    maxHeight: 450,
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
});