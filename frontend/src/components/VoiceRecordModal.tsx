import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, SPACING } from '../theme';
import { haptic } from '../utils/haptics';
import { saveEclatAudio, createEclat, Eclat } from '../utils/eclatStorage';
import { MicIcon, StopIcon, SparkleIcon } from './icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');
const MAX_DURATION_MS = 120000; // 2 minutes

interface VoiceRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onEclatCreated?: (eclat: Eclat) => void;
  userLocation?: { lat: number; lng: number };
  territoire?: string;
}

export default function VoiceRecordModal({
  visible,
  onClose,
  onEclatCreated,
  userLocation = { lat: 14.6, lng: -61.0 },
  territoire = 'Fort-de-France',
}: VoiceRecordModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const saveAnim = useRef(new Animated.Value(0)).current;

  // Request audio permission on mount
  useEffect(() => {
    if (visible) {
      requestPermission();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  // Pulse animation while recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
      
      Animated.loop(
        Animated.timing(waveAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isRecording]);

  // Save animation
  useEffect(() => {
    if (isSaving) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(saveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(saveAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      saveAnim.setValue(0);
    }
  }, [isSaving]);

  const requestPermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermissionGranted(granted);
      if (granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (e) {
      console.log('Audio permission error:', e);
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await requestPermission();
      return;
    }

    try {
      haptic.eveille(); // Awakening haptic
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 100;
          if (newTime >= MAX_DURATION_MS) {
            stopRecording();
          }
          return newTime;
        });
      }, 100);
    } catch (e) {
      console.log('Start recording error:', e);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsSaving(true);
      haptic.ancre(); // Anchoring haptic during save

      await recordingRef.current.stopAndUnloadAsync();
      const tempUri = recordingRef.current.getURI();
      const duration = recordingTime;
      
      setIsRecording(false);
      
      if (tempUri && duration > 500) { // Minimum 0.5s recording
        // Save the audio file permanently
        const savedPath = await saveEclatAudio(tempUri);
        
        // Create the Eclat record
        const eclat = await createEclat(
          savedPath,
          duration,
          territoire,
          userLocation.lat,
          userLocation.lng
        );
        
        console.log('Éclat créé:', eclat);
        
        haptic.propulse(); // Success haptic
        
        // Notify parent
        if (onEclatCreated) {
          onEclatCreated(eclat);
        }
      }
      
      recordingRef.current = null;
      setRecordingTime(0);
      setIsSaving(false);
      onClose();
    } catch (e) {
      console.log('Stop recording error:', e);
      setIsRecording(false);
      setIsSaving(false);
    }
  };

  const cancelRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
    haptic.light();
    onClose();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = recordingTime / MAX_DURATION_MS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancelRecording}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        
        <View style={styles.content}>
          {isSaving ? (
            <>
              <Animated.View style={[styles.saveIndicator, { opacity: saveAnim }]}>
                <SparkleIcon size={60} color={COLORS.gold} />
              </Animated.View>
              <Text style={styles.saveText}>Création de l'Éclat...</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {isRecording ? 'Enregistrement...' : 'Capture Vocale'}
              </Text>
              <Text style={styles.subtitle}>
                {isRecording 
                  ? `${formatTime(recordingTime)} / 2:00`
                  : 'Appuyez pour commencer (2 min max)'
                }
              </Text>

              {/* Progress ring */}
              {isRecording && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBg} />
                  <View 
                    style={[
                      styles.progressRing, 
                      { 
                        borderColor: COLORS.terra,
                        borderTopColor: 'transparent',
                        borderRightColor: progress > 0.25 ? COLORS.terra : 'transparent',
                        borderBottomColor: progress > 0.5 ? COLORS.terra : 'transparent',
                        borderLeftColor: progress > 0.75 ? COLORS.terra : 'transparent',
                        transform: [{ rotate: `${progress * 360}deg` }],
                      }
                    ]} 
                  />
                </View>
              )}

              {/* Main record button */}
              <TouchableOpacity
                style={styles.recordBtnContainer}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.recordBtnOuter,
                    { transform: [{ scale: pulseAnim }] },
                    isRecording && styles.recordBtnOuterActive,
                  ]}
                >
                  <View style={[
                    styles.recordBtnInner,
                    isRecording && styles.recordBtnRecording,
                  ]}>
                    <Text style={styles.recordBtnIcon}>
                      {isRecording ? '◼' : '🎤'}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>

              {/* Wave visualization */}
              {isRecording && (
                <View style={styles.waveContainer}>
                  {[...Array(7)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: 15 + Math.sin(i * 0.8) * 20 + Math.random() * 15,
                          opacity: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Cancel button */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={cancelRecording}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  content: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 40,
  },
  progressContainer: {
    position: 'absolute',
    top: 80,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBg: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(166, 93, 71, 0.2)',
  },
  progressRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  recordBtnContainer: {
    marginBottom: 30,
  },
  recordBtnOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(166, 93, 71, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnOuterActive: {
    backgroundColor: 'rgba(166, 93, 71, 0.3)',
  },
  recordBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnRecording: {
    backgroundColor: '#CC4444',
  },
  recordBtnIcon: {
    fontSize: 28,
    color: COLORS.cream,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 6,
    marginBottom: 20,
  },
  waveBar: {
    width: 5,
    backgroundColor: COLORS.terra,
    borderRadius: 3,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.gray,
  },
  // Saving state
  saveIndicator: {
    marginBottom: 20,
  },
  saveEmoji: {
    fontSize: 60,
  },
  saveText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 22,
    color: COLORS.terra,
  },
});
