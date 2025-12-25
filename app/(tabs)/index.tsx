import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LocationProvider } from '../../context/LocationContext';

// Ekranları import et
import HomeScreen from '../../screens/HomeScreen';
import LoginScreen from '../../screens/LoginScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import RegisterScreen from '../../screens/RegisterScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
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
        options={{ title: 'Giriş Yap' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Kayıt Ol' }}
      />
    </Stack.Navigator>
  );
}

// Main Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1e3a5f',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#1e3a5f' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Ana Sayfa',
          tabBarLabel: 'Ana Sayfa'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profil',
          tabBarLabel: 'Profil'
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const isLoggedIn = false;

  return (
    <LocationProvider>
      {isLoggedIn ? <MainTabs /> : <AuthStack />}
    </LocationProvider>
  );
}