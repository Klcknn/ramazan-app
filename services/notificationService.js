import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
// ✅ Bildirim helper'ı import et
import { addNotification } from './Notificationrenewalhelper';

// ✅ Bildirim davranışını ayarla - Ses ve görünürlük için maksimum öncelik
Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: notification?.request?.content?.data?.shouldPlaySound !== false,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

const STORAGE_KEYS = {
  NOTIFICATION_ENABLED: 'notification_enabled',
  SOUND_ENABLED: 'sound_enabled',
  VIBRATION_ENABLED: 'vibration_enabled',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
};
const MAX_CONCURRENT_ALARMS = 500;
const ALARM_BUFFER = 20;
let prayerSchedulingInFlight = null;

const PRAYER_SCHEDULES = [
  { name: 'İmsak', key: 'Fajr', icon: '🌟' },
  { name: 'Öğle', key: 'Dhuhr', icon: '☀️' },
  { name: 'İkindi', key: 'Asr', icon: '🌤' },
  { name: 'Akşam', key: 'Maghrib', icon: '🌅' },
  { name: 'Yatsı', key: 'Isha', icon: '🌙' },
];

const IMPORTANT_DAYS_TEMPLATE = [
  { name: 'Regaip Kandili', icon: '🌙', hijriMonth: 7, hijriDay: 1, description: 'Mübarek kandil gecesi.' },
  { name: 'Miraç Kandili', icon: '✨', hijriMonth: 7, hijriDay: 26, description: 'Mübarek kandil gecesi.' },
  { name: 'Berat Kandili', icon: '🌟', hijriMonth: 8, hijriDay: 14, description: 'Mübarek kandil gecesi.' },
  { name: 'Ramazan Başlangıcı', icon: '🌙', hijriMonth: 9, hijriDay: 1, description: 'Ramazan ayı başladı.' },
  { name: 'Kadir Gecesi', icon: '⭐', hijriMonth: 9, hijriDay: 26, description: 'Bin aydan hayırlı gece.' },
  { name: 'Ramazan Bayramı', icon: '🎉', hijriMonth: 10, hijriDay: 1, description: 'Ramazan Bayramınız mübarek olsun.' },
  { name: 'Arefe Günü', icon: '🕌', hijriMonth: 12, hijriDay: 9, description: 'Arefe gününüz mübarek olsun.' },
  { name: 'Kurban Bayramı', icon: '🐑', hijriMonth: 12, hijriDay: 10, description: 'Kurban Bayramınız mübarek olsun.' },
  { name: 'Hicri Yılbaşı', icon: '🌙', hijriMonth: 1, hijriDay: 1, description: 'Hicri yılbaşı mübarek olsun.' },
  { name: 'Aşure Günü', icon: '🍲', hijriMonth: 1, hijriDay: 10, description: 'Aşure gününüz mübarek olsun.' },
  { name: 'Mevlid Kandili', icon: '💫', hijriMonth: 3, hijriDay: 11, description: 'Mevlid Kandiliniz mübarek olsun.' },
];

const formatDateKey = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parsePrayerTime = (time) => {
  if (!time || typeof time !== 'string') return null;
  const clean = time.substring(0, 5);
  const [hourStr, minuteStr] = clean.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
};

const getNotificationType = (item) => item?.content?.data?.type;
const getChannelId = (item) => item?.content?.channelId || item?.trigger?.channelId;

const isPrayerNotification = (item) => {
  const type = getNotificationType(item);
  const channelId = getChannelId(item);
  const title = item?.content?.title || '';
  return (
    type === 'prayer' ||
    (typeof channelId === 'string' && channelId.startsWith('prayer-times')) ||
    (typeof title === 'string' && title.includes('Vakti Girdi'))
  );
};

const isImportantDayNotification = (item) => {
  const type = getNotificationType(item);
  const channelId = getChannelId(item);
  return ['important_day', 'reminder', 'main'].includes(type) || channelId === 'important-days';
};

const getPrayerChannelId = (soundEnabled, vibrationEnabled) => {
  if (soundEnabled && vibrationEnabled) return 'prayer-times';
  if (!soundEnabled && vibrationEnabled) return 'prayer-times-silent';
  if (soundEnabled && !vibrationEnabled) return 'prayer-times-no-vibration';
  return 'prayer-times-silent-no-vibration';
};

const cancelScheduledByPredicate = async (predicate) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  let cancelledCount = 0;

  for (const item of scheduled) {
    if (!predicate(item)) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
      cancelledCount += 1;
    } catch (error) {
      console.warn('Planli bildirim iptal edilemedi:', error);
    }
  }

  return cancelledCount;
};

