import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Gunluk icerik servisi
 * Firebase'den gunun duasi ve hadisini ceker
 */

// Cache keys
const DAILY_DUA_KEY = '@daily_dua';
const DAILY_HADIS_KEY = '@daily_hadis';
const LAST_FETCH_AT_KEY = '@last_fetch_at';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Bugunun tarihini YYYY-MM-DD formatinda doner (lokal saat)
 */
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Metni deterministic bir sayiya cevir
 */
const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Icerik listesinden gunluk deterministic secim yap
 */
const pickDailyItem = (items) => {
  if (!items || items.length === 0) {
    return null;
  }

  const seed = getTodayDate();
  const index = hashString(seed) % items.length;
  return items[index];
};

/**
 * Cache'den gunluk icerigi al
 */
const getCachedContent = async () => {
  try {
    const lastFetchAtRaw = await AsyncStorage.getItem(LAST_FETCH_AT_KEY);
    const lastFetchAt = Number(lastFetchAtRaw);

    // Son cekim zamani yoksa veya 24 saati asmissa cache gecersiz
    if (!lastFetchAt || Number.isNaN(lastFetchAt) || Date.now() - lastFetchAt >= CACHE_TTL_MS) {
      return null;
    }

    const [cachedDua, cachedHadis] = await Promise.all([
      AsyncStorage.getItem(DAILY_DUA_KEY),
      AsyncStorage.getItem(DAILY_HADIS_KEY),
    ]);

    if (!cachedDua || !cachedHadis) {
      return null;
    }

    return {
      dua: JSON.parse(cachedDua),
      hadis: JSON.parse(cachedHadis),
    };
  } catch (error) {
    console.error('Cache okuma hatasi:', error);
    return null;
  }
};

/**
 * Gunluk icerigi cache'e kaydet
 */
const cacheContent = async (dua, hadis) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(DAILY_DUA_KEY, JSON.stringify(dua)),
      AsyncStorage.setItem(DAILY_HADIS_KEY, JSON.stringify(hadis)),
      AsyncStorage.setItem(LAST_FETCH_AT_KEY, String(Date.now())),
    ]);
    console.log('Gunluk icerik cache\'e kaydedildi');
  } catch (error) {
    console.error('Cache yazma hatasi:', error);
  }
};

/**
 * Firebase'den gunluk duayi cek
 */
const fetchDailyDua = async () => {
  try {
    console.log('Firebase\'den gunluk dua cekiliyor...');

    const duasCollection = collection(db, 'duas');
    const duasSnapshot = await getDocs(duasCollection);

    if (duasSnapshot.empty) {
      console.warn('Firebase\'de dua bulunamadi');
      return null;
    }

    const allDuas = [];
    duasSnapshot.forEach((docItem) => {
      allDuas.push({
        id: docItem.id,
        ...docItem.data(),
      });
    });

    allDuas.sort((a, b) => (a.order || 0) - (b.order || 0));
    const dua = pickDailyItem(allDuas);

    console.log('Gunluk dua yuklendi:', dua?.title);
    return dua;
  } catch (error) {
    console.error('Dua cekme hatasi:', error);
    throw error;
  }
};

/**
 * Firebase'den gunluk hadisi cek
 */
const fetchDailyHadis = async () => {
  try {
    console.log('Firebase\'den gunluk hadis cekiliyor...');

    const hadislerCollection = collection(db, 'hadisler');
    const hadislerSnapshot = await getDocs(hadislerCollection);

    if (hadislerSnapshot.empty) {
      console.warn('Firebase\'de hadis bulunamadi');
      return null;
    }

    const allHadisler = [];
    hadislerSnapshot.forEach((docItem) => {
      allHadisler.push({
        id: docItem.id,
        ...docItem.data(),
      });
    });

    allHadisler.sort((a, b) => (a.order || 0) - (b.order || 0));
    const hadis = pickDailyItem(allHadisler);

    console.log('Gunluk hadis yuklendi:', hadis?.title);
    return hadis;
  } catch (error) {
    console.error('Hadis cekme hatasi:', error);
    throw error;
  }
};

/**
 * Gunluk icerigi getir (cache varsa cache'den, yoksa Firebase'den)
 */
export const fetchDailyContent = async () => {
  try {
    // Once cache'e bak
    const cached = await getCachedContent();
    if (cached) {
      console.log('Gunluk icerik cache\'den geldi');
      return cached;
    }

    // Cache yoksa Firebase'den cek
    console.log('Cache bulunamadi, Firebase\'den cekiliyor...');

    const [dua, hadis] = await Promise.all([
      fetchDailyDua(),
      fetchDailyHadis(),
    ]);

    if (!dua || !hadis) {
      throw new Error('Dua veya hadis bulunamadi');
    }

    // Cache'e kaydet
    await cacheContent(dua, hadis);

    return { dua, hadis };
  } catch (error) {
    console.error('Gunluk icerik hatasi:', error);
    throw error;
  }
};

/**
 * Cache'i temizle (test icin)
 */
export const clearDailyContentCache = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(DAILY_DUA_KEY),
      AsyncStorage.removeItem(DAILY_HADIS_KEY),
      AsyncStorage.removeItem(LAST_FETCH_AT_KEY),
    ]);
    console.log('Gunluk icerik cache\'i temizlendi');
  } catch (error) {
    console.error('Cache temizleme hatasi:', error);
  }
};

/**
 * Rastgele dua getir
 */
export const fetchRandomDua = async () => {
  try {
    const duasCollection = collection(db, 'duas');
    const querySnapshot = await getDocs(duasCollection);

    if (querySnapshot.empty) {
      return null;
    }

    const allDuas = [];
    querySnapshot.forEach((doc) => {
      allDuas.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Rastgele sec
    const randomIndex = Math.floor(Math.random() * allDuas.length);
    return allDuas[randomIndex];
  } catch (error) {
    console.error('Rastgele dua hatasi:', error);
    throw error;
  }
};

/**
 * Rastgele hadis getir
 */
export const fetchRandomHadis = async () => {
  try {
    const hadislerCollection = collection(db, 'hadisler');
    const querySnapshot = await getDocs(hadislerCollection);

    if (querySnapshot.empty) {
      return null;
    }

    const allHadisler = [];
    querySnapshot.forEach((doc) => {
      allHadisler.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Rastgele sec
    const randomIndex = Math.floor(Math.random() * allHadisler.length);
    return allHadisler[randomIndex];
  } catch (error) {
    console.error('Rastgele hadis hatasi:', error);
    throw error;
  }
};
