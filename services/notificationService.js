import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

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
 * Bildirim izni al
 */
export const requestNotificationPermission = async () => {
  try {
    if (!Device.isDevice) {
      Alert.alert('Uyarı', 'Bildirimler sadece gerçek cihazlarda çalışır');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Uyarı', 'Bildirim izni verilmedi. Namaz vakti bildirimleri almak için lütfen ayarlardan izin verin.');
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

    // Ses dosyasını yükle ve çal
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/adhan.mp3'),
      { shouldPlay: true }
    );

    console.log('🔊 Ezan sesi çalınıyor...');

    // Ses bittiğinde temizle
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
 */
const scheduleNotificationForPrayer = async (prayerName, prayerTime, icon) => {
  try {
    const [hours, minutes] = prayerTime.split(':').map(Number);

    // ✅ DÜZELTİLDİ: type: 'calendar' ekledik
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${icon} ${prayerName} Vakti Girdi`,
        body: `${prayerName} namazı vaktine girmiştir. Haydi namaza! 🕌`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        data: { prayerName, prayerTime },
      },
      trigger: {
        type: 'calendar', // ← EKLENEN SATIR
        repeats: true,
        hour: hours,
        minute: minutes,
      },
    });

    console.log(`✅ ${prayerName} bildirimi planlandı: Her gün ${hours}:${minutes.toString().padStart(2, '0')}`);
    return notificationId;
  } catch (error) {
    console.error(`❌ ${prayerName} bildirim planlama hatası:`, error);
    return null;
  }
};

/**
 * Tüm namaz vakitleri için bildirimleri planla
 */
export const schedulePrayerNotifications = async (prayerTimes) => {
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

    await Notifications.cancelAllScheduledNotificationsAsync();

    const prayers = [
      { name: 'İmsak', time: prayerTimes.Fajr, icon: '🌟' },
      { name: 'Güneş', time: prayerTimes.Sunrise, icon: '🌄' },
      { name: 'Öğle', time: prayerTimes.Dhuhr, icon: '☀️' },
      { name: 'İkindi', time: prayerTimes.Asr, icon: '🌤' },
      { name: 'Akşam', time: prayerTimes.Maghrib, icon: '🌅' },
      { name: 'Yatsı', time: prayerTimes.Isha, icon: '🌙' },
    ];

    const scheduledIds = [];

    for (const prayer of prayers) {
      const notificationId = await scheduleNotificationForPrayer(
        prayer.name,
        prayer.time,
        prayer.icon
      );
      if (notificationId) {
        scheduledIds.push({ prayer: prayer.name, id: notificationId });
      }
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
      JSON.stringify(scheduledIds)
    );

    console.log('✅ Tüm namaz vakitleri için bildirimler planlandı');
    return true;
  } catch (error) {
    console.error('❌ Bildirim planlama hatası:', error);
    return false;
  }
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
        // 1 GÜN ÖNCE HATIRLATMA (11:00)
        const reminderDate = new Date(dayDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(11, 0, 0, 0);

        if (reminderDate > today) {
          // ✅ DÜZELTİLDİ: type: 'date' ekledik
          const reminderId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${day.icon} Yarın ${day.name}`,
              body: `Yarın ${day.name} mübarek günüdür. Hazırlıklarınızı yapabilirsiniz. 🤲`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { 
                type: 'reminder',
                dayName: day.name,
                dayDate: day.formattedDate,
              },
            },
            trigger: {
              type: 'date', // ← EKLENEN SATIR
              date: reminderDate,
            },
          });

          if (reminderId) {
            scheduledIds.push({ 
              day: day.name, 
              id: reminderId, 
              type: 'reminder' 
            });
            console.log(`✅ ${day.name} hatırlatması planlandı: ${reminderDate.toLocaleString('tr-TR')}`);
          }
        }

        // GÜNÜN KENDİSİ İÇİN BİLDİRİM (08:00)
        const mainDate = new Date(dayDate);
        mainDate.setHours(8, 0, 0, 0);

        if (mainDate > today) {
          // ✅ DÜZELTİLDİ: type: 'date' ekledik
          const mainId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${day.icon} ${day.name} Mübarek!`,
              body: `Bugün ${day.name}. ${day.description}`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: { 
                type: 'main',
                dayName: day.name,
                dayDate: day.formattedDate,
              },
            },
            trigger: {
              type: 'date', // ← EKLENEN SATIR
              date: mainDate,
            },
          });

          if (mainId) {
            scheduledIds.push({ 
              day: day.name, 
              id: mainId, 
              type: 'main' 
            });
            console.log(`✅ ${day.name} ana bildirimi planlandı: ${mainDate.toLocaleString('tr-TR')}`);
          }
        }
      }
    }

    await AsyncStorage.setItem(
      'important_days_notifications',
      JSON.stringify(scheduledIds)
    );

    console.log(`✅ Toplam ${scheduledIds.length} önemli gün bildirimi planlandı`);
    return true;
  } catch (error) {
    console.error('❌ Önemli gün bildirimi planlama hatası:', error);
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
 * Bildirim ayarlarını kaydet
 */
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_ENABLED,
      settings.enabled.toString()
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.SOUND_ENABLED,
      settings.sound.toString()
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.VIBRATION_ENABLED,
      settings.vibration.toString()
    );
    console.log('✅ Bildirim ayarları kaydedildi:', settings);
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
      const { prayerName } = response.notification.request.content.data;
      console.log('🔔 Bildirime tıklandı:', prayerName);
      
      await playAdhan();
    }
  );

  const notificationListener = Notifications.addNotificationReceivedListener(
    async (notification) => {
      const { prayerName } = notification.request.content.data;
      console.log('📬 Bildirim alındı:', prayerName);
      
      await playAdhan();
    }
  );

  return {
    notificationResponseListener,
    notificationListener,
  };
};

/**
 * Listener'ları kaldır
 */
export const removeNotificationListeners = (listeners) => {
  listeners.notificationResponseListener?.remove();
  listeners.notificationListener?.remove();
};