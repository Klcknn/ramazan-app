import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useContext } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthContext, AuthProvider } from '../../context/AuthContext';
import { LocationProvider } from '../../context/LocationContext';
import QiblaScreen from '../../screens/QiblaScreen';
import TesbihScreen from '../../screens/TesbihScreen';
import RamadanCalendarScreen from '../../screens/RamadanCalendarScreen';
import NearestMosquesScreen from '../../screens/NearestMosquesScreen';
import DuaScreen from '../../screens/DuaScreen';

// Ekranları import et
import HomeScreen from '../../screens/HomeScreen';
import LoginScreen from '../../screens/LoginScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import RegisterScreen from '../../screens/RegisterScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Giriş yapmamış kullanıcılar için)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a5f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }} // Header'ı kaldır
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerShown: false }} // Header'ı kaldır

       /*  
       options={{ 
          title: 'Kayıt Ol',
          headerStyle: { backgroundColor: '#2E7D32' }
        }} 
        */
      />
    </Stack.Navigator>
  );
}

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
        name="Qibla" 
        component={QiblaScreen}
        options={{ 
          title: 'Kıble Pusulası',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <HomeStack.Screen 
        name="RamadanCalendar" 
        component={RamadanCalendarScreen}
        options={{ 
          headerShown: false,
          title: 'RamadanCalendar',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      /> 
      <HomeStack.Screen 
        name="NearestMosquesScreen" 
        component={NearestMosquesScreen}
        options={{ 
          headerShown: false,
          title: 'NearestMosquesScreen',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <HomeStack.Screen 
        name="DuaScreen" 
        component={DuaScreen}
        options={{ 
          headerShown: false,
          title: 'DuaScreen',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
    </HomeStack.Navigator>
  );
}

// Main Tabs (Giriş yapmış kullanıcılar için)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#999',
        //headerStyle: { backgroundColor: 'transparent' },
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen}
        options={{ 
          headerShown: false ,
          title: '',
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          headerShown: false ,
          title: '',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

// Basit Tab Icon Component
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </View>
  );
}

// Navigation Manager (Kullanıcı durumuna göre)
function Navigation() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <>
      {user ? <MainTabs /> : <AuthStack />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
          <Navigation />
      </LocationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

