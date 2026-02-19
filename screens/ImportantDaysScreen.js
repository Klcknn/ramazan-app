import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ImportantDaysScreen({ navigation }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [importantDays, setImportantDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Önemli Dini Günler Şablonu (Hicri takvime göre sabit)
  const islamicDaysTemplate = [
    {
      name: 'Regaip Kandili',
      type: 'kandil',
      icon: '🌙',
      hijriMonth: 7, // Recep
      hijriDay: 1, // İlk Cuma gecesi
      description: 'Recep ayının ilk cuma gecesi olan Regaip Kandili, Allah\'a dua ve ibadetle geçirilir.',
      color: ['#7B1FA2', '#9C27B0'],
      prayers: ['Regaip namazı', 'İstiğfar', 'Salavat-ı şerife'],
    },
    {
      name: 'Miraç Kandili',
      type: 'kandil',
      icon: '✨',
      hijriMonth: 7, // Recep
      hijriDay: 26, // Kandil gecesi (27. gece), miladi güne 26 Recep denk gelir
      description: 'Hz. Muhammed\'in (SAV) Miraç\'a yükseldiği mübarek gece.',
      color: ['#1976D2', '#42A5F5'],
      prayers: ['Kandil namazı', 'Kur\'an okuma', 'Tesbih'],
    },
    {
      name: 'Berat Kandili',
      type: 'kandil',
      icon: '🌟',
      hijriMonth: 8, // Şaban
      hijriDay: 14, // Kandil gecesi (15. gece)
      description: 'Şaban ayının 15. gecesi, günahların bağışlandığı mübarek gece.',
      color: ['#7B1FA2', '#BA68C8'],
      prayers: ['Kandil namazı', 'Tesbih', 'İstiğfar', 'Dua'],
    },
    {
      name: 'Ramazan Başlangıcı',
      type: 'ramazan',
      icon: '🌙',
      hijriMonth: 9, // Ramazan
      hijriDay: 1,
      description: 'Ramazan ayının mübarek başlangıcı. Oruç ve ibadetle geçirilecek 30 gün.',
      color: ['#E91E63', '#F06292'],
      prayers: ['Teravih namazı', 'Sahur', 'İftar duası'],
    },
    {
      name: 'Kadir Gecesi',
      type: 'kandil',
      icon: '⭐',
      hijriMonth: 9, // Ramazan
      hijriDay: 26, // Kandil gecesi (27. gece)
      description: 'Bin aydan daha hayırlı olan Kadir Gecesi. Kur\'an-ı Kerim\'in indirildiği gece.',
      color: ['#FF6B6B', '#FFA94D'],
      prayers: ['Kandil namazı', 'Kur\'an okuma', 'Tesbih', 'Dua'],
    },
    {
      name: 'Ramazan Bayramı',
      type: 'bayram',
      icon: '🎉',
      hijriMonth: 10, // Şevval
      hijriDay: 1,
      description: 'Ramazan orucunun tamamlanmasının ardından kutlanan mübarek bayram.',
      color: ['#4CAF50', '#66BB6A'],
      prayers: ['Bayram namazı', 'Fitre sadakası', 'Ziyaretler'],
      duration: '3 gün',
    },
    {
      name: 'Arefe Günü',
      type: 'ozel',
      icon: '🕌',
      hijriMonth: 12, // Zilhicce
      hijriDay: 9,
      description: 'Hac ibadeti için kutsal gün. Oruç tutulması müstehaptır.',
      color: ['#FF5722', '#FF7043'],
      prayers: ['Arefe orucu', 'Dua', 'Tesbih'],
    },
    {
      name: 'Kurban Bayramı',
      type: 'bayram',
      icon: '🐑',
      hijriMonth: 12, // Zilhicce
      hijriDay: 10,
      description: 'Hz. İbrahim\'in Allah\'a olan teslimiyetini hatırlatan mübarek bayram.',
      color: ['#D32F2F', '#E57373'],
      prayers: ['Bayram namazı', 'Kurban kesimi', 'Ziyaretler'],
      duration: '4 gün',
    },
    {
      name: 'Hicri Yılbaşı',
      type: 'ozel',
      icon: '🌙',
      hijriMonth: 1, // Muharrem
      hijriDay: 1,
      description: 'İslam takviminin yeni yılı. Hz. Muhammed\'in (SAV) Mekke\'den Medine\'ye hicreti.',
      color: ['#00897B', '#26A69A'],
      prayers: ['Şükür namazı', 'Dua', 'Tesbih'],
    },
    {
      name: 'Aşure Günü',
      type: 'ozel',
      icon: '🍲',
      hijriMonth: 1, // Muharrem
      hijriDay: 10,
      description: 'Muharrem ayının 10. günü. Hz. Nuh\'un gemisinin karaya oturduğu gün.',
      color: ['#5E35B1', '#7E57C2'],
      prayers: ['Oruç', 'Aşure ikramı', 'Dua'],
    },
    {
      name: 'Mevlid Kandili',
      type: 'kandil',
      icon: '💫',
      hijriMonth: 3, // Rebiülevvel
      hijriDay: 11, // Kandil gecesi (12. gece)
      description: 'Hz. Muhammed\'in (SAV) doğum günü. Mevlid-i Nebi.',
      color: ['#00897B', '#4DB6AC'],
      prayers: ['Mevlid okuma', 'Salavat-ı şerife', 'Dua'],
    },
  ];

  // Seçili yıl için dini günleri hesapla
  useEffect(() => {
    calculateDaysForYear(selectedYear);
  }, [selectedYear]);

  const calculateDaysForYear = async (year) => {
    try {
      const monthRequests = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        return fetch(
          `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=Ankara&country=Turkey&method=13`
        ).then((res) => res.json());
      });

      const monthResults = await Promise.all(monthRequests);
      const allDays = monthResults.flatMap((result) => (Array.isArray(result?.data) ? result.data : []));
      const days = [];

      islamicDaysTemplate.forEach((template) => {
        const matchedDay = allDays.find(
          (item) =>
            Number(item?.date?.hijri?.month?.number) === template.hijriMonth &&
            Number(item?.date?.hijri?.day) === template.hijriDay
        );

        if (!matchedDay) {
          return;
        }

        const gDay = Number(matchedDay?.date?.gregorian?.day);
        const gMonth = Number(matchedDay?.date?.gregorian?.month?.number) - 1;
        const gYear = Number(matchedDay?.date?.gregorian?.year) || year;
        const gregorianDate = new Date(gYear, gMonth, gDay);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayDate = new Date(gregorianDate);
        dayDate.setHours(0, 0, 0, 0);

        const diffTime = dayDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        days.push({
          ...template,
          gregorianDate,
          formattedDate: gregorianDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          daysLeft: diffDays,
          isPast: diffDays < 0,
          isToday: diffDays === 0,
          isTomorrow: diffDays === 1,
        });
      });

      // Tarihe göre sırala
      days.sort((a, b) => a.gregorianDate - b.gregorianDate);
      setImportantDays(days);
    } catch (error) {
      console.error('Dini günler hesaplanamadı:', error);
      setImportantDays([]);
    }
  };

  const getDaysLeftText = (day) => {
    if (day.isToday) return 'Bugün';
    if (day.isTomorrow) return 'Yarın';
    if (day.isPast) return 'Geçti';
    return `${day.daysLeft} gün sonra`;
  };

  // Yıl seçenekleri (2026-2030)
  const years = [2026, 2027, 2028, 2029, 2030];

  const handleDayPress = (day) => {
    setSelectedDay(day);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00897B', '#26A69A', '#4DB6AC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Önemli Dini Günler</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Yıl Seçici */}
      <View style={styles.yearSelectorContainer}>
        <View style={styles.yearSelectorRow}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearChip,
                selectedYear === year && styles.yearChipActive,
              ]}
              onPress={() => setSelectedYear(year)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.yearChipText,
                selectedYear === year && styles.yearChipTextActive,
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dini Günler Listesi */}
      <ScrollView 
        style={styles.daysContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.daysContent}
      >
        {importantDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayRow,
              day.isPast && styles.dayRowPast,
            ]}
            onPress={() => handleDayPress(day)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.dayIconContainer,
              day.isPast && styles.dayIconContainerPast,
            ]}>
              <Text style={styles.dayIcon}>{day.icon}</Text>
            </View>

            <View style={styles.dayInfo}>
              <Text style={[
                styles.dayName,
                day.isPast && styles.dayNamePast,
              ]}>
                {day.name}
              </Text>
              <Text style={[
                styles.dayDate,
                day.isPast && styles.dayDatePast,
              ]}>
                📅 {day.formattedDate}
              </Text>
              {day.duration && (
                <Text style={[
                  styles.dayDuration,
                  day.isPast && styles.dayDatePast,
                ]}>
                  ⏰ {day.duration}
                </Text>
              )}
            </View>

            <View style={[
              styles.dayBadge,
              day.isPast && styles.dayBadgePast,
              day.isToday && styles.dayBadgeToday,
              day.isTomorrow && styles.dayBadgeTomorrow,
            ]}>
              <Text style={[
                styles.dayBadgeText,
                day.isPast && styles.dayBadgeTextPast,
              ]}>
                {getDaysLeftText(day)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detay Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDay && (
              <>
                <LinearGradient
                  colors={selectedDay.color}
                  style={styles.modalHeader}
                >
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.modalIconContainer}>
                    <Text style={styles.modalIcon}>{selectedDay.icon}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedDay.name}</Text>
                  <Text style={styles.modalDate}>📅 {selectedDay.formattedDate}</Text>
                </LinearGradient>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>📖 Gün Bilgisi</Text>
                    <Text style={styles.infoSectionText}>{selectedDay.description}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>✅ Bu Günde Yapılacaklar</Text>
                    {(selectedDay.prayers || []).map((item, idx) => (
                      <View key={idx} style={styles.todoItem}>
                        <Text style={styles.todoBullet}>•</Text>
                        <Text style={styles.todoText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.infoSection, styles.hadithSection]}>
                    <Text style={styles.infoSectionTitle}>ℹ️ Kısa Özet</Text>
                    <Text style={styles.hadithText}>
                      {selectedDay.duration ? `${selectedDay.duration} süren mübarek günlerdendir. ` : ''}
                      Durum: {getDaysLeftText(selectedDay)}
                    </Text>
                  </View>

                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  yearSelectorContainer: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yearChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  yearChipActive: {
    backgroundColor: '#26A69A',
    borderColor: '#26A69A',
  },
  yearChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26A69A',
  },
  yearChipTextActive: {
    color: '#fff',
  },
  daysContainer: {
    flex: 1,
  },
  daysContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayRowPast: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  dayIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayIconContainerPast: {
    backgroundColor: '#E0E0E0',
  },
  dayIcon: {
    fontSize: 22,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dayNamePast: {
    color: '#999',
  },
  dayDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  dayDatePast: {
    color: '#999',
  },
  dayDuration: {
    fontSize: 12,
    color: '#00897B',
    fontWeight: '600',
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
  },
  dayBadgePast: {
    backgroundColor: '#E0E0E0',
  },
  dayBadgeToday: {
    backgroundColor: '#4CAF50',
  },
  dayBadgeTomorrow: {
    backgroundColor: '#FFC107',
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00897B',
  },
  dayBadgeTextPast: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  modalBody: {
    padding: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoSectionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  todoItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 8,
  },
  todoBullet: {
    fontSize: 18,
    color: '#00897B',
    marginRight: 10,
    marginTop: 2,
  },
  todoText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  hadithSection: {
    backgroundColor: '#E0F2F1',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00897B',
  },
  hadithText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});