const getRemainingAlarmSlots = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return Math.max(0, MAX_CONCURRENT_ALARMS - ALARM_BUFFER - scheduled.length);
};

export const getImportantDaysForYear = async (year = new Date().getFullYear()) => {
  try {
    const monthRequests = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return fetch(
        `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=Ankara&country=Turkey&method=13`
      ).then((res) => res.json());
    });

    const monthResults = await Promise.all(monthRequests);
    const allDays = monthResults.flatMap((result) => (Array.isArray(result?.data) ? result.data : []));
    const mappedDays = [];

    IMPORTANT_DAYS_TEMPLATE.forEach((template) => {
      const matchedDay = allDays.find(
        (item) =>
          Number(item?.date?.hijri?.month?.number) === template.hijriMonth &&
          Number(item?.date?.hijri?.day) === template.hijriDay
      );

      if (!matchedDay) return;

      const gDay = Number(matchedDay?.date?.gregorian?.day);
      const gMonth = Number(matchedDay?.date?.gregorian?.month?.number) - 1;
      const gYear = Number(matchedDay?.date?.gregorian?.year) || year;
      const gregorianDate = new Date(gYear, gMonth, gDay);

      mappedDays.push({
        ...template,
        gregorianDate: gregorianDate.toISOString(),
      });
    });

    return mappedDays.sort((a, b) => new Date(a.gregorianDate) - new Date(b.gregorianDate));
  } catch (error) {
    console.error('❌ Önemli günler alınamadı:', error);
    return [];
  }
};

export const syncInAppNotifications = async ({ prayerTimes, importantDays = [] }) => {
  try {
    if (!prayerTimes) return;

    const now = new Date();
    const todayKey = formatDateKey(now);
    const stored = await AsyncStorage.getItem('app_notifications');
    let notifications = stored ? JSON.parse(stored) : [];

    const existingTitleSet = new Set(
      notifications
        .filter((item) => formatDateKey(item.timestamp) === todayKey)
        .map((item) => `${item.type}|${item.title}`)
    );

    const toInsert = [];

    PRAYER_SCHEDULES.forEach((prayer) => {
      const prayerValue = prayerTimes[prayer.key];
      const parsed = parsePrayerTime(prayerValue);
      if (!parsed) return;

      const prayerDate = new Date();
      prayerDate.setHours(parsed.hour, parsed.minute, 0, 0);

      if (prayerDate <= now) {
        const title = `${prayer.icon} ${prayer.name} Vakti Girdi`;
        const dedupeKey = `prayer|${title}`;
        if (!existingTitleSet.has(dedupeKey)) {
          toInsert.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title,
            body: `${prayer.name} namazı vaktine girmiştir. Haydi namaza! 🕌`,
            type: 'prayer',
            timestamp: prayerDate.toISOString(),
            read: false,
          });
          existingTitleSet.add(dedupeKey);
        }
      }
    });

    importantDays.forEach((day) => {
      const dayDate = new Date(day.gregorianDate);
      const dayKey = formatDateKey(dayDate);
      const reminderDate = new Date(dayDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(11, 0, 0, 0);

      const mainDate = new Date(dayDate);
      mainDate.setHours(8, 0, 0, 0);

      if (dayKey === todayKey && now >= mainDate) {
        const title = `${day.icon} ${day.name} Mübarek!`;
        const dedupeKey = `important_day|${title}`;
        if (!existingTitleSet.has(dedupeKey)) {
          toInsert.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title,
            body: `Bugün ${day.name}. ${day.description}`,
            type: 'important_day',
            timestamp: mainDate.toISOString(),
            read: false,
          });
          existingTitleSet.add(dedupeKey);
        }
      }

      if (formatDateKey(reminderDate) === todayKey && now >= reminderDate) {
        const title = `${day.icon} Yarın ${day.name}`;
        const dedupeKey = `reminder|${title}`;
        if (!existingTitleSet.has(dedupeKey)) {
          toInsert.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title,
            body: `Yarın ${day.name} mübarek günüdür. Hazırlıklarınızı yapabilirsiniz. 🤲`,
            type: 'reminder',
            timestamp: reminderDate.toISOString(),
            read: false,
          });
          existingTitleSet.add(dedupeKey);
        }
      }
    });

    if (toInsert.length > 0) {
      notifications = [...toInsert, ...notifications].slice(0, 15);
      await AsyncStorage.setItem('app_notifications', JSON.stringify(notifications));
      console.log(`✅ In-app bildirim senkronlandı: +${toInsert.length}`);
    }
  } catch (error) {
    console.error('❌ In-app bildirim senkron hatası:', error);
  }
};

