import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useLocalization } from '../context/LocalizationContext';
import { useAppTheme } from '../hooks/use-app-theme';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const theme = useAppTheme();
  const { t } = useLocalization();

  const markAllAsRead = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      if (!stored) return;

      const notifs = JSON.parse(stored);
      const updatedNotifs = notifs.map((n) => ({ ...n, read: true }));
      await AsyncStorage.setItem('app_notifications', JSON.stringify(updatedNotifs));
    } catch (error) {
      console.error('[NotificationsScreen] markAllAsRead hatası:', error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');

      if (stored) {
        const notifs = JSON.parse(stored);
        notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(notifs);
        await markAllAsRead();
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('[NotificationsScreen] Yükleme hatası:', error);
    }
  }, [markAllAsRead]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const deleteNotification = async (id) => {
    try {
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      await AsyncStorage.setItem('app_notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

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
          },
        },
      ]
    );
  };

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
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'prayer':
        return '🕌';
      case 'dua':
        return '🤲';
      case 'hadis':
        return '📖';
      case 'important_day':
      case 'main':
        return '📅';
      case 'reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const renderRightActions = (id) => (
    <TouchableOpacity style={styles.swipeDeleteAction} activeOpacity={0.85} onPress={() => deleteNotification(id)}>
      <Ionicons name="trash" size={20} color="#fff" />
      <Text style={styles.swipeDeleteText}>Sil</Text>
    </TouchableOpacity>
  );

  const renderNotification = ({ item }) => (
    <Swipeable overshootRight={false} renderRightActions={() => renderRightActions(item.id)}>
      <View
        style={[
          styles.notificationCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          !item.read && styles.unreadCard,
          !item.read && { borderColor: theme.accent },
        ]}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.notificationBody, { color: theme.textMuted }]}>{item.body}</Text>
            <Text style={[styles.notificationTime, { color: theme.textMuted }]}>{formatTime(item.timestamp)}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(item.id)}>
            <Text style={[styles.deleteButtonText, { color: theme.textMuted }]}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <LinearGradient colors={theme.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>{t('notifications.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{notifications.length} bildirim</Text>
            <TouchableOpacity onPress={clearAllNotifications}>
              <Text style={styles.clearAllText}>{t('notifications.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('notifications.noNotifications')}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{t('notifications.noNotificationsDesc')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
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
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  swipeDeleteAction: {
    width: 84,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
