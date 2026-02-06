import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// ✅ YENİ: expo-constants import
import Constants from 'expo-constants';

const NearestMosquesScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState(null);
  const [showList, setShowList] = useState(false);
  const [nearestMosque, setNearestMosque] = useState(null);
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ✅ API Key'i expo-constants'tan al (app.json'dan)
  const GOOGLE_MAPS_API_KEY = Platform.select({
    android: Constants.expoConfig?.android?.config?.googleMaps?.apiKey || 'AIzaSyCQh9eXuB9RapkWfbnrTt6UoWdVgobeNzY',
    ios: Constants.expoConfig?.ios?.config?.googleMapsApiKey || 'AIzaSyCQh9eXuB9RapkWfbnrTt6UoWdVgobeNzY',
    default: 'AIzaSyCQh9eXuB9RapkWfbnrTt6UoWdVgobeNzY'
  });

  // Debug: API key kontrol
  useEffect(() => {
    console.log('🔑 Google Maps API Key:', GOOGLE_MAPS_API_KEY);
    console.log('📱 Platform:', Platform.OS);
    
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'AIzaSyCQh9eXuB9RapkWfbnrTt6UoWdVgobeNzY') {
      console.warn('⚠️ API key app.json\'dan alınamadı, varsayılan kullanılıyor');
    }
  }, []);

  // Geri butonu handler
  const handleGoBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate('Home');
    }
  };

  // Pulse animasyonu
  useEffect(() => {
    if (nearestMosque) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      setTimeout(() => {
        pulse.stop();
        pulseAnim.setValue(1);
      }, 5000);

      return () => pulse.stop();
    }
  }, [nearestMosque]);

  // Kullanıcının konumunu al
  useEffect(() => {
    (async () => {
      try {
        console.log('🔍 Konum izni isteniyor...');
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('❌ Konum izni reddedildi');
          Alert.alert(
            'İzin Gerekli', 
            'Yakındaki camileri görebilmek için konum izni gereklidir.',
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Ayarlar', onPress: () => Linking.openSettings() }
            ]
          );
          setLoading(false);
          return;
        }

        console.log('✅ Konum izni verildi, konum alınıyor...');
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };

        console.log('📍 Konum alındı:', userLocation.latitude, userLocation.longitude);
        setLocation(userLocation);
        await findNearbyMosques(userLocation.latitude, userLocation.longitude);
      } catch (error) {
        console.error('❌ Konum alınırken hata:', error);
        Alert.alert('Hata', 'Konum bilgisi alınamadı. GPS açık olduğundan emin olun.');
        setLoading(false);
      }
    })();
  }, []);

  // Yakındaki camileri bul
  const findNearbyMosques = async (lat, lng) => {
    try {
      console.log('🔍 Camiler aranıyor...');
      console.log('📍 Konum:', lat, lng);
      console.log('🔑 Kullanılan API Key:', GOOGLE_MAPS_API_KEY?.substring(0, 20) + '...');
      
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=mosque&language=tr&key=${GOOGLE_MAPS_API_KEY}`;
      
      console.log('🌐 API çağrısı yapılıyor...');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📡 API Response Status:', data.status);
      console.log('📊 Bulunan sonuç sayısı:', data.results?.length || 0);

      // ✅ API KEY HATASI KONTROLÜ
      if (data.status === 'REQUEST_DENIED') {
        console.error('❌ API KEY HATASI:', data.error_message);
        Alert.alert(
          'Google Maps API Hatası',
          `API erişimi engellendi:\n\n${data.error_message || 'API key geçersiz veya kısıtlı'}\n\nLütfen Google Cloud Console'da API key ayarlarını kontrol edin.`,
          [
            { text: 'Tamam' },
            { 
              text: 'Yardım', 
              onPress: () => {
                Alert.alert(
                  'API Key Sorunu',
                  '1. Google Cloud Console → APIs & Services\n2. Credentials → API key\n3. API restrictions: "Don\'t restrict key" seçin\n4. Application restrictions: "None" seçin\n5. Kaydet ve 5 dakika bekleyin'
                );
              }
            }
          ]
        );
        setLoading(false);
        return;
      }

      if (data.status === 'ZERO_RESULTS') {
        console.log('⚠️ Yakında cami bulunamadı');
        Alert.alert(
          'Bilgi',
          'Yakınınızda (5 km) kayıtlı cami bulunamadı.'
        );
        setLoading(false);
        return;
      }

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        console.log('✅ Camiler bulundu, işleniyor...');
        
        const mosquesData = data.results.map((place) => {
          const distance = calculateDistance(
            lat,
            lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address || 'Adres bilgisi yok',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            distance: distance,
            rating: place.rating || 0,
            open: place.opening_hours?.open_now ?? null,
            userRatingsTotal: place.user_ratings_total || 0,
          };
        });

        mosquesData.sort((a, b) => a.distance - b.distance);
        
        if (mosquesData.length > 0) {
          setNearestMosque(mosquesData[0]);
          console.log('🕌 En yakın cami:', mosquesData[0].name, '-', mosquesData[0].distance, 'km');
        }

        setMosques(mosquesData);
        console.log(`✅ ${mosquesData.length} cami state'e eklendi`);
        
        if (mapRef.current && mosquesData.length > 0) {
          setTimeout(() => {
            try {
              mapRef.current?.fitToCoordinates(
                mosquesData.slice(0, 5).map(m => ({
                  latitude: m.latitude,
                  longitude: m.longitude,
                })),
                {
                  edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                  animated: true,
                }
              );
            } catch (e) {
              console.log('⚠️ Harita zoom hatası:', e.message);
            }
          }, 1000);
        }
      } else {
        console.error('❌ Beklenmeyen API durumu:', data.status);
        Alert.alert('Hata', `API hatası: ${data.status}. ${data.error_message || ''}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ findNearbyMosques hatası:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert(
          'Zaman Aşımı',
          'API çağrısı zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.'
        );
      } else if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Bağlantı Hatası',
          'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
        );
      } else {
        Alert.alert(
          'Hata',
          `Camiler yüklenirken hata oluştu:\n\n${error.message}\n\nAPI key doğru yapılandırıldığından emin olun.`
        );
      }
      
      setLoading(false);
    }
  };

  // Mesafe hesaplama
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return parseFloat(distance.toFixed(2));
  };

  // Haritada camiye odaklan
  const focusOnMosque = (mosque) => {
    setSelectedMosque(mosque);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: mosque.latitude,
          longitude: mosque.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  // Yol tarifi aç
  const openDirections = (mosque) => {
    const scheme = Platform.select({
      ios: `maps:?daddr=${mosque.latitude},${mosque.longitude}`,
      android: `google.navigation:q=${mosque.latitude},${mosque.longitude}`,
    });

    Linking.canOpenURL(scheme).then((supported) => {
      if (supported) {
        Linking.openURL(scheme);
      } else {
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
        Linking.openURL(webUrl);
      }
    });
  };

  // Cami kartı render
  const renderMosqueCard = ({ item }) => {
    const isNearest = nearestMosque && item.id === nearestMosque.id;
    
    return (
      <TouchableOpacity
        style={[styles.mosqueCard, isNearest && styles.nearestCard]}
        onPress={() => {
          focusOnMosque(item);
          setShowList(false);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, isNearest && styles.nearestIcon]}>
            <MaterialCommunityIcons
              name="mosque"
              size={40}
              color={isNearest ? '#f59e0b' : '#14b8a6'}
            />
          </View>

          <View style={styles.mosqueInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.mosqueName} numberOfLines={1}>
                {item.name}
              </Text>
              {isNearest && (
                <View style={styles.nearestBadge}>
                  <Text style={styles.nearestBadgeText}>En Yakın</Text>
                </View>
              )}
            </View>
            <Text style={styles.mosqueAddress} numberOfLines={2}>
              {item.address}
            </Text>

            <View style={styles.mosqueDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="location" size={16} color="#14b8a6" />
                <Text style={styles.detailText}>{item.distance} km</Text>
              </View>

              {item.rating > 0 && (
                <View style={styles.detailItem}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.detailText}>
                    {item.rating} ({item.userRatingsTotal})
                  </Text>
                </View>
              )}

              {item.open !== null && (
                <View style={styles.detailItem}>
                  <View style={[styles.statusDot, item.open && styles.statusOpen]} />
                  <Text style={styles.detailText}>
                    {item.open ? 'Açık' : 'Kapalı'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.directionButton, isNearest && styles.nearestDirectionButton]}
            onPress={() => openDirections(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading ekranı
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Yakındaki camiler aranıyor...</Text>
        <Text style={styles.loadingSubtext}>Konum ve harita yükleniyor</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Yakındaki Camiler</Text>

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => setShowList(!showList)}
        >
          <Ionicons
            name={showList ? 'map' : 'list'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!showList ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={location}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            loadingEnabled
            loadingIndicatorColor="#14b8a6"
          >
            {mosques.map((mosque) => {
              const isNearest = nearestMosque && mosque.id === nearestMosque.id;
              
              return (
                <Marker
                  key={mosque.id}
                  coordinate={{
                    latitude: mosque.latitude,
                    longitude: mosque.longitude,
                  }}
                  title={mosque.name}
                  description={`${mosque.distance} km`}
                  onPress={() => focusOnMosque(mosque)}
                >
                  <View style={[styles.markerContainer, isNearest && styles.nearestMarker]}>
                    <MaterialCommunityIcons
                      name="mosque"
                      size={24}
                      color={isNearest ? '#f59e0b' : '#14b8a6'}
                    />
                  </View>
                </Marker>
              );
            })}

            {nearestMosque && (
              <Circle
                center={{
                  latitude: nearestMosque.latitude,
                  longitude: nearestMosque.longitude,
                }}
                radius={100}
                fillColor="rgba(245, 158, 11, 0.2)"
                strokeColor="rgba(245, 158, 11, 0.5)"
                strokeWidth={2}
              />
            )}
          </MapView>

          {selectedMosque && (
            <View style={styles.selectedMosqueCard}>
              <View style={styles.selectedContent}>
                <MaterialCommunityIcons name="mosque" size={40} color="#14b8a6" />

                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedName} numberOfLines={1}>
                    {selectedMosque.name}
                  </Text>
                  <Text style={styles.selectedAddress} numberOfLines={2}>
                    {selectedMosque.address}
                  </Text>
                  <Text style={styles.selectedDistance}>
                    {selectedMosque.distance} km uzaklıkta
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => openDirections(selectedMosque)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate-circle" size={50} color="#14b8a6" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedMosque(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <FlatList
          data={mosques}
          renderItem={renderMosqueCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="mosque" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Yakında cami bulunamadı</Text>
              <Text style={styles.emptySubtext}>Farklı bir bölgeye gidin</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// Styles kısmı aynı kalacak, değişiklik yok
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14b8a6',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  listButton: {
    padding: 5,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  nearestMarker: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#f59e0b',
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  selectedMosqueCard: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedInfo: {
    flex: 1,
    marginLeft: 15,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  selectedAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  selectedDistance: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '600',
  },
  navigateButton: {
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  listContainer: {
    padding: 15,
  },
  mosqueCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nearestCard: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearestIcon: {
    backgroundColor: '#fef3c7',
  },
  mosqueInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  mosqueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  nearestBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  nearestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  mosqueAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  mosqueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  statusOpen: {
    backgroundColor: '#10b981',
  },
  directionButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  nearestDirectionButton: {
    backgroundColor: '#f59e0b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NearestMosquesScreen;