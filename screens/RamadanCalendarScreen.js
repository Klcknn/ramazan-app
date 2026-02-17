import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
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

const RamadanCalendarScreen = ({ navigation }) => {
  // Aladhan-Diyanet tarih farkı görülen yıllar için gösterim düzeltmesi (gün)
  const YEAR_DISPLAY_SHIFT_DAYS = {
    2026: 1,
    2027: 1,
    2028: 1,
    2029: 1,
    2030: 1,
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, index) => currentYear + index);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState({ name: 'Kars', id: 9597 });
  const [selectedDistrict, setSelectedDistrict] = useState({ name: 'Kars', id: 9597 });
  const [districts, setDistricts] = useState([]);
  const [modalStep, setModalStep] = useState('province');
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [todayKey, setTodayKey] = useState(formatDateKey(new Date()));
  const listRef = useRef(null);

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

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const normalizeText = (value) =>
    (value || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

  const formatDistrictName = (value) => {
    const lower = (value || '').toLocaleLowerCase('tr-TR').trim();
    return lower.replace(
      /(^|[\s\-'/().])([a-zçğıöşü])/giu,
      (match, separator, letter) => `${separator}${letter.toLocaleUpperCase('tr-TR')}`
    );
  };

  const filteredCities = cities.filter((city) =>
    normalizeText(city.name).includes(normalizeText(searchQuery))
  );
  const filteredDistricts = districts.filter((district) =>
    normalizeText(district.name).includes(normalizeText(searchQuery))
  );

  const getGregorianDate = (item) => {
    const gDay = Number(item?.date?.gregorian?.day);
    const gMonth = Number(item?.date?.gregorian?.month?.number) - 1;
    const gYear = Number(item?.date?.gregorian?.year);
    return new Date(gYear, gMonth, gDay);
  };

  const fetchRamadanData = async (provinceName, districtName, year) => {
    setLoading(true);
    const targetYear = year ?? selectedYear;

    try {
      const activeProvince = provinceName || selectedProvince.name;
      const activeDistrict = districtName || selectedDistrict?.name || activeProvince;

      const monthRequests = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const districtQuery = encodeURIComponent(activeDistrict);
        const provinceQuery = encodeURIComponent(activeProvince);
        return fetch(
          `https://api.aladhan.com/v1/calendarByCity/${targetYear}/${month}?city=${districtQuery}&state=${provinceQuery}&country=Turkey&method=13`
        )
          .then((res) => res.json())
          .then((json) => {
            if (Array.isArray(json?.data) && json.data.length > 0) {
              return json;
            }
            const provinceOnlyQuery = encodeURIComponent(activeProvince);
            return fetch(
              `https://api.aladhan.com/v1/calendarByCity/${targetYear}/${month}?city=${provinceOnlyQuery}&country=Turkey&method=13`
            ).then((res) => res.json());
          });
      });

      const monthResults = await Promise.all(monthRequests);
      const allDays = monthResults.flatMap((result) => (Array.isArray(result?.data) ? result.data : []));

      const ramadanEntries = allDays
        .filter((item) => Number(item?.date?.hijri?.month?.number) === 9)
        .sort((a, b) => getGregorianDate(a) - getGregorianDate(b));

      if (ramadanEntries.length === 0) {
        throw new Error('Seçilen yıl için Ramazan verisi bulunamadı.');
      }

      const groupedByHijriYear = ramadanEntries.reduce((acc, item) => {
        const hijriYear = String(item?.date?.hijri?.year || 'unknown');
        if (!acc[hijriYear]) acc[hijriYear] = [];
        acc[hijriYear].push(item);
        return acc;
      }, {});

      const groups = Object.values(groupedByHijriYear)
        .map((group) => group.sort((a, b) => getGregorianDate(a) - getGregorianDate(b)))
        .sort((a, b) => getGregorianDate(a[0]) - getGregorianDate(b[0]));

      // Öncelik: Seçilen miladi yılda başlayan (1 Ramazan) grup
      let selectedGroup =
        groups.find((group) =>
          group.some((item) => {
            const hijriDay = Number(item?.date?.hijri?.day);
            const gYear = getGregorianDate(item).getFullYear();
            return hijriDay === 1 && gYear === targetYear;
          })
        ) || [];

      // Fallback: seçilen yılda herhangi bir Ramazan günü içeren ilk grup
      if (selectedGroup.length === 0) {
        selectedGroup =
          groups.find((group) =>
            group.some((item) => getGregorianDate(item).getFullYear() === targetYear)
          ) || [];
      }

      if (selectedGroup.length === 0) {
        throw new Error('Ramazan başlangıç verisi oluşturulamadı.');
      }

      // Listeyi kesin olarak 1 Ramazan'dan başlat.
      const firstRamadanIndex = selectedGroup.findIndex(
        (item) => Number(item?.date?.hijri?.day) === 1
      );
      const normalizedGroup =
        firstRamadanIndex >= 0 ? selectedGroup.slice(firstRamadanIndex) : selectedGroup;

      if (normalizedGroup.length === 0) {
        throw new Error('Ramazan başlangıç verisi oluşturulamadı.');
      }

      // Ramazan süresi (29/30): Hicri gün numaralarından dinamik belirle.
      const seenHijriDays = new Set();
      const finalGroup = normalizedGroup.filter((item) => {
        const hijriDay = Number(item?.date?.hijri?.day);
        if (hijriDay < 1 || hijriDay > 30 || seenHijriDays.has(hijriDay)) {
          return false;
        }
        seenHijriDays.add(hijriDay);
        return true;
      });

      if (finalGroup.length === 0) {
        throw new Error('Ramazan günleri listelenemedi.');
      }

      const fullRamadanData = finalGroup.map((item, index) => {
        const gDate = getGregorianDate(item);
        const displayDate = new Date(gDate);

        const shiftDays = YEAR_DISPLAY_SHIFT_DAYS[targetYear] || 0;
        if (shiftDays !== 0) {
          displayDate.setDate(displayDate.getDate() + shiftDays);
        }

        const gDay = displayDate.getDate();
        const gMonth = displayDate.getMonth();

        return {
          day: String(index + 1).padStart(2, '0'),
          date: `${gDay} ${monthNames[gMonth]}`,
          dayName: dayNames[displayDate.getDay()],
          fullDate: formatDateKey(displayDate),
          sahur: item?.timings?.Imsak?.split(' ')[0] || '--:--',
          iftar: item?.timings?.Maghrib?.split(' ')[0] || '--:--',
        };
      });

      setRamadanDays(fullRamadanData);
      console.log(`${targetYear} ${activeProvince}/${activeDistrict} imsakiyesi başarıyla yüklendi.`);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      setRamadanDays(generateSampleData(targetYear));
    } finally {
      setLoading(false);
    }
  };

  const fetchDistrictsByProvince = async (provinceName, autoSelect = false) => {
    setLoadingDistricts(true);
    try {
      const provinceRes = await fetch('https://ezanvakti.emushaf.net/sehirler/2');
      const provinceData = await provinceRes.json();
      const matchedProvince = (provinceData || []).find(
        (item) => normalizeText(item?.SehirAdi) === normalizeText(provinceName)
      );

      if (!matchedProvince?.SehirID) {
        setDistricts([]);
        return;
      }

      const districtRes = await fetch(`https://ezanvakti.emushaf.net/ilceler/${matchedProvince.SehirID}`);
      const districtData = await districtRes.json();
      const mappedDistricts = (districtData || [])
        .map((item) => ({
          id: Number(item.IlceID),
          name: formatDistrictName(item.IlceAdi),
        }))
        .sort((a, b) => {
          const aCenter = normalizeText(a.name).includes('merkez');
          const bCenter = normalizeText(b.name).includes('merkez');
          if (aCenter !== bCenter) return aCenter ? -1 : 1;
          return a.name.localeCompare(b.name, 'tr-TR');
        });

      setDistricts(mappedDistricts);

      if (autoSelect && mappedDistricts.length > 0) {
        const centerDistrict =
          mappedDistricts.find((item) => normalizeText(item.name).includes('merkez')) ||
          mappedDistricts[0];
        setSelectedDistrict(centerDistrict);
      }
    } catch (error) {
      console.error('İlçe verisi çekilemedi:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const generateSampleData = (year = selectedYear) => {
    const ramadanStart = new Date(year, 1, 19);
    const data = [];

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(ramadanStart);
      currentDate.setDate(ramadanStart.getDate() + i);

      const day = String(currentDate.getDate()).padStart(2, '0');
      const sahurHour = Math.max(2, 5 - Math.floor(i / 10));
      const sahurMin = Math.max(0, 37 - i);
      const iftarHour = 18 + Math.floor(i / 15);
      const iftarMin = Math.min(59, 42 + Math.floor(i / 3));

      data.push({
        day: String(i + 1).padStart(2, '0'),
        date: `${day} ${monthNames[currentDate.getMonth()]}`,
        dayName: dayNames[currentDate.getDay()],
        fullDate: formatDateKey(currentDate),
        sahur: `${String(sahurHour).padStart(2, '0')}:${String(sahurMin).padStart(2, '0')}`,
        iftar: `${String(iftarHour).padStart(2, '0')}:${String(iftarMin).padStart(2, '0')}`,
      });
    }

    return data;
  };

  useEffect(() => {
    fetchDistrictsByProvince(selectedProvince.name, true);
  }, []);

  useEffect(() => {
    if (!selectedDistrict?.name) return;
    fetchRamadanData(selectedProvince.name, selectedDistrict.name, selectedYear);
  }, [selectedProvince.name, selectedDistrict?.name, selectedYear]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [selectedYear, selectedProvince.name, selectedDistrict?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTodayKey(formatDateKey(new Date()));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleProvinceSelect = async (province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setRamadanDays([]);
    setSearchQuery('');
    setModalStep('district');
    await fetchDistrictsByProvince(province.name);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setSearchQuery('');
    setShowCityModal(false);
    setModalStep('province');
  };

  const renderDay = ({ item }) => {
    const isActiveDay = item.fullDate === todayKey;

    return (
    <View style={[styles.dayCard, isActiveDay && styles.activeDayCard]}>
      <View style={styles.cardContent}>
        <Text style={[styles.dayNumber, isActiveDay && styles.activeDayNumber]}>{item.day}</Text>

        <View style={styles.dateInfo}>
          <Text style={[styles.dateText, isActiveDay && styles.activeDateText]}>{item.date}</Text>
          <Text style={[styles.dayNameText, isActiveDay && styles.activeDayNameText]}>{item.dayName}</Text>
        </View>

        <Text style={[styles.sahurTime, isActiveDay && styles.activeSahurTime]}>{item.sahur}</Text>
        <Text style={[styles.iftarTime, isActiveDay && styles.activeIftarTime]}>{item.iftar}</Text>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#14b8a6" />

      <ImageBackground
        source={require('../assets/images/imsakiye_background_image.jpg')}
        style={styles.screenBackground}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['#00897B', '#26A69A', '#4DB6AC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerTop}
          >
            <TouchableOpacity onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>İmsakiye</Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.searchBox}
              onPress={() => {
                setModalStep('province');
                setSearchQuery('');
                setShowCityModal(true);
              }}
            >
              <Ionicons name="search" size={22} color="#26A69A" />
              <Text style={styles.searchText}>
                {selectedProvince.name} / {selectedDistrict?.name || 'İlçe seçin'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.yearSelector}>
            {availableYears.map((year) => {
              const isActive = selectedYear === year;
              return (
                <TouchableOpacity
                  key={year}
                  style={[styles.yearButton, isActive && styles.yearButtonActive]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[styles.yearButtonText, isActive && styles.yearButtonTextActive]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabBar}>
            <View style={styles.tabItem}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={27} color="#26A69A" />
              <Text style={styles.tabLabel}>Ramazan Günü</Text>
            </View>

            <View style={styles.tabItem}>
              <MaterialCommunityIcons name="calendar-blank" size={27} color="#26A69A" />
              <Text style={styles.tabLabel}>Tarih</Text>
            </View>

            <View style={styles.tabItem}>
              <Ionicons name="sunny" size={27} color="#26A69A" />
              <Text style={styles.tabLabel}>Sahur Vakti</Text>
            </View>

            <View style={styles.tabItem}>
              <MaterialCommunityIcons name="weather-night" size={27} color="#26A69A" />
              <Text style={styles.tabLabel}>İftar Vakti</Text>
            </View>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={ramadanDays}
            renderItem={renderDay}
            keyExtractor={(item) => item.day}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        )}
      </ImageBackground>

      <Modal
        visible={showCityModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {modalStep === 'district' && (
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => {
                      setModalStep('province');
                      setSearchQuery('');
                    }}
                  >
                    <Ionicons name="arrow-back" size={22} color="#14b8a6" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  {modalStep === 'district' ? `${selectedProvince.name} İlçeleri` : 'İl Seçin'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowCityModal(false);
                  setModalStep('province');
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close-circle" size={28} color="#14b8a6" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={modalStep === 'district' ? 'İlçe ara...' : 'İl ara...'}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.cityList}>
              {modalStep === 'province' ? (
                <>
                  {filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={styles.cityItem}
                      onPress={() => handleProvinceSelect(city)}
                    >
                      <Text style={styles.cityName}>{city.name}</Text>
                      {selectedProvince.id === city.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#14b8a6" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredCities.length === 0 && (
                    <Text style={styles.noResultText}>İl bulunamadı</Text>
                  )}
                </>
              ) : (
                <>
                  {loadingDistricts ? (
                    <View style={styles.districtLoadingWrap}>
                      <ActivityIndicator size="small" color="#14b8a6" />
                      <Text style={styles.districtLoadingText}>İlçeler yükleniyor...</Text>
                    </View>
                  ) : (
                    <>
                      {filteredDistricts.map((district) => (
                        <TouchableOpacity
                          key={district.id}
                          style={styles.cityItem}
                          onPress={() => handleDistrictSelect(district)}
                        >
                          <Text style={styles.cityName}>{district.name}</Text>
                          {selectedDistrict?.id === district.id && (
                            <Ionicons name="checkmark-circle" size={24} color="#14b8a6" />
                          )}
                        </TouchableOpacity>
                      ))}
                      {filteredDistricts.length === 0 && (
                        <Text style={styles.noResultText}>İlçe bulunamadı</Text>
                      )}
                    </>
                  )}
                </>
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
  screenBackground: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 8,
    gap: 10,
  },
  searchText: {
    fontSize: 18,
    color: '#26A69A',
    fontWeight: '700',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  yearButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  yearButtonActive: {
    backgroundColor: '#26A69A',
    borderColor: '#26A69A',
  },
  yearButtonText: {
    color: '#26A69A',
    fontSize: 15,
    fontWeight: '700',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    marginHorizontal: 10,
    marginTop: 6,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
  },
  tabLabel: {
    color: '#26A69A',
    fontSize: 10,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 1,
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
  activeDayCard: {
    backgroundColor: '#e8f8f6',
    borderWidth: 2,
    borderColor: '#26A69A',
    shadowColor: '#26A69A',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
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
  activeDayNumber: {
    color: '#0f766e',
  },
  activeDateText: {
    color: '#0f766e',
  },
  activeDayNameText: {
    color: '#0f766e',
  },
  activeSahurTime: {
    color: '#0f766e',
    fontWeight: '700',
  },
  activeIftarTime: {
    color: '#0f766e',
    fontWeight: '700',
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
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginTop: 50,
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  modalBackButton: {
    marginRight: 10,
    paddingVertical: 2,
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
  districtLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  districtLoadingText: {
    color: '#14b8a6',
    fontSize: 14,
    fontWeight: '600',
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
