import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
// ✅ Bildirim helper'ı import et
import { addNotification } from './Notificationrenewalhelper';

// Bildirim davranışını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_KEYS = {
  NOTIFICATION_ENABLED: 'notification_enabled',
  SOUND_ENABLED: 'sound_enabled',
  VIBRATION_ENABLED: 'vibration_enabled',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
};

/**
 * Android bildirim kanalı oluştur
 */
const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Namaz Vakitleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#00FF00',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync('important-days', {
      name: 'Önemli Günler',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#FFD700',
    });

    console.log('✅ Android bildirim kanalları oluşturuldu');
  }
};

/**
 * Bildirim izni al
 */
export const requestNotificationPermission = async () => {
  try {
    if (!Device.isDevice) {
      console.warn('⚠️ Emülatör tespit edildi - bildirimler sınırlı çalışabilir');
    }

    await createNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Bildirim İzni Gerekli',
        'Namaz vakti bildirimleri almak için lütfen ayarlardan bildirim izni verin.',
        [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Ayarlara Git', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }

    console.log('✅ Bildirim izni verildi');
    return true;
  } catch (error) {
    console.error('❌ Bildirim izni hatası:', error);
    return false;
  }
};

/**
 * Ezan sesi çal
 */
export const playAdhan = async () => {
  try {
    const soundEnabled = await AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    if (soundEnabled === 'false') {
      console.log('🔇 Ses kapalı, ezan çalınmayacak');
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/adhan.mp3'),
      { shouldPlay: true }
    );

    console.log('🔊 Ezan sesi çalınıyor...');

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        console.log('✅ Ezan sesi tamamlandı');
      }
    });
  } catch (error) {
    console.error('❌ Ezan sesi hatası:', error);
  }
};

/**
 * Tek bir namaz vakti için bildirim planla
 * Android: Önümüzdeki 30 gün için günlük bildirimler
 * iOS: Calendar trigger ile tekrarlayan bildirim
 */
const scheduleNotificationForPrayer = async (prayerName, prayerTime, icon) => {
  try {
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const notificationIds = [];

    // Bildirim içeriği
    const content = {
      title: `${icon} ${prayerName} Vakti Girdi`,
      body: `${prayerName} namazı vaktine girmiştir. Haydi namaza! 🕌`,
      sound: true,
      data: { prayerName, prayerTime },
    };

    if (Platform.OS === 'android') {
      content.priority = Notifications.AndroidNotificationPriority.MAX;
      content.channelId = 'prayer-times';
      content.vibrate = [0, 250, 250, 250];

      // ANDROID: Her gün için ayrı bildirim planla (30 gün)
      const now = new Date();
      
      for (let i = 0; i < 30; i++) {
        const notificationDate = new Date();
        notificationDate.setDate(now.getDate() + i);
        notificationDate.setHours(hours);
        notificationDate.setMinutes(minutes);
        notificationDate.setSeconds(0);
        notificationDate.setMilliseconds(0);

        // Sadece gelecekteki zamanlar için planla
        if (notificationDate > now) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: 'date',
              date: notificationDate,
              channelId: 'prayer-times',
            },
          });
          
          notificationIds.push(notificationId);
        }
      }

      console.log(`✅ ${prayerName} - ${notificationIds.length} bildirim planlandı (30 gün)`);
    } else {
      // iOS: Calendar trigger kullan
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: 'calendar',
          repeats: true,
          hour: hours,
          minute: minutes,
        },
      });

      notificationIds.push(notificationId);
      console.log(`✅ ${prayerName} - Tekrarlayan bildirim planlandı (iOS)`);
    }

    return notificationIds;
  } catch (error) {
    console.error(`❌ ${prayerName} bildirim planlama hatası:`, error);
    return [];
  }
};

/**
 * Tüm namaz vakitleri için bildirimleri planla
 */
