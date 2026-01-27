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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const HadisScreen = ({ navigation }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedHadis, setSelectedHadis] = useState(null);
  const [showHadisModal, setShowHadisModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [hadislerData, setHadislerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: 'Tümü', icon: 'apps' },
    { id: 'ibadet', name: 'İbadet', icon: 'moon' },
    { id: 'ahlak', name: 'Ahlak', icon: 'heart' },
    { id: 'dua', name: 'Dua', icon: 'hand-left' },
    { id: 'ilim', name: 'İlim', icon: 'book' },
    { id: 'sabir', name: 'Sabır', icon: 'shield-checkmark' },
    { id: 'sadaka', name: 'Sadaka', icon: 'gift' },
    { id: 'hayir', name: 'Hayır', icon: 'star' },
  ];

  useEffect(() => {
    loadFavorites();
    fetchHadislerFromFirebase();
  }, []);

  const fetchHadislerFromFirebase = async () => {
    try {
      setLoading(true);
      console.log('🔥 Firebase\'den hadisler çekiliyor...');

      const hadislerCollection = collection(db, 'hadisler');
      const querySnapshot = await getDocs(hadislerCollection);

      const hadislerArray = [];
      querySnapshot.forEach((doc) => {
        hadislerArray.push({
          firestoreId: doc.id,
          id: doc.id,
          ...doc.data(),
        });
      });

      hadislerArray.sort((a, b) => (a.order || 0) - (b.order || 0));
      setHadislerData(hadislerArray);
      console.log(`✅ ${hadislerArray.length} hadis başarıyla yüklendi`);
    } catch (error) {
      console.error('❌ Firebase hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHadislerByCategory = async (categoryId) => {
    if (categoryId === 'all') {
      fetchHadislerFromFirebase();
      return;
    }

    try {
      setLoading(true);
      const hadislerCollection = collection(db, 'hadisler');
      const querySnapshot = await getDocs(hadislerCollection);

      const hadislerArray = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category === categoryId) {
          hadislerArray.push({
            firestoreId: doc.id,
            id: doc.id,
            ...data,
          });
        }
      });

      hadislerArray.sort((a, b) => (a.order || 0) - (b.order || 0));
      setHadislerData(hadislerArray);
      console.log(`✅ ${hadislerArray.length} hadis yüklendi`);
    } catch (error) {
      console.error('❌ Kategori yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      fetchHadislerByCategory(category.id);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHadislerFromFirebase();
    setRefreshing(false);
  };

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favoriteHadisler');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favoriteHadisler', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Favoriler kaydedilemedi:', error);
    }
  };

  const toggleFavorite = (hadisId) => {
    const isFavorite = favorites.includes(hadisId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== hadisId)
      : [...favorites, hadisId];
    saveFavorites(newFavorites);
  };

  const filteredHadisler = hadislerData.filter(hadis => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      hadis.title?.toLowerCase().includes(query) ||
      hadis.turkish?.toLowerCase().includes(query) ||
      hadis.arabic?.includes(searchQuery) ||
      hadis.source?.toLowerCase().includes(query)
    );
  });

  const speakHadis = (hadis) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const text = `${hadis.title}. ${hadis.turkish}. Kaynak: ${hadis.source}`;
      Speech.speak(text, {
        language: 'tr',
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const shareHadis = async (hadis) => {
    try {
      const message = `${hadis.title}\n\n${hadis.arabic}\n\n${hadis.turkish}\n\nKaynak: ${hadis.source}\n\n${hadis.explanation}`;
      await Share.share({
        message: message,
        title: hadis.title,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    cardBg: isDarkMode ? '#2d2d2d' : '#fff',
    text: isDarkMode ? '#fff' : '#333',
    textSecondary: isDarkMode ? '#aaa' : '#666',
    border: isDarkMode ? '#444' : '#e0e0e0',
    primary: '#14b8a6',
    accent: '#f59e0b',
  };

  const renderHadisCard = ({ item }) => {
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.hadisCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => {
          setSelectedHadis(item);
          setShowHadisModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.hadisCardHeader}>
          <View style={styles.hadisTitleContainer}>
            <MaterialCommunityIcons name="bookshelf" size={24} color={theme.primary} />
            <Text style={[styles.hadisTitle, { color: theme.text }]} numberOfLines={1}>
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

        <Text style={[styles.hadisArabic, { color: theme.text, fontSize: fontSize + 2 }]} numberOfLines={2}>
          {item.arabic}
        </Text>

        <Text style={[styles.hadisTurkish, { color: theme.textSecondary, fontSize: fontSize }]} numberOfLines={3}>
          {item.turkish}
        </Text>

        <View style={styles.hadisCardFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
              {categories.find(c => c.id === item.category)?.name || 'Genel'}
            </Text>
          </View>
          <Text style={[styles.sourceText, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.source}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && hadislerData.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Firebase den hadisler yükleniyor...
        </Text>
        <Text style={[styles.loadingSubText, { color: theme.textSecondary }]}>
          Lütfen bekleyin
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hadisler ({hadislerData.length})</Text>
        <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Hadis ara..."
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

      <FlatList
        data={filteredHadisler}
        renderItem={renderHadisCard}
        keyExtractor={(item) => item.firestoreId || item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bookshelf" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'Aradığınız hadis bulunamadı' : 'Henüz hadis eklenmemiş'}
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

      <Modal
        visible={showHadisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHadisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            {selectedHadis && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={2}>
                    {selectedHadis.title}
                  </Text>
                  <TouchableOpacity onPress={() => setShowHadisModal(false)}>
                    <Ionicons name="close" size={28} color={theme.text} />
                  </TouchableOpacity>
                </View>

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
                  <View style={styles.hadisSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      ARAPÇA
                    </Text>
                    <Text style={[styles.hadisArabicFull, { color: theme.text, fontSize: fontSize + 6 }]}>
                      {selectedHadis.arabic}
                    </Text>
                  </View>

                  <View style={styles.hadisSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      TÜRKÇE ANLAMI
                    </Text>
                    <Text style={[styles.hadisMeaning, { color: theme.text, fontSize: fontSize }]}>
                      {selectedHadis.turkish}
                    </Text>
                  </View>

                  <View style={styles.hadisSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      KAYNAK
                    </Text>
                    <Text style={[styles.hadisSource, { color: theme.primary, fontSize: fontSize }]}>
                      {selectedHadis.source}
                    </Text>
                  </View>

                  <View style={styles.hadisSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      AÇIKLAMA
                    </Text>
                    <Text style={[styles.hadisExplanation, { color: theme.textSecondary, fontSize: fontSize }]}>
                      {selectedHadis.explanation}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => speakHadis(selectedHadis)}
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
                    onPress={() => shareHadis(selectedHadis)}
                  >
                    <Ionicons name="share-social" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Paylaş</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: favorites.includes(selectedHadis.id) ? '#ef4444' : '#6b7280' },
                    ]}
                    onPress={() => toggleFavorite(selectedHadis.id)}
                  >
                    <Ionicons
                      name={favorites.includes(selectedHadis.id) ? 'heart' : 'heart-outline'}
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>
                      {favorites.includes(selectedHadis.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, fontSize: 18, fontWeight: '600' },
  loadingSubText: { marginTop: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#14b8a6', paddingHorizontal: 15, paddingVertical: 15, paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff', flex: 1, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginTop: 15, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  categoriesWrapper: { marginTop: 15, marginBottom: 10 },
  categoriesContainer: { paddingHorizontal: 15, paddingVertical: 8, gap: 10, alignItems: 'center' },
  categoryButton: { marginTop: 1, marginBottom: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, height: 40, borderRadius: 20, borderWidth: 1, gap: 6, minWidth: 80 },
  categoryButtonActive: { backgroundColor: '#14b8a6', borderColor: '#14b8a6' },
  categoryButtonText: { fontSize: 14, fontWeight: '600' },
  listContainer: { padding: 15 },
  hadisCard: { borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, elevation: 3 },
  hadisCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hadisTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  hadisTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  hadisArabic: { fontWeight: '600', textAlign: 'right', marginBottom: 10, lineHeight: 28 },
  hadisTurkish: { lineHeight: 22, marginBottom: 10 },
  hadisCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  sourceText: { fontSize: 11, flex: 1, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 15, marginBottom: 20 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8 },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: '90%', paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '700', flex: 1, marginRight: 10 },
  fontSizeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  fontSizeLabel: { fontSize: 14, fontWeight: '600' },
  fontSizeButtons: { flexDirection: 'row', gap: 10 },
  fontButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { paddingHorizontal: 20, maxHeight: 400 },
  hadisSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 1 },
  hadisArabicFull: { fontWeight: '600', textAlign: 'right', lineHeight: 36 },
  hadisMeaning: { lineHeight: 26 },
  hadisSource: { fontWeight: '600', lineHeight: 24 },
  hadisExplanation: { lineHeight: 24 },
  actionButtons: { paddingHorizontal: 20, paddingVertical: 15, gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 10 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default HadisScreen;