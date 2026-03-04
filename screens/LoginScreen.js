import { createResponsiveStyles } from '../hooks/responsive-styles';
/* eslint-disable no-unused-vars */
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppLogo from '../assets/images/logo/AppLogo';
import { auth } from '../config/firebase';
import { LocationContext } from '../context/LocationContext';
import { useLocalization } from '../context/LocalizationContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { fullLocation, backgroundImage, loading: locationLoading } = useContext(LocationContext);
  const { t } = useLocalization();

  const validateForm = () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return false;
    }
    if (!password) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Firebase ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Giriş başarılı:', user.uid);
      
      // Alert.alert kaldır - otomatik yönlenecek
      console.log('✅ Giriş başarılı, ana ekrana yönlendiriliyor...');
      // AuthContext otomatik olarak MainTabs'e yönlendirecek
      
      /* Alert.alert(
        'Başarılı! 🎉', 
        'Giriş yapıldı. Ana sayfaya yönlendiriliyorsunuz...'
      ); */
      
      // TODO: Ana ekrana yönlendir (yarın yapacağız)
      
    } catch (error) {
      console.error('❌ Giriş hatası:', error);
      
      // Hata mesajlarını Türkçe'ye çevir
      let errorMessage = 'Giriş sırasında bir hata oluştu';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Bu email ile kayıtlı kullanıcı bulunamadı';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Yanlış şifre';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Bu hesap devre dışı bırakılmış';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'İnternet bağlantısı hatası';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email veya şifre hatalı';
      }
      
      Alert.alert(t('auth.loginFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>{t('auth.loadingLocation')}</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{ uri: backgroundImage }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(21, 101, 192, 0.3)',
          'rgba(46, 125, 50, 0.5)',
          'rgba(255, 255, 255, 0.8)'
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Logo ve Konum */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <AppLogo size={110} color="#2E7D32" />
            </View>
            
            <BlurView intensity={40} tint="light" style={styles.locationBadge}>
              <Text style={styles.locationText}>📍 {fullLocation}</Text>
            </BlurView>
          </View>

          {/* Form Kartı */}
          <BlurView intensity={60} tint="light" style={styles.formCard}>
            <Text style={styles.title}>{t('auth.welcome')}</Text>
            <Text style={styles.subtitle}>{t('auth.prepareRamadan')}</Text>

            {/* Email */}
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

            {/* Şifre */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Şifremi Unuttum */}
            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => Alert.alert(t('common.info'), t('auth.resetSoon'))}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Giriş Butonu */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2E7D32', '#388E3C']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? t('auth.loggingIn') : t('auth.login')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Kayıt Ol */}
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                {t('auth.noAccount')} <Text style={styles.registerTextBold}>{t('auth.register')}</Text>
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = createResponsiveStyles({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  locationBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
//  borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  //borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginLeft: 3,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginTop: -5,
  },
  forgotText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerTextBold: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});




