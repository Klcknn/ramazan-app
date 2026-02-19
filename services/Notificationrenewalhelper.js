import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_NOTIFICATIONS = 15;

const getDateKey = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDuplicateForSameDay = (existing, incoming) => {
  if (!existing || !incoming) return false;
  if (existing.type !== incoming.type) return false;
  if (existing.title !== incoming.title) return false;

  const existingDay = getDateKey(existing.timestamp);
  const incomingDay = getDateKey(incoming.timestamp);
  return existingDay === incomingDay;
};

/**
 * Yeni bildirim ekle
 * @param {Object} notification - Bildirim objesi
 * @param {string} notification.title - Bildirim başlığı
 * @param {string} notification.body - Bildirim içeriği
 * @param {string} notification.type - Bildirim tipi (prayer, dua, hadis, important_day, reminder)
 * @param {string} notification.timestamp - Opsiyonel ISO tarih
 */
export const addNotification = async (notification) => {
  try {
    // Mevcut bildirimleri al
    const stored = await AsyncStorage.getItem('app_notifications');
    let notifications = stored ? JSON.parse(stored) : [];

    // Yeni bildirim ekle
    const timestamp = notification.timestamp || new Date().toISOString();
    const newNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: notification.title,
      body: notification.body,
      type: notification.type || 'default',
      timestamp,
      read: false,
    };

    const exists = notifications.some((item) => isDuplicateForSameDay(item, newNotification));
    if (exists) {
      return true;
    }

    // Başa ekle (en yeni önce)
    notifications.unshift(newNotification);

    // Max 15 bildirim tut
    if (notifications.length > MAX_NOTIFICATIONS) {
      notifications = notifications.slice(0, MAX_NOTIFICATIONS);
    }

    // Kaydet
    await AsyncStorage.setItem('app_notifications', JSON.stringify(notifications));
    
    console.log('✅ Yeni bildirim eklendi:', newNotification.title);
    return true;
  } catch (error) {
    console.error('❌ Bildirim eklenirken hata:', error);
    return false;
  }
};

/**
 * Okunmamış bildirim sayısını al
 */
export const getUnreadNotificationCount = async () => {
  try {
    const stored = await AsyncStorage.getItem('app_notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      return notifications.filter(n => !n.read).length;
    }
    return 0;
  } catch (error) {
    console.error('❌ Bildirim sayısı alınırken hata:', error);
    return 0;
  }
};

/**
 * Tüm bildirimleri okundu olarak işaretle
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const stored = await AsyncStorage.getItem('app_notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem('app_notifications', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Bildirimler güncellenirken hata:', error);
    return false;
  }
};

/**
 * Tüm bildirimleri sil
 */
export const clearAllNotifications = async () => {
  try {
    await AsyncStorage.setItem('app_notifications', JSON.stringify([]));
    console.log('✅ Tüm bildirimler silindi');
    return true;
  } catch (error) {
    console.error('❌ Bildirimler silinirken hata:', error);
    return false;
  }
};

/**
 * Namaz vakti bildirimi ekle
 */
export const addPrayerNotification = async (prayerName, prayerTime) => {
  return await addNotification({
    title: `${prayerName} Vakti`,
    body: `${prayerName} vakti girdi. Saat: ${prayerTime}`,
    type: 'prayer',
  });
};

/**
 * Dini gün hatırlatması ekle
 */
export const addImportantDayNotification = async (dayName, date) => {
  return await addNotification({
    title: `${dayName}`,
    body: `Yarın ${dayName}. Hayırlı kandiller!`,
    type: 'important_day',
  });
};

/**
 * Test bildirimi ekle (geliştirme amaçlı)
 */
export const addTestNotification = async () => {
  return await addNotification({
    title: 'Test Bildirimi',
    body: 'Bu bir test bildirimidir',
    type: 'reminder',
  });
};
