import AsyncStorage from '@react-native-async-storage/async-storage';
import { renewPrayerNotifications, schedulePrayerNotifications } from './notificationService';

const RENEWAL_CHECK_KEY = 'last_notification_renewal';
const RENEWAL_INTERVAL_DAYS = 14; // 14 günde bir yenile

/**
 * Bildirimlerin yenilenmesi gerekip gerekmediğini kontrol et
 */
export const checkAndRenewNotifications = async (prayerTimes) => {
  try {
    const lastRenewal = await AsyncStorage.getItem(RENEWAL_CHECK_KEY);
    const now = new Date().getTime();

    if (!lastRenewal) {
      // İlk kez çalışıyor
      console.log('📅 İlk bildirim planlaması yapılıyor...');
      const success = await schedulePrayerNotifications(prayerTimes);
      
      if (success) {
        await AsyncStorage.setItem(RENEWAL_CHECK_KEY, now.toString());
      }
      
      return success;
    }

    const daysSinceRenewal = (now - parseInt(lastRenewal)) / (1000 * 60 * 60 * 24);

    if (daysSinceRenewal >= RENEWAL_INTERVAL_DAYS) {
      console.log(`🔄 ${Math.floor(daysSinceRenewal)} gün geçti, bildirimler yenileniyor...`);
      const success = await renewPrayerNotifications(prayerTimes);
      
      if (success) {
        await AsyncStorage.setItem(RENEWAL_CHECK_KEY, now.toString());
      }
      
      return success;
    } else {
      const remainingDays = Math.ceil(RENEWAL_INTERVAL_DAYS - daysSinceRenewal);
      console.log(`✅ Bildirimler güncel (${remainingDays} gün sonra yenilenecek)`);
      return true;
    }
  } catch (error) {
    console.error('❌ Yenileme kontrolü hatası:', error);
    return false;
  }
};

/**
 * Bildirimleri manuel yenile
 */
export const forceRenewNotifications = async (prayerTimes) => {
  try {
    console.log('🔄 Manuel yenileme başlatıldı...');
    const success = await renewPrayerNotifications(prayerTimes);
    
    if (success) {
      const now = new Date().getTime();
      await AsyncStorage.setItem(RENEWAL_CHECK_KEY, now.toString());
      console.log('✅ Bildirimler başarıyla yenilendi');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Manuel yenileme hatası:', error);
    return false;
  }
};

/**
 * Son yenileme zamanını öğren
 */
export const getLastRenewalInfo = async () => {
  try {
    const lastRenewal = await AsyncStorage.getItem(RENEWAL_CHECK_KEY);
    
    if (!lastRenewal) {
      return {
        lastRenewal: null,
        daysSince: 0,
        daysUntilNext: RENEWAL_INTERVAL_DAYS,
        message: 'Henüz bildirim planlanmamış'
      };
    }

    const now = new Date().getTime();
    const renewalTime = parseInt(lastRenewal);
    const daysSince = Math.floor((now - renewalTime) / (1000 * 60 * 60 * 24));
    const daysUntilNext = Math.max(0, RENEWAL_INTERVAL_DAYS - daysSince);

    return {
      lastRenewal: new Date(renewalTime),
      daysSince,
      daysUntilNext,
      message: daysUntilNext === 0 
        ? 'Bildirimler yenilenmeyi bekliyor' 
        : `${daysUntilNext} gün sonra yenilenecek`
    };
  } catch (error) {
    console.error('❌ Bilgi alma hatası:', error);
    return null;
  }
};

/**
 * Uygulama başlangıcında çağrılacak
 */
export const initializeNotifications = async (prayerTimes) => {
  console.log('🚀 Bildirim sistemi başlatılıyor...');
  return await checkAndRenewNotifications(prayerTimes);
};

export default {
  checkAndRenewNotifications,
  forceRenewNotifications,
  getLastRenewalInfo,
  initializeNotifications,
};