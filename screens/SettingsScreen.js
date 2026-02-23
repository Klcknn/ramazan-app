import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { useLocalization } from '../context/LocalizationContext';
import { useAppTheme } from '../hooks/use-app-theme';
import { LocationContext } from '../context/LocationContext';
import {
  cancelImportantDayNotifications,
  cancelPrayerNotifications,
  getNotificationSettings,
  requestNotificationPermission,
  saveNotificationSettings,
  scheduleImportantDayNotificationsForYear,
  schedulePrayerNotifications,
} from '../services/notificationService';
import { getPrayerTimes, getPrayerTimesByCity } from '../services/prayerTimesAPI';


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
  const { darkMode, setDarkMode } = useAppearance();
  const { language, setLanguage, t, languages, getLanguageByCode } = useLocalization();
  const theme = useAppTheme();
  
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
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  // Favori sayısı
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { location, fullLocation, city } = useContext(LocationContext);

  // Favori sayısını yenile
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
      Alert.alert(t('common.error'), t('settings.provincesLoadError'));
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
      Alert.alert(t('common.error'), t('settings.districtsLoadError'));
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
      Alert.alert(t('common.info'), t('settings.selectProvinceFirst'));
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
      Alert.alert(t('common.success'), t('settings.locationSaved'));
    } catch (error) {
      console.error('Konum kaydetme hatası:', error);
      Alert.alert(t('common.error'), t('settings.locationSaveError'));
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
      Alert.alert(t('common.success'), t('settings.locationResetSuccess'));
    } catch (error) {
      console.error('Anlık konuma dönüş hatası:', error);
      Alert.alert(t('common.error'), t('settings.locationResetError'));
    }
  };

  // Favori sayısını yükle
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
          Alert.alert(t('settings.prayerNotificationNeedLocationTitle'), t('settings.prayerNotificationNeedLocation'));
          return;
        }

        const scheduled = await schedulePrayerNotifications(times);
        if (!scheduled) {
          setPrayerNotifications(false);
          await saveSettings(false);
          Alert.alert(t('common.info'), t('settings.prayerNotificationScheduleFailed'));
          return;
        }

        Alert.alert(t('common.success'), t('settings.prayerNotificationOn'));
        return;
      }

      await cancelPrayerNotifications();
      await saveSettings(false);
      Alert.alert(t('common.success'), t('settings.prayerNotificationOff'));
    } catch (error) {
      console.error('Namaz bildirimi ayar hatası:', error);
      Alert.alert(t('common.error'), t('settings.prayerNotificationUpdateError'));
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
      Alert.alert(t('common.error'), t('settings.adhanSoundUpdateError'));
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
      Alert.alert(t('common.error'), t('settings.vibrationUpdateError'));
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
        Alert.alert(t('common.success'), t('settings.importantDaysOn'));
        return;
      }

      await AsyncStorage.setItem('important_days_notifications_enabled', 'false');
      await cancelImportantDayNotifications();
      Alert.alert(t('common.success'), t('settings.importantDaysOff'));
    } catch (error) {
      console.error('Önemli gün ayarı güncellenemedi:', error);
      Alert.alert(t('common.error'), t('settings.importantDaysUpdateError'));
    }
  };

  const handleCityChange = () => {
    openLocationPicker('province');
  };

  const handleDistrictChange = () => {
    openLocationPicker('district');
  };

  const handleLanguageChange = () => {
    setLanguageModalVisible(true);
  };

  const handleLanguageSelect = async (code) => {
    await setLanguage(code);
    setLanguageModalVisible(false);
    Alert.alert(t('common.success'), t('settings.languageUpdated'));
  };

  const notificationSettings = [
      {
      icon: '🔔',
      label: t('settings.sectionNotifications'),
      description: t('settings.prayerNotificationOn'),
      value: prayerNotifications,
      onToggle: handleNotificationToggle,
    },
    {
      icon: '📅',
      label: t('settings.importantDaysOn'),
      description: 'Kandil ve bayramlardan 1 gün önce hatırlatma',
      value: importantDaysNotifications,
      onToggle: handleImportantDaysToggle,
    },
    {
      icon: '🔊',
      label: t('settings.adhanLabel'),
      description: 'Vakit girdiğinde ezan sesi çal',
      value: notificationSound,
      onToggle: handleSoundToggle,
    },
    {
      icon: '📳',
      label: t('settings.vibrationLabel'),
      description: 'Bildirimde telefonu titret',
      value: vibration,
      onToggle: handleVibrationToggle,
    },
  ];

  const appearanceSettings = [
    {
      icon: '🌙',
      label: t('settings.darkMode'),
      description: t('settings.darkModeDescription'),
      value: darkMode,
      onToggle: setDarkMode,
    },
  ];

  const locationSettings = [
    {
      icon: '🏙️',
      label: t('settings.city'),
      value: selectedCity,
      action: handleCityChange,
    },
    {
      icon: '📍',
      label: t('settings.district'),
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

  const supportItems = [
    {
      icon: '💬',
      label: t('settings.feedbackTitle'),
      action: () => Alert.alert(t('settings.feedbackTitle'), t('settings.feedbackBody')),
    },
    {
      icon: 'ℹ️',
      label: t('settings.aboutTitle'),
      action: () => Alert.alert(
        'Vakitçim',
        'Versiyon: 1.0.0\n\n© 2026 Tüm hakları saklıdır.\n\nBu uygulama, Müslümanların günlük ibadetlerini kolaylaştırmak için geliştirilmiştir.\n\nÖzellikler:\n• Namaz vakitleri\n• Kıble pusulası\n• Günlük dua ve hadisler\n• Tesbih\n• Yakın camiler\n• Ve daha fazlası...'
      ),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={theme.headerGradient} style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ {t('settings.title')}</Text>
        <Text style={[styles.headerSubtitle, { opacity: theme.darkMode ? 0.95 : 0.9 }]}>{t('settings.subtitle')}</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Favoriler Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>❤️</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.sectionFavorites')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                      <Text style={[styles.settingLabel, { color: theme.text }]}>{t('favorites.title')}</Text>
                      <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                        {t('settings.favoriteSaved')}
                      </Text>
                </View>
              </View>
              <View style={styles.menuRight}>
                {favoritesCount > 0 && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>{favoritesCount}</Text>
                  </View>
                )}
                <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.sectionNotifications')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                    <Text style={[styles.settingLabel, { color: theme.text }]}>{item.label}</Text>
                    <Text style={[styles.settingDescription, { color: theme.textMuted }]}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: theme.switchTrackOff, true: theme.success }}
                  thumbColor={item.value ? theme.switchThumbOn : theme.switchThumbOff}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Konum Ayarları */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.sectionLocation')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                  <Text style={[styles.settingLabel, { color: theme.text }]}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={[styles.valueText, { color: theme.textMuted }]}>{item.value}</Text>
                  <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={[styles.menuItem, styles.settingItemBorder]}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>🧭</Text>
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.locationSource')}</Text>
                  <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                    {isManualLocation ? t('settings.locationManual') : t('settings.locationAuto')}
                  </Text>
                </View>
              </View>
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>{isManualLocation ? t('settings.locationManualBadge') : t('settings.locationAutoBadge')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={useCurrentLocation}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>📡</Text>
                </View>
                <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.useCurrentLocation')}</Text>
                <Text style={[styles.settingDescription, { color: theme.textMuted }]}>{t('settings.useCurrentLocationDesc')}</Text>
              </View>
            </View>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Görünüm Ayarları */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>🎨</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.sectionAppearance')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                    <Text style={[styles.settingLabel, { color: theme.text }]}>{item.label}</Text>
                    <Text style={[styles.settingDescription, { color: theme.textMuted }]}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: theme.switchTrackOff, true: theme.success }}
                  thumbColor={item.value ? theme.switchThumbOn : theme.switchThumbOff}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Destek & Yardım */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>💡</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.sectionSupport')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                  <Text style={[styles.settingLabel, { color: theme.text }]}>{item.label}</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textMuted }]}>Vakitçim v1.0.0</Text>
          <Text style={[styles.appInfoSubtext, { color: theme.textMuted }]}>© 2026 Tüm hakları saklıdır</Text>
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
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {locationModalStep === 'district'
                  ? t('settings.locationModalDistrictTitle', { province: selectedProvinceOption?.name || selectedCity })
                  : t('settings.locationModalProvinceTitle')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLocationModalVisible(false);
                  setLocationModalStep('province');
                  setLocationSearch('');
                }}
              >
                <Text style={[styles.modalCloseButtonText, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <TextInput
                style={styles.modalInput}
                placeholder={locationModalStep === 'district' ? t('settings.searchDistrictPlaceholder') : t('settings.searchProvincePlaceholder')}
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoCapitalize="words"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <ScrollView style={styles.modalList}>
              {locationModalStep === 'province' ? (
                <>
                  {loadingProvinces ? (
                    <View style={styles.modalLoadingWrap}>
                      <ActivityIndicator size="small" color="#00897B" />
                      <Text style={[styles.modalLoadingText, { color: theme.textMuted }]}>{t('settings.loadingProvinces')}</Text>
                    </View>
                  ) : (
                    <>
                      {filteredProvinces.map((province) => (
                        <TouchableOpacity
                          key={province.id}
                          style={styles.modalItem}
                          onPress={() => handleProvinceSelectFromList(province)}
                        >
                          <Text style={[styles.modalItemText, { color: theme.text }]}>{province.name}</Text>
                          {(selectedCity === province.name || selectedProvinceOption?.id === province.id) && (
                            <Text style={styles.modalItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      {!filteredProvinces.length && <Text style={[styles.noResultText, { color: theme.textMuted }]}>{t('settings.provinceNotFound')}</Text>}
                    </>
                  )}
                </>
              ) : (
                <>
                  {loadingDistricts ? (
                    <View style={styles.modalLoadingWrap}>
                      <ActivityIndicator size="small" color="#00897B" />
                      <Text style={[styles.modalLoadingText, { color: theme.textMuted }]}>{t('settings.loadingDistricts')}</Text>
                    </View>
                  ) : (
                    <>
                      {filteredDistricts.map((district) => (
                        <TouchableOpacity
                          key={district.id}
                          style={styles.modalItem}
                          onPress={() => handleDistrictSelectFromList(district)}
                        >
                          <Text style={[styles.modalItemText, { color: theme.text }]}>{district.name}</Text>
                          {(selectedDistrict === district.name || selectedDistrictOption?.id === district.id) && (
                            <Text style={styles.modalItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      {!filteredDistricts.length && <Text style={[styles.noResultText, { color: theme.textMuted }]}>{t('settings.districtNotFound')}</Text>}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={languageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalBackPlaceholder} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('settings.languageModalTitle')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Text style={[styles.modalCloseButtonText, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {languages.map((lang) => {
                const selected = lang.code === language;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <View>
                      <Text style={[styles.modalItemText, { color: theme.text }]}>
                        {lang.nativeLabel}
                      </Text>
                      <Text style={[styles.modalLoadingText, { color: theme.textMuted }]}>
                        {lang.label} ({lang.code.toUpperCase()})
                      </Text>
                    </View>
                    {selected && <Text style={styles.modalItemCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: 'transparent',
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
  // Favori badge stili
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
  modalItemSelected: {
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    paddingHorizontal: 10,
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


