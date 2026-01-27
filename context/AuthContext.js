// AuthContext.js - ARTIK KULLANILMIYOR
// Bu dosya giriş/kayıt sistemi kaldırıldığında gerekli değil
// Dosyayı tamamen silebilirsiniz

// VEYA boş bir context export edin (uyumluluk için):

import React from 'react';

export const AuthContext = React.createContext({
  user: null,
  loading: false,
});

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};