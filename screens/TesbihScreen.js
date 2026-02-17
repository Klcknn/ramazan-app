import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ImageBackground, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

const TESBIH_STORAGE_KEY = 'tesbih_data_v1';
const TARGET_OPTIONS = [33, 99, 500, 'infinite'];

const createInitialCounts = () => {
  const base = {};
  TARGET_OPTIONS.forEach((value) => {
    base[value] = 0;
  });
  return base;
};

export default function TesbihScreen({ navigation }) {
  const [target, setTarget] = useState(33);
  const [countsByTarget, setCountsByTarget] = useState(createInitialCounts);

  useEffect(() => {
    const loadTesbihData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(TESBIH_STORAGE_KEY);
        if (!savedData) return;

        const parsed = JSON.parse(savedData);
        const nextCounts = createInitialCounts();

        if (parsed && typeof parsed.countsByTarget === 'object') {
          if (parsed.version === 2) {
            TARGET_OPTIONS.forEach((value) => {
              const current = parsed.countsByTarget[value];
              if (typeof current === 'number' && current >= 0) {
                nextCounts[value] = current;
              }
            });
          } else {
            // Legacy migration:
            // old 100 -> new 500, old 500 -> new Sonsuz
            if (typeof parsed.countsByTarget[33] === 'number') {
              nextCounts[33] = Math.max(0, parsed.countsByTarget[33]);
            }
            if (typeof parsed.countsByTarget[99] === 'number') {
              nextCounts[99] = Math.max(0, parsed.countsByTarget[99]);
            }
            if (typeof parsed.countsByTarget[100] === 'number') {
              nextCounts[500] = Math.max(0, parsed.countsByTarget[100]);
            }
            if (typeof parsed.countsByTarget[500] === 'number') {
              nextCounts.infinite = Math.max(0, parsed.countsByTarget[500]);
            }
          }
        } else if (typeof parsed?.count === 'number' && typeof parsed?.target === 'number') {
          if (TARGET_OPTIONS.includes(parsed.target)) {
            nextCounts[parsed.target] = Math.max(0, parsed.count);
          } else if (parsed.target === 100) {
            nextCounts[500] = Math.max(0, parsed.count);
          } else if (parsed.target === 500) {
            nextCounts.infinite = Math.max(0, parsed.count);
          }
        }

        setCountsByTarget(nextCounts);

        if (TARGET_OPTIONS.includes(parsed?.target)) {
          setTarget(parsed.target);
        } else if (parsed?.target === 100) {
          setTarget(500);
        } else if (parsed?.target === 500) {
          setTarget('infinite');
        }
      } catch (error) {
        console.log('Tesbih verisi okunamadi:', error);
      }
    };

    loadTesbihData();
  }, []);

  useEffect(() => {
    const saveTesbihData = async () => {
      try {
        await AsyncStorage.setItem(
          TESBIH_STORAGE_KEY,
          JSON.stringify({ version: 2, target, countsByTarget })
        );
      } catch (error) {
        console.log('Tesbih verisi kaydedilemedi:', error);
      }
    };

    saveTesbihData();
  }, [target, countsByTarget]);

  const currentCount = countsByTarget[target] || 0;

  const handlePress = () => {
    const newCount = currentCount + 1;

    setCountsByTarget((prev) => ({
      ...prev,
      [target]: newCount,
    }));

    Vibration.vibrate(50);

    if (typeof target === 'number' && newCount === target) {
      Vibration.vibrate([0, 100, 100, 100]);
      Alert.alert(
        '🎉 Tebrikler!',
        `${target} tane tamamlandı!`,
        [
          {
            text: 'Devam Et',
            onPress: () => {
              setCountsByTarget((prev) => ({
                ...prev,
                [target]: 0,
              }));
            },
          },
          { text: 'Tamam' },
        ]
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Sıfırla',
      'Bu hedefteki sayacı sıfırlamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            setCountsByTarget((prev) => ({
              ...prev,
              [target]: 0,
            }));
          },
        },
      ]
    );
  };

  const handleTargetChange = (newTarget) => {
    if (newTarget === 'refresh') {
      setCountsByTarget((prev) => ({
        ...prev,
        [target]: 0,
      }));
      return;
    }

    setTarget(newTarget);
  };

  const isInfiniteTarget = target === 'infinite';
  const progressPercent = isInfiniteTarget
    ? 0
    : Math.min(100, Math.round((currentCount / target) * 100));

  return (
    <ImageBackground
      source={require('../assets/images/tesbih_background_image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.backgroundOverlay}>
        <LinearGradient
          colors={['#00897B', '#26A69A', '#4DB6AC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tesbih</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Hedef</Text>
            <View style={styles.targetButtons}>
              {[...TARGET_OPTIONS, 'refresh'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.targetButton,
                    target === num && styles.targetButtonActive,
                    num === 'refresh' && styles.refreshTargetButton,
                  ]}
                  onPress={() => handleTargetChange(num)}
                >
                  <Text
                    style={[
                      styles.targetButtonText,
                      target === num && styles.targetButtonTextActive,
                      num === 'refresh' && styles.refreshTargetButtonText,
                    ]}
                  >
                    {num === 'refresh' ? 'Yenile' : num === 'infinite' ? 'Sonsuz' : num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>{currentCount}</Text>
            <Text style={styles.targetText}>/ {isInfiniteTarget ? 'Sonsuz' : target}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{isInfiniteTarget ? 'Sonsuz mod' : `%${progressPercent}`}</Text>
          </View>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={handlePress}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <LinearGradient colors={['#FFFFFF', '#F5F5F5']} style={styles.mainButtonGradient}>
              <Text style={styles.mainButtonText}>📿</Text>
              <Text style={styles.mainButtonLabel}>Dokun</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>🔄 Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(68, 58, 58, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  targetContainer: {
    width: '100%',
    marginBottom: 40,
  },
  targetLabel: {
    fontSize: 22,
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
    backgroundColor: '#2E7D32',
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
  refreshTargetButton: {
    backgroundColor: '#FFFFFF',
  },
  refreshTargetButtonText: {
    color: '#00897B',
    fontWeight: '700',
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
    marginBottom: 30,
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
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 20,
  },
  mainButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: 54,
    marginBottom: 6,
  },
  mainButtonLabel: {
    fontSize: 16,
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
