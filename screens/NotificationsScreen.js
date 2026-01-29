import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  // Bildirimleri yükle
  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      if (stored) {
        const notifs = JSON.parse(stored);
        // En yeni önce
        notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(notifs);
        
        // Tüm bildirimleri okundu olarak işaretle
        await markAllAsRead();
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      if (stored) {
        const notifs = JSON.parse(stored);
        const updatedNotifs = notifs.map(n => ({ ...n, read: true }));
        await AsyncStorage.setItem('app_notifications', JSON.stringify(updatedNotifs));
      }
    } catch (error) {
      console.error('Bildirimler güncellenirken hata:', error);
    }
  };

  // Tek bildirimi sil
  const deleteNotification = async (id) => {
    try {
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      await AsyncStorage.setItem('app_notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  // Tüm bildirimleri sil
  const clearAllNotifications = () => {
    Alert.alert(
      'Tüm Bildirimleri Sil',
      'Tüm bildirimler silinsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('app_notifications', JSON.stringify([]));
              setNotifications([]);
            } catch (error) {
              console.error('Bildirimler silinirken hata:', error);
            }
          }
        }
      ]
    );
  };

  // Zaman formatı
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Bildirim ikonu
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'prayer': return '🕌';
      case 'dua': return '🤲';
      case 'hadis': return '📖';
      case 'important_day': return '📅';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  // Bildirim kartı
  const renderNotification = ({ item }) => (
    <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#00897B', '#26A69A']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <View style={styles.backButton} />
        </View>
        
        {notifications.length > 0 && (
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>
              {notifications.length} bildirim
            </Text>
            <TouchableOpacity onPress={clearAllNotifications}>
              <Text style={styles.clearAllText}>Tümünü Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Bildirim Listesi */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>Bildirim Yok</Text>
          <Text style={styles.emptySubtitle}>
            Henüz hiç bildiriminiz bulunmuyor
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerStatsText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  clearAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00897B',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#EF5350',
    fontWeight: '600',
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});