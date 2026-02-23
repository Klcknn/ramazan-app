import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppBackground from '../../components/AppBackground';
import { useAppearance } from '../../context/AppearanceContext';
import { useLocalization } from '../../context/LocalizationContext';
import { LocationProvider } from '../../context/LocationContext';
import DuaScreen from '../../screens/DuaScreen';
import FavoritesScreen from '../../screens/FavoritesScreen';
import HadisScreen from '../../screens/HadisScreen';
import HomeScreen from '../../screens/HomeScreen';
import ImportantDaysScreen from '../../screens/ImportantDaysScreen';
import NearestMosquesScreen from '../../screens/NearestMosquesScreen';
import NotificationsScreen from '../../screens/NotificationsScreen';
import QiblaScreen from '../../screens/QiblaScreen';
import RamadanCalendarScreen from '../../screens/RamadanCalendarScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import SplashScreen from '../../screens/SplashScreen';
import TesbihScreen from '../../screens/TesbihScreen';
// Bildirim listener'larini import et
import { removeNotificationListeners, setupNotificationListeners } from '../../services/notificationService';


const Tab = createBottomTabNavigator();

/* 
// Bildirim ayarlari
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
}); 
*/

// Bildirim ayarlari - Expo Go uyarisini onlemek icin kosullu
// Yerel bildirimler (local notifications) hala calisir
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
  // Expo Go'da hata vermesini onle
  console.log('Notification handler ayarlanamadi (Expo Go)');
}

// Home Stack
const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ cardStyle: { backgroundColor: 'transparent' } }}>
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="Tesbih" 
        component={TesbihScreen}
        options={{ 
          headerShown: false,
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
          title: 'Kıble Pusulası',
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
      <HomeStack.Screen 
        name="FavoritesScreen" 
        component={FavoritesScreen}
        options={{ 
          headerShown: false,
          title: 'Favorilerim',
        }}
      />
      <HomeStack.Screen 
        name="NotificationsScreen" 
        component={NotificationsScreen}
        options={{ 
          headerShown: false,
          title: 'Bildirimler',
        }}
      />
    </HomeStack.Navigator>
  );
}

// Qibla Stack
const QiblaStack = createStackNavigator();

function QiblaStackScreen() {
  return (
    <QiblaStack.Navigator screenOptions={{ cardStyle: { backgroundColor: 'transparent' } }}>
      <QiblaStack.Screen 
        name="QiblaMain" 
        component={QiblaScreen}
        options={{ 
          headerShown: false,
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
    <MosquesStack.Navigator screenOptions={{ cardStyle: { backgroundColor: 'transparent' } }}>
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
    <SettingsStack.Navigator screenOptions={{ cardStyle: { backgroundColor: 'transparent' } }}>
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ 
          headerShown: false,
          title: 'Ayarlar',
        }}
      />
      <SettingsStack.Screen 
        name="FavoritesScreen" 
        component={FavoritesScreen}
        options={{ 
          headerShown: false,
          title: 'Favorilerim',
        }}
      />
    </SettingsStack.Navigator>
  );
}

// Custom Tab Icon Component
function CustomTabIcon({
  iconName,
  label,
  focused,
}: {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <MaterialCommunityIcons
          name={iconName}
          size={focused ? 26 : 24}
          color="#FFFFFF"
          style={[styles.icon, focused && styles.iconActive]}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

// Main Tabs
function MainTabs() {
  const { darkMode } = useAppearance();
  const { t } = useLocalization();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: 'transparent' },
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <LinearGradient
            colors={darkMode ? ['#0f5f55', '#16796d', '#2b8c80'] : ['#00897B', '#26A69A', '#4DB6AC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
            }}
          />
        ),
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="home-variant" label={t('tabs.home')} focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="QiblaTab" 
        component={QiblaStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="compass-outline" label={t('tabs.qibla')} focused={focused} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="MosquesTab" 
        component={MosquesStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="mosque" label={t('tabs.mosques')} focused={focused} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="cog-outline" label={t('tabs.settings')} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Notification listener'larini uygulama baslarken kur
  useEffect(() => {
    console.log('Notification listenerlar kuruluyor...');
    const listeners = setupNotificationListeners();
    console.log('Notification listenerlar kuruldu');


    return () => {
      if (listeners) {
        console.log('Notification listenerlar kaldiriliyor...');
        removeNotificationListeners(listeners);
      }
    };
  }, []);

  // Splash ekrani goster
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // LocationProvider kendi icinde state yonetiyor
  // Artik App.tsx'de location state'leri tutmamiza gerek yok
  return (
    <LocationProvider>
      <View style={styles.appRoot}>
        <AppBackground />
        <View style={styles.appContent}>
          <MainTabs />
        </View>
      </View>
    </LocationProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  appContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabBar: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingBottom: 6,
    paddingTop: 7,
    shadowColor: '#0A3D36',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 70,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    opacity: 0.85,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '700',
    marginTop: -2,
    textAlign: 'center',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});