/**
 * ✅ Android bildirim kanalı oluştur - Özel ses dosyası için
 */
const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // ✅ NAMAZ VAKİTLERİ KANALI - Maksimum öncelik
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Namaz Vakitleri - Ezan Sesi',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500], // Daha belirgin titreşim
      sound: 'adhan.mp3', // ✅ Özel ses dosyası - assets/sounds/adhan.mp3
      enableLights: true,
      lightColor: '#00FF00',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // ✅ Rahatsız Etmeyin modunu geç
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('prayer-times-silent', {
      name: 'Namaz Vakitleri - Sessiz',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      sound: null,
      enableLights: true,
      lightColor: '#00FF00',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('prayer-times-no-vibration', {
      name: 'Namaz Vakitleri - Sessiz Titreşim',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0],
      sound: 'adhan.mp3',
      enableLights: true,
      lightColor: '#00FF00',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('prayer-times-silent-no-vibration', {
      name: 'Namaz Vakitleri - Tam Sessiz',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0],
      sound: null,
      enableLights: true,
      lightColor: '#00FF00',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
    });
    // Önemli günler kanalı
    await Notifications.setNotificationChannelAsync('important-days', {
      name: 'Önemli Günler',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#FFD700',
    });

    console.log('✅ Android bildirim kanalları oluşturuldu (Ezan sesi dahil)');
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

    // ✅ Önce kanalları oluştur
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
        'Namaz vakti bildirimleri ve ezan sesi için lütfen ayarlardan bildirim izni verin.',
        [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Ayarlara Git', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }

    // ✅ Android için ses izinlerini kontrol et
    if (Platform.OS === 'android') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // ✅ Arka planda aktif kal
        shouldDuckAndroid: true,
      });
    }

    console.log('✅ Bildirim ve ses izinleri verildi');
    return true;
  } catch (error) {
    console.error('❌ Bildirim izni hatası:', error);
    return false;
  }
};

/**
 * ✅ Ezan sesi çal - Uygulama ön planda olduğunda
 */
export const playAdhan = async () => {
  try {
    const soundEnabled = await AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    if (soundEnabled === 'false') {
      console.log('🔇 Ses kapalı, ezan çalınmayacak');
      return;
    }

    // ✅ Ses modunu yapılandır
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true, // iOS'ta sessiz modda bile çal
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/adhan.mp3'),
      { 
        shouldPlay: true,
        volume: 1.0,
        isMuted: false,
      }
    );

    console.log('🔊 Ezan sesi çalınıyor...');

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        console.log('✅ Ezan sesi tamamlandı');
      }
    });

    return sound;
  } catch (error) {
    console.error('❌ Ezan sesi hatası:', error);
    Alert.alert(
      'Ses Hatası',
      'Ezan sesi çalınamadı. Lütfen ses dosyasının yüklü olduğundan emin olun.'
    );
  }
};

/**
 * ✅ Tek bir namaz vakti için bildirim planla
 * Android: Özel ses kanalı ile bildirim
 * iOS: Sistem bildirimi
 */
const scheduleNotificationForPrayer = async (
  prayerName,
  prayerTime,
  icon,
  slotState,
  soundEnabled,
  vibrationEnabled
) => {
  try {
    const parsedTime = parsePrayerTime(prayerTime);
    if (!parsedTime) {
      return [];
    }
    const { hour: hours, minute: minutes } = parsedTime;
    const notificationIds = [];

    if (Platform.OS === 'android') {
      const now = new Date();

      for (let i = 0; i < 30; i++) {
        if (slotState && slotState.remaining <= 0) {
          break;
        }

        const notificationDate = new Date();
        notificationDate.setDate(now.getDate() + i);
        notificationDate.setHours(hours);
        notificationDate.setMinutes(minutes);
        notificationDate.setSeconds(0);
        notificationDate.setMilliseconds(0);

        if (notificationDate > now) {
          const channelId = getPrayerChannelId(soundEnabled, vibrationEnabled);
          const content = {
            title: `${icon} ${prayerName} Vakti Girdi`,
            body: `${prayerName} namazi vaktine girmistir. Haydi namaza.`,
            sound: soundEnabled ? 'adhan.mp3' : null,
            priority: Notifications.AndroidNotificationPriority.MAX,
            channelId,
            vibrate: vibrationEnabled ? [0, 500, 250, 500] : [0],
            sticky: false,
            autoDismiss: true,
            data: {
              prayerName,
              prayerTime,
              type: 'prayer',
              shouldPlaySound: soundEnabled,
              eventDate: formatDateKey(notificationDate),
            },
          };

          const notificationId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: 'date',
              date: notificationDate,
              channelId,
            },
          });

          notificationIds.push(notificationId);
          if (slotState) {
            slotState.remaining -= 1;
          }
        }
      }

      console.log(`${prayerName} - ${notificationIds.length} bildirim planlandi`);
    } else {
      const content = {
        title: `${icon} ${prayerName} Vakti Girdi`,
        body: `${prayerName} namazi vaktine girmistir. Haydi namaza.`,
        sound: soundEnabled ? 'adhan.mp3' : null,
        data: {
          prayerName,
          prayerTime,
          type: 'prayer',
          shouldPlaySound: soundEnabled,
        },
      };

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
      console.log(`${prayerName} - Tekrarlayan bildirim planlandi (iOS)`);
    }

    return notificationIds;
  } catch (error) {
    console.error(`${prayerName} bildirim planlama hatasi:`, error);
    return [];
  }
};

