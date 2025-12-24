import { StatusBar } from 'expo-status-bar';
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
