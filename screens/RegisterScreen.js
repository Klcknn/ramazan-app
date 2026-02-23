import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useLocalization } from '../context/LocalizationContext';

export default function RegisterScreen({ navigation }) {
  // State'ler - form verilerini tutar
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLocalization();

  // Form validasyonu
  const validateForm = () => {
    // Email kontrolü
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.validEmailRequired'));
      return false;
    }

    // İsim kontrolü
    if (!fullName) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return false;
    }

    // Şifre kontrolü
    if (!password) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordMin'));
      return false;
    }

    // Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return false;
    }

    return true;
  };

  // Kayıt fonksiyonu
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Firebase'de kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Kullanıcı bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'users', user.uid), {
        fullName: fullName,
        email: email,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      });

      console.log('✅ Kullanıcı başarıyla kaydedildi:', user.uid);

      Alert.alert(
        `${t('auth.registerSuccessTitle')} 🎉`, 
        t('auth.registerSuccessDesc'),
        [{ 
          text: t('common.ok'), 
          onPress: () => navigation.navigate('Login')
        }]
      );
      
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      
      // Hata mesajlarını Türkçe'ye çevir
      let errorMessage = t('auth.registerError');
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('auth.emailInUse');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmail');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('auth.weakPassword');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('auth.networkError');
      }
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>🌙 {t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.prepareRamadanShort')}</Text>
        </View>

        <View style={styles.form}>
          {/* Ad Soyad Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.fullName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.fullNamePlaceholder')}
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Şifre Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.passwordMinPlaceholder')}
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Şifre Tekrar Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.passwordRepeat')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.passwordRepeatPlaceholder')}
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Kayıt Butonu */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('auth.registering') : t('auth.register')}
            </Text>
          </TouchableOpacity>

          {/* Giriş Yap Linki */}
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>
              {t('auth.alreadyHaveAccount')} <Text style={styles.linkTextBold}>{t('auth.login')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a5f',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#1e3a5f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#ddd',
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
