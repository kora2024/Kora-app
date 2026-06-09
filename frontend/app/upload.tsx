/**
 * KORA Upload — Interface de dépôt créateur
 * 
 * Permet aux créateurs de soumettre leur contenu (audio/vidéo)
 * - Audio : Publication directe
 * - Vidéo : Soumission pour approbation admin
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/theme';
import { BackIcon, PlayIcon } from '../src/components/icons/KoraIcons';

// Conditional imports for native-only features
const DocumentPicker = Platform.OS !== 'web' ? require('expo-document-picker') : null;
const ImagePicker = Platform.OS !== 'web' ? require('expo-image-picker') : null;

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

// Territoires disponibles
const TERRITORIES = [
  { id: 'caribbean', name: 'Caraïbes', emoji: '🌴' },
  { id: 'africa', name: 'Afrique', emoji: '🌍' },
  { id: 'diaspora', name: 'Diaspora', emoji: '🌐' },
  { id: 'latin', name: 'Latin', emoji: '💃' },
  { id: 'world', name: 'Monde', emoji: '🎵' },
];

// Catégories
const CATEGORIES = [
  { id: 'music', name: 'Musique', icon: '🎵' },
  { id: 'podcast', name: 'Podcast', icon: '🎙️' },
  { id: 'film', name: 'Film/Série', icon: '🎬' },
  { id: 'documentary', name: 'Documentaire', icon: '📽️' },
  { id: 'live', name: 'Live/Concert', icon: '🎤' },
];

// Genres musicaux
const GENRES = [
  'Afrobeat', 'Reggae', 'Dancehall', 'Zouk', 'Kompa', 
  'Hip-Hop', 'R&B', 'Soul', 'Jazz', 'Gospel',
  'Salsa', 'Bachata', 'Rumba', 'Highlife', 'Soukous',
];

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Form state
  const [contentType, setContentType] = useState<'audio' | 'video'>('audio');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [territory, setTerritory] = useState('caribbean');
  const [category, setCategory] = useState('music');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isrc, setIsrc] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [copyright, setCopyright] = useState('');
  
  // File state
  const [mediaFile, setMediaFile] = useState<any>(null);
  const [artworkFile, setArtworkFile] = useState<any>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if user is creator
  useEffect(() => {
    checkCreatorStatus();
  }, []);

  const checkCreatorStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour accéder à cette fonctionnalité.');
        router.back();
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const profile = await res.json();
        setIsCreator(profile.is_creator || false);
      }
    } catch (error) {
      console.error('Error checking creator status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const becomeCreator = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      
      const res = await fetch(`${API_BASE}/api/auth/become-creator`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setIsCreator(true);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        Alert.alert('Bienvenue !', 'Vous êtes maintenant un créateur KORA.');
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de devenir créateur. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickMedia = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: contentType === 'audio' 
          ? ['audio/*', 'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/flac']
          : ['video/*', 'video/mp4', 'video/quicktime', 'video/x-msvideo'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setMediaFile(result.assets[0]);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const pickArtwork = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setArtworkFile(result.assets[0]);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner la pochette.');
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre].slice(0, 5)
    );
    try { Haptics.selectionAsync(); } catch {}
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis.');
      return;
    }
    if (!mediaFile) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier média.');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('auth_token');

      // For now, we'll submit metadata only (Cloudinary integration pending)
      const submission = {
        title: title.trim(),
        description: description.trim(),
        type: contentType,
        category,
        territory,
        genres: selectedGenres,
        media_url: mediaFile.uri, // Placeholder - would be Cloudinary URL after upload
        artwork_url: artworkFile?.uri || '',
        duration: 0,
        isrc: isrc.trim(),
        explicit,
        copyright: copyright.trim(),
      };

      const res = await fetch(`${API_BASE}/api/content/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (res.ok) {
        const result = await res.json();
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        
        if (contentType === 'video') {
          Alert.alert(
            'Soumis pour approbation',
            'Votre vidéo sera examinée par notre équipe. Vous serez notifié une fois approuvée.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert(
            'Publié !',
            'Votre contenu audio est maintenant disponible sur KORA.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Erreur de soumission');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de soumettre le contenu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.terra} />
      </View>
    );
  }

  // Not a creator - show activation screen
  if (!isCreator) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon size={24} color={COLORS.cream} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Devenir Créateur</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.activationContainer}>
          <Text style={styles.activationIcon}>🎨</Text>
          <Text style={styles.activationTitle}>Rejoignez les créateurs KORA</Text>
          <Text style={styles.activationDesc}>
            Partagez votre musique, vos films et votre art avec la communauté diasporique mondiale.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎵</Text>
              <Text style={styles.benefitText}>Publication directe de vos audios</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎬</Text>
              <Text style={styles.benefitText}>Soumission vidéo avec modération premium</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>Statistiques détaillées de vos contenus</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💰</Text>
              <Text style={styles.benefitText}>Monétisation future de vos œuvres</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.activateBtn}
            onPress={becomeCreator}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.terra, '#8B4D3B']}
              style={styles.activateBtnGradient}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.cream} />
              ) : (
                <Text style={styles.activateBtnText}>Activer mon compte créateur</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Creator upload form
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon size={24} color={COLORS.cream} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau contenu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de contenu</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, contentType === 'audio' && styles.typeBtnActive]}
              onPress={() => { setContentType('audio'); setMediaFile(null); }}
            >
              <Text style={styles.typeEmoji}>🎵</Text>
              <Text style={[styles.typeText, contentType === 'audio' && styles.typeTextActive]}>Audio</Text>
              <Text style={styles.typeSubtext}>Publication directe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, contentType === 'video' && styles.typeBtnActive]}
              onPress={() => { setContentType('video'); setMediaFile(null); }}
            >
              <Text style={styles.typeEmoji}>🎬</Text>
              <Text style={[styles.typeText, contentType === 'video' && styles.typeTextActive]}>Vidéo</Text>
              <Text style={styles.typeSubtext}>Soumis pour approbation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* File Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fichier média</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickMedia}>
            {mediaFile ? (
              <View style={styles.fileSelected}>
                <Text style={styles.fileIcon}>{contentType === 'audio' ? '🎵' : '🎬'}</Text>
                <Text style={styles.fileName} numberOfLines={1}>{mediaFile.name}</Text>
                <Text style={styles.fileSize}>
                  {mediaFile.size ? `${(mediaFile.size / 1024 / 1024).toFixed(1)} MB` : ''}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.uploadIcon}>+</Text>
                <Text style={styles.uploadText}>
                  Sélectionner un fichier {contentType === 'audio' ? 'audio' : 'vidéo'}
                </Text>
                <Text style={styles.uploadHint}>
                  {contentType === 'audio' ? 'WAV, FLAC, MP3, AAC' : 'MP4, MOV, AVI'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pochette</Text>
          <TouchableOpacity style={styles.artworkBox} onPress={pickArtwork}>
            {artworkFile ? (
              <View style={styles.artworkPreview}>
                <Text style={styles.artworkIcon}>✓</Text>
                <Text style={styles.artworkText}>Pochette sélectionnée</Text>
              </View>
            ) : (
              <>
                <Text style={styles.uploadIcon}>🖼️</Text>
                <Text style={styles.uploadText}>Ajouter une pochette</Text>
                <Text style={styles.uploadHint}>3000×3000px recommandé</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de votre œuvre"
            placeholderTextColor={COLORS.gray}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez votre contenu..."
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Territory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Territoire</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              {TERRITORIES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, territory === t.id && styles.chipActive]}
                  onPress={() => setTerritory(t.id)}
                >
                  <Text style={styles.chipEmoji}>{t.emoji}</Text>
                  <Text style={[styles.chipText, territory === t.id && styles.chipTextActive]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, category === c.id && styles.chipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Text style={styles.chipEmoji}>{c.icon}</Text>
                  <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres (max 5)</Text>
          <View style={styles.genresGrid}>
            {GENRES.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genreChip, selectedGenres.includes(g) && styles.genreChipActive]}
                onPress={() => toggleGenre(g)}
              >
                <Text style={[styles.genreText, selectedGenres.includes(g) && styles.genreTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métadonnées (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="Code ISRC"
            placeholderTextColor={COLORS.gray}
            value={isrc}
            onChangeText={setIsrc}
          />
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="Copyright (ex: © 2024 Votre Nom)"
            placeholderTextColor={COLORS.gray}
            value={copyright}
            onChangeText={setCopyright}
          />
          <TouchableOpacity 
            style={styles.explicitToggle}
            onPress={() => setExplicit(!explicit)}
          >
            <View style={[styles.checkbox, explicit && styles.checkboxActive]}>
              {explicit && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.explicitLabel}>Contenu explicite</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            {contentType === 'audio' ? '🎵 Audio : Publication directe' : '🎬 Vidéo : Modération requise'}
          </Text>
          <Text style={styles.infoText}>
            {contentType === 'audio' 
              ? 'Votre audio sera immédiatement disponible sur KORA après soumission.'
              : 'Votre vidéo sera examinée par notre équipe avant publication. Délai moyen : 24-48h.'}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[COLORS.terra, '#8B4D3B']}
            style={styles.submitBtnGradient}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.cream} />
            ) : (
              <Text style={styles.submitBtnText}>
                {contentType === 'video' ? 'Soumettre pour approbation' : 'Publier maintenant'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Type selector
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    borderColor: COLORS.terra,
    backgroundColor: 'rgba(166,93,71,0.1)',
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.gray,
  },
  typeTextActive: {
    color: COLORS.cream,
  },
  typeSubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  // Upload box
  uploadBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 32,
    color: COLORS.terra,
    marginBottom: 12,
  },
  uploadText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  uploadHint: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
  },
  fileSelected: {
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  fileName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    maxWidth: 200,
  },
  fileSize: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.terra,
    marginTop: 4,
  },
  // Artwork
  artworkBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  artworkPreview: {
    alignItems: 'center',
  },
  artworkIcon: {
    fontSize: 24,
    color: COLORS.terra,
  },
  artworkText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 8,
  },
  // Input
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Chips
  chipContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  chipActive: {
    backgroundColor: COLORS.terra,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  chipTextActive: {
    color: COLORS.cream,
  },
  // Genres
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  genreChipActive: {
    backgroundColor: COLORS.terra,
  },
  genreText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.gray,
  },
  genreTextActive: {
    color: COLORS.cream,
  },
  // Explicit toggle
  explicitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.terra,
    borderColor: COLORS.terra,
  },
  checkmark: {
    color: COLORS.cream,
    fontSize: 14,
    fontWeight: 'bold',
  },
  explicitLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  // Info box
  infoBox: {
    backgroundColor: 'rgba(166,93,71,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.terra,
  },
  infoTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 20,
  },
  // Submit button
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  // Activation screen
  activationContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activationIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  activationTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 12,
  },
  activationDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
  },
  activateBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  activateBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  activateBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
});
