import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LocationProvider } from '../../context/LocationContext';
import DuaScreen from '../../screens/DuaScreen';
import HadisScreen from '../../screens/HadisScreen';
import HomeScreen from '../../screens/HomeScreen';
import ImportantDaysScreen from '../../screens/ImportantDaysScreen';
import NearestMosquesScreen from '../../screens/NearestMosquesScreen';
import QiblaScreen from '../../screens/QiblaScreen';
import RamadanCalendarScreen from '../../screens/RamadanCalendarScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import SplashScreen from '../../screens/SplashScreen';
import TesbihScreen from '../../screens/TesbihScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* 
// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
}); 
*/

// ✅ Bildirim ayarları - Expo Go uyarısını önlemek için koşullu
// Yerel bildirimler (local notifications) hala çalışır
try {
  Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // Expo Go'da hata vermesini önle
  console.log('Notification handler ayarlanamadı (Expo Go)');
}

// Home Stack
const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="Tesbih" 
        component={TesbihScreen}
        options={{ 
          title: 'Tesbih',
          headerStyle: { backgroundColor: '#00897B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <HomeStack.Screen 
        name="NearestMosquesScreen" 
        component={NearestMosquesScreen}
        options={{ 
          title: 'NearestMosquesScreen',
          headerShown: false,
          headerStyle: { backgroundColor: '#00897B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <HomeStack.Screen 
        name="QiblaScreen" 
        component={QiblaScreen}
        options={{ 
          title: 'Qıble Pusulası',
          headerShown: false,
          headerStyle: { backgroundColor: '#00897B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <HomeStack.Screen 
        name="RamadanCalendar" 
        component={RamadanCalendarScreen}
        options={{ 
          headerShown: false,
          title: 'Ramazan Takvimi',
        }}
      /> 
      <HomeStack.Screen 
        name="DuaScreen" 
        component={DuaScreen}
        options={{ 
          headerShown: false,
          title: 'Dualar',
        }}
      />
      <HomeStack.Screen 
        name="HadisScreen" 
        component={HadisScreen}
        options={{ 
          headerShown: false,
          title: 'Hadisler',
        }}
      />
      <HomeStack.Screen 
        name="ImportantDaysScreen" 
        component={ImportantDaysScreen}
        options={{ 
          headerShown: false,
          title: 'Önemli Dini Günler',
        }}
      />
    </HomeStack.Navigator>
  );
}

// Qibla Stack
const QiblaStack = createStackNavigator();

function QiblaStackScreen() {
  return (
    <QiblaStack.Navigator>
      <QiblaStack.Screen 
        name="QiblaMain" 
        component={QiblaScreen}
        options={{ 
          title: 'Kıble Pusulası',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
    </QiblaStack.Navigator>
  );
}

// Mosques Stack
const MosquesStack = createStackNavigator();

function MosquesStackScreen() {
  return (
    <MosquesStack.Navigator>
      <MosquesStack.Screen 
        name="MosquesMain" 
        component={NearestMosquesScreen}
        options={{ 
          headerShown: false,
          title: 'Yakın Camiler',
        }}
      />
    </MosquesStack.Navigator>
  );
}

// Settings Stack
const SettingsStack = createStackNavigator();

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ 
          headerShown: false,
          title: 'Ayarlar',
        }}
      />
    </SettingsStack.Navigator>
  );
}

// Custom Tab Icon Component
function CustomTabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

// Main Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon icon="🏠" label="Ana Sayfa" focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="QiblaTab" 
        component={QiblaStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon icon="🧭" label="Kıble" focused={focused} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="MosquesTab" 
        component={MosquesStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon icon="🕌" label="Camiler" focused={focused} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon icon="⚙️" label="Ayarlar" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Splash ekranını 3 saniye göster
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Splash ekranı göster
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // ✅ LocationProvider kendi içinde state yönetiyor
  // Artık App.tsx'de location state'leri tutmamıza gerek yok
  return (
    <LocationProvider>
      <MainTabs />
    </LocationProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 70,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: '#E0F2F1',
  },
  icon: {
    fontSize: 24,
    opacity: 0.5,
  },
  iconActive: {
    fontSize: 26,
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  labelActive: {
    color: '#00897B',
    fontWeight: '700',
    fontSize: 10,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00897B',
  },
});