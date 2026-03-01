/**
 * KORA Settings Screen — UPGRADE 18
 * 
 * Paramètres de l'application avec :
 * - Clé de Mémoire (12 mots sacrés)
 * - Réinitialisation de l'Éveil
 * 
 * // Ces 12 mots sont votre territoire.
 * // Ne les partagez jamais. Notez-les maintenant.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../src/theme';
import { haptic } from '../src/utils/haptics';
import { getSacredWords, deleteSacredWords } from '../src/utils/sacredWords';
import { ChevronLeftIcon, KeyIcon, LockIcon, CopyIcon, AlertIcon } from '../src/components/icons/KoraIcons';

const { width: SW } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// SACRED WORDS MODAL
// ══════════════════════════════════════════════════════════════════════════════

interface SacredWordsModalProps {
  visible: boolean;
  words: string[];
  onClose: () => void;
}

function SacredWordsModal({ visible, words, onClose }: SacredWordsModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
    }
  }, [visible]);

  const handleCopy = async () => {
    const text = words.map((w, i) => `${i + 1}. ${w}`).join('\n');
    await Clipboard.setStringAsync(text);
    haptic.success();
    Alert.alert('Copié', 'Les 12 mots ont été copiés dans le presse-papier.');
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <KeyIcon size={32} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={styles.modalTitle}>Clé de Mémoire</Text>
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
              <AlertIcon size={20} color={COLORS.terra} strokeWidth={1.5} />
              <Text style={styles.warningText}>
                Ces 12 mots sont votre territoire.{'\n'}
                Ne les partagez jamais. Notez-les maintenant.
              </Text>
            </View>

            {/* Words Grid 3x4 */}
            <View style={styles.wordsGrid}>
              {words.map((word, index) => (
                <View key={index} style={styles.wordCell}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>

            {/* Copy Button */}
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <CopyIcon size={18} color={COLORS.cream} strokeWidth={1.5} />
              <Text style={styles.copyButtonText}>Copier</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeModalText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [sacredWords, setSacredWords] = useState<string[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);

  const handleBack = () => {
    router.back();
  };

  // Request biometric auth before showing sacred words
  const handleShowSacredWords = useCallback(async () => {
    setIsLoadingWords(true);
    
    try {
      // Check if biometric is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      let authenticated = false;
      
      if (hasHardware && isEnrolled) {
        // Request biometric authentication
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour voir votre Clé de Mémoire',
          fallbackLabel: 'Code de secours',
        });
        
        authenticated = result.success;
        
        if (!result.success) {
          haptic.error();
          return;
        }
      } else {
        // No biometric, allow access (on web or devices without biometric)
        authenticated = true;
      }
      
      if (authenticated) {
        // Get sacred words
        const words = await getSacredWords();
        
        if (words && words.length === 12) {
          haptic.success();
          setSacredWords(words);
          setShowWordsModal(true);
        } else {
          Alert.alert(
            'Clé non disponible',
            'Votre Clé de Mémoire n\'a pas encore été générée. Elle sera créée lors de votre prochain Éveil.'
          );
        }
      }
    } catch (error) {
      console.error('Error showing sacred words:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à votre Clé de Mémoire.');
    } finally {
      setIsLoadingWords(false);
    }
  }, []);

  // Reset Éveil and all data
  const handleResetEveil = useCallback(async () => {
    Alert.alert(
      'Réinitialiser l\'Éveil',
      'Cette action effacera toutes vos données, y compris votre Clé de Mémoire. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all storage
              await AsyncStorage.multiRemove([
                'kora_eveil_completed',
                'kora_eveil_date',
                'kora_eclats',
                'kora_first_eclat_created',
              ]);
              
              // Delete sacred words
              await deleteSacredWords();
              
              haptic.heavy();
              
              Alert.alert(
                'Éveil réinitialisé',
                'Fermez et rouvrez l\'application pour recommencer.',
                [{ text: 'OK', onPress: () => router.replace('/') }]
              );
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Erreur', 'Impossible de réinitialiser.');
            }
          },
        },
      ]
    );
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={24} color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
          
          {/* Clé de Mémoire */}
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleShowSacredWords}
            activeOpacity={0.7}
            disabled={isLoadingWords}
          >
            <View style={styles.settingsItemLeft}>
              <KeyIcon size={20} color={COLORS.gold} strokeWidth={1.5} />
              <View style={styles.settingsItemTextContainer}>
                <Text style={styles.settingsItemTitle}>Clé de Mémoire</Text>
                <Text style={styles.settingsItemSubtitle}>
                  Vos 12 mots sacrés
                </Text>
              </View>
            </View>
            <ChevronLeftIcon
              size={16}
              color={COLORS.gray}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>
        </View>

        {/* Section: Données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DONNÉES</Text>
          
          {/* Reset Éveil */}
          <TouchableOpacity
            style={[styles.settingsItem, styles.dangerItem]}
            onPress={handleResetEveil}
            activeOpacity={0.7}
          >
            <View style={styles.settingsItemLeft}>
              <LockIcon size={20} color="#ff6b6b" strokeWidth={1.5} />
              <View style={styles.settingsItemTextContainer}>
                <Text style={[styles.settingsItemTitle, styles.dangerText]}>
                  Réinitialiser l'Éveil
                </Text>
                <Text style={styles.settingsItemSubtitle}>
                  Efface toutes les données
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>KORA v1.0</Text>
          <Text style={styles.footerSubtext}>Ton monde t'attend</Text>
        </View>
      </ScrollView>

      {/* Sacred Words Modal */}
      <SacredWordsModal
        visible={showWordsModal}
        words={sacredWords}
        onClose={() => setShowWordsModal(false)}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 18,
    color: COLORS.cream,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemTextContainer: {
    gap: 2,
  },
  settingsItemTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: COLORS.cream,
  },
  settingsItemSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  dangerItem: {
    backgroundColor: 'rgba(255, 100, 100, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.15)',
  },
  dangerText: {
    color: '#ff6b6b',
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl * 2,
    paddingBottom: SPACING.xl,
  },
  footerText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  footerSubtext: {
    fontFamily: FONTS.playfairItalic,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SW * 0.9,
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: COLORS.dark2,
    borderRadius: 24,
    padding: SPACING.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    marginTop: SPACING.md,
  },
  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(166, 93, 71, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.terra,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.terra,
    lineHeight: 20,
  },
  // Words Grid
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  wordCell: {
    width: (SW * 0.9 - SPACING.lg * 2 - 16) / 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  wordNumber: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 4,
  },
  wordText: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
  },
  // Buttons
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.terra,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: SPACING.md,
  },
  copyButtonText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  closeModalBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeModalText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
});
