import { createResponsiveStyles } from '../hooks/responsive-styles';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../context/LocalizationContext';
import { useAppTheme } from '../hooks/use-app-theme';

const RamadanCalendarScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const softScale = clamp(width / 393, 0.92, 1.05);
  const rs = (value, factor = 1) => Math.round(value * (1 + (softScale - 1) * factor));
  const textScale = clamp(softScale, 0.92, 1.0);
  const scaleText = (value) => Math.round(value * textScale);
  const listBottomPadding = Math.max(rs(118, 1), insets.bottom + rs(104, 1));
  const headerTopPadding = Math.max(rs(50, 1), insets.top + rs(8, 0.9));
  const dayColWidth = rs(52, 0.95);
  const timeColWidth = rs(74, 0.95);
  const rowEstimatedHeight = rs(74, 0.9);
  const modalTopMargin = Math.max(insets.top + rs(8, 0.9), rs(44, 0.9));
  const modalMaxHeight = Math.min(
    Math.round(height * 0.82),
    height - modalTopMargin - insets.bottom - rs(12, 0.8)
  );
  const modalRowMaxWidth = Math.min(Math.round(width * 0.84), 480);
  const modalRowVerticalPadding = clamp(Math.round(width * 0.016), 6, 10);
  const modalRowHorizontalPadding = clamp(Math.round(width * 0.04), 14, 20);
  // Aladhan-Diyanet tarih farkı görülen yıllar için gösterim düzeltmesi (gün)
  const YEAR_DISPLAY_SHIFT_DAYS = {
    2026: 1,
  };
  const OFFICIAL_RAMADAN_DAY_COUNT_BY_YEAR = {
    2026: 29,
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const availableYears = [2026, 2027, 2028, 2029, 2030];
  const currentYear = new Date().getFullYear();
  const initialYear = availableYears.includes(currentYear) ? currentYear : 2026;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState({ name: 'Kars', id: 9597 });
  const [selectedDistrict, setSelectedDistrict] = useState({ name: 'Kars', id: 9597 });
  const [districts, setDistricts] = useState([]);
  const [modalStep, setModalStep] = useState('province');
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedYear, setSelectedYear] = useState(initialYear);
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

  const formatDottedDateToKey = (value) => {
    const [day, month, year] = String(value || '').split('.');
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const fetchRamadanData = async (provinceName, districtName, year, districtId) => {
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
          `https://api.aladhan.com/v1/calendarByCity/${targetYear}/${month}?city=${provinceQuery}&state=${districtQuery}&country=Turkey&method=13`
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

      let officialTimesByDate = {};
      let officialTimesByRamadanDay = {};
      const resolvedDistrictId =
        districtId ||
        selectedDistrict?.id ||
        districts.find((item) => normalizeText(item?.name) === normalizeText(activeDistrict))?.id ||
        cities.find((item) => normalizeText(item?.name) === normalizeText(activeProvince))?.id;
      const mapOfficialTimes = (list) => {
        if (!Array.isArray(list)) return;
        officialTimesByDate = list.reduce((acc, entry) => {
          const dateKey = formatDottedDateToKey(entry?.MiladiTarihKisa);
          if (!dateKey) return acc;
          if (acc[dateKey]) return acc;
          acc[dateKey] = {
            imsak: String(entry?.Imsak || '').slice(0, 5),
            aksam: String(entry?.Aksam || '').slice(0, 5),
          };
          return acc;
        }, {});

        officialTimesByRamadanDay = list.reduce((acc, entry) => {
          const [hijriDay, hijriMonth] = String(entry?.HicriTarihKisa || '')
            .split('.')
            .map((x) => Number(x));
          if (hijriMonth !== 9 || !Number.isInteger(hijriDay)) return acc;
          if (acc[hijriDay]) return acc;
          acc[hijriDay] = {
            imsak: String(entry?.Imsak || '').slice(0, 5),
            aksam: String(entry?.Aksam || '').slice(0, 5),
          };
          return acc;
        }, {});
      };

      if (resolvedDistrictId) {
        try {
          const officialRes = await fetch(`https://ezanvakti.emushaf.net/vakitler/${resolvedDistrictId}`);
          const officialJson = await officialRes.json();
          mapOfficialTimes(officialJson);
        } catch (officialError) {
          console.warn('Diyanet vakitleri alınamadı, Aladhan verisi kullanılacak:', officialError);
        }
      }

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

      const officialDayCount = OFFICIAL_RAMADAN_DAY_COUNT_BY_YEAR[targetYear];
      const displayGroup = Number.isInteger(officialDayCount)
        ? finalGroup.slice(0, officialDayCount)
        : finalGroup;

      // Diyanet vakitlerini seçili yılın Ramazan başlangıcına göre yeniden çek.
      // İl/ilçe bazında doğru Ramazan dilimi alınarak gün kaymaları engellenir.
      if (resolvedDistrictId && displayGroup.length > 0) {
        const startDateKey = formatDateKey(getGregorianDate(displayGroup[0]));
        try {
          const scopedRes = await fetch(
            `https://ezanvakti.emushaf.net/vakitler/${resolvedDistrictId}?date=${startDateKey}`
          );
          const scopedJson = await scopedRes.json();
          mapOfficialTimes(scopedJson);
        } catch (scopedError) {
          console.warn('Yıl bazlı Diyanet vakitleri alınamadı, mevcut veriler kullanılacak:', scopedError);
        }
      }

      const fullRamadanData = displayGroup.map((item, index) => {
        const gDate = getGregorianDate(item);
        const displayDate = new Date(gDate);

        const shiftDays = YEAR_DISPLAY_SHIFT_DAYS[targetYear] || 0;
        if (shiftDays !== 0) {
          displayDate.setDate(displayDate.getDate() + shiftDays);
        }

        const gDay = displayDate.getDate();
        const gMonth = displayDate.getMonth();

        const sourceDateKey = formatDateKey(gDate);
        const displayDateKey = formatDateKey(displayDate);
        // 2026 gibi görüntü tarihi kaydırılan yıllarda, kullanıcıya gösterilen tarih ile
        // Diyanet saatinin birebir eşleşmesi için önce displayDate anahtarını kullan.
        const officialByDate = officialTimesByDate[displayDateKey] || officialTimesByDate[sourceDateKey];
        const officialByRamadanDay = officialTimesByRamadanDay[index + 1];

        return {
          day: String(index + 1).padStart(2, '0'),
          date: `${gDay} ${monthNames[gMonth]}`,
          dayName: dayNames[displayDate.getDay()],
          fullDate: displayDateKey,
          sahur:
            officialByDate?.imsak ||
            officialByRamadanDay?.imsak ||
            item?.timings?.Imsak?.split(' ')[0] ||
            '--:--',
          iftar:
            officialByDate?.aksam ||
            officialByRamadanDay?.aksam ||
            item?.timings?.Maghrib?.split(' ')[0] ||
            '--:--',
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
        const defaultDistrict =
          normalizeText(provinceName) === 'kars'
            ? mappedDistricts.find((item) => normalizeText(item.name) === 'kars')
            : mappedDistricts.find((item) => normalizeText(item.name).includes('merkez'));

        setSelectedDistrict(defaultDistrict || mappedDistricts[0]);
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

    const daysCount = OFFICIAL_RAMADAN_DAY_COUNT_BY_YEAR[year] || 30;
    for (let i = 0; i < daysCount; i++) {
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
    fetchRamadanData(selectedProvince.name, selectedDistrict.name, selectedYear, selectedDistrict?.id);
  }, [selectedProvince.name, selectedDistrict?.id, selectedDistrict?.name, selectedYear]);

  useEffect(() => {
    if (!ramadanDays.length || !listRef.current) return;

    const activeIndex = ramadanDays.findIndex((item) => item.fullDate === todayKey);
    const targetIndex = activeIndex >= 0 ? activeIndex : 0;

    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.35,
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [ramadanDays, selectedDistrict?.id, selectedProvince.name, selectedYear, todayKey]);

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
    const activeDarkTextColor = '#111111';
    const listTextColor = isActiveDay && theme.darkMode ? activeDarkTextColor : theme.darkMode ? '#FFFFFF' : theme.text;
    const listSubTextColor = isActiveDay && theme.darkMode ? activeDarkTextColor : theme.darkMode ? '#FFFFFF' : theme.textMuted;

    return (
    <View style={[styles.dayCard, { backgroundColor: theme.surface }, isActiveDay && styles.activeDayCard]}>
      <View style={[styles.cardContent, { paddingHorizontal: rs(10, 0.95), paddingVertical: rs(7, 0.95), gap: rs(6, 0.9) }]}>
        <Text
          style={[
            styles.dayNumber,
            {
              color: listTextColor,
              fontSize: scaleText(18),
              width: dayColWidth,
              marginLeft: 0,
              textAlign: 'center',
            },
            isActiveDay && !theme.darkMode && styles.activeDayNumber,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
          allowFontScaling={false}
        >
          {item.day}
        </Text>

        <View style={[styles.dateInfo, { marginLeft: 0, paddingHorizontal: 0 }]}>
          <Text
            style={[styles.dateText, { color: listSubTextColor, fontSize: scaleText(15), marginLeft: 0, textAlign: 'center' }, isActiveDay && !theme.darkMode && styles.activeDateText]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.88}
            allowFontScaling={false}
          >
            {item.date}
          </Text>
          <Text
            style={[styles.dayNameText, { color: listSubTextColor, fontSize: scaleText(13), marginLeft: 0, textAlign: 'center' }, isActiveDay && !theme.darkMode && styles.activeDayNameText]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.88}
            allowFontScaling={false}
          >
            {item.dayName}
          </Text>
        </View>

        <Text
          style={[
            styles.sahurTime,
            {
              color: isActiveDay && theme.darkMode ? activeDarkTextColor : theme.darkMode ? '#FFFFFF' : '#333',
              fontSize: scaleText(17),
              width: timeColWidth,
              marginRight: 0,
              textAlign: 'center',
            },
            isActiveDay && !theme.darkMode && styles.activeSahurTime,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
          allowFontScaling={false}
        >
          {item.sahur}
        </Text>
        <Text
          style={[
            styles.iftarTime,
            {
              color: isActiveDay && theme.darkMode ? activeDarkTextColor : theme.darkMode ? '#FFFFFF' : '#14b8a6',
              fontSize: scaleText(17),
              width: timeColWidth,
              marginRight: 0,
              textAlign: 'center',
            },
            isActiveDay && !theme.darkMode && styles.activeIftarTime,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
          allowFontScaling={false}
        >
          {item.iftar}
        </Text>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.darkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/imsakiye_background_image.jpg')}
        style={styles.screenBackground}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <LinearGradient
            colors={theme.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.headerTop, { paddingHorizontal: rs(15, 0.9), paddingVertical: rs(14, 0.9), paddingTop: headerTopPadding }]}
          >
            <TouchableOpacity onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={rs(24, 0.9)} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74} allowFontScaling={false}>{t('headers.ramadan')}</Text>
            <View style={{ width: rs(24, 0.9) }} />
          </LinearGradient>

          <View style={styles.topBar}>
            <TouchableOpacity
              style={[styles.searchBox, { backgroundColor: theme.surface, paddingHorizontal: rs(14, 0.9), paddingVertical: rs(11, 0.9), borderRadius: rs(12, 0.9), marginTop: rs(8, 0.9), gap: rs(8, 0.8) }]}
              onPress={() => {
                setModalStep('province');
                setSearchQuery('');
                setShowCityModal(true);
              }}
            >
              <Ionicons name="search" size={rs(22, 0.9)} color="#26A69A" />
              <Text style={[styles.searchText, { color: theme.text, fontSize: scaleText(16) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} allowFontScaling={false}>
                {selectedProvince.name} / {selectedDistrict?.name || t('ramadan.selectDistrict')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.yearSelector, { paddingHorizontal: rs(10, 0.9), paddingTop: rs(10, 0.9), paddingBottom: rs(6, 0.9), gap: rs(8, 0.8) }]}>
            {availableYears.map((year) => {
              const isActive = selectedYear === year;
              return (
                <TouchableOpacity
                  key={year}
                  style={[styles.yearButton, { borderColor: theme.border, paddingVertical: rs(9, 0.9), borderRadius: rs(16, 0.9) }, isActive && styles.yearButtonActive]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[styles.yearButtonText, { color: theme.textMuted, fontSize: scaleText(13) }, isActive && styles.yearButtonTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} allowFontScaling={false}>
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.tabBar, { paddingTop: rs(8, 0.9), marginHorizontal: rs(10, 0.9), marginTop: rs(6, 0.9), paddingVertical: rs(10, 0.9), borderRadius: rs(16, 0.9), paddingHorizontal: rs(10, 0.95), gap: rs(6, 0.9) }]}>
            <View style={[styles.tabItem, { width: dayColWidth }]}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={rs(27, 0.9)} color="#26A69A" />
              <Text style={[styles.tabLabel, { fontSize: scaleText(10) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} allowFontScaling={false}>{t('ramadan.day')}</Text>
            </View>

            <View style={[styles.tabItem, styles.tabDateItem]}>
              <MaterialCommunityIcons name="calendar-blank" size={rs(27, 0.9)} color="#26A69A" />
              <Text style={[styles.tabLabel, { fontSize: scaleText(10) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} allowFontScaling={false}>{t('ramadan.date')}</Text>
            </View>

            <View style={[styles.tabItem, { width: timeColWidth }]}>
              <Ionicons name="sunny" size={rs(27, 0.9)} color="#26A69A" />
              <Text style={[styles.tabLabel, { fontSize: scaleText(10) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} allowFontScaling={false}>{t('ramadan.sahur')}</Text>
            </View>

            <View style={[styles.tabItem, { width: timeColWidth }]}>
              <MaterialCommunityIcons name="weather-night" size={rs(27, 0.9)} color="#26A69A" />
              <Text style={[styles.tabLabel, { fontSize: scaleText(10) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} allowFontScaling={false}>{t('ramadan.iftar')}</Text>
            </View>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={[styles.loadingText, { color: theme.textMuted, fontSize: scaleText(14) }]} allowFontScaling={false}>{t('ramadan.loading')}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={ramadanDays}
            renderItem={renderDay}
            keyExtractor={(item) => item.day}
            contentContainerStyle={[styles.listContent, { paddingHorizontal: rs(10, 0.9), paddingTop: rs(2, 0.8), paddingBottom: listBottomPadding }]}
            showsVerticalScrollIndicator={true}
            ListFooterComponent={<View style={{ height: rs(16, 0.8) }} />}
            onScrollToIndexFailed={({ index }) => {
              setTimeout(() => {
                listRef.current?.scrollToOffset({
                  offset: Math.max(0, index * rowEstimatedHeight),
                  animated: true,
                });
              }, 120);
            }}
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
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                marginTop: modalTopMargin,
                maxHeight: modalMaxHeight,
                paddingTop: rs(10, 0.85),
              },
            ]}
          >
            <View style={[styles.modalHeader, { paddingHorizontal: rs(20, 0.9), marginBottom: rs(10, 0.9) }]}>
              <View style={styles.modalHeaderLeft}>
                {modalStep === 'district' && (
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => {
                      setModalStep('province');
                      setSearchQuery('');
                    }}
                  >
                    <Ionicons name="arrow-back" size={rs(22, 0.9)} color={theme.accent} />
                  </TouchableOpacity>
                )}
                <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaleText(20) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} allowFontScaling={false}>
                  {modalStep === 'district' ? t('ramadan.districtTitle', { province: selectedProvince.name }) : t('ramadan.provinceTitle')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowCityModal(false);
                  setModalStep('province');
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close-circle" size={rs(28, 0.9)} color={theme.accent} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.modalSearchBox,
                {
                  backgroundColor: theme.surfaceSoft,
                  marginHorizontal: rs(15, 0.9),
                  marginBottom: rs(15, 0.9),
                  paddingHorizontal: rs(15, 0.9),
                  paddingVertical: rs(6, 0.85),
                  borderRadius: rs(12, 0.9),
                  gap: rs(10, 0.8),
                },
              ]}
            >
              <Ionicons name="search" size={rs(20, 0.9)} color={theme.textMuted} />
              <TextInput
                style={[styles.modalSearchInput, { color: theme.text, fontSize: scaleText(16) }]}
                placeholder={modalStep === 'district' ? t('ramadan.searchDistrict') : t('ramadan.searchProvince')}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                allowFontScaling={false}
              />
            </View>

            <ScrollView style={[styles.cityList, { maxHeight: Math.max(rs(320, 0.9), modalMaxHeight - rs(130, 0.9)) }]}>
              {modalStep === 'province' ? (
                <>
                  {filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        styles.cityItem,
                        {
                          paddingVertical: modalRowVerticalPadding,
                          paddingHorizontal: modalRowHorizontalPadding,
                          maxWidth: modalRowMaxWidth,
                          marginBottom: rs(5, 0.75),
                        },
                      ]}
                      onPress={() => handleProvinceSelect(city)}
                    >
                      <Text style={[styles.cityName, { color: theme.text, fontSize: scaleText(16) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} allowFontScaling={false}>{city.name}</Text>
                      {selectedProvince.id === city.id && (
                        <Ionicons name="checkmark-circle" size={rs(24, 0.9)} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {filteredCities.length === 0 && (
                    <Text style={[styles.noResultText, { color: theme.textMuted, fontSize: scaleText(16), padding: rs(30, 0.9) }]} allowFontScaling={false}>{t('ramadan.provinceNotFound')}</Text>
                  )}
                </>
              ) : (
                <>
                  {loadingDistricts ? (
                    <View style={styles.districtLoadingWrap}>
                      <ActivityIndicator size="small" color={theme.accent} />
                      <Text style={[styles.districtLoadingText, { color: theme.textMuted, fontSize: scaleText(14) }]} allowFontScaling={false}>{t('ramadan.districtsLoading')}</Text>
                    </View>
                  ) : (
                    <>
                      {filteredDistricts.map((district) => (
                        <TouchableOpacity
                          key={district.id}
                          style={[
                            styles.cityItem,
                            {
                              paddingVertical: modalRowVerticalPadding,
                              paddingHorizontal: modalRowHorizontalPadding,
                              maxWidth: modalRowMaxWidth,
                              marginBottom: rs(5, 0.75),
                            },
                          ]}
                          onPress={() => handleDistrictSelect(district)}
                        >
                          <Text style={[styles.cityName, { color: theme.text, fontSize: scaleText(16) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} allowFontScaling={false}>{district.name}</Text>
                          {selectedDistrict?.id === district.id && (
                            <Ionicons name="checkmark-circle" size={rs(24, 0.9)} color={theme.accent} />
                          )}
                        </TouchableOpacity>
                      ))}
                      {filteredDistricts.length === 0 && (
                        <Text style={[styles.noResultText, { color: theme.textMuted, fontSize: scaleText(16), padding: rs(30, 0.9) }]} allowFontScaling={false}>{t('ramadan.districtNotFound')}</Text>
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

const styles = createResponsiveStyles({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    alignItems: 'center',
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
    justifyContent: 'center',
    gap: 5,
  },
  tabDateItem: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
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
    alignSelf: 'center',
    width: '90%',
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
    width: '94%',
    alignSelf: 'center',
    minHeight: 38,
    borderRadius: 12,
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





