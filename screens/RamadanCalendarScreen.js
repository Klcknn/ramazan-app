import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const RamadanCalendarScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState({ name: 'Kars', id: 9597 });
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  
  // Türkiye'deki 81 ilin listesi (Diyanet API güncel il kodları ile)
  const cities = [
    { name: 'Adana', id: 9146 },
    { name: 'Adıyaman', id: 9158 },
    { name: 'Afyonkarahisar', id: 9167 },
    { name: 'Ağrı', id: 9169 },
    { name: 'Aksaray', id: 9193 },
    { name: 'Amasya', id: 9170 },
    { name: 'Ankara', id: 9206 },
    { name: 'Antalya', id: 9225 },
    { name: 'Ardahan', id: 9246 },
    { name: 'Artvin', id: 9247 },
    { name: 'Aydın', id: 9252 },
    { name: 'Balıkesir', id: 9270 },
    { name: 'Bartın', id: 9497 },
    { name: 'Batman', id: 9354 },
    { name: 'Bayburt', id: 9356 },
    { name: 'Bilecik', id: 9357 },
    { name: 'Bingöl', id: 9359 },
    { name: 'Bitlis', id: 9363 },
    { name: 'Bolu', id: 9373 },
    { name: 'Burdur', id: 9379 },
    { name: 'Bursa', id: 9335 },
    { name: 'Çanakkale', id: 9380 },
    { name: 'Çankırı', id: 9387 },
    { name: 'Çorum', id: 9392 },
    { name: 'Denizli', id: 9402 },
    { name: 'Diyarbakır', id: 9406 },
    { name: 'Düzce', id: 9518 },
    { name: 'Edirne', id: 9417 },
    { name: 'Elazığ', id: 9432 },
    { name: 'Erzincan', id: 9436 },
    { name: 'Erzurum', id: 9440 },
    { name: 'Eskişehir', id: 9451 },
    { name: 'Gaziantep', id: 9147 },
    { name: 'Giresun', id: 9347 },
    { name: 'Gümüşhane', id: 9469 },
    { name: 'Hakkari', id: 9470 },
    { name: 'Hatay', id: 9156 },
    { name: 'Iğdır', id: 20166 },
    { name: 'Isparta', id: 9239 },
    { name: 'İstanbul', id: 9541 },
    { name: 'İzmir', id: 9560 },
    { name: 'Kahramanmaraş', id: 9153 },
    { name: 'Karabük', id: 9702 },
    { name: 'Karaman', id: 9622 }, 
    { name: 'Kars', id: 9597 },
    { name: 'Kastamonu', id: 9609 },
    { name: 'Kayseri', id: 9632 },
    { name: 'Kilis', id: 20069 },
    { name: 'Kırklareli', id: 9639 },
    { name: 'Kırşehir', id: 9642 },
    { name: 'Kocaeli', id: 9636 }, 
    { name: 'Konya', id: 9654 },
    { name: 'Kütahya', id: 9680 },
    { name: 'Malatya', id: 9676 },
    { name: 'Manisa', id: 9554 },
    { name: 'Mardin', id: 9635 },
    { name: 'Mersin', id: 9336 },
    { name: 'Muğla', id: 9561 },
    { name: 'Muş', id: 9713 },
    { name: 'Nevşehir', id: 9650 },
    { name: 'Niğde', id: 9234 },
    { name: 'Ordu', id: 9352 },
    { name: 'Osmaniye', id: 20183 },
    { name: 'Rize', id: 9489 },
    { name: 'Sakarya', id: 9534 },
    { name: 'Samsun', id: 9511 },
    { name: 'Şanlıurfa', id: 9413 },
    { name: 'Siirt', id: 9716 },
    { name: 'Sinop', id: 9738 },
    { name: 'Şırnak', id: 20089 },
    { name: 'Sivas', id: 9760 },
    { name: 'Tekirdağ', id: 9425 },
    { name: 'Tokat', id: 9514 },
    { name: 'Trabzon', id: 9780 },
    { name: 'Tunceli', id: 9797 },
    { name: 'Uşak', id: 9562 },
    { name: 'Van', id: 9809 },
    { name: 'Yalova', id: 20090 },
    { name: 'Yozgat', id: 9831 },
    { name: 'Zonguldak', id: 9854 },
  ];

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ramazan verilerini çekme
  const fetchRamadanData = async (cityId) => {
    setLoading(true);
    try {
      // 1. cityId'den şehir ismini bulalım
      const cityObj = cities.find(c => c.id === cityId);
      if (!cityObj) return;
  
      const cityName = cityObj.name;
      const year = 2026;
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  
      // 2. Şubat ve Mart aylarını paralel olarak çekelim (Hız için)
      // method=13 -> Türkiye Diyanet İşleri Başkanlığı hesaplama yöntemidir.
      const [febRes, marRes] = await Promise.all([
        fetch(`https://api.aladhan.com/v1/calendarByCity/${year}/2?city=${cityName}&country=Turkey&method=13`),
        fetch(`https://api.aladhan.com/v1/calendarByCity/${year}/3?city=${cityName}&country=Turkey&method=13`)
      ]);
  
      const febData = await febRes.json();
      const marData = await marRes.json();
  
      let fullRamadanData = [];
  
      // 3. Şubat Ayını İşle (18 Şubat'tan itibaren)
      if (febData.data) {
        febData.data.forEach((item) => {
          const day = parseInt(item.date.gregorian.day);
          if (day >= 18) { // Ramazan başlangıcı 18 Şubat
            const dateObj = new Date(year, 1, day);
            fullRamadanData.push({
              day: String(fullRamadanData.length + 1).padStart(2, '0'),
              date: `${day} ${monthNames[1]}`,
              dayName: dayNames[dateObj.getDay()],
              sahur: item.timings.Fajr.split(' ')[0],
              iftar: item.timings.Maghrib.split(' ')[0],
            });
          }
        });
      }
  
      // 4. Mart Ayını İşle (Ramazan'ın geri kalanı)
      if (marData.data) {
        marData.data.forEach((item) => {
          const day = parseInt(item.date.gregorian.day);
          // Ramazan 30 gün sürdüğü için diziyi 30'a tamamlayana kadar ekle
          if (fullRamadanData.length < 30) {
            const dateObj = new Date(year, 2, day);
            fullRamadanData.push({
              day: String(fullRamadanData.length + 1).padStart(2, '0'),
              date: `${day} ${monthNames[2]}`,
              dayName: dayNames[dateObj.getDay()],
              sahur: item.timings.Fajr.split(' ')[0],
              iftar: item.timings.Maghrib.split(' ')[0],
            });
          }
        });
      }
  
      setRamadanDays(fullRamadanData);
      console.log("2026 Ramazan Takvimi Başarıyla Oluşturuldu.");
  
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      setRamadanDays(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  // Örnek veri oluşturma fonksiyonu (API çalışmazsa)
  const generateSampleData = () => {
    const ramadanStart = new Date(2026, 1, 18);
    const data = [];
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'];

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(ramadanStart);
      currentDate.setDate(ramadanStart.getDate() + i);

      const day = String(currentDate.getDate()).padStart(2, '0');
      
      // Sahur ve iftar vakitlerini hesapla (örnek)
      const sahurHour = 5 - Math.floor(i / 10);
      const sahurMin = 37 - i;
      const iftarHour = 18 + Math.floor(i / 15);
      const iftarMin = 42 + Math.floor(i / 3);

      data.push({
        day: String(i + 1).padStart(2, '0'),
        date: `${day} ${monthNames[currentDate.getMonth()]}`,
        dayName: dayNames[currentDate.getDay()],
        sahur: `0${sahurHour}:${String(sahurMin).padStart(2, '0')}`,
        iftar: `${iftarHour}:${String(iftarMin).padStart(2, '0')}`,
      });
    }

    return data;
  };
  useEffect(() => {
    fetchRamadanData(selectedCity.id);
  }, []);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSearchQuery('');
    setShowCityModal(false);
    fetchRamadanData(city.id);
  };

  const renderDay = ({ item }) => (
    <View style={styles.dayCard}>
      <View style={styles.cardContent}>
        <Text style={styles.dayNumber}>{item.day}</Text>
        
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.dayNameText}>{item.dayName}</Text>
        </View>

        <Text style={styles.sahurTime}>{item.sahur}</Text>
        <Text style={styles.iftarTime}>{item.iftar}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#14b8a6" />

      {/* Header */}
      <View style={styles.header}>
        
      
        {/* Geri butonu ve arama */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.searchBox}
            onPress={() => setShowCityModal(true)}
          >
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchText}>{selectedCity.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>Ramazan Ayı Takvimi</Text>

        {/* Tab İkonları */}
        <View style={styles.tabBar}>
          <View style={styles.tabItem}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={25} color="#fff" />
            <Text style={styles.tabLabel}>Ramazan Gün</Text>
          </View>

          <View style={styles.tabItem}>
            <MaterialCommunityIcons name="calendar-blank" size={25} color="#fff" />
            <Text style={styles.tabLabel}>Tarih</Text>
          </View>

          <View style={styles.tabItem}>
            <Ionicons name="sunny" size={25} color="#fff" />
            <Text style={styles.tabLabel}>Sahur Vakti</Text>
          </View>

          <View style={styles.tabItem}>
            <MaterialCommunityIcons name="weather-night" size={25} color="#fff" />
            <Text style={styles.tabLabel}>İftar Vakti</Text>
          </View>
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={ramadanDays}
          renderItem={renderDay}
          keyExtractor={(item) => item.day}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Şehir Seçim Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Seçin</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close-circle" size={28} color="#14b8a6" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Şehir ara..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.cityList}>
              {filteredCities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.cityItem}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={styles.cityName}>{city.name}</Text>
                  {selectedCity.id === city.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#14b8a6" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredCities.length === 0 && (
                <Text style={styles.noResultText}>Şehir bulunamadı</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14b8a6',
  },
  header: {
    backgroundColor: '#14b8a6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 5,
    paddingHorizontal: 5,
  },
  statusBarArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
  },
  statusTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
    gap: 15,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 70,
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 15,
  },
  searchText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  listContent: {
    padding: 10,
    paddingBottom: 30,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14b8a6',
    width: 40,
    marginLeft: 30,
  },
  dateInfo: {
    flex: 1,
    marginLeft: 15,
  },
  dateText: {
    fontSize: 15,
    color: '#14b8a6',
    fontWeight: '600',
    marginLeft: 27,
    marginBottom: 2,
  },
  dayNameText: {
    fontSize: 13,
    color: '#14b8a6',
    marginLeft: 27,
  },
  sahurTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 55,
  },
  iftarTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14b8a6',
    marginRight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '75%',
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  cityList: {
    maxHeight: 450,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  noResultText: {
    textAlign: 'center',
    padding: 30,
    color: '#999',
    fontSize: 16,
  },
});

export default RamadanCalendarScreen;