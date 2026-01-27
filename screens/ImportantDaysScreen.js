import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { scheduleImportantDayNotifications } from '../services/notificationService';

const { width } = Dimensions.get('window');

export default function ImportantDaysScreen({ navigation }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [importantDays, setImportantDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Hicri takvim yaklaşık hesaplama (basitleştirilmiş)
  // Not: Gerçek uygulamada moment-hijri gibi kütüphane kullanılmalı
  const getIslamicDate = (gregorianDate, hijriYear, hijriMonth, hijriDay) => {
    // Basit hesaplama - gerçek uygulama için API kullanın
    const baseDate = new Date('2026-01-01');
    const hijriBaseYear = 1447;
    const yearDiff = hijriYear - hijriBaseYear;
    const approximateDays = yearDiff * 354; // Hicri yıl ~354 gün
    
    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + approximateDays + (hijriMonth * 29) + hijriDay);
    
    return targetDate;
  };

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
      hijriDay: 27,
      description: 'Hz. Muhammed\'in (SAV) Miraç\'a yükseldiği mübarek gece.',
      color: ['#1976D2', '#42A5F5'],
      prayers: ['Kandil namazı', 'Kur\'an okuma', 'Tesbih'],
    },
    {
      name: 'Berat Kandili',
      type: 'kandil',
      icon: '🌟',
      hijriMonth: 8, // Şaban
      hijriDay: 15,
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
      hijriDay: 27,
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
      hijriDay: 12,
      description: 'Hz. Muhammed\'in (SAV) doğum günü. Mevlid-i Nebi.',
      color: ['#00897B', '#4DB6AC'],
      prayers: ['Mevlid okuma', 'Salavat-ı şerife', 'Dua'],
    },
  ];

  // Seçili yıl için dini günleri hesapla
  useEffect(() => {
    calculateDaysForYear(selectedYear);
  }, [selectedYear]);

  const calculateDaysForYear = (year) => {
    const days = [];
    const hijriYear = 1447 + (year - 2026); // Yaklaşık hicri yıl

    // 2026 yılı için sabit tarihler (referans)
    const referenceDates2026 = {
      'Regaip Kandili': new Date('2026-01-16'),
      'Miraç Kandili': new Date('2026-02-13'),
      'Berat Kandili': new Date('2026-02-28'),
      'Ramazan Başlangıcı': new Date('2026-03-01'),
      'Kadir Gecesi': new Date('2026-03-27'),
      'Ramazan Bayramı': new Date('2026-03-31'),
      'Arefe Günü': new Date('2026-06-06'),
      'Kurban Bayramı': new Date('2026-06-07'),
      'Hicri Yılbaşı': new Date('2026-06-27'),
      'Aşure Günü': new Date('2026-07-06'),
      'Mevlid Kandili': new Date('2026-09-04'),
    };

    islamicDaysTemplate.forEach((template) => {
      let gregorianDate;
      
      if (year === 2026) {
        // 2026 için sabit tarihler
        gregorianDate = referenceDates2026[template.name];
      } else {
        // Diğer yıllar için yaklaşık hesaplama (hicri takvim ~354 gün)
        const referenceDate = referenceDates2026[template.name];
        const yearDiff = year - 2026;
        const approximateDays = yearDiff * 354; // Hicri yıl Miladi yıldan ~11 gün kısa
        
        gregorianDate = new Date(referenceDate);
        gregorianDate.setDate(gregorianDate.getDate() + approximateDays);
      }

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
      <LinearGradient colors={['#7B1FA2', '#9C27B0']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📅 Önemli Dini Günler</Text>
          <Text style={styles.headerSubtitle}>İslami takvim • Yıllık liste</Text>
        </View>
      </LinearGradient>

      {/* Yıl Seçici */}
      <View style={styles.yearSelectorContainer}>
        <Text style={styles.yearLabel}>Yıl Seçin:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearChipsContainer}
        >
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
        </ScrollView>
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
                  <Text style={styles.modalTitle}>{selectedDay.detailedInfo.title}</Text>
                  <Text style={styles.modalDate}>📅 {selectedDay.formattedDate}</Text>
                </LinearGradient>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Anlamı */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>📖 Anlamı</Text>
                    <Text style={styles.infoSectionText}>{selectedDay.detailedInfo.meaning}</Text>
                  </View>

                  {/* Önemi */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>⭐ Önemi</Text>
                    <Text style={styles.infoSectionText}>{selectedDay.detailedInfo.importance}</Text>
                  </View>

                  {/* Yapılacaklar */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>✅ Bu Günde Yapılacaklar</Text>
                    {selectedDay.detailedInfo.whatToDo.map((item, idx) => (
                      <View key={idx} style={styles.todoItem}>
                        <Text style={styles.todoBullet}>•</Text>
                        <Text style={styles.todoText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Hadis */}
                  <View style={[styles.infoSection, styles.hadithSection]}>
                    <Text style={styles.infoSectionTitle}>📿 Hadis-i Şerif</Text>
                    <Text style={styles.hadithText}>{selectedDay.detailedInfo.hadith}</Text>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  yearSelectorContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  yearLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  yearChipsContainer: {
    gap: 10,
  },
  yearChip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  yearChipActive: {
    backgroundColor: '#7B1FA2',
    borderColor: '#7B1FA2',
  },
  yearChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
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
    padding: 16,
    marginBottom: 12,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dayIconContainerPast: {
    backgroundColor: '#E0E0E0',
  },
  dayIcon: {
    fontSize: 28,
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
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    padding: 30,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 40,
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
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00897B',
  },
  hadithText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});