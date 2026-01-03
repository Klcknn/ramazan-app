import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function TesbihScreen({ navigation }) {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);

  const handlePress = () => {
    const newCount = count + 1;
    setCount(newCount);
    
    // Vibration feedback
    Vibration.vibrate(50);
    
    // Hedef tamamlandıysa
    if (newCount === target) {
      Vibration.vibrate([0, 100, 100, 100]); // Uzun titreşim
      Alert.alert(
        '🎉 Tebrikler!',
        `${target} tane tamamlandı!`,
        [
          { text: 'Devam Et', onPress: () => setCount(0) },
          { text: 'Tamam' }
        ]
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Sıfırla',
      'Sayacı sıfırlamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sıfırla', onPress: () => setCount(0), style: 'destructive' }
      ]
    );
  };

  const handleTargetChange = (newTarget) => {
    setTarget(newTarget);
    setCount(0);
  };

  return (
    <LinearGradient
      colors={['#00897B', '#26A69A', '#4DB6AC']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Hedef Seçimi */}
        <View style={styles.targetContainer}>
          <Text style={styles.targetLabel}>Hedef</Text>
          <View style={styles.targetButtons}>
            {[33, 99, 100, 500, 1000].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.targetButton,
                  target === num && styles.targetButtonActive
                ]}
                onPress={() => handleTargetChange(num)}
              >
                <Text style={[
                  styles.targetButtonText,
                  target === num && styles.targetButtonTextActive
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ana Sayaç */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>{count}</Text>
          <Text style={styles.targetText}>/ {target}</Text>
        </View>

        {/* İlerleme Çubuğu */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(count / target) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            %{Math.round((count / target) * 100)}
          </Text>
        </View>

        {/* Ana Tesbih Butonu */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F5F5F5']}
            style={styles.mainButtonGradient}
          >
            <Text style={styles.mainButtonText}>📿</Text>
            <Text style={styles.mainButtonLabel}>Dokun</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sıfırlama Butonu */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleReset}
        >
          <Text style={styles.resetButtonText}>🔄 Sıfırla</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  targetContainer: {
    width: '100%',
    marginBottom: 40,
  },
  targetLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  targetButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  targetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  targetButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: '#FFFFFF',
  },
  targetButtonText: {
    fontSize: 16,
    color: '#E0F2F1',
    fontWeight: '600',
  },
  targetButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  counterText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  targetText: {
    fontSize: 32,
    color: '#E0F2F1',
    marginTop: -20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 50,
  },
  progressBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mainButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 30,
  },
  mainButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: 80,
    marginBottom: 10,
  },
  mainButtonLabel: {
    fontSize: 20,
    color: '#00897B',
    fontWeight: 'bold',
  },
  resetButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});