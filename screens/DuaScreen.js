import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
// Firebase Web SDK import
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase'; // Firebase config dosyanızın yolu

const DuaScreen = ({ navigation }) => {
  const [isDarkMode] = useState(false); // Karanlık mod kapalı
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedDua, setSelectedDua] = useState(null);
  const [showDuaModal, setShowDuaModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ViewShot ref
  const viewShotRef = useRef(null);

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

  // ✅ GÜNCEL - Favorileri yükle - ANA FAVORİLER SİSTEMİ İLE UYUMLU
  const loadFavorites = async () => {
    try {
      // Ana favoriler sisteminden yükle
      const mainFavorites = await AsyncStorage.getItem('favorites');
      if (mainFavorites) {
        const favList = JSON.parse(mainFavorites);
        // Sadece dua tipindeki favorilerin ID'lerini al
        const duaFavoriteIds = favList
          .filter(item => item.type === 'dua')
          .map(item => item.content.firestoreId || item.content.id);
        setFavorites(duaFavoriteIds);
      }
    } catch (error) {
      console.error('Favoriler yüklenemedi:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Favoriler kaydedilemedi:', error);
    }
  };

  // ✅ GÜNCEL - toggleFavorite - ANA FAVORİLER SİSTEMİ İLE UYUMLU
  const toggleFavorite = async (duaId) => {
    try {
      // Ana favoriler sisteminden oku
      const mainFavorites = await AsyncStorage.getItem('favorites');
      let favList = mainFavorites ? JSON.parse(mainFavorites) : [];
      
      // Bu duayı bul
      const dua = duasData.find(d => d.id === duaId);
      if (!dua) return;

      // Favorilerde var mı kontrol et
      const existingIndex = favList.findIndex(
        item => item.type === 'dua' && (item.content.firestoreId === duaId || item.content.id === duaId)
      );

      if (existingIndex >= 0) {
        // Favorilerden çıkar
        favList.splice(existingIndex, 1);
        const newFavoriteIds = favorites.filter(id => id !== duaId);
        setFavorites(newFavoriteIds);
      } else {
        // Favorilere ekle
        favList.push({
          type: 'dua',
          title: dua.title,
          content: dua,
          addedAt: new Date().toISOString()
        });
        setFavorites([...favorites, duaId]);
      }

      // Ana favoriler sistemine kaydet
      await AsyncStorage.setItem('favorites', JSON.stringify(favList));
      console.log('✅ Dua favorilere eklendi/çıkarıldı');
    } catch (error) {
      console.error('❌ Favori toggle hatası:', error);
    }
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
      // Arapça metni okuma
      const text = dua.arabic;
      Speech.speak(text, {
        language: 'ar-SA',         // Arapça (Suudi Arabistan)
        pitch: 0.80,               // Derin, imam sesi
        rate: 0.65,                // Çok yavaş, tertil tarzı
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  // Paylaşma
  const shareDua = async (dua) => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Hata', 'Görsel oluşturulamadı');
        return;
      }

      console.log('📸 Dua görseli oluşturuluyor...');
      const uri = await viewShotRef.current.capture();
      console.log('✅ Görsel oluşturuldu:', uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: `${dua.title} - Dua`,
        });
        console.log('✅ Paylaşım başarılı');
      }
    } catch (error) {
      console.error('❌ Paylaşma hatası:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
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
          Dualar yükleniyor...
        </Text>
        <Text style={[styles.loadingSubText, { color: theme.textSecondary }]}>
          Lütfen bekleyin
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ana İçerik - Arka Plan Görselli (Header dahil tümü) */}
      <ImageBackground
        source={require('../assets/images/dua_background_image.jpg')}
        style={styles.backgroundImageFull}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="cover"
      >
        {/* Header */}
        <LinearGradient
          colors={['#00897B', '#26A69A', '#4DB6AC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dualar ({duasData.length})</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>
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
      </ImageBackground>

      {/* Dua Detay Modal */}
      <Modal
        visible={showDuaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDuaModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* ViewShot - Paylaşım için görsel (görünmez) */}
          <View style={{ position: 'absolute', left: -9999, top: 0 }}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
              <LinearGradient
                colors={['#00897B', '#26A69A', '#4DB6AC']}
                style={styles.shareImageContainer}
              >
                {selectedDua && (
                  <View style={styles.shareImageContent}>
                    {/* Header */}
                    <View style={styles.shareHeader}>
                      <Text style={styles.shareAppName}>🕌 İslami Hayat</Text>
                    </View>

                    {/* Başlık */}
                    <View style={styles.shareTitleBox}>
                      <Text style={styles.shareTitle}>{selectedDua.title}</Text>
                    </View>

                    {/* Arapça */}
                    <View style={styles.shareSection}>
                      <View style={styles.shareSectionHeader}>
                        <View style={styles.shareLine} />
                        <Text style={styles.shareSectionTitle}>ARAPÇA</Text>
                        <View style={styles.shareLine} />
                      </View>
                      <Text style={styles.shareArabic}>{selectedDua.arabic}</Text>
                    </View>

                    {/* Okunuş */}
                    <View style={styles.shareSection}>
                      <View style={styles.shareSectionHeader}>
                        <View style={styles.shareLine} />
                        <Text style={styles.shareSectionTitle}>OKUNUŞU</Text>
                        <View style={styles.shareLine} />
                      </View>
                      <Text style={styles.sharePronunciation}>{selectedDua.pronunciation}</Text>
                    </View>

                    {/* Türkçe */}
                    <View style={styles.shareSection}>
                      <View style={styles.shareSectionHeader}>
                        <View style={styles.shareLine} />
                        <Text style={styles.shareSectionTitle}>TÜRKÇE MEALİ</Text>
                        <View style={styles.shareLine} />
                      </View>
                      <Text style={styles.shareTurkish}>{selectedDua.turkish}</Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.shareFooter}>
                      <Text style={styles.shareFooterText}>📱 İslami Hayat Uygulaması</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </ViewShot>
          </View>

          <ImageBackground
            source={require('../assets/images/islamic-pattern_2.jpg')}
            style={[styles.modalContent, { backgroundColor: theme.cardBg }]}
            imageStyle={{ opacity: 0.12, resizeMode: "cover" }}
          >
            <View style={styles.modalContentOverlay}>
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
                    <Text style={styles.actionButtonText}>Favori Ekle</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          </ImageBackground>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImageFull: {
    flex: 1,
    width: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.5,
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450,       // Tablet friendly
    borderRadius: 25,    // Yuvarlak köşeler

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
    textAlign: 'center',
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
    fontSize: 18,
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
    fontSize: 16,
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
    flexDirection: 'row',      // Yan yana
    gap: 10,                    // Aralarında boşluk
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  actionButton: {
    flex: 1,                   // Eşit genişlik
    flexDirection: 'row',   // İkon üstte, text altta
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,        // Kompakt
    fontWeight: '700',
    textAlignVertical: 'center',
    color: '#fff',
    marginLeft: 6,      // İkon ile text arasında boşluk
  },
  // Paylaşım Görseli Stilleri
  shareImageContainer: {
    width: 600,
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  shareImageContent: {
    flex: 1,
  },
  shareHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  shareAppName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  shareTitleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  shareSection: {
    marginBottom: 20,
  },
  shareSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shareLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  shareSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 12,
    letterSpacing: 1.5,
  },
  shareArabic: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 12,
  },
  sharePronunciation: {
    fontSize: 17,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 12,
  },
  shareTurkish: {
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 12,
  },
  shareFooter: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
  },
  shareFooterText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default DuaScreen;