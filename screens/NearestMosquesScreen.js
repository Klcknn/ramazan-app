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

const NearestMosquesScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState(null);
  const [showList, setShowList] = useState(false);
  const [nearestMosque, setNearestMosque] = useState(null);
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Geri butonu handler
  const handleGoBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Alternatif olarak ana sayfaya git
      navigation?.navigate('Home'); // veya ana sayfa route'unuz
    }
  };

  // Pulse animasyonu (en yakın cami için)
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

      // 5 saniye sonra animasyonu durdur
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
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Konum izni verilmedi. Lütfen ayarlardan izin verin.');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const userLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };

        setLocation(userLocation);
        await findNearbyMosques(userLocation.latitude, userLocation.longitude);
      } catch (error) {
        console.error('Konum alınırken hata:', error);
        Alert.alert('Hata', 'Konum bilgisi alınamadı.');
        setLoading(false);
      }
    })();
  }, []);

  // Yakındaki camileri bul
  const findNearbyMosques = async (lat, lng) => {
    try {
      const API_KEY = 'AIzaSyCQh9eXuB9RapkWfbnrTt6UoWdVgobeNzY';
      
      // CORS proxy kullanarak API çağrısı
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=mosque&language=tr&key=${API_KEY}`;
      
      console.log('API URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response Status:', data.status);
      console.log('API Results Count:', data.results?.length || 0);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const mosquesData = data.results.map((place) => {
          const distance = calculateDistance(
            lat,
            lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          console.log('Cami:', place.name, 'Lat:', place.geometry.location.lat, 'Lng:', place.geometry.location.lng);

          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address || '',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            distance: distance,
            rating: place.rating || 0,
            open: place.opening_hours?.open_now ?? null,
            userRatingsTotal: place.user_ratings_total || 0,
          };
        });

        // Mesafeye göre sırala
        mosquesData.sort((a, b) => a.distance - b.distance);
        
        // En yakın camiyi belirle
        if (mosquesData.length > 0) {
          setNearestMosque(mosquesData[0]);
          console.log('En yakın cami:', mosquesData[0].name);
        }

        setMosques(mosquesData);
        console.log(`✅ ${mosquesData.length} cami bulundu ve state'e eklendi`);
        
        // İlk camiye zoom yap
        if (mapRef.current && mosquesData.length > 0) {
          setTimeout(() => {
            mapRef.current.fitToCoordinates(
              mosquesData.slice(0, 5).map(m => ({
                latitude: m.latitude,
                longitude: m.longitude,
              })),
              {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
              }
            );
          }, 500);
        }
      } else {
        console.error('❌ API Hatası:', data.status, data.error_message);
        Alert.alert('Bilgi', `Yakında cami bulunamadı. Durum: ${data.status}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Camiler yüklenirken hata:', error);
      Alert.alert('Hata', 'Camiler yüklenirken bir hata oluştu. İnternet bağlantınızı kontrol edin.');
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

  // Custom Marker Component - Kaldırıldı, artık gerekli değil

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
                  <Text style={styles.detailText}>{item.open ? 'Açık' : 'Kapalı'}</Text>
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

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Yakındaki camiler aranıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>En Yakın Camiler</Text>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => setShowList(!showList)}
          activeOpacity={0.7}
        >
          <Ionicons name={showList ? 'map' : 'list'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Harita veya Liste */}
      {!showList ? (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={location}
            showsUserLocation={true}
            showsMyLocationButton={true}
            loadingEnabled={true}
            showsCompass={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
          >
            {console.log('🗺️ Haritada render edilecek cami sayısı:', mosques.length)}
            {mosques.map((mosque) => {
              const isNearest = nearestMosque && mosque.id === nearestMosque.id;
              console.log('📍 Marker render:', mosque.name, 'isNearest:', isNearest);
              
              return (
                <Marker
                  key={mosque.id}
                  coordinate={{
                    latitude: mosque.latitude,
                    longitude: mosque.longitude,
                  }}
          // anchor: Marker'ın koordinat noktasının neresi olacağını belirler (merkezleme için 0.5)
                  anchor={{ x: 0.5, y: 0.5 }}
                  title={mosque.name}
                  description={`${mosque.distance} km uzaklıkta`}
                  onPress={() => {
                    console.log('Marker tıklandı:', mosque.name);
                    setSelectedMosque(mosque);
                  }}
                >
                  <View style={[
                      styles.markerContainer,
                      isNearest && styles.nearestMarker,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="mosque"
                      size={isNearest ? 30 : 26}
                      color={isNearest ? '#f59e0b' : '#14b8a6'}
                    />
                  </View>
                </Marker>
              );
            })}

            {/* En yakın cami için daire */}
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

          {/* Seçili Cami Bilgisi */}
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
};

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
    // Gölge (Shadow) ayarları
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,     // Android'de gölgenin kesilmemesi için önemli
    borderWidth: 1,   // İkonun sınırlarını belirginleştirmek için ince bir kenarlık
    borderColor: 'rgba(0,0,0,0.05)',
  },
  nearestMarker: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#f59e0b',
    width: 40,        // En yakın olanı bir tık büyük yaparak vurgulayalım
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
});

export default NearestMosquesScreen;