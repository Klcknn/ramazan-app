import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../config/firebase';
import DailyContentDetail from './DailyContentDetail';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const DailyContentSlider = ({ isDarkMode, navigation }) => {
  const [dailyDua, setDailyDua] = useState(null);
  const [dailyHadis, setDailyHadis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const scrollViewRef = useRef(null);

  const theme = {
    cardBg: isDarkMode ? '#2d2d2d' : '#fff',
    text: isDarkMode ? '#fff' : '#333',
    textSecondary: isDarkMode ? '#aaa' : '#666',
    primary: '#14b8a6',
    accent: '#f59e0b',
  };

  useEffect(() => {
    fetchDailyContent();
  }, []);

  const fetchDailyContent = async () => {
    try {
      setLoading(true);

      // Günün duası ve hadisini random seç
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem('dailyContentDate');
      
      let savedDua = null;
      let savedHadis = null;

      // Eğer bugün için zaten seçildiyse cache'den al
      if (savedDate === today) {
        const duaStr = await AsyncStorage.getItem('dailyDua');
        const hadisStr = await AsyncStorage.getItem('dailyHadis');
        if (duaStr) savedDua = JSON.parse(duaStr);
        if (hadisStr) savedHadis = JSON.parse(hadisStr);
      }

      // Dua çek
      if (!savedDua) {
        const duasCollection = collection(db, 'duas');
        const duasSnapshot = await getDocs(duasCollection);
        const duas = [];
        duasSnapshot.forEach(doc => duas.push({ id: doc.id, ...doc.data() }));
        
        if (duas.length > 0) {
          const randomIndex = Math.floor(Math.random() * duas.length);
          savedDua = duas[randomIndex];
          await AsyncStorage.setItem('dailyDua', JSON.stringify(savedDua));
        }
      }

      // Hadis çek
      if (!savedHadis) {
        const hadislerCollection = collection(db, 'hadisler');
        const hadislerSnapshot = await getDocs(hadislerCollection);
        const hadisler = [];
        hadislerSnapshot.forEach(doc => hadisler.push({ id: doc.id, ...doc.data() }));
        
        if (hadisler.length > 0) {
          const randomIndex = Math.floor(Math.random() * hadisler.length);
          savedHadis = hadisler[randomIndex];
          await AsyncStorage.setItem('dailyHadis', JSON.stringify(savedHadis));
        }
      }

      // Tarihi kaydet
      await AsyncStorage.setItem('dailyContentDate', today);

      setDailyDua(savedDua);
      setDailyHadis(savedHadis);
    } catch (error) {
      console.error('Günlük içerik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_WIDTH);
    setActiveIndex(index);
  };

  const scrollToIndex = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * CARD_WIDTH,
      animated: true,
    });
    setActiveIndex(index);
  };

  const openDetail = (content, type) => {
    setSelectedContent(content);
    setSelectedType(type);
    setDetailVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.loadingCard, { backgroundColor: theme.cardBg }]}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Günlük içerik yükleniyor...
        </Text>
      </View>
    );
  }

  if (!dailyDua && !dailyHadis) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Günün Duası */}
        {dailyDua && (
          <View style={[styles.card, { backgroundColor: theme.cardBg, width: CARD_WIDTH }]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="book-open-variant" size={28} color={theme.primary} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.cardLabel, { color: theme.primary }]}>Günün Duası</Text>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {dailyDua.title}
                </Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={[styles.arabicText, { color: theme.text }]} numberOfLines={3}>
                {dailyDua.arabic}
              </Text>
              <Text style={[styles.turkishText, { color: theme.textSecondary }]} numberOfLines={3}>
                {dailyDua.turkish}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="book" size={14} color={theme.primary} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>Dua</Text>
              </View>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => openDetail(dailyDua, 'dua')}
              >
                <Text style={[styles.moreButtonText, { color: theme.primary }]}>Devamını Oku</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Günün Hadisi */}
        {dailyHadis && (
          <View style={[styles.card, { backgroundColor: theme.cardBg, width: CARD_WIDTH }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
                <MaterialCommunityIcons name="bookshelf" size={28} color={theme.accent} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.cardLabel, { color: theme.accent }]}>Günün Hadisi</Text>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {dailyHadis.title}
                </Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={[styles.arabicText, { color: theme.text }]} numberOfLines={2}>
                {dailyHadis.arabic}
              </Text>
              <Text style={[styles.turkishText, { color: theme.textSecondary }]} numberOfLines={4}>
                {dailyHadis.turkish}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={[styles.badge, { backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="bookmarks" size={14} color={theme.accent} />
                <Text style={[styles.badgeText, { color: theme.accent }]}>Hadis</Text>
              </View>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => openDetail(dailyHadis, 'hadis')}
              >
                <Text style={[styles.moreButtonText, { color: theme.accent }]}>Devamını Oku</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.accent} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {[0, 1].map((index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: activeIndex === index ? theme.primary : theme.textSecondary,
                width: activeIndex === index ? 20 : 8,
              },
            ]}
            onPress={() => scrollToIndex(index)}
          />
        ))}
      </View>

      {/* Detail Modal */}
      <DailyContentDetail
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        content={selectedContent}
        type={selectedType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  loadingCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#14b8a620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardContent: {
    marginBottom: 15,
    gap: 10,
  },
  arabicText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 28,
  },
  turkishText: {
    fontSize: 14,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
});

export default DailyContentSlider;
