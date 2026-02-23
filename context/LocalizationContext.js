import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'app_language';

const LANGUAGE_DATASET = [{ code: 'tr', label: 'Türkçe', nativeLabel: 'Türkçe', rtl: false }];

const TEXT = {
  tr: {
    common: {
      ok: 'Tamam',
      cancel: 'İptal',
      close: 'Kapat',
      save: 'Kaydet',
      loading: 'Yükleniyor...',
      success: 'Başarılı',
      error: 'Hata',
      info: 'Bilgi',
      soon: 'Yakında',
    },
    tabs: {
      home: 'Ana Sayfa',
      qibla: 'Kıble',
      mosques: 'Camiler',
      settings: 'Ayarlar',
    },
    settings: {
      title: 'Ayarlar',
      subtitle: 'Uygulamanızı kişiselleştirin',
      sectionFavorites: 'Favoriler',
      sectionNotifications: 'Bildirim Ayarları',
      sectionLocation: 'Konum Ayarları',
      sectionAppearance: 'Görünüm Ayarları',
      sectionGeneral: 'Genel Ayarlar',
      sectionSupport: 'Destek ve Yardım',
      language: 'Dil',
      languageModalTitle: 'Dil Seçimi',
      languageUpdated: 'Uygulama dili güncellendi.',
      darkMode: 'Karanlık Mod',
      darkModeDescription: 'Gece modunu aktif et',
      backgroundTheme: 'Arkaplan Teması',
      themeDefault: 'Varsayılan',
      themePattern: 'İslami Motif',
      themeGradient: 'Gradient',
      calcMethod: 'Hesaplama Yöntemi',
      favoriteSaved: 'Kaydettiğiniz dua ve hadisler',
      useCurrentLocation: 'Anlık Konumu Kullan',
      useCurrentLocationDesc: 'Manuel seçimi kapat ve GPS konumuna dön',
      locationSource: 'Konum Kaynağı',
      locationManual: 'Manuel seçim kullanılıyor',
      locationAuto: 'Anlık konum kullanılıyor',
      locationManualBadge: 'Manuel',
      locationAutoBadge: 'Otomatik',
      city: 'İl',
      district: 'İlçe',
      adhanLabel: 'Ezan',
      vibrationLabel: 'Titreşim',
      backgroundThemeDescription: 'Uygulamanın arkaplanını değiştir',
      provincesLoadError: 'İl listesi yüklenemedi.',
      districtsLoadError: 'İlçe listesi yüklenemedi.',
      selectProvinceFirst: 'Önce il seçiniz.',
      locationSaved: 'Konum ayarı kaydedildi. Ana sayfa bu konuma göre güncellenecek.',
      locationSaveError: 'Konum ayarı kaydedilemedi.',
      locationResetSuccess: 'Anlık konuma geri dönüldü.',
      locationResetError: 'Anlık konuma dönülemedi.',
      notificationPermissionDenied: 'Bildirim izni verilmedi',
      testNotificationTitle: 'Test Bildirimi',
      testNotificationBody: 'Bu bir test bildirimidir. Bildirimler çalışıyor!',
      testNotificationScheduled: 'Test bildirimi 5 saniye sonra gelecek. Uygulamayı arka plana alın ve bekleyin.',
      testNotificationError: 'Test bildirimi gönderilemedi',
      noScheduledNotifications: 'Hiç planlanmış bildirim yok. Lütfen namaz vakti bildirimlerini aktif edin.',
      scheduledNotificationsTitle: 'Planlanan Bildirimler',
      scheduledNotificationsError: 'Bildirimler listelenemedi',
      prayerNotificationNeedLocationTitle: 'Konum Gerekli',
      prayerNotificationNeedLocation: 'Namaz vakti bildirimi için önce konum izni veriniz.',
      prayerNotificationScheduleFailed: 'Namaz vakti bildirimleri planlanamadı.',
      prayerNotificationOn: 'Namaz vakti bildirimleri aktif edildi.',
      prayerNotificationOff: 'Namaz vakti bildirimleri kapatıldı.',
      prayerNotificationUpdateError: 'Namaz bildirimi ayarı güncellenemedi.',
      adhanSoundUpdateError: 'Ezan sesi ayarı güncellenemedi.',
      vibrationUpdateError: 'Titreşim ayarı güncellenemedi.',
      importantDaysOn: 'Önemli gün bildirimleri aktif edildi.',
      importantDaysOff: 'Önemli gün bildirimleri kapatıldı.',
      importantDaysUpdateError: 'Önemli gün bildirim ayarı güncellenemedi.',
      calcMethodSoon: 'Hesaplama yöntemi seçimi yakında eklenecek',
      guideTitle: 'Kullanım Kılavuzu',
      guideSoon: 'Uygulama kullanım kılavuzu yakında hazırlanacak',
      faqTitle: 'SSS',
      faqSoon: 'Sıkça sorulan sorular bölümü yakında eklenecek',
      feedbackTitle: 'Geri Bildirim',
      feedbackBody: 'Öneri ve şikayetleriniz için: iletisim@islamiuygulama.com',
      rateThanksTitle: 'Teşekkürler!',
      rateThanksBody: 'Değerlendirmeniz bizim için çok önemli',
      aboutTitle: 'Vakitçim',
      locationModalProvinceTitle: 'İl Seçin',
      locationModalDistrictTitle: '{{province}} İlçeleri',
      searchProvincePlaceholder: 'İl ara...',
      searchDistrictPlaceholder: 'İlçe ara...',
      loadingProvinces: 'İller yükleniyor...',
      loadingDistricts: 'İlçeler yükleniyor...',
      provinceNotFound: 'İl bulunamadı',
      districtNotFound: 'İlçe bulunamadı',
    },
    home: {
      checkingLocation: 'Konumunuz kontrol ediliyor',
      allFeatures: 'TÜM ÖZELLİKLER',
      dailyContent: 'GÜNÜN İÇERİĞİ',
      dailyDua: 'GÜNÜN DUASI',
      dailyHadith: 'GÜNÜN HADİSİ',
      readMore: 'Tamamını Oku',
      featureSoon: '{{name}} özelliği çok yakında eklenecek!',
      dailyContentLoading: 'Günlük içerik yükleniyor...',
      dailyContentLoadErrorTitle: 'Bilgi',
      dailyContentLoadError: 'Günlük hadis ve dua yüklenemedi. Lütfen internet bağlantınızı kontrol edin.',
      favoriteRemoved: 'Favorilerden kaldırıldı',
      favoriteAdded: 'Favorilere eklendi',
      favoriteError: 'Favorilere eklenirken bir hata oluştu',
      shareImagePrepareError: 'Görsel hazırlanamadı',
      shareNotAvailable: 'Paylaşım özelliği bu cihazda kullanılamıyor',
      shareError: 'Paylaşım sırasında bir hata oluştu',
      locationRequiredTitle: 'Konum Gerekli',
      locationRequiredDesc: 'Namaz vakitlerini gösterebilmek için konum izni verin veya Ayarlar > Konum Ayarları bölümünden il/ilçe seçin.',
      prayerTimesErrorTitle: 'Hata',
      prayerTimesError: 'Namaz vakitleri alınamadı. Tekrar denemek ister misiniz?',
      shareSectionArabic: 'Arapça',
      shareSectionPronunciation: 'Okunuşu',
      shareSectionTurkishMeaning: 'Türkçe Meali',
      modalSectionArabic: 'ARAPÇA',
      modalSectionPronunciation: 'OKUNUŞU',
      modalSectionMeaning: 'ANLAMI',
      modalSectionExplanation: 'AÇIKLAMA',
      modalSectionTurkish: 'TÜRKÇE',
      modalSectionSource: 'KAYNAK',
      favoriteInList: 'Favorilerde',
      addToFavorites: 'Favorilere Ekle',
      shareAction: 'Paylaş',
      allDuas: 'Tüm Duaları Gör',
      allHadiths: 'Tüm Hadisleri Gör',
      features: {
        tesbih: 'Zikirmatik',
        mosques: 'Camiler',
        qibla: 'Kıble',
        ramadan: 'İmsakiye',
        dua: 'Dua',
        hadis: 'Hadis',
        holyDays: 'Dini Günler',
        prayers: 'Namazlar',
        quran: 'Kuran',
        khutbah: 'Hutbe',
      },
    },
    notifications: {
      title: 'Bildirimler',
      clearAll: 'Tümünü Sil',
      emptyTitle: 'Bildirim Yok',
      emptyDesc: 'Henüz hiç bildiriminiz bulunmuyor',
      noNotifications: 'Bildirim Yok',
      noNotificationsDesc: 'Henüz hiç bildiriminiz bulunmuyor',
      countSuffix: 'bildirim',
    },
    favorites: {
      title: 'Favorilerim',
      total: 'Toplam',
      share: 'Paylaş',
      remove: 'Kaldır',
      empty: 'Henüz favori eklemediniz',
      emptyTitle: 'Henüz favori eklemediniz',
      emptyDesc: 'Günün duası veya hadisini favorilere ekleyerek daha sonra kolayca erişebilirsiniz',
      dua: 'DUA',
      hadis: 'HADİS',
    },
    qibla: {
      direction: 'Kıble Yönü',
      distance: "Kabe'ye Mesafe",
      phoneDirection: 'Telefonun Yönü',
      north: 'KUZEY',
      east: 'DOĞU',
      south: 'GÜNEY',
      west: 'BATI',
      rotatePhone: 'Telefonunuzu yavaşça çevirin',
      aligned: 'Kıble yönüne bakıyorsunuz!',
      near: 'Yaklaşıyorsunuz, biraz daha çevirin',
      far: 'Telefonunuzu yavaşça çevirerek kıble yönünü bulun',
      calibrating: 'Pusula kalibre ediliyor...',
      locationRequiredTitle: 'Konum Gerekli',
      locationRequiredDesc: 'Kıble yönünü hesaplamak için konum izni gereklidir.',
      sensorError: 'Cihazınızda pusula sensörü yok',
    },
    mosques: {
      nearest: 'En Yakın',
      open: 'Açık',
      closed: 'Kapalı',
      loadingTitle: 'Yakın camiler aranıyor...',
      loadingDesc: 'Konum ve harita yükleniyor',
      distance: 'Mesafe',
      rating: 'Puan',
      directions: 'Yol Tarifi Al',
      emptyTitle: 'Yakında cami bulunamadı',
      emptyDesc: 'Farklı bir bölgeye gidin',
    },
    ramadan: {
      selectDistrict: 'İlçe seçin',
      day: 'Ramazan Günü',
      date: 'Tarih',
      sahur: 'Sahur Vakti',
      iftar: 'İftar Vakti',
      loading: 'Veriler yükleniyor...',
      provinceTitle: 'İl Seçin',
      districtTitle: '{{province}} İlçeleri',
      searchProvince: 'İl ara...',
      searchDistrict: 'İlçe ara...',
      provinceNotFound: 'İl bulunamadı',
      districtNotFound: 'İlçe bulunamadı',
      districtsLoading: 'İlçeler yükleniyor...',
    },
    headers: {
      ramadan: 'İmsakiye',
      tesbih: 'Zikirmatik',
      importantDays: 'Önemli Dini Günler',
      qibla: 'Kıble Pusulası',
      mosques: 'Yakın Camiler',
    },
    auth: {
      welcome: 'Hoş Geldiniz',
      prepareRamadan: "Ramazan'a Hazırlanın",
      email: 'Email',
      password: 'Şifre',
      forgotPassword: 'Şifremi Unuttum',
      login: 'Giriş Yap',
      loggingIn: 'Giriş yapılıyor...',
      noAccount: 'Hesabın yok mu?',
      register: 'Kayıt Ol',
      createAccount: 'Hesap Oluştur',
      prepareRamadanShort: "Ramazan'a hazırlan",
      fullName: 'Ad Soyad',
      fullNamePlaceholder: 'Adınızı girin',
      passwordMinPlaceholder: 'En az 6 karakter',
      passwordRepeat: 'Şifre Tekrar',
      passwordRepeatPlaceholder: 'Şifrenizi tekrar girin',
      registering: 'Kaydediliyor...',
      alreadyHaveAccount: 'Zaten hesabın var mı?',
      loadingLocation: 'Konum bilgisi alınıyor...',
      emailRequired: 'Email adresi gerekli',
      validEmailRequired: 'Geçerli bir email adresi girin',
      nameRequired: 'Adınızı girin',
      passwordRequired: 'Şifre gerekli',
      passwordMin: 'Şifre en az 6 karakter olmalı',
      passwordMismatch: 'Şifreler eşleşmiyor',
      loginFailed: 'Giriş Başarısız',
      resetSoon: 'Şifre sıfırlama özelliği yakında',
      registerSuccessTitle: 'Başarılı!',
      registerSuccessDesc: 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
      registerError: 'Kayıt sırasında bir hata oluştu',
      emailInUse: 'Bu email adresi zaten kullanılıyor',
      invalidEmail: 'Geçersiz email adresi',
      weakPassword: 'Şifre çok zayıf (en az 6 karakter)',
      networkError: 'İnternet bağlantısı hatası',
    },
  },
};

const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
};

const interpolate = (value, params = {}) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ''));
};

const LocalizationContext = createContext({
  language: 'tr',
  setLanguage: async () => {},
  t: (key) => key,
  languages: LANGUAGE_DATASET,
  getLanguageByCode: () => LANGUAGE_DATASET[0],
  isRTL: false,
});

export const LocalizationProvider = ({ children }) => {
  const [language, setLanguageState] = useState('tr');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (stored === 'tr') setLanguageState('tr');
      } catch (error) {
        console.error('Dil ayarı yüklenemedi:', error);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = async (code) => {
    if (code !== 'tr') return;
    setLanguageState('tr');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'tr');
    } catch (error) {
      console.error('Dil ayarı kaydedilemedi:', error);
    }
  };

  const t = (key, params) => {
    const raw = getByPath(TEXT.tr, key) ?? key;
    return interpolate(raw, params);
  };

  const getLanguageByCode = (code) => LANGUAGE_DATASET.find((x) => x.code === code) || LANGUAGE_DATASET[0];

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: LANGUAGE_DATASET,
      getLanguageByCode,
      isRTL: false,
    }),
    [language]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useLocalization = () => useContext(LocalizationContext);

