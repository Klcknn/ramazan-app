import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';

const DuaScreen = ({ navigation }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedDua, setSelectedDua] = useState(null);
  const [showDuaModal, setShowDuaModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Dua kategorileri
  const categories = [
    { id: 'all', name: 'Tümü', icon: 'apps' },
    { id: 'morning', name: 'Sabah', icon: 'sunny' },
    { id: 'evening', name: 'Akşam', icon: 'moon' },
    { id: 'prayer', name: 'Namaz', icon: 'pray' },
    { id: 'meal', name: 'Yemek', icon: 'restaurant' },
    { id: 'travel', name: 'Yolculuk', icon: 'car' },
    { id: 'daily', name: 'Günlük', icon: 'calendar' },
  ];

  // Örnek dualar (Gerçek uygulamada API'den gelir)
  const duasData = [
    {
      id: '1',
      category: 'morning',
      title: 'Sabah Duası',
      arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
      turkish: 'Sabahladık, mülk Allahındır.',
      pronunciation: 'Asbahnâ ve asbahal-mulku lillâh',
      meaning: 'Allah a hamd ederek güne başlama duası.',
    },
    {
      id: '2',
      category: 'evening',
      title: 'Akşam Duası',
      arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
      turkish: 'Akşamladık, mülk Allah ındır.',
      pronunciation: 'Emseynâ ve emse l-mulku lillâh',
      meaning: 'Allah a hamd ederek akşama girme duası.',
    },
    {
      id: '3',
      category: 'meal',
      title: 'Yemek Öncesi Duası',
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
      turkish: 'Rahman ve Rahim olan Allah\'ın adıyla.',
      pronunciation: 'Bismillâhirrahmânirrahîm',
      meaning: 'Yemek yemeye başlamadan önce okunan dua.',
    },
    {
      id: '4',
      category: 'meal',
      title: 'Yemek Sonrası Duası',
      arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا',
      turkish: 'Bizi yedirip içiren Allah\'a hamdolsun.',
      pronunciation: 'Elhamdulillâhillezî at\'amenâ ve sekānâ',
      meaning: 'Yemek yedikten sonra şükür duası.',
    },
    {
      id: '5',
      category: 'travel',
      title: 'Yolculuk Duası',
      arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا',
      turkish: 'Bunu bize boyun eğdiren Allah\'ı tesbih ederiz.',
      pronunciation: 'Subhânallezî sehhara lenâ hâzâ',
      meaning: 'Yolculuğa çıkarken okunan dua.',
    },
    {
      id: '6',
      category: 'prayer',
      title: 'Ezan Duası',
      arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ',
      turkish: 'Allah\'ım! Bu tam davet ve kılınacak namazın Rabbi.',
      pronunciation: 'Allâhumme rabbe hâzihi\'d-da\'veti\'t-tâmmeh',
      meaning: 'Ezan sonrası okunan dua.',
    },
    {
      id: '7',
      category: 'daily',
      title: 'Güne Başlarken',
      arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
      turkish: 'Allah\'ım! Keder ve üzüntüden Sana sığınırım.',
      pronunciation: 'Allâhumme innî e\'ûzu bike mine\'l-hemmi ve\'l-hazen',
      meaning: 'Günlük sıkıntılardan korunma duası.',
    },
    {
      id: '8',
      category: 'daily',
      title: 'Uyumadan Önce',
      arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
      turkish: 'Allah\'ım! Senin adınla ölür ve dirilirim.',
      pronunciation: 'Bismike Allâhumme emûtu ve ahyâ',
      meaning: 'Yatmadan önce okunan dua.',
    },
  ];

  // Favorileri yükle
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favoriteDuas');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favoriteDuas', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Favoriler kaydedilemedi:', error);
    }
  };

  const toggleFavorite = (duaId) => {
    const isFavorite = favorites.includes(duaId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== duaId)
      : [...favorites, duaId];
    saveFavorites(newFavorites);
  };

  // Dua filtreleme
  const filteredDuas = duasData.filter(dua => {
    const matchesSearch = dua.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dua.turkish.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || dua.category === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Sesli okuma
  const speakDua = (dua) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const text = `${dua.title}. ${dua.pronunciation}. ${dua.turkish}`;
      Speech.speak(text, {
        language: 'tr',
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  // Paylaşma
  const shareDua = async (dua) => {
    try {
      const message = `${dua.title}\n\nArapça: ${dua.arabic}\n\nOkunuşu: ${dua.pronunciation}\n\nAnlamı: ${dua.turkish}\n\n${dua.meaning}`;
      await Share.share({
        message: message,
        title: dua.title,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  // Tema
  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#fff',
    cardBg: isDarkMode ? '#2d2d2d' : '#fff',
    text: isDarkMode ? '#fff' : '#333',
    textSecondary: isDarkMode ? '#aaa' : '#666',
    border: isDarkMode ? '#444' : '#e0e0e0',
    primary: '#14b8a6',
    accent: '#f59e0b',
  };

  // Dua kartı
  const renderDuaCard = ({ item }) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.duaCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => {
          setSelectedDua(item);
          setShowDuaModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.duaCardHeader}>
          <View style={styles.duaTitleContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color={theme.primary} />
            <Text style={[styles.duaTitle, { color: theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={24} 
              color={isFavorite ? '#ef4444' : theme.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.duaArabic, { color: theme.text, fontSize: fontSize + 4 }]} numberOfLines={2}>
          {item.arabic}
        </Text>

        <Text style={[styles.duaTurkish, { color: theme.textSecondary, fontSize: fontSize }]} numberOfLines={2}>
          {item.turkish}
        </Text>

        <View style={styles.duaCardFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
              {categories.find(c => c.id === item.category)?.name || 'Genel'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dualar</Text>
        <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Dua ara..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategoriler */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.name && styles.categoryButtonActive,
              { borderColor: theme.border },
            ]}
            onPress={() => setSelectedCategory(category.name)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={category.icon} 
              size={20} 
              color={selectedCategory === category.name ? '#fff' : theme.text} 
            />
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === category.name ? '#fff' : theme.text }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dua Listesi */}
      <FlatList
        data={filteredDuas}
        renderItem={renderDuaCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Dua bulunamadı
            </Text>
          </View>
        }
      />

      {/* Dua Detay Modal */}
      <Modal
        visible={showDuaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDuaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            {selectedDua && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {selectedDua.title}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDuaModal(false)}>
                    <Ionicons name="close" size={28} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {/* Yazı Boyutu Ayarı */}
                <View style={styles.fontSizeContainer}>
                  <Text style={[styles.fontSizeLabel, { color: theme.textSecondary }]}>
                    Yazı Boyutu
                  </Text>
                  <View style={styles.fontSizeButtons}>
                    <TouchableOpacity
                      style={[styles.fontButton, { borderColor: theme.border }]}
                      onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                    >
                      <Text style={{ color: theme.text }}>A-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.fontButton, { borderColor: theme.border }]}
                      onPress={() => setFontSize(Math.min(24, fontSize + 2))}
                    >
                      <Text style={{ color: theme.text }}>A+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Arapça */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      Arapça
                    </Text>
                    <Text style={[styles.duaArabicFull, { color: theme.text, fontSize: fontSize + 8 }]}>
                      {selectedDua.arabic}
                    </Text>
                  </View>

                  {/* Okunuşu */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      Okunuşu
                    </Text>
                    <Text style={[styles.duaPronunciation, { color: theme.text, fontSize: fontSize + 2 }]}>
                      {selectedDua.pronunciation}
                    </Text>
                  </View>

                  {/* Türkçe Meal */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      Türkçe Anlamı
                    </Text>
                    <Text style={[styles.duaMeaning, { color: theme.text, fontSize: fontSize }]}>
                      {selectedDua.turkish}
                    </Text>
                  </View>

                  {/* Açıklama */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      Açıklama
                    </Text>
                    <Text style={[styles.duaExplanation, { color: theme.textSecondary, fontSize: fontSize }]}>
                      {selectedDua.meaning}
                    </Text>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => speakDua(selectedDua)}
                  >
                    <Ionicons 
                      name={isSpeaking ? 'stop' : 'volume-high'} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.actionButtonText}>
                      {isSpeaking ? 'Durdur' : 'Sesli Oku'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.accent }]}
                    onPress={() => shareDua(selectedDua)}
                  >
                    <Ionicons name="share-social" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Paylaş</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: favorites.includes(selectedDua.id) ? '#ef4444' : '#6b7280' }]}
                    onPress={() => toggleFavorite(selectedDua.id)}
                  >
                    <Ionicons 
                      name={favorites.includes(selectedDua.id) ? 'heart' : 'heart-outline'} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.actionButtonText}>
                      {favorites.includes(selectedDua.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesScroll: {
    marginTop: 15,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8, // Butonların nefes alması için eklendi
    gap: 10,
    alignItems: 'center', // İçerikleri dikeyde ortalar
  },
  categoryButton: {
    marginTop: 1,
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // İçeriği ortalar
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 40, // Standart dokunma alanı (Touch Target) yüksekliği
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    minWidth: 80, // Çok kısa kelimelerde butonun çok daralmasını önler
  },
  categoryButtonActive: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlignVertical: 'center', // Android için metni dikeyde ortalar
    includeFontPadding: false, // Android'deki varsayılan yazı tipi boşluğunu kaldırır
  },
  listContainer: {
    padding: 15,
  },
  duaCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  duaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  duaTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  duaTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  duaArabic: {
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 10,
    lineHeight: 32,
  },
  duaTurkish: {
    lineHeight: 22,
    marginBottom: 10,
  },
  duaCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  fontSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  fontSizeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fontSizeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  fontButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  duaSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  duaArabicFull: {
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 40,
  },
  duaPronunciation: {
    fontStyle: 'italic',
    lineHeight: 26,
  },
  duaMeaning: {
    lineHeight: 26,
  },
  duaExplanation: {
    lineHeight: 24,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DuaScreen;