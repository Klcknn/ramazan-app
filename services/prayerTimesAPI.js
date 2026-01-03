import axios from 'axios';

const ALADHAN_API = 'https://api.aladhan.com/v1';

/**
 * Koordinatlara göre namaz vakitlerini getirir
 * @param {number} latitude - Enlem
 * @param {number} longitude - Boylam
 * @param {Date} date - Tarih (opsiyonel)
 */
export const getPrayerTimes = async (latitude, longitude, date = new Date()) => {
  try {
    // Tarihi formatla (DD-MM-YYYY)
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    // API isteği
    const response = await axios.get(`${ALADHAN_API}/timings/${dateString}`, {
      params: {
        latitude: latitude,
        longitude: longitude,
        method: 13, // Turkey Diyanet method
      }
    });

    if (response.data.code === 200) {
      const timings = response.data.data.timings;
      
      // Türkçe isimlere çevir
      return {
        Fajr: timings.Fajr,      // İmsak
        Sunrise: timings.Sunrise, // Güneş
        Dhuhr: timings.Dhuhr,    // Öğle
        Asr: timings.Asr,        // İkindi
        Maghrib: timings.Maghrib,// Akşam
        Isha: timings.Isha,      // Yatsı
        date: response.data.data.date.readable,
        hijriDate: response.data.data.date.hijri.date,
      };
    } else {
      throw new Error('API yanıt hatası');
    }
  } catch (error) {
    console.error('❌ Namaz vakitleri API hatası:', error);
    throw error;
  }
};

/**
 * Bir sonraki namaz vaktini hesaplar
 * @param {object} prayerTimes - Namaz vakitleri
 */
export const getNextPrayer = (prayerTimes) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: 'İmsak', time: prayerTimes.Fajr, key: 'Fajr' },
    { name: 'Güneş', time: prayerTimes.Sunrise, key: 'Sunrise' },
    { name: 'Öğle', time: prayerTimes.Dhuhr, key: 'Dhuhr' },
    { name: 'İkindi', time: prayerTimes.Asr, key: 'Asr' },
    { name: 'Akşam', time: prayerTimes.Maghrib, key: 'Maghrib' },
    { name: 'Yatsı', time: prayerTimes.Isha, key: 'Isha' },
  ];

  // Her vakti dakikaya çevir
  const prayersInMinutes = prayers.map(prayer => {
    const [hours, minutes] = prayer.time.split(':');
    return {
      ...prayer,
      totalMinutes: parseInt(hours) * 60 + parseInt(minutes)
    };
  });

  // Bir sonraki vakti bul
  for (let prayer of prayersInMinutes) {
    if (prayer.totalMinutes > currentTime) {
      const remainingMinutes = prayer.totalMinutes - currentTime;
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      
      return {
        name: prayer.name,
        time: prayer.time,
        remaining: { hours, minutes }
      };
    }
  }

  // Eğer hiçbir vakit kalmadıysa, yarının ilk vakti (İmsak)
  const tomorrowFajr = prayersInMinutes[0];
  const remainingMinutes = (24 * 60) - currentTime + tomorrowFajr.totalMinutes;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  return {
    name: 'İmsak (Yarın)',
    time: tomorrowFajr.time,
    remaining: { hours, minutes }
  };
};