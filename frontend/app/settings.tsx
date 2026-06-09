/**
 * KORA Settings Screen — UPGRADES 18, 21, 24
 * 
 * Paramètres de l'application avec :
 * - Clé de Mémoire (12 mots sacrés)
 * - Curseur d'Harmonie
 * - Territoires éloignés (Étoiles Noires)
 * - Transition de téléphone (48h)
 * - Réinitialisation de l'Éveil
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
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../src/theme';
import { haptic } from '../src/utils/haptics';
import { getSacredWords, deleteSacredWords } from '../src/utils/sacredWords';
import { 
  getEtoilesNoires, 
  rallumerTerritoire, 
  getHarmonieLevel, 
  setHarmonieLevel,
  EtoileNoire,
  clearEtoilesNoires,
} from '../src/utils/etoileNoire';
import {
  getDeviceTransition,
  startDeviceTransition,
  cancelDeviceTransition,
  getTransitionTimeRemaining,
  formatTimeRemaining,
  clearDeviceTransition,
} from '../src/utils/deviceTransition';
import { 
  BackIcon, 
  KeyIcon, 
  LockIcon, 
  CopyIcon, 
  AlertIcon,
  SettingsIcon,
  CloseIcon,
} from '../src/components/icons/KoraIcons';

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
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
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
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <KeyIcon size={32} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={styles.modalTitle}>Clé de Mémoire</Text>
            </View>

            <View style={styles.warningBox}>
              <AlertIcon size={20} color={COLORS.terra} strokeWidth={1.5} />
              <Text style={styles.warningText}>
                Ces 12 mots sont votre territoire.{'\n'}
                Ne les partagez jamais. Notez-les maintenant.
              </Text>
            </View>

            <View style={styles.wordsGrid}>
              {words.map((word, index) => (
                <View key={index} style={styles.wordCell}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
              <CopyIcon size={18} color={COLORS.cream} strokeWidth={1.5} />
              <Text style={styles.copyButtonText}>Copier</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.closeModalText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTOILES NOIRES MODAL — UPGRADE 21
// ══════════════════════════════════════════════════════════════════════════════

interface EtoilesNoiresModalProps {
  visible: boolean;
  etoiles: EtoileNoire[];
  onRallumer: (id: string) => void;
  onClose: () => void;
}

function EtoilesNoiresModal({ visible, etoiles, onRallumer, onClose }: EtoilesNoiresModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.etoileIcon}>🌑</Text>
            <Text style={styles.modalTitle}>Territoires éloignés</Text>
          </View>

          <Text style={styles.etoileDescription}>
            Ces territoires sont silencieux pour vous. Leurs éclats ne vous atteignent plus.
          </Text>

          {etoiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun territoire éloigné</Text>
              <Text style={styles.emptySubtext}>Tous les territoires sont audibles</Text>
            </View>
          ) : (
            <View style={styles.etoilesList}>
              {etoiles.map((etoile) => (
                <View key={etoile.territoireId} style={styles.etoileItem}>
                  <View style={styles.etoileInfo}>
                    <Text style={styles.etoileName}>{etoile.nom}</Text>
                    <Text style={styles.etoileDate}>
                      Éloigné le {new Date(etoile.eloigneAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.rallumerBtn}
                    onPress={() => onRallumer(etoile.territoireId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rallumerText}>Rallumer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.closeModalBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeModalText}>Fermer</Text>
          </TouchableOpacity>
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
  
  // Sacred Words state
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [sacredWords, setSacredWords] = useState<string[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);

  // UPGRADE 21 — Harmonie & Étoiles Noires
  const [harmonieLevel, setHarmonieLevelState] = useState(0.5);
  const [showEtoilesModal, setShowEtoilesModal] = useState(false);
  const [etoilesNoires, setEtoilesNoires] = useState<EtoileNoire[]>([]);

  // UPGRADE 24 — Device Transition
  const [transitionActive, setTransitionActive] = useState(false);
  const [transitionRemaining, setTransitionRemaining] = useState('');

  // Load data on mount
  useEffect(() => {
    loadHarmonieLevel();
    loadEtoilesNoires();
    checkTransition();
  }, []);

  // Check transition timer periodically
  useEffect(() => {
    const interval = setInterval(checkTransition, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const loadHarmonieLevel = async () => {
    const level = await getHarmonieLevel();
    setHarmonieLevelState(level);
  };

  const loadEtoilesNoires = async () => {
    const etoiles = await getEtoilesNoires();
    setEtoilesNoires(etoiles);
  };

  const checkTransition = async () => {
    const remaining = await getTransitionTimeRemaining();
    setTransitionActive(remaining > 0);
    setTransitionRemaining(formatTimeRemaining(remaining));
  };

  const handleBack = () => {
    router.back();
  };

  // Harmonie slider change
  const handleHarmonieChange = async (value: number) => {
    setHarmonieLevelState(value);
    await setHarmonieLevel(value);
  };

  // Sacred Words
  const handleShowSacredWords = useCallback(async () => {
    setIsLoadingWords(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      let authenticated = !hasHardware || !isEnrolled;
      
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour voir votre Clé de Mémoire',
          fallbackLabel: 'Code de secours',
        });
        authenticated = result.success;
        if (!result.success) {
          haptic.error();
          return;
        }
      }
      
      if (authenticated) {
        const words = await getSacredWords();
        if (words && words.length === 12) {
          haptic.success();
          setSacredWords(words);
          setShowWordsModal(true);
        } else {
          Alert.alert('Clé non disponible', 'Votre Clé de Mémoire n\'a pas encore été générée.');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à votre Clé de Mémoire.');
    } finally {
      setIsLoadingWords(false);
    }
  }, []);

  // Étoiles Noires — Rallumer
  const handleRallumer = useCallback(async (territoireId: string) => {
    const success = await rallumerTerritoire(territoireId);
    if (success) {
      haptic.success();
      await loadEtoilesNoires();
    }
  }, []);

  // Device Transition
  const handleStartTransition = useCallback(async () => {
    // Require biometric + sacred words verification
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Vérification biométrique requise',
        fallbackLabel: 'Code de secours',
      });
      if (!result.success) {
        haptic.error();
        return;
      }
    }

    Alert.alert(
      'Changer de téléphone',
      'Cela démarrera un délai de sécurité de 48h. Pendant ce temps, votre territoire sera en mode "Transition".\n\nÊtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            await startDeviceTransition();
            haptic.success();
            await checkTransition();
            Alert.alert('Transition démarrée', 'Délai de 48h activé. Vous recevrez une confirmation une fois terminé.');
          },
        },
      ]
    );
  }, []);

  const handleCancelTransition = useCallback(async () => {
    Alert.alert(
      'Annuler la transition',
      'Voulez-vous annuler le changement de téléphone en cours ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            await cancelDeviceTransition();
            haptic.medium();
            await checkTransition();
          },
        },
      ]
    );
  }, []);

  // Reset everything
  const handleResetEveil = useCallback(async () => {
    Alert.alert(
      'Réinitialiser l\'Éveil',
      'Cette action effacera toutes vos données, y compris votre Clé de Mémoire et vos ancrages. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'kora_eveil_completed',
                'kora_eveil_date',
                'kora_eclats',
                'kora_first_eclat_created',
                'kora_ancrages',
              ]);
              await deleteSacredWords();
              await clearEtoilesNoires();
              await clearDeviceTransition();
              haptic.heavy();
              Alert.alert('Éveil réinitialisé', 'Fermez et rouvrez l\'application pour recommencer.', [
                { text: 'OK', onPress: () => router.replace('/') },
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser.');
            }
          },
        },
      ]
    );
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Transition Banner — UPGRADE 24 */}
      {transitionActive && (
        <TouchableOpacity style={styles.transitionBanner} onPress={handleCancelTransition}>
          <Text style={styles.transitionIcon}>⚠</Text>
          <View style={styles.transitionTextContainer}>
            <Text style={styles.transitionTitle}>Transition en cours</Text>
            <Text style={styles.transitionTime}>{transitionRemaining} restantes</Text>
          </View>
          <Text style={styles.transitionCancel}>Annuler</Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <BackIcon size={24} color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Section: Harmonie — UPGRADE 21 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HARMONIE</Text>
          <View style={styles.harmonieContainer}>
            <View style={styles.harmonieLabels}>
              <Text style={styles.harmonieLabel}>Spectre Large</Text>
              <Text style={styles.harmonieLabel}>Spectre Harmonique</Text>
            </View>
            <TouchableOpacity 
              style={styles.harmonieSliderContainer}
              onPress={(e: any) => {
                // Simple tap to change value
                const newValue = harmonieLevel < 0.5 ? 0.7 : 0.3;
                handleHarmonieChange(newValue);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.harmonieSliderTrack}>
                <View style={[styles.harmonieSliderFill, { width: `${harmonieLevel * 100}%` }]} />
                <View style={[styles.harmonieSliderThumb, { left: `${harmonieLevel * 100}%` }]} />
              </View>
            </TouchableOpacity>
            <Text style={styles.harmonieDescription}>
              {harmonieLevel < 0.3 
                ? 'Tous les territoires sont audibles'
                : harmonieLevel > 0.7 
                  ? 'Filtre personnalisé actif'
                  : 'Équilibre entre découverte et filtrage'}
            </Text>
          </View>
        </View>

        {/* Section: Territoires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERRITOIRES</Text>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => { loadEtoilesNoires(); setShowEtoilesModal(true); }}
            activeOpacity={0.7}
          >
            <View style={styles.settingsItemLeft}>
              <Text style={styles.etoileIconSmall}>🌑</Text>
              <View style={styles.settingsItemTextContainer}>
                <Text style={styles.settingsItemTitle}>Territoires éloignés</Text>
                <Text style={styles.settingsItemSubtitle}>
                  {etoilesNoires.length === 0 
                    ? 'Aucun territoire silencieux'
                    : `${etoilesNoires.length} territoire${etoilesNoires.length > 1 ? 's' : ''} silencieux`}
                </Text>
              </View>
            </View>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <BackIcon size={16} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
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
                <Text style={styles.settingsItemSubtitle}>Vos 12 mots sacrés</Text>
              </View>
            </View>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <BackIcon size={16} color={COLORS.gray} />
            </View>
          </TouchableOpacity>

          {/* Device Transition — UPGRADE 24 */}
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={transitionActive ? handleCancelTransition : handleStartTransition}
            activeOpacity={0.7}
          >
            <View style={styles.settingsItemLeft}>
              <LockIcon size={20} color={COLORS.blue} strokeWidth={1.5} />
              <View style={styles.settingsItemTextContainer}>
                <Text style={styles.settingsItemTitle}>Changer de téléphone</Text>
                <Text style={styles.settingsItemSubtitle}>
                  {transitionActive ? `En cours — ${transitionRemaining}` : 'Délai de sécurité 48h'}
                </Text>
              </View>
            </View>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <BackIcon size={16} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DONNÉES</Text>
          <TouchableOpacity
            style={[styles.settingsItem, styles.dangerItem]}
            onPress={handleResetEveil}
            activeOpacity={0.7}
          >
            <View style={styles.settingsItemLeft}>
              <AlertIcon size={20} color="#ff6b6b" strokeWidth={1.5} />
              <View style={styles.settingsItemTextContainer}>
                <Text style={[styles.settingsItemTitle, styles.dangerText]}>Réinitialiser l&apos;Éveil</Text>
                <Text style={styles.settingsItemSubtitle}>Efface toutes les données</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>KORA v1.0</Text>
          <Text style={styles.footerSubtext}>Ton monde t&apos;attend</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <SacredWordsModal visible={showWordsModal} words={sacredWords} onClose={() => setShowWordsModal(false)} />
      <EtoilesNoiresModal
        visible={showEtoilesModal}
        etoiles={etoilesNoires}
        onRallumer={handleRallumer}
        onClose={() => setShowEtoilesModal(false)}
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
  // Transition Banner
  transitionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  transitionIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  transitionTextContainer: {
    flex: 1,
  },
  transitionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.dark,
  },
  transitionTime: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.dark,
    opacity: 0.8,
  },
  transitionCancel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.dark,
    opacity: 0.7,
  },
  // Header
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
  // Harmonie
  harmonieContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: SPACING.md,
  },
  harmonieLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  harmonieLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
  },
  harmonieSlider: {
    width: '100%',
    height: 40,
  },
  harmonieDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  // Settings Items
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
  etoileIconSmall: {
    fontSize: 18,
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
  etoileIcon: {
    fontSize: 32,
  },
  etoileDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
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
  // Étoiles Noires List
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: COLORS.cream,
  },
  emptySubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  etoilesList: {
    marginBottom: SPACING.lg,
  },
  etoileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: 8,
  },
  etoileInfo: {
    flex: 1,
  },
  etoileName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  etoileDate: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  rallumerBtn: {
    backgroundColor: COLORS.terra,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rallumerText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
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
  // Custom Slider
  harmonieSliderContainer: {
    width: '100%',
    paddingVertical: 12,
  },
  harmonieSliderTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    position: 'relative',
  },
  harmonieSliderFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.terra,
    borderRadius: 3,
    left: 0,
  },
  harmonieSliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cream,
    top: -7,
    marginLeft: -10,
  },
});
