import * as Location from 'expo-location';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Context için tip tanımı
/**
 * @typedef {Object} LocationContextType
 * @property {Location.LocationObject | null} location
 * @property {string} fullLocation
 * @property {string} city
 * @property {boolean} loading
 * @property {() => Promise<void>} refreshLocation
 */

// Context oluştur
export const LocationContext = createContext({
  location: null,
  fullLocation: 'Türkiye',
  city: '',
  loading: true,
  refreshLocation: async () => {},
});

// Provider Props tipi
/**
 * @typedef {Object} LocationProviderProps
 * @property {ReactNode} children
 */

// Provider Component
export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null); // Removed invalid type annotation
  const [fullLocation, setFullLocation] = useState('Türkiye');
  const [city, setCity] = useState('');
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
      let cityName = address.region || address.city || '';
      
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

      console.log('📍 Görüntülenecek konum:', fullLocationText);
      console.log('🏙️ Şehir:', cityName);

    } catch (error) {
      console.error('❌ Konum hatası:', error);
      Alert.alert('Hata', 'Konum alınamadı: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
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
        loading,
        refreshLocation: getLocationPermission 
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
