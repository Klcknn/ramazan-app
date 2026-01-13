import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
// Firebase Web SDK import
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase'; // Firebase config dosyanızın yolu

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

  // Firebase state
  const [duasData, setDuasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dua kategorileri
  const categories = [
    { id: 'all', name: 'Tümü', icon: 'apps' },
    { id: 'sabah', name: 'Sabah', icon: 'sunny' },
    { id: 'aksam', name: 'Akşam', icon: 'moon' },
    { id: 'namaz', name: 'Namaz', icon: 'book' },
    { id: 'yemek', name: 'Yemek', icon: 'restaurant' },
    { id: 'yolculuk', name: 'Yolculuk', icon: 'car' },
    { id: 'uyku', name: 'Uyku', icon: 'bed' },
    { id: 'gunluk', name: 'Günlük', icon: 'calendar' },
    { id: 'kuran', name: 'Kuran', icon: 'book-outline' },
    { id: 'peygamber', name: 'Peygamber', icon: 'star' },
  ];

  // Component mount olduğunda
  useEffect(() => {
    loadFavorites();
    fetchDuasFromFirebase();
  }, []);

  // Firebase'den duaları çek
  const fetchDuasFromFirebase = async () => {
    try {
      setLoading(true);
      console.log('🔥 Firebase\'den dualar çekiliyor...');

      const duasCollection = collection(db, 'duas');
      const q = query(duasCollection, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);

      const duasArray = [];
      querySnapshot.forEach((doc) => {
        duasArray.push({
          firestoreId: doc.id,
          id: doc.id,
          ...doc.data(),
        });
      });

      setDuasData(duasArray);
      console.log(`✅ ${duasArray.length} dua başarıyla yüklendi`);
    } catch (error) {
      console.error('❌ Firebase hatası:', error);
      console.error('Hata detayı:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kategoriye göre filtrele
  const fetchDuasByCategory = async (categoryId) => {
    if (categoryId === 'all') {
      fetchDuasFromFirebase();
      return;
    }

    try {
      setLoading(true);
      console.log(`🔥 "${categoryId}" kategorisi yükleniyor...`);

      // Tüm duaları çek ve client-side filtrele (index gerekmesin)
      const duasCollection = collection(db, 'duas');
      const querySnapshot = await getDocs(duasCollection);

      const duasArray = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Kategoriye göre filtrele
        if (data.category === categoryId) {
          duasArray.push({
            firestoreId: doc.id,
            id: doc.id,
            ...data,
          });
        }
      });

      // Client-side sıralama
      duasArray.sort((a, b) => (a.order || 0) - (b.order || 0));

      setDuasData(duasArray);
      console.log(`✅ ${duasArray.length} dua yüklendi`);
    } catch (error) {
      console.error('❌ Kategori yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kategori değiştir
  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      fetchDuasByCategory(category.id);
    }
  };

  // Yenile (Pull to refresh)
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDuasFromFirebase();
    setRefreshing(false);
  };

  // Favorileri yükle
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

  // Arama filtresi
  const filteredDuas = duasData.filter(dua => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      dua.title?.toLowerCase().includes(query) ||
      dua.turkish?.toLowerCase().includes(query) ||
      dua.arabic?.includes(searchQuery) ||
      dua.pronunciation?.toLowerCase().includes(query)
    );
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
    background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
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

  // Loading ekranı
  if (loading && duasData.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Firebase den dualar yükleniyor...
        </Text>
        <Text style={[styles.loadingSubText, { color: theme.textSecondary }]}>
          Lütfen bekleyin
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dualar ({duasData.length})</Text>
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
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.name && styles.categoryButtonActive,
                { borderColor: theme.border },
              ]}
              onPress={() => handleCategoryChange(item.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={selectedCategory === item.name ? '#fff' : theme.text}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === item.name ? '#fff' : theme.text },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      {/* Dua Listesi */}
      <FlatList
        data={filteredDuas}
        renderItem={renderDuaCard}
        keyExtractor={(item) => item.firestoreId || item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'Aradığınız dua bulunamadı' : 'Henüz dua eklenmemiş'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: theme.primary }]}
                onPress={handleRefresh}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshButtonText}>Yenile</Text>
              </TouchableOpacity>
            )}
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
                  <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={2}>
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

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Arapça */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      ARAPÇA
                    </Text>
                    <Text style={[styles.duaArabicFull, { color: theme.text, fontSize: fontSize + 8 }]}>
                      {selectedDua.arabic}
                    </Text>
                  </View>

                  {/* Okunuşu */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      OKUNUŞU
                    </Text>
                    <Text style={[styles.duaPronunciation, { color: theme.text, fontSize: fontSize + 2 }]}>
                      {selectedDua.pronunciation}
                    </Text>
                  </View>

                  {/* Türkçe Meal */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      TÜRKÇE ANLAMI
                    </Text>
                    <Text style={[styles.duaMeaning, { color: theme.text, fontSize: fontSize }]}>
                      {selectedDua.turkish}
                    </Text>
                  </View>

                  {/* Açıklama */}
                  <View style={styles.duaSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      AÇIKLAMA
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
                    style={[
                      styles.actionButton,
                      { backgroundColor: favorites.includes(selectedDua.id) ? '#ef4444' : '#6b7280' },
                    ]}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
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
  categoriesWrapper: {
    marginTop: 15,
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 10,
    alignItems: 'center',
  },
  categoryButton: {
    marginTop: 1,
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginRight: 10,
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
    maxHeight: 400,
  },
  duaSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 1,
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