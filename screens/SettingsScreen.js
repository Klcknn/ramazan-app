import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { getNotificationSettings, requestNotificationPermission, saveNotificationSettings } from '../services/notificationService';

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
  
  // Dil
  const [selectedLanguage, setSelectedLanguage] = useState('Türkçe');

  // ✅ YENİ: Favori sayısı
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Ayarları yükle
  useEffect(() => {
    loadSettings();
    loadFavoritesCount();
  }, []);

  // ✅ YENİ: Favori sayısını yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavoritesCount();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    const settings = await getNotificationSettings();
    setPrayerNotifications(settings.enabled);
    setNotificationSound(settings.sound);
    setVibration(settings.vibration);
    
    // Önemli günler bildirimi ayarını yükle
    const importantDaysEnabled = await AsyncStorage.getItem('important_days_notifications_enabled');
    setImportantDaysNotifications(importantDaysEnabled !== 'false');
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

  // Bildirim toggle handler
  const handleNotificationToggle = async (value) => {
    setPrayerNotifications(value);
    
    if (value) {
      // İzin iste
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setPrayerNotifications(false);
        return;
      }
    }
    
    // Ayarları kaydet
    await saveNotificationSettings({
      enabled: value,
      sound: notificationSound,
      vibration: vibration,
    });

    Alert.alert(
      'Başarılı',
      value 
        ? 'Namaz vakti bildirimleri aktif edildi. Namaz vakitleri güncellendiğinde bildirimler otomatik planlanacak.' 
        : 'Namaz vakti bildirimleri kapatıldı.'
    );
  };

  // Ses toggle handler
  const handleSoundToggle = async (value) => {
    setNotificationSound(value);
    await saveNotificationSettings({
      enabled: prayerNotifications,
      sound: value,
      vibration: vibration,
    });
  };

  // Titreşim toggle handler
  const handleVibrationToggle = async (value) => {
    setVibration(value);
    await saveNotificationSettings({
      enabled: prayerNotifications,
      sound: notificationSound,
      vibration: value,
    });
  };

  // Önemli günler bildirimi toggle handler
  const handleImportantDaysToggle = async (value) => {
    setImportantDaysNotifications(value);
    await AsyncStorage.setItem('important_days_notifications_enabled', value.toString());
    
    Alert.alert(
      'Başarılı',
      value 
        ? 'Önemli dini günler için bildirimler aktif edildi. Önemli günlerden 1 gün önce saat 11:00\'de hatırlatma alacaksınız.' 
        : 'Önemli dini günler bildirimleri kapatıldı.'
    );
  };

  const handleCityChange = () => {
    Alert.alert(
      'İl Seçimi',
      'İl seçimi özelliği yakında eklenecek',
      [{ text: 'Tamam' }]
    );
  };

  const handleDistrictChange = () => {
    Alert.alert(
      'İlçe Seçimi',
      'İlçe seçimi özelliği yakında eklenecek',
      [{ text: 'Tamam' }]
    );
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
});