import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Günlük içerik servisi
 * Firebase'den günün duası ve hadisini çeker
 */

// Cache keys
const DAILY_DUA_KEY = '@daily_dua';
const DAILY_HADIS_KEY = '@daily_hadis';
const LAST_FETCH_DATE_KEY = '@last_fetch_date';

/**
 * Bugünün tarihini YYYY-MM-DD formatında döner
 */
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Cache'den günlük içeriği al
 */
const getCachedContent = async () => {
  try {
    const lastFetchDate = await AsyncStorage.getItem(LAST_FETCH_DATE_KEY);
    const todayDate = getTodayDate();

    // Eğer bugün çekilmediyse cache geçersiz
    if (lastFetchDate !== todayDate) {
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
    console.error('Cache okuma hatası:', error);
    return null;
  }
};

/**
 * Günlük içeriği cache'e kaydet
 */
const cacheContent = async (dua, hadis) => {
  try {
    const todayDate = getTodayDate();
    await Promise.all([
      AsyncStorage.setItem(DAILY_DUA_KEY, JSON.stringify(dua)),
      AsyncStorage.setItem(DAILY_HADIS_KEY, JSON.stringify(hadis)),
      AsyncStorage.setItem(LAST_FETCH_DATE_KEY, todayDate),
    ]);
    console.log('✅ Günlük içerik cache\'e kaydedildi');
  } catch (error) {
    console.error('Cache yazma hatası:', error);
  }
};

/**
 * Firebase'den günlük duayı çek
 */
const fetchDailyDua = async () => {
  try {
    console.log('🔥 Firebase\'den günlük dua çekiliyor...');
    
    const duasCollection = collection(db, 'duas');
    const duasQuery = query(duasCollection, orderBy('order', 'asc'), limit(1));
    const duasSnapshot = await getDocs(duasQuery);

    if (duasSnapshot.empty) {
      console.warn('⚠️ Firebase\'de dua bulunamadı');
      return null;
    }

    const duaData = duasSnapshot.docs[0].data();
    const dua = {
      id: duasSnapshot.docs[0].id,
      ...duaData,
    };

    console.log('✅ Günlük dua yüklendi:', dua.title);
    return dua;
  } catch (error) {
    console.error('❌ Dua çekme hatası:', error);
    throw error;
  }
};

/**
 * Firebase'den günlük hadisi çek
 */
const fetchDailyHadis = async () => {
  try {
    console.log('🔥 Firebase\'den günlük hadis çekiliyor...');
    
    const hadislerCollection = collection(db, 'hadisler');
    const hadislerQuery = query(hadislerCollection, orderBy('order', 'asc'), limit(1));
    const hadislerSnapshot = await getDocs(hadislerQuery);

    if (hadislerSnapshot.empty) {
      console.warn('⚠️ Firebase\'de hadis bulunamadı');
      return null;
    }

    const hadisData = hadislerSnapshot.docs[0].data();
    const hadis = {
      id: hadislerSnapshot.docs[0].id,
      ...hadisData,
    };

    console.log('✅ Günlük hadis yüklendi:', hadis.title);
    return hadis;
  } catch (error) {
    console.error('❌ Hadis çekme hatası:', error);
    throw error;
  }
};

/**
 * Günlük içeriği getir (cache varsa cache'den, yoksa Firebase'den)
 */
export const fetchDailyContent = async () => {
  try {
    // Önce cache'e bak
    const cached = await getCachedContent();
    if (cached) {
      console.log('✅ Günlük içerik cache\'den geldi');
      return cached;
    }

    // Cache yoksa Firebase'den çek
    console.log('🔄 Cache bulunamadı, Firebase\'den çekiliyor...');
    
    const [dua, hadis] = await Promise.all([
      fetchDailyDua(),
      fetchDailyHadis(),
    ]);

    if (!dua || !hadis) {
      throw new Error('Dua veya hadis bulunamadı');
    }

    // Cache'e kaydet
    await cacheContent(dua, hadis);

    return { dua, hadis };
  } catch (error) {
    console.error('❌ Günlük içerik hatası:', error);
    throw error;
  }
};

/**
 * Cache'i temizle (test için)
 */
export const clearDailyContentCache = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(DAILY_DUA_KEY),
      AsyncStorage.removeItem(DAILY_HADIS_KEY),
      AsyncStorage.removeItem(LAST_FETCH_DATE_KEY),
    ]);
    console.log('✅ Günlük içerik cache\'i temizlendi');
  } catch (error) {
    console.error('Cache temizleme hatası:', error);
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

    // Rastgele seç
    const randomIndex = Math.floor(Math.random() * allDuas.length);
    return allDuas[randomIndex];
  } catch (error) {
    console.error('Rastgele dua hatası:', error);
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

    // Rastgele seç
    const randomIndex = Math.floor(Math.random() * allHadisler.length);
    return allHadisler[randomIndex];
  } catch (error) {
    console.error('Rastgele hadis hatası:', error);
    throw error;
  }
};