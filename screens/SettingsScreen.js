import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LocationContext } from '../context/LocationContext';
import {
  cancelImportantDayNotifications,
  cancelPrayerNotifications,
  getNotificationSettings,
  listScheduledNotifications,
  requestNotificationPermission,
  saveNotificationSettings,
  scheduleImportantDayNotificationsForYear,
  schedulePrayerNotifications,
} from '../services/notificationService';
import { getPrayerTimes, getPrayerTimesByCity } from '../services/prayerTimesAPI';


import * as Notifications from 'expo-notifications'; // ← YENİ
import { addTestNotification } from '../services/Notificationrenewalhelper'; // ← YENİ

const LOCATION_STORAGE_KEYS = {
  USE_MANUAL: 'use_manual_location',
  CITY: 'manual_location_city',
  DISTRICT: 'manual_location_district',
};

const normalizeText = (value) =>
  (value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const formatDistrictName = (value) => {
  const lower = (value || '').toLocaleLowerCase('tr-TR').trim();
  return lower.replace(
    /(^|[\s\-'/().])([a-zçğıöşü])/giu,
    (match, separator, letter) => `${separator}${letter.toLocaleUpperCase('tr-TR')}`
  );
};

export default function SettingsScreen({ navigation }) {
  // Bildirim Ayarları
  const [prayerNotifications, setPrayerNotifications] = useState(true);
  const [importantDaysNotifications, setImportantDaysNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  
  // Görünüm Ayarları
  const [darkMode, setDarkMode] = useState(false);
  const [backgroundTheme, setBackgroundTheme] = useState('default');
  
  // Konum
  const [selectedCity, setSelectedCity] = useState('Ankara');
  const [selectedDistrict, setSelectedDistrict] = useState('Yenişehir');
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalStep, setLocationModalStep] = useState('province');
  const [locationSearch, setLocationSearch] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedProvinceOption, setSelectedProvinceOption] = useState(null);
  const [selectedDistrictOption, setSelectedDistrictOption] = useState(null);
  
  // Dil
  const [selectedLanguage] = useState('Türkçe');

  // ✅ YENİ: Favori sayısı
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { location, fullLocation, city } = useContext(LocationContext);

  // ✅ YENİ: Favori sayısını yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavoritesCount();
    });
    return unsubscribe;
  }, [navigation]);

  const parseLocationFromContext = useCallback(() => {
    if (!fullLocation || typeof fullLocation !== 'string') {
      return { district: '', city: '' };
    }

    const parts = fullLocation
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return { district: parts[0], city: parts[parts.length - 1] };
    }

    return { district: '', city: parts[0] || '' };
  }, [fullLocation]);

  useEffect(() => {
    if (isManualLocation) return;
    const parsed = parseLocationFromContext();
    setSelectedCity(parsed.city || city || 'Ankara');
    setSelectedDistrict(parsed.district || 'Merkez');
  }, [city, isManualLocation, parseLocationFromContext]);

  const loadSettings = useCallback(async () => {
    const settings = await getNotificationSettings();
    setPrayerNotifications(settings.enabled);
    setNotificationSound(settings.sound);
    setVibration(settings.vibration);
    
    // Önemli günler bildirimi ayarını yükle
    const importantDaysEnabled = await AsyncStorage.getItem('important_days_notifications_enabled');
    setImportantDaysNotifications(importantDaysEnabled !== 'false');

    const useManual = (await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.USE_MANUAL)) === 'true';
    const savedCity = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.CITY);
    const savedDistrict = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.DISTRICT);

    if (useManual && savedCity) {
      setIsManualLocation(true);
      setSelectedCity(savedCity);
      setSelectedDistrict(savedDistrict || '');
      return;
    }

    const parsed = parseLocationFromContext();
    setIsManualLocation(false);
    setSelectedCity(parsed.city || city || 'Ankara');
    setSelectedDistrict(parsed.district || 'Merkez');
  }, [city, parseLocationFromContext]);

  // Ayarlari yukle
  useEffect(() => {
    loadSettings();
    loadFavoritesCount();
  }, [loadSettings]);

  const fetchProvinces = useCallback(async () => {
    setLoadingProvinces(true);
    try {
      const provinceRes = await fetch('https://ezanvakti.emushaf.net/sehirler/2');
      const provinceData = await provinceRes.json();
      const mappedProvinces = (provinceData || [])
        .map((item) => ({
          id: Number(item.SehirID),
          name: item.SehirAdi,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

      setProvinces(mappedProvinces);
      return mappedProvinces;
    } catch (error) {
      console.error('İl listesi alınamadı:', error);
      Alert.alert('Hata', 'İl listesi yüklenemedi.');
      setProvinces([]);
      return [];
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  const fetchDistrictsByProvinceName = useCallback(async (provinceName) => {
    if (!provinceName) return [];
    setLoadingDistricts(true);
    try {
      let localProvinces = provinces;
      if (!localProvinces.length) {
        localProvinces = await fetchProvinces();
      }

      const matchedProvince = localProvinces.find(
        (item) => normalizeText(item.name) === normalizeText(provinceName)
      );
      if (!matchedProvince?.id) {
        setDistricts([]);
        return [];
      }

      const districtRes = await fetch(`https://ezanvakti.emushaf.net/ilceler/${matchedProvince.id}`);
      const districtData = await districtRes.json();
      const mappedDistricts = (districtData || [])
        .map((item) => ({
          id: Number(item.IlceID),
          name: formatDistrictName(item.IlceAdi),
        }))
        .sort((a, b) => {
          const aCenter = normalizeText(a.name).includes('merkez');
          const bCenter = normalizeText(b.name).includes('merkez');
          if (aCenter !== bCenter) return aCenter ? -1 : 1;
          return a.name.localeCompare(b.name, 'tr-TR');
        });

      setDistricts(mappedDistricts);
      return mappedDistricts;
    } catch (error) {
      console.error('İlçe listesi alınamadı:', error);
      Alert.alert('Hata', 'İlçe listesi yüklenemedi.');
      setDistricts([]);
      return [];
    } finally {
      setLoadingDistricts(false);
    }
  }, [fetchProvinces, provinces]);

  const openLocationPicker = async (startStep = 'province') => {
    const provinceList = provinces.length ? provinces : await fetchProvinces();
    const currentProvince = provinceList.find(
      (item) => normalizeText(item.name) === normalizeText(selectedCity)
    );

    setSelectedProvinceOption(currentProvince || null);
    setSelectedDistrictOption(null);
    setLocationSearch('');
    setLocationModalVisible(true);

    if (startStep === 'district' && currentProvince) {
      setLocationModalStep('district');
      const districtList = await fetchDistrictsByProvinceName(currentProvince.name);
      const matchedDistrict = districtList.find(
        (item) => normalizeText(item.name) === normalizeText(selectedDistrict)
      );
      setSelectedDistrictOption(matchedDistrict || null);
      return;
    }

    setLocationModalStep('province');
    setDistricts([]);
  };

  const handleProvinceSelectFromList = async (province) => {
    setSelectedProvinceOption(province);
    setSelectedDistrictOption(null);
    setLocationModalStep('district');
    setLocationSearch('');
    await fetchDistrictsByProvinceName(province.name);
  };

  const handleDistrictSelectFromList = async (district) => {
    if (!selectedProvinceOption?.name) {
      Alert.alert('Bilgi', 'Önce il seçiniz.');
      return;
    }

    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEYS.USE_MANUAL, 'true');
      await AsyncStorage.setItem(LOCATION_STORAGE_KEYS.CITY, selectedProvinceOption.name);
      await AsyncStorage.setItem(LOCATION_STORAGE_KEYS.DISTRICT, district?.name || '');

      setSelectedCity(selectedProvinceOption.name);
      setSelectedDistrict(district?.name || 'Merkez');
      setSelectedDistrictOption(district || null);
      setIsManualLocation(true);
      setLocationModalVisible(false);
      setLocationModalStep('province');
      setLocationSearch('');
      Alert.alert('Başarılı', 'Konum ayarı kaydedildi. Ana sayfa bu konuma göre güncellenecek.');
    } catch (error) {
      console.error('Konum kaydetme hatası:', error);
      Alert.alert('Hata', 'Konum ayarı kaydedilemedi.');
    }
  };

  const useCurrentLocation = async () => {
    const parsed = parseLocationFromContext();
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEYS.USE_MANUAL, 'false');
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEYS.CITY);
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEYS.DISTRICT);

      setIsManualLocation(false);
      setSelectedCity(parsed.city || city || 'Ankara');
      setSelectedDistrict(parsed.district || 'Merkez');
      Alert.alert('Başarılı', 'Anlık konuma geri dönüldü.');
    } catch (error) {
      console.error('Anlık konuma dönüş hatası:', error);
      Alert.alert('Hata', 'Anlık konuma dönülemedi.');
    }
  };

  // ✅ YENİ: Favori sayısını yükle
  const loadFavoritesCount = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      if (favorites) {
        const favList = JSON.parse(favorites);
        setFavoritesCount(favList.length);
      } else {
        setFavoritesCount(0);
      }
    } catch (error) {
      console.error('Favori sayısı yüklenirken hata:', error);
      setFavoritesCount(0);
    }
  };

  // ✅ YENİ FONKSİYON EKLE (diğer handler'ların yanına)

