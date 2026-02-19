import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
// âœ… Bildirim listener'larÄ±nÄ± import et
import { removeNotificationListeners, setupNotificationListeners } from '../../services/notificationService';


const Tab = createBottomTabNavigator();

/* 
// Bildirim ayarlarÄ±
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
}); 
*/

// âœ… Bildirim ayarlarÄ± - Expo Go uyarÄ±sÄ±nÄ± Ã¶nlemek iÃ§in koÅŸullu
// Yerel bildirimler (local notifications) hala Ã§alÄ±ÅŸÄ±r
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
  // Expo Go'da hata vermesini Ã¶nle
  console.log('Notification handler ayarlanamadÄ± (Expo Go)');
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
          title: 'QÄ±ble PusulasÄ±',
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
          title: 'Ã–nemli Dini GÃ¼nler',
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
    <QiblaStack.Navigator>
      <QiblaStack.Screen 
        name="QiblaMain" 
        component={QiblaScreen}
        options={{ 
          headerShown: false,
          title: 'KÄ±ble PusulasÄ±',
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
          title: 'YakÄ±n Camiler',
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
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#00897B', '#26A69A', '#4DB6AC']}
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
            <CustomTabIcon iconName="home-variant" label="Ana Sayfa" focused={focused} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="QiblaTab" 
        component={QiblaStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="compass-outline" label="Kıble" focused={focused} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="MosquesTab" 
        component={MosquesStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="mosque" label="Camiler" focused={focused} />
          ),
          headerShown: false,
        }}
      />
      
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon iconName="cog-outline" label="Ayarlar" focused={focused} />
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
    // Splash ekranÄ±nÄ± 3 saniye gÃ¶ster
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // âœ… Notification listener'larÄ±nÄ± uygulama baÅŸlarken kur
  useEffect(() => {
    console.log('ğŸ”” Notification listenerlar kuruluyor...');
    const listeners = setupNotificationListeners();
    console.log('âœ… Notification listenerlar kuruldu');


    return () => {
      if (listeners) {
        console.log('ğŸ”´ Notification listenerlar kaldÄ±rÄ±lÄ±yor...');
        removeNotificationListeners(listeners);
      }
    };
  }, []);

  // Splash ekranÄ± gÃ¶ster
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // âœ… LocationProvider kendi iÃ§inde state yÃ¶netiyor
  // ArtÄ±k App.tsx'de location state'leri tutmamÄ±za gerek yok
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
    backgroundColor: 'transparent',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 12,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    marginTop: 2,
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


