import * as Location from 'expo-location';
import React, { createContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const LocationContext = createContext();

// Türkiye'deki 81 ilin cami resimleri
const cityBackgrounds = {
  // Marmara Bölgesi
  'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',
  'ankara': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80',
  'izmir': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'bursa': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80',
  'balikesir': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'canakkale': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'edirne': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
  'kirklareli': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'tekirdag': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'yalova': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'kocaeli': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'sakarya': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'duzce': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'bolu': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'bilecik': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',

  // Ege Bölgesi
  'manisa': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'aydin': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'denizli': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'mugla': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'usak': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'afyonkarahisar': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'kutahya': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'eskisehir': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',

  // Akdeniz Bölgesi
  'antalya': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'adana': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'mersin': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'hatay': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'kahramanmaras': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'osmaniye': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'isparta': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'burdur': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',

  // İç Anadolu Bölgesi
  'konya': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'kayseri': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'sivas': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'yozgat': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'nevsehir': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'kirikkale': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'aksaray': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'nigde': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'kirsehir': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'cankiri': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'karaman': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',

  // Karadeniz Bölgesi
  'samsun': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'trabzon': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'ordu': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'rize': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'giresun': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'kastamonu': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'sinop': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'amasya': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'tokat': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'corum': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'zonguldak': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'bartin': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'karabuk': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'gumushane': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'bayburt': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'artvin': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',

  // Doğu Anadolu Bölgesi
  'erzurum': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'erzincan': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  //'kars': 'https://plus.unsplash.com/premium_photo-1728072616787-f00295e24deb?q=80',
  'kars': 'https://kars.ktb.gov.tr/Resim/217511,manucehrjpg.png?0',
  'agri': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'ardahan': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'igdir': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'malatya': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'elazig': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'tunceli': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'bingol': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'mus': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'bitlis': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'van': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'hakkari': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',

  // Güneydoğu Anadolu Bölgesi
  'gaziantep': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'sanliurfa': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'diyarbakir': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'mardin': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
  'batman': 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
  'sirnak': 'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
  'siirt': 'https://images.unsplash.com/photo-1597526666937-08c68e80e8ec?w=1200&q=80',
  'kilis': 'https://images.unsplash.com/photo-1564769610726-5a900d3fd33f?w=1200&q=80',
  'adiyaman': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',

  // Varsayılan
  'default': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',
};

// Türkçe karakterleri normalize et
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .trim();
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [fullLocation, setFullLocation] = useState('Türkiye');
  const [city, setCity] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(cityBackgrounds.default);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli',
          'Namaz vakitlerini gösterebilmek için konum izni gereklidir.',
          [{ text: 'Tamam' }]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);

      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      console.log('🔍 Ham adres bilgisi:', address);

      // Detaylı konum oluştur (görüntüleme için)
      let locationParts = [];
      
      if (address.district) {
        locationParts.push(address.district);
      } else if (address.subregion && !address.subregion.includes('Merkez')) {
        locationParts.push(address.subregion);
      } else if (address.street) {
        locationParts.push(address.street);
      }
      
      // İl adını al
      let cityName = address.region || address.city ||  '';
      
      // Eğer city yoksa subregion'dan çıkar
      if (!cityName && address.subregion) {
        cityName = address.subregion;
      }
      
      // "Merkez", "Province", "İli" gibi gereksiz kelimeleri temizle
      cityName = cityName
        .replace(/\s+Merkez$/gi, '')
        .replace(/\s+Province$/gi, '')
        .replace(/\s+İli$/gi, '')
        .replace(/\s+ili$/gi, '')
        .trim();
      
      // Görüntüleme için il ekle
      if (cityName) {
        locationParts.push(cityName);
      }
      
      const fullLocationText = locationParts.length > 0 
        ? locationParts.join(', ') 
        : 'Türkiye';
      
      setFullLocation(fullLocationText);
      setCity(cityName);

      // Arka plan resmi seç
      const normalizedCity = normalizeText(cityName);
      
      if (cityBackgrounds[normalizedCity]) {
        setBackgroundImage(cityBackgrounds[normalizedCity]);
        console.log('✅ İl bulundu:', cityName, '→', normalizedCity);
      } else {
        setBackgroundImage(cityBackgrounds.default);
        console.log('⚠️ İl bulunamadı:', fullLocationText, '→', normalizedCity);
        console.log('📋 Mevcut iller:', Object.keys(cityBackgrounds).slice(0, 10).join(', '), '...');
      }

      console.log('📍 Görüntülenecek konum:', fullLocationText);
      console.log('🏙️ Temizlenmiş il:', cityName);

    } catch (error) {
      console.error('❌ Konum hatası:', error);
      Alert.alert('Hata', 'Konum alınamadı: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider 
      value={{ 
        location, 
        fullLocation,
        city,
        backgroundImage, 
        loading,
        refreshLocation: getLocationPermission 
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
