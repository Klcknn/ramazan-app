import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase kullanıcı durumu değişikliklerini dinle
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Kullanıcı giriş yapmış
        console.log('✅ Kullanıcı oturumu aktif:', currentUser.email);
        setUser(currentUser);
        
        // AsyncStorage'a kaydet
        await AsyncStorage.setItem('userLoggedIn', 'true');
      } else {
        // Kullanıcı çıkış yapmış
        console.log('❌ Kullanıcı oturumu yok');
        setUser(null);
        
        // AsyncStorage'dan sil
        await AsyncStorage.removeItem('userLoggedIn');
      }
      
      setLoading(false);
    });

    // Cleanup
    return unsubscribe;
  }, []);

  // Çıkış yapma fonksiyonu
  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userLoggedIn');
      console.log('✅ Çıkış yapıldı');
    } catch (error) {
      console.error('❌ Çıkış hatası:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};