export const schedulePrayerNotifications = async (prayerTimes) => {
  try {
    console.log('🔔 Bildirim planlama başlıyor...');

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('❌ Bildirim izni yok');
      return false;
    }

    const notificationEnabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED);
    if (notificationEnabled === 'false') {
      console.log('🔕 Bildirimler kapalı');
      return false;
    }

    // Önce tüm bildirimleri iptal et
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Eski bildirimler temizlendi');

    const prayers = [
      { name: 'İmsak', time: prayerTimes.Fajr, icon: '🌟' },
      { name: 'Güneş', time: prayerTimes.Sunrise, icon: '🌄' },
      { name: 'Öğle', time: prayerTimes.Dhuhr, icon: '☀️' },
      { name: 'İkindi', time: prayerTimes.Asr, icon: '🌤' },
      { name: 'Akşam', time: prayerTimes.Maghrib, icon: '🌅' },
      { name: 'Yatsı', time: prayerTimes.Isha, icon: '🌙' },
    ];

    const allScheduledIds = [];

    for (const prayer of prayers) {
      if (!prayer.time) {
        console.warn(`⚠️ ${prayer.name} vakti bulunamadı`);
        continue;
      }

      const notificationIds = await scheduleNotificationForPrayer(
        prayer.name,
        prayer.time,
        prayer.icon
      );
      
      if (notificationIds.length > 0) {
        allScheduledIds.push({
          prayer: prayer.name,
          ids: notificationIds,
          count: notificationIds.length
        });
      }
    }

    // Planlanan bildirimleri kaydet
    await AsyncStorage.setItem(
      STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
      JSON.stringify(allScheduledIds)
    );

    // Kontrol için planlanan bildirimleri say
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Toplam planlanan bildirim sayısı:', scheduled.length);

    const totalByPrayer = allScheduledIds.reduce((sum, p) => sum + p.count, 0);
    console.log(`✅ ${allScheduledIds.length} namaz vakti için ${totalByPrayer} bildirim planlandı`);
    
    return true;
  } catch (error) {
    console.error('❌ Bildirim planlama hatası:', error);
    return false;
  }
};

/**
 * Bildirimleri yeniden planla (her 2 haftada bir çağrılmalı)
 */
export const renewPrayerNotifications = async (prayerTimes) => {
  console.log('🔄 Bildirimler yenileniyor...');
  return await schedulePrayerNotifications(prayerTimes);
};

/**
 * Önemli dini günler için bildirim planla
 */
export const scheduleImportantDayNotifications = async (importantDays) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    const notificationEnabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED);
    if (notificationEnabled === 'false') {
      console.log('🔕 Bildirimler kapalı');
      return false;
    }

    const scheduledIds = [];

    for (const day of importantDays) {
      const dayDate = new Date(day.gregorianDate);
      const today = new Date();
      
      if (dayDate > today) {
        // 1 GÜN ÖNCE HATIRLATMA
        const reminderDate = new Date(dayDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(11, 0, 0, 0);

        if (reminderDate > today) {
          const content = {
            title: `${day.icon} Yarın ${day.name}`,
            body: `Yarın ${day.name} mübarek günüdür. Hazırlıklarınızı yapabilirsiniz. 🤲`,
            sound: true,
            data: { type: 'reminder', dayName: day.name },
          };

          if (Platform.OS === 'android') {
            content.priority = Notifications.AndroidNotificationPriority.HIGH;
            content.channelId = 'important-days';
          }

          const reminderId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: 'date',
              date: reminderDate,
              ...(Platform.OS === 'android' && { channelId: 'important-days' }),
            },
          });

          if (reminderId) {
            scheduledIds.push({ day: day.name, id: reminderId, type: 'reminder' });
            console.log(`✅ ${day.name} hatırlatması planlandı`);
          }
        }

        // GÜNÜN KENDİSİ
        const mainDate = new Date(dayDate);
        mainDate.setHours(8, 0, 0, 0);

        if (mainDate > today) {
          const content = {
            title: `${day.icon} ${day.name} Mübarek!`,
            body: `Bugün ${day.name}. ${day.description}`,
            sound: true,
            data: { type: 'main', dayName: day.name },
          };

          if (Platform.OS === 'android') {
            content.priority = Notifications.AndroidNotificationPriority.MAX;
            content.channelId = 'important-days';
          }

          const mainId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: 'date',
              date: mainDate,
              ...(Platform.OS === 'android' && { channelId: 'important-days' }),
            },
          });

          if (mainId) {
            scheduledIds.push({ day: day.name, id: mainId, type: 'main' });
            console.log(`✅ ${day.name} ana bildirimi planlandı`);
          }
        }
      }
    }

    await AsyncStorage.setItem('important_days_notifications', JSON.stringify(scheduledIds));
    console.log(`✅ ${scheduledIds.length} önemli gün bildirimi planlandı`);
    return true;
  } catch (error) {
    console.error('❌ Önemli gün bildirimi hatası:', error);
    return false;
  }
};

