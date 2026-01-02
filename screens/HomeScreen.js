import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LocationContext } from '../context/LocationContext';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { fullLocation } = useContext(LocationContext);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.greeting}>🌙 Merhaba!</Text>
        <Text style={styles.email}>{user?.email}</Text> */}
        <Text style={styles.location}>📍 {fullLocation}</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>🕌</Text>
        <Text style={styles.placeholderTitle}>Namaz Vakitleri</Text>
        <Text style={styles.placeholderText}>
          Yakında burada namaz vakitlerini göreceksiniz
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#E8F5E9',
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});