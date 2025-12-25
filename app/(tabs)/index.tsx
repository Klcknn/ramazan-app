import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

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

// Main Tabs (Giriş yapmış kullanıcılar için)
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
  // Şimdilik hep AuthStack gösterelim
  // İleride kullanıcı durumuna göre değişecek
  const isLoggedIn = false;

  return isLoggedIn ? <MainTabs /> : <AuthStack />;
}




























/* import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useState } from 'react';

export default function App() {
  const [testResult, setTestResult] = useState('Test başlamadı');

  // Firestore'a veri yaz
  const testFirestore = async () => {
    try {
      setTestResult('⏳ Yazılıyor...');
      
      // Test verisi ekle
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Merhaba Firebase!',
        timestamp: new Date(),
      });
      
      setTestResult(`✅ Veri yazıldı! ID: ${docRef.id}`);
      console.log('✅ Firestore yazma başarılı:', docRef.id);
      
      // Veriyi oku
      const querySnapshot = await getDocs(collection(db, 'test'));
      console.log('📖 Toplam kayıt:', querySnapshot.size);
      
    } catch (error) {
      setTestResult(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}`);
      console.error('❌ Firestore hatası:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌙 Ramazan Uygulaması</Text>
      <Text style={styles.subtitle}>Firebase Test</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Firestore Test" onPress={testFirestore} />
      </View>
      
      <Text style={styles.result}>{testResult}</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 30,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  result: {
    fontSize: 14,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
});
 */