/**
 * Tüm bildirimleri iptal et
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    console.log('✅ Tüm bildirimler iptal edildi');
  } catch (error) {
    console.error('❌ Bildirim iptal hatası:', error);
  }
};

/**
 * Önemli gün bildirimlerini iptal et
 */
export const cancelImportantDayNotifications = async () => {
  try {
    const stored = await AsyncStorage.getItem('important_days_notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      for (const notif of notifications) {
        await Notifications.cancelScheduledNotificationAsync(notif.id);
      }
      await AsyncStorage.removeItem('important_days_notifications');
      console.log('✅ Önemli gün bildirimleri iptal edildi');
    }
  } catch (error) {
    console.error('❌ Bildirim iptal hatası:', error);
  }
};

/**
 * Planlanan bildirimleri listele
 */
export const listScheduledNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Planlanan bildirimler:', scheduled.length);
    return scheduled;
  } catch (error) {
    console.error('❌ Listeleme hatası:', error);
    return [];
  }
};

/**
 * Bildirim ayarlarını kaydet
 */
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ENABLED, settings.enabled.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, settings.sound.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.VIBRATION_ENABLED, settings.vibration.toString());
    console.log('✅ Ayarlar kaydedildi');
  } catch (error) {
    console.error('❌ Ayar kaydetme hatası:', error);
  }
};

/**
 * Bildirim ayarlarını oku
 */
export const getNotificationSettings = async () => {
  try {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED);
    const sound = await AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    const vibration = await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION_ENABLED);

    return {
      enabled: enabled !== 'false',
      sound: sound !== 'false',
      vibration: vibration !== 'false',
    };
  } catch (error) {
    console.error('❌ Ayar okuma hatası:', error);
    return { enabled: true, sound: true, vibration: true };
  }
};

/**
 * Bildirim listener'ı kur
 */
export const setupNotificationListeners = () => {
  const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const { prayerName } = response.notification.request.content.data || {};
      console.log('🔔 Bildirime tıklandı:', prayerName);
      await playAdhan();
      
      // ✅ Bildirimi in-app listeye ekle
      const { title, body } = response.notification.request.content;
      const data = response.notification.request.content.data;
      
      try {
        await addNotification({
          title: title || 'Bildirim',
          body: body || '',
          type: data?.type || 'prayer',
        });
      } catch (error) {
        console.error('Bildirim listeye eklenirken hata:', error);
      }
    }
  );

  const notificationListener = Notifications.addNotificationReceivedListener(
    async (notification) => {
      const { prayerName } = notification.request.content.data || {};
      console.log('📬 Bildirim alındı:', prayerName);
      await playAdhan();
      
      // ✅ Bildirimi in-app listeye ekle
      const { title, body } = notification.request.content;
      const data = notification.request.content.data;
      
      try {
        await addNotification({
          title: title || 'Bildirim',
          body: body || '',
          type: data?.type || 'prayer',
        });
      } catch (error) {
        console.error('Bildirim listeye eklenirken hata:', error);
      }
    }
  );

  return { notificationResponseListener, notificationListener };
};

/**
 * Listener'ları kaldır
 */
export const removeNotificationListeners = (listeners) => {
  listeners?.notificationResponseListener?.remove();
  listeners?.notificationListener?.remove();
};