// Test bildirimi gönder
const handleTestNotification = async () => {
  try {
    // 1. İzin kontrol
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      Alert.alert('Hata', 'Bildirim izni verilmedi');
      return;
    }

    // 2. Test bildirimi planla (5 saniye sonra)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕌 Test Bildirimi',
        body: 'Bu bir test bildirimidir. Bildirimler çalışıyor! ✅',
        sound: true,
        data: { type: 'test' },
      },
      trigger: {
        seconds: 5,
      },
    });

    // 3. In-app listeye ekle
    await addTestNotification();

    Alert.alert(
      'Başarılı',
      'Test bildirimi 5 saniye sonra gelecek. Uygulamayı arka plana alın ve bekleyin.',
      [{ text: 'Tamam' }]
    );

    console.log('✅ Test bildirimi planlandı');
  } catch (error) {
    console.error('❌ Test bildirimi hatası:', error);
    Alert.alert('Hata', 'Test bildirimi gönderilemedi');
  }
};

// Planlanan bildirimleri göster
const handleShowScheduledNotifications = async () => {
  try {
    const scheduled = await listScheduledNotifications();
    
    if (scheduled.length === 0) {
      Alert.alert(
        'Bilgi',
        'Hiç planlanmış bildirim yok. Lütfen namaz vakti bildirimlerini aktif edin.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    // Bildirimleri grupla
    const byType = scheduled.reduce((acc, notif) => {
      const type = notif.content?.data?.prayerName || 'Diğer';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const message = Object.entries(byType)
      .map(([type, count]) => `${type}: ${count} bildirim`)
      .join('\n');

    Alert.alert(
      `📊 Planlanan Bildirimler (${scheduled.length})`,
      message,
      [{ text: 'Tamam' }]
    );

    console.log('📋 Planlanan bildirimler:', scheduled);
  } catch (error) {
    console.error('❌ Listeleme hatası:', error);
    Alert.alert('Hata', 'Bildirimler listelenemedi');
  }
};

  // Bildirim toggle handler
  const handleNotificationToggle = async (value) => {
    setPrayerNotifications(value);

    const saveSettings = async (enabledValue) => {
      await saveNotificationSettings({
        enabled: enabledValue,
        sound: notificationSound,
        vibration,
      });
    };

    try {
      if (value) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          setPrayerNotifications(false);
          await saveSettings(false);
          return;
        }

        await saveSettings(true);
        const times = await getPrayerTimesForSelectedLocation();
        if (!times) {
          setPrayerNotifications(false);
          await saveSettings(false);
          Alert.alert('Konum Gerekli', 'Namaz vakti bildirimi için önce konum izni veriniz.');
          return;
        }

        const scheduled = await schedulePrayerNotifications(times);
        if (!scheduled) {
          setPrayerNotifications(false);
          await saveSettings(false);
          Alert.alert('Bilgi', 'Namaz vakti bildirimleri planlanamadı.');
          return;
        }

        Alert.alert('Başarılı', 'Namaz vakti bildirimleri aktif edildi.');
        return;
      }

      await cancelPrayerNotifications();
      await saveSettings(false);
      Alert.alert('Başarılı', 'Namaz vakti bildirimleri kapatıldı.');
    } catch (error) {
      console.error('Namaz bildirimi ayar hatası:', error);
      Alert.alert('Hata', 'Namaz bildirimi ayarı güncellenemedi.');
    }
  };

  const getPrayerTimesForSelectedLocation = async () => {
    const useManual = (await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.USE_MANUAL)) === 'true';
    const manualCity = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.CITY);
    const manualDistrict = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.DISTRICT);

    if (useManual && manualCity) {
      return getPrayerTimesByCity(manualCity, manualDistrict || '');
    }

    if (!location?.coords) {
      return null;
    }

    const { latitude, longitude } = location.coords;
    return getPrayerTimes(latitude, longitude);
  };

  // Ses toggle handler
  const handleSoundToggle = async (value) => {
    setNotificationSound(value);
    try {
      await saveNotificationSettings({
        enabled: prayerNotifications,
        sound: value,
        vibration,
      });

      if (prayerNotifications) {
        const times = await getPrayerTimesForSelectedLocation();
        if (times) {
          await schedulePrayerNotifications(times);
        }
      }
    } catch (error) {
      console.error('Ses ayarı güncellenemedi:', error);
      Alert.alert('Hata', 'Ezan sesi ayarı güncellenemedi.');
    }
  };

  // Titreşim toggle handler
  const handleVibrationToggle = async (value) => {
    setVibration(value);
    try {
      await saveNotificationSettings({
        enabled: prayerNotifications,
        sound: notificationSound,
        vibration: value,
      });

      if (prayerNotifications) {
        const times = await getPrayerTimesForSelectedLocation();
        if (times) {
          await schedulePrayerNotifications(times);
        }
      }
    } catch (error) {
      console.error('Titreşim ayarı güncellenemedi:', error);
      Alert.alert('Hata', 'Titreşim ayarı güncellenemedi.');
    }
  };

  // Önemli günler bildirimi toggle handler
  const handleImportantDaysToggle = async (value) => {
    setImportantDaysNotifications(value);

    try {
      if (value) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          setImportantDaysNotifications(false);
          await AsyncStorage.setItem('important_days_notifications_enabled', 'false');
          return;
        }

        await AsyncStorage.setItem('important_days_notifications_enabled', 'true');
        await scheduleImportantDayNotificationsForYear(new Date().getFullYear());
        Alert.alert('Başarılı', 'Önemli gün bildirimleri aktif edildi.');
        return;
      }

      await AsyncStorage.setItem('important_days_notifications_enabled', 'false');
      await cancelImportantDayNotifications();
      Alert.alert('Başarılı', 'Önemli gün bildirimleri kapatıldı.');
    } catch (error) {
      console.error('Önemli gün ayarı güncellenemedi:', error);
      Alert.alert('Hata', 'Önemli gün bildirim ayarı güncellenemedi.');
    }
  };

  const handleCityChange = () => {
    openLocationPicker('province');
  };

  const handleDistrictChange = () => {
    openLocationPicker('district');
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Dil Seçimi',
      'Dil değiştirme özelliği yakında eklenecek.\n\nMevcut Dil: Türkçe',
      [{ text: 'Tamam' }]
    );
  };

  const handleBackgroundChange = () => {
    Alert.alert(
      'Arkaplan Değiştir',
      'Hangi arkaplanı seçmek istersiniz?',
      [
        { text: 'Varsayılan', onPress: () => setBackgroundTheme('default') },
        { text: 'İslami Motif', onPress: () => setBackgroundTheme('pattern') },
        { text: 'Gradient', onPress: () => setBackgroundTheme('gradient') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const notificationSettings = [
    {
      icon: '🔔',
      label: 'Namaz Vakti Bildirimleri',
      description: 'Namaz vakti girdiğinde bildirim al',
      value: prayerNotifications,
      onToggle: handleNotificationToggle,
    },
    {
      icon: '📅',
      label: 'Önemli Günler Hatırlatması',
      description: 'Kandil ve bayramlardan 1 gün önce hatırlatma',
      value: importantDaysNotifications,
      onToggle: handleImportantDaysToggle,
    },
    {
      icon: '🔊',
      label: 'Ezan Sesi',
      description: 'Vakit girdiğinde ezan sesi çal',
      value: notificationSound,
      onToggle: handleSoundToggle,
    },
    {
      icon: '📳',
      label: 'Titreşim',
      description: 'Bildirimde telefonu titret',
      value: vibration,
      onToggle: handleVibrationToggle,
    },
  ];

  const appearanceSettings = [
    {
      icon: '🌙',
      label: 'Karanlık Mod',
      description: 'Gece modunu aktif et',
      value: darkMode,
      onToggle: setDarkMode,
    },
  ];

  const locationSettings = [
    {
      icon: '🏙️',
      label: 'İl',
      value: selectedCity,
      action: handleCityChange,
    },
    {
      icon: '📍',
      label: 'İlçe',
      value: selectedDistrict,
      action: handleDistrictChange,
    },
  ];

  const filteredProvinces = provinces.filter((item) =>
    normalizeText(item.name).includes(normalizeText(locationSearch))
  );
  const filteredDistricts = districts.filter((item) =>
    normalizeText(item.name).includes(normalizeText(locationSearch))
  );

  const generalSettings = [
    {
      icon: '🌍',
      label: 'Dil',
      value: selectedLanguage,
      action: handleLanguageChange,
    },
    {
      icon: '🎨',
      label: 'Arkaplan Teması',
      value: backgroundTheme === 'default' ? 'Varsayılan' : backgroundTheme === 'pattern' ? 'İslami Motif' : 'Gradient',
      action: handleBackgroundChange,
    },
    {
      icon: '🕌',
      label: 'Hesaplama Yöntemi',
      value: 'Diyanet',
      action: () => Alert.alert('Yakında', 'Hesaplama yöntemi seçimi yakında eklenecek'),
    },
  ];

  const supportItems = [
    {
      icon: '📖',
      label: 'Kullanım Kılavuzu',
      action: () => Alert.alert('Kullanım Kılavuzu', 'Uygulama kullanım kılavuzu yakında hazırlanacak'),
    },
    {
      icon: '❓',
      label: 'Sıkça Sorulan Sorular',
      action: () => Alert.alert('SSS', 'Sıkça sorulan sorular bölümü yakında eklenecek'),
    },
    {
      icon: '💬',
      label: 'Geri Bildirim',
      action: () => Alert.alert('Geri Bildirim', 'Öneri ve şikayetleriniz için: iletisim@islamiuygulama.com'),
    },
    {
      icon: '⭐',
      label: 'Uygulamayı Değerlendir',
      action: () => Alert.alert('Teşekkürler!', 'Değerlendirmeniz bizim için çok önemli'),
    },
    {
      icon: 'ℹ️',
      label: 'Hakkında',
      action: () => Alert.alert(
        'İslami Hayat',
        'Versiyon: 1.0.0\n\n© 2026 Tüm hakları saklıdır.\n\nBu uygulama, Müslümanların günlük ibadetlerini kolaylaştırmak için geliştirilmiştir.\n\nÖzellikler:\n• Namaz vakitleri\n• Kıble pusulası\n• Günlük dua ve hadisler\n• Tesbih\n• Yakın camiler\n• Ve daha fazlası...'
      ),
    },
    // ✅ YENİ: Test butonu
    {
      icon: '🔔',
      label: 'Test Bildirimi Gönder',
      action: handleTestNotification,
    },
    // ✅ YENİ: Planlanan bildirimleri göster
    {
      icon: '📊',
      label: 'Planlanan Bildirimleri Gör',
      action: handleShowScheduledNotifications,
    },
    
    {
      icon: 'ℹ️',
      label: 'Hakkında',
      action: () => Alert.alert(/* ... */),
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00695C', '#00897B']} style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Ayarlar</Text>
        <Text style={styles.headerSubtitle}>Uygulamanızı kişiselleştirin</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ✅ YENİ: Favoriler Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>❤️</Text>
            <Text style={styles.sectionTitle}>Favoriler</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('FavoritesScreen')}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>❤️</Text>
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Favorilerim</Text>
                  <Text style={styles.settingDescription}>
                    Kaydettiğiniz dua ve hadisler
                  </Text>
                </View>
              </View>
              <View style={styles.menuRight}>
                {favoritesCount > 0 && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>{favoritesCount}</Text>
                  </View>
                )}
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
          </View>
          <View style={styles.card}>
            {notificationSettings.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.settingItem,
                  index !== notificationSettings.length - 1 && styles.settingItemBorder,
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
                  thumbColor={item.value ? '#FFFFFF' : '#F5F5F5'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Konum Ayarları */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>Konum Ayarları</Text>
          </View>
          <View style={styles.card}>
            {locationSettings.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index !== locationSettings.length - 1 && styles.settingItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={styles.valueText}>{item.value}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={[styles.menuItem, styles.settingItemBorder]}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>🧭</Text>
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Konum Kaynağı</Text>
                  <Text style={styles.settingDescription}>
                    {isManualLocation ? 'Manuel seçim kullanılıyor' : 'Anlık konum kullanılıyor'}
                  </Text>
                </View>
              </View>
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>{isManualLocation ? 'Manuel' : 'Otomatik'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={useCurrentLocation}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>📡</Text>
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Anlık Konumu Kullan</Text>
                  <Text style={styles.settingDescription}>Manuel seçimi kapat ve GPS konumuna dön</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Görünüm Ayarları */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>🎨</Text>
            <Text style={styles.sectionTitle}>Görünüm Ayarları</Text>
          </View>
          <View style={styles.card}>
            {appearanceSettings.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.settingItem,
                  index !== appearanceSettings.length - 1 && styles.settingItemBorder,
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#D0D0D0', true: '#4CAF50' }}
                  thumbColor={item.value ? '#FFFFFF' : '#F5F5F5'}
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleBackgroundChange}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>🖼️</Text>
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Arkaplan Teması</Text>
                  <Text style={styles.settingDescription}>Uygulamanın arkaplanını değiştir</Text>
                </View>
              </View>
              <View style={styles.menuRight}>
                <View style={styles.themeBadge}>
                  <Text style={styles.themeBadgeText}>
                    {backgroundTheme === 'default' ? 'Varsayılan' : backgroundTheme === 'pattern' ? 'Motif' : 'Gradient'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Genel Ayarlar */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>⚙️</Text>
            <Text style={styles.sectionTitle}>Genel Ayarlar</Text>
          </View>
          <View style={styles.card}>
            {generalSettings.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index !== generalSettings.length - 1 && styles.settingItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={styles.valueText}>{item.value}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Destek & Yardım */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>💡</Text>
            <Text style={styles.sectionTitle}>Destek & Yardım</Text>
          </View>
          <View style={styles.card}>
            {supportItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index !== supportItems.length - 1 && styles.settingItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>İslami Hayat v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>© 2026 Tüm hakları saklıdır</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setLocationModalVisible(false);
          setLocationModalStep('province');
          setLocationSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              {locationModalStep === 'district' ? (
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => {
                    setLocationModalStep('province');
                    setLocationSearch('');
                  }}
                >
                  <Text style={styles.modalBackButtonText}>‹</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.modalBackPlaceholder} />
              )}
              <Text style={styles.modalTitle}>
                {locationModalStep === 'district'
                  ? `${selectedProvinceOption?.name || selectedCity} İlçeleri`
                  : 'İl Seçin'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLocationModalVisible(false);
                  setLocationModalStep('province');
                  setLocationSearch('');
                }}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <TextInput
                style={styles.modalInput}
                placeholder={locationModalStep === 'district' ? 'İlçe ara...' : 'İl ara...'}
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoCapitalize="words"
              />
            </View>

            <ScrollView style={styles.modalList}>
              {locationModalStep === 'province' ? (
                <>
                  {loadingProvinces ? (
                    <View style={styles.modalLoadingWrap}>
                      <ActivityIndicator size="small" color="#00897B" />
                      <Text style={styles.modalLoadingText}>İller yükleniyor...</Text>
                    </View>
                  ) : (
                    <>
                      {filteredProvinces.map((province) => (
                        <TouchableOpacity
                          key={province.id}
                          style={styles.modalItem}
                          onPress={() => handleProvinceSelectFromList(province)}
                        >
                          <Text style={styles.modalItemText}>{province.name}</Text>
                          {(selectedCity === province.name || selectedProvinceOption?.id === province.id) && (
                            <Text style={styles.modalItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      {!filteredProvinces.length && <Text style={styles.noResultText}>İl bulunamadı</Text>}
                    </>
                  )}
                </>
              ) : (
                <>
                  {loadingDistricts ? (
                    <View style={styles.modalLoadingWrap}>
                      <ActivityIndicator size="small" color="#00897B" />
                      <Text style={styles.modalLoadingText}>İlçeler yükleniyor...</Text>
                    </View>
                  ) : (
                    <>
                      {filteredDistricts.map((district) => (
                        <TouchableOpacity
                          key={district.id}
                          style={styles.modalItem}
                          onPress={() => handleDistrictSelectFromList(district)}
                        >
                          <Text style={styles.modalItemText}>{district.name}</Text>
                          {(selectedDistrict === district.name || selectedDistrictOption?.id === district.id) && (
                            <Text style={styles.modalItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      {!filteredDistricts.length && <Text style={styles.noResultText}>İlçe bulunamadı</Text>}
                    </>
                  )}
                </>
              )}
            </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0F2F1',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#00897B',
    fontWeight: '600',
  },
  themeBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00897B',
  },
  // ✅ YENİ: Favori badge stili
  favoriteBadge: {
    backgroundColor: '#FF4081',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  favoriteBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 24,
    color: '#BDBDBD',
    fontWeight: '300',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalBackButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackButtonText: {
    fontSize: 22,
    color: '#00897B',
    lineHeight: 24,
    fontWeight: '700',
  },
  modalBackPlaceholder: {
    width: 28,
    height: 28,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalCloseButtonText: {
    fontSize: 20,
    color: '#00897B',
    fontWeight: '700',
  },
  modalSearchBox: {
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  modalList: {
    maxHeight: 380,
  },
  modalLoadingWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  modalLoadingText: {
    fontSize: 13,
    color: '#666',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalItemCheck: {
    color: '#00897B',
    fontSize: 16,
    fontWeight: '700',
  },
  noResultText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 16,
  },
});