/**
 * Tüm namaz vakitleri için bildirimleri planla
 */
export const schedulePrayerNotifications = async (prayerTimes) => {
  if (prayerSchedulingInFlight) {
    console.log('⏳ Namaz bildirim planlama zaten devam ediyor, mevcut işlem bekleniyor');
    return prayerSchedulingInFlight;
  }

  prayerSchedulingInFlight = (async () => {
    try {
      console.log('🔔 Bildirim planlama başlıyor...');

      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.log('❌ Bildirim izni yok');
        return false;
      }

      const notificationEnabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED);
      if (notificationEnabled === 'false') {
        console.log('Bildirimler kapali');
        return false;
      }
      
      const soundEnabled = (await AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED)) !== 'false';
      const vibrationEnabled = (await AsyncStorage.getItem(STORAGE_KEYS.VIBRATION_ENABLED)) !== 'false';

      const existingScheduled = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      const existingItems = existingScheduled ? JSON.parse(existingScheduled) : [];
      for (const item of existingItems) {
        for (const id of item.ids || []) {
          try {
            await Notifications.cancelScheduledNotificationAsync(id);
          } catch (cancelError) {
            console.warn('Eski namaz bildirimi iptal edilemedi:', cancelError);
          }
        }
      }
      console.log('Eski namaz bildirimleri temizlendi');
      const stalePrayerCount = await cancelScheduledByPredicate(isPrayerNotification);
      if (stalePrayerCount > 0) {
        console.log(`Ek olarak ${stalePrayerCount} eski namaz alarmi temizlendi`);
      }

      const slotState = { remaining: await getRemainingAlarmSlots() };
      if (slotState.remaining <= 0) {
        console.warn('Alarm limiti dolu, namaz bildirimleri planlanamadi');
        return false;
      }

      const prayers = PRAYER_SCHEDULES.map((prayer) => ({
        name: prayer.name,
        time: prayerTimes[prayer.key],
        icon: prayer.icon,
      }));

      const allScheduledIds = [];

      for (const prayer of prayers) {
        if (!prayer.time) {
          console.warn(`⚠️ ${prayer.name} vakti bulunamadı`);
          continue;
        }

        const notificationIds = await scheduleNotificationForPrayer(
          prayer.name,
          prayer.time,
          prayer.icon,
          slotState,
          soundEnabled,
          vibrationEnabled
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
      console.log(`📊 Toplam ${scheduled.length} bildirim planlandı (Sistem)`);

      const totalByPrayer = allScheduledIds.reduce((sum, p) => sum + p.count, 0);
      console.log(`✅ ${allScheduledIds.length} namaz vakti için ${totalByPrayer} bildirim planlandı`);
      
      return true;
    } catch (error) {
      console.error('❌ Bildirim planlama hatası:', error);
      return false;
    } finally {
      prayerSchedulingInFlight = null;
    }
  })();

  return prayerSchedulingInFlight;
};

