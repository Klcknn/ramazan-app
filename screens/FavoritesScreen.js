import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Favori ekleme/çıkarmada sayfayı yenilemek için
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoritesData = await AsyncStorage.getItem('favorites');
      if (favoritesData) {
        const favList = JSON.parse(favoritesData);
        // En yeniden eskiye sırala
        favList.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        setFavorites(favList);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (item) => {
    Alert.alert(
      'Favorilerden Kaldır',
      `${item.title} favorilerden kaldırılsın mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedFavorites = favorites.filter(
                fav => !(fav.type === item.type && fav.title === item.title)
              );
              await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
              setFavorites(updatedFavorites);
              Alert.alert('Başarılı', 'Favorilerden kaldırıldı');
            } catch (error) {
              console.error('Favori kaldırma hatası:', error);
              Alert.alert('Hata', 'Favorilerden kaldırılırken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const shareFavorite = async (item) => {
    try {
      let message = '';
      const content = item.content;
      
      if (item.type === 'dua') {
        message = `🤲 ${content.title}\n\n`;
        message += `📖 ${content.arabic}\n\n`;
        message += `🔤 ${content.pronunciation}\n\n`;
        message += `🇹🇷 ${content.turkish}\n\n`;
        message += `Kaynak: ${content.source || 'Bilinmiyor'}`;
      } else {
        message = `📖 ${content.title}\n\n`;
        message += `📜 ${content.arabic}\n\n`;
        message += `🇹🇷 ${content.turkish}\n\n`;
        message += `Kaynak: ${content.source || 'Bilinmiyor'}`;
      }

      await Share.share({
        message: message,
        title: item.title
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const renderFavoriteItem = ({ item, index }) => {
    const isDua = item.type === 'dua';
    
    return (
      <View style={styles.favoriteCard}>
        <View style={styles.favoriteHeader}>
          <View style={[
            styles.favoriteIconContainer,
            { backgroundColor: isDua ? '#E0F2F1' : '#FFF8E1' }
          ]}>
            <Text style={styles.favoriteIcon}>{isDua ? '🤲' : '📖'}</Text>
          </View>
          <View style={styles.favoriteTitleContainer}>
            <Text style={styles.favoriteType}>
              {isDua ? 'DUA' : 'HADİS'}
            </Text>
            <Text style={styles.favoriteTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.favoriteDate}>
              {new Date(item.addedAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.favoritePreview} numberOfLines={2}>
          {item.content.turkish}
        </Text>

        <View style={styles.favoriteActions}>
          <TouchableOpacity
            style={[styles.favoriteActionButton, styles.shareActionButton]}
            onPress={() => shareFavorite(item)}
          >
            <Text style={styles.actionButtonIcon}>📤</Text>
            <Text style={styles.actionButtonText}>Paylaş</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favoriteActionButton, styles.removeActionButton]}
            onPress={() => removeFavorite(item)}
          >
            <Text style={styles.actionButtonIcon}>🗑️</Text>
            <Text style={styles.actionButtonText}>Kaldır</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={styles.loadingText}>Favoriler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00897B', '#26A69A', '#4DB6AC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorilerim</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Henüz favori eklemediniz</Text>
          <Text style={styles.emptySubtitle}>
            Günün duası veya hadisini favorilere ekleyerek daha sonra kolayca erişebilirsiniz
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Toplam {favorites.length} favori
            </Text>
          </View>
          
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item, index) => `${item.type}-${item.title}-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  favoriteIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  favoriteTitleContainer: {
    flex: 1,
  },
  favoriteType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00897B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  favoriteDate: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  favoritePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  favoriteActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  shareActionButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  removeActionButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

