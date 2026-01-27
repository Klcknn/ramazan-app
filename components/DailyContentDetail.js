import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const DailyContentDetail = ({ visible, onClose, content, type }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (content) {
      checkIfFavorite();
    }
  }, [content]);

  const checkIfFavorite = async () => {
    try {
      const favoritesKey = type === 'dua' ? 'favoriteDuas' : 'favoriteHadis';
      const favoritesStr = await AsyncStorage.getItem(favoritesKey);
      const favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
      const isFav = favorites.some(item => item.id === content.id);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Favori kontrol hatası:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favoritesKey = type === 'dua' ? 'favoriteDuas' : 'favoriteHadis';
      const favoritesStr = await AsyncStorage.getItem(favoritesKey);
      let favorites = favoritesStr ? JSON.parse(favoritesStr) : [];

      if (isFavorite) {
        // Favorilerden çıkar
        favorites = favorites.filter(item => item.id !== content.id);
        setIsFavorite(false);
        Alert.alert('✓', 'Favorilerden kaldırıldı');
      } else {
        // Favorilere ekle
        favorites.push(content);
        setIsFavorite(true);
        Alert.alert('✓', 'Favorilere eklendi');
      }

      await AsyncStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Favori ekleme/çıkarma hatası:', error);
      Alert.alert('Hata', 'İşlem yapılırken bir hata oluştu');
    }
  };

  const handleCopy = () => {
    const textToCopy = `${content.title}\n\n${content.arabic}\n\n${content.turkish}${content.transliteration ? '\n\nOkunuşu: ' + content.transliteration : ''}${content.source ? '\n\nKaynak: ' + content.source : ''}`;
    
    Clipboard.setString(textToCopy);
    Alert.alert('✓', 'Metin kopyalandı');
  };

  const handleShare = async () => {
    try {
      const shareMessage = `${content.title}\n\n${content.arabic}\n\n${content.turkish}${content.transliteration ? '\n\nOkunuşu: ' + content.transliteration : ''}${content.source ? '\n\nKaynak: ' + content.source : ''}`;
      
      await Share.share({
        message: shareMessage,
        title: content.title,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  if (!content) return null;

  const isDua = type === 'dua';
  const theme = {
    primary: isDua ? '#14b8a6' : '#f59e0b',
    primaryLight: isDua ? '#14b8a620' : '#f59e0b20',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.primary }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconContainer}>
                  <MaterialCommunityIcons 
                    name={isDua ? "book-open-variant" : "bookshelf"} 
                    size={32} 
                    color="#FFFFFF" 
                  />
                </View>
                <View>
                  <Text style={styles.headerLabel}>
                    {isDua ? 'Günün Duası' : 'Günün Hadisi'}
                  </Text>
                  <Text style={styles.headerTitle}>{content.title}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Arabic Text */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                  Arapça Metin
                </Text>
              </View>
              <View style={[styles.arabicContainer, { backgroundColor: theme.primaryLight }]}>
                <Text style={styles.arabicText}>{content.arabic}</Text>
              </View>
            </View>

            {/* Turkish Translation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="language" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                  Türkçe Anlamı
                </Text>
              </View>
              <Text style={styles.turkishText}>{content.turkish}</Text>
            </View>

            {/* Transliteration if exists */}
            {content.transliteration && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="text" size={20} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                    Okunuşu
                  </Text>
                </View>
                <Text style={styles.transliterationText}>{content.transliteration}</Text>
              </View>
            )}

            {/* Source/Reference */}
            {content.source && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bookmark" size={20} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                    Kaynak
                  </Text>
                </View>
                <View style={[styles.sourceContainer, { borderLeftColor: theme.primary }]}>
                  <Text style={styles.sourceText}>{content.source}</Text>
                </View>
              </View>
            )}

            {/* Category if exists */}
            {content.category && (
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={16} color={theme.primary} />
                <Text style={[styles.categoryText, { color: theme.primary }]}>
                  {content.category}
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? '#E91E63' : theme.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
              onPress={handleCopy}
            >
              <Ionicons name="copy-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: height * 0.9,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  arabicContainer: {
    padding: 20,
    borderRadius: 15,
  },
  arabicText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 40,
    color: '#333',
  },
  turkishText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
  },
  transliterationText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#666',
    fontStyle: 'italic',
  },
  sourceContainer: {
    borderLeftWidth: 3,
    paddingLeft: 15,
    paddingVertical: 10,
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginTop: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DailyContentDetail;