/**
 * Bildirimleri yeniden planla
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

    const importantDaysEnabled = await AsyncStorage.getItem('important_days_notifications_enabled');
    if (importantDaysEnabled === 'false') {
      console.log('Onemli gunler ayardan kapali');
      return false;
    }
    const existingImportant = await AsyncStorage.getItem('important_days_notifications');
    const existingItems = existingImportant ? JSON.parse(existingImportant) : [];
    for (const item of existingItems) {
      if (!item?.id) continue;
      try {
        await Notifications.cancelScheduledNotificationAsync(item.id);
      } catch (cancelError) {
        console.warn('Onemli gun bildirimi iptal edilemedi:', cancelError);
      }
    }
    const staleImportantCount = await cancelScheduledByPredicate(isImportantDayNotification);
    if (staleImportantCount > 0) {
      console.log(`Ek olarak ${staleImportantCount} eski onemli gun alarmi temizlendi`);
    }

    let remainingSlots = await getRemainingAlarmSlots();
    if (remainingSlots <= 0) {
      console.warn('Alarm limiti dolu, onemli gun bildirimleri planlanamadi');
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
          if (remainingSlots <= 0) {
            break;
          }
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

          let reminderId = null;
          try {
            reminderId = await Notifications.scheduleNotificationAsync({
              content,
              trigger: {
                type: 'date',
                date: reminderDate,
                ...(Platform.OS === 'android' && { channelId: 'important-days' }),
              },
            });
            remainingSlots -= 1;
          } catch (scheduleError) {
            console.error('Onemli gun hatirlatma planlama hatasi:', scheduleError);
            if (String(scheduleError).includes('Maximum limit')) {
              break;
            }
          }

          if (reminderId) {
            scheduledIds.push({ day: day.name, id: reminderId, type: 'reminder' });
            console.log(`✅ ${day.name} hatırlatması planlandı`);
          }
        }

        // GÜNÜN KENDİSİ
        const mainDate = new Date(dayDate);
        mainDate.setHours(8, 0, 0, 0);

        if (mainDate > today) {
          if (remainingSlots <= 0) {
            break;
          }
          const content = {
            title: `${day.icon} ${day.name} Mübarek!`,
            body: `Bugün ${day.name}. ${day.description}`,
            sound: true,
            data: { type: 'important_day', dayName: day.name },
          };

          if (Platform.OS === 'android') {
            content.priority = Notifications.AndroidNotificationPriority.MAX;
            content.channelId = 'important-days';
          }

          let mainId = null;
          try {
            mainId = await Notifications.scheduleNotificationAsync({
              content,
              trigger: {
                type: 'date',
                date: mainDate,
                ...(Platform.OS === 'android' && { channelId: 'important-days' }),
              },
            });
            remainingSlots -= 1;
          } catch (scheduleError) {
            console.error('Onemli gun ana bildirim planlama hatasi:', scheduleError);
            if (String(scheduleError).includes('Maximum limit')) {
              break;
            }
          }

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
export const scheduleImportantDayNotificationsForYear = async (
  year = new Date().getFullYear()
) => {
  const importantDays = await getImportantDaysForYear(year);
  if (!importantDays.length) {
    return false;
  }
  return scheduleImportantDayNotifications(importantDays);
};
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
 * Namaz vakti bildirimlerini iptal et
 */
export const cancelPrayerNotifications = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    if (stored) {
      const notifications = JSON.parse(stored);
      for (const item of notifications) {
        for (const id of item.ids || []) {
          try {
            await Notifications.cancelScheduledNotificationAsync(id);
          } catch (cancelError) {
            console.warn('Namaz bildirimi iptal edilemedi:', cancelError);
          }
        }
      }
    }

    const stalePrayerCount = await cancelScheduledByPredicate(isPrayerNotification);
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    console.log(`✅ Namaz bildirimleri iptal edildi (${stalePrayerCount} sistem alarmı temizlendi)`);
  } catch (error) {
    console.error('❌ Namaz bildirimi iptal hatası:', error);
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
 * ✅ Bildirim listener'ı kur - Ön planda ezan çalmak için
 */
export const setupNotificationListeners = () => {
  // Bildirime tıklandığında
  const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const { prayerName, type, shouldPlaySound } = response.notification.request.content.data || {};
      
      console.log('🔔 Bildirime tıklandı:', prayerName);
      
      // ✅ Namaz vakti bildirimi ise ezan çal (uygulama ön plandaysa)
      if (type === 'prayer' && shouldPlaySound) {
        await playAdhan();
      }
      
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

  // Bildirim uygulama ön plandayken alındığında
  const notificationListener = Notifications.addNotificationReceivedListener(
    async (notification) => {
      const { prayerName, type, shouldPlaySound } = notification.request.content.data || {};
      
      console.log('📬 Bildirim alındı (ön plan):', prayerName);
      
      // ✅ Uygulama ön plandaysa ezan çal
      if (type === 'prayer' && shouldPlaySound) {
        await playAdhan();
      }
      
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

  console.log('✅ Bildirim listener\'ları kuruldu');
  return { notificationResponseListener, notificationListener };
};

/**
 * Listener'ları kaldır
 */
export const removeNotificationListeners = (listeners) => {
  listeners?.notificationResponseListener?.remove();
  listeners?.notificationListener?.remove();
  console.log('🔴 Bildirim listener\'ları kaldırıldı');
};










