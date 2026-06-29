/**
 * KORA Playlists — Gestion des Playlists Premium
 * 
 * Interface cinématique pour:
 * - Créer/modifier des playlists
 * - Parcourir les playlists publiques
 * - Ajouter des tracks
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Animated,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function BackIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function PlusIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function PlayIcon({ size = 20, color = COLORS.dark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 3L19 12L5 21V3Z" fill={color} />
    </Svg>
  );
}

function TrashIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke={COLORS.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function MusicIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16Z" stroke={COLORS.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedCard({ children, onPress, style, delay = 0 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 100, friction: 12, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, tension: 180, friction: 14, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
      <Animated.View style={[style, { opacity, transform: [{ scale }, { translateY }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAYLIST CARD
// ══════════════════════════════════════════════════════════════════════════════

function PlaylistCard({ playlist, onPress, onDelete, isOwner, index }: any) {
  return (
    <AnimatedCard onPress={onPress} style={styles.playlistCard} delay={index * 80}>
      <Image source={{ uri: playlist.cover_url }} style={styles.playlistCover} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.playlistGradient}
      />
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={2}>{playlist.name}</Text>
        <Text style={styles.playlistMeta}>
          {playlist.tracks?.length || 0} titres • {playlist.followers_count || 0} followers
        </Text>
        {playlist.territory && playlist.territory !== 'world' && (
          <View style={styles.territoryBadge}>
            <Text style={styles.territoryText}>{playlist.territory.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.playlistActions}>
        <TouchableOpacity style={styles.playBtn} onPress={onPress}>
          <PlayIcon size={16} color={COLORS.dark} />
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(playlist._id)}>
            <TrashIcon size={16} />
          </TouchableOpacity>
        )}
      </View>
    </AnimatedCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATE PLAYLIST MODAL
// ══════════════════════════════════════════════════════════════════════════════

function CreatePlaylistModal({ visible, onClose, onCreate }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    setLoading(true);
    await onCreate({ name: name.trim(), description: description.trim(), is_public: isPublic });
    setLoading(false);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient colors={[COLORS.dark2, COLORS.dark]} style={StyleSheet.absoluteFill} />
          
          <Text style={styles.modalTitle}>Nouvelle Playlist</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Nom de la playlist"
            placeholderTextColor={COLORS.gray}
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={[styles.modalInput, styles.modalTextarea]}
            placeholder="Description (optionnel)"
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsPublic(!isPublic)}
          >
            <Text style={styles.toggleLabel}>Playlist publique</Text>
            <View style={[styles.toggle, isPublic && styles.toggleActive]}>
              <View style={[styles.toggleDot, isPublic && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.dark} size="small" />
              ) : (
                <Text style={styles.createBtnText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function PlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToken();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchPublicPlaylists();
    } else if (token) {
      fetchMyPlaylists();
    }
  }, [activeTab, token]);

  const loadToken = async () => {
    const t = await AsyncStorage.getItem('kora_token');
    setToken(t);
  };

  const fetchPublicPlaylists = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/playlists?limit=30&featured=true`);
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPlaylists = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/playlists/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Error fetching my playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (playlistData: any) => {
    if (!token) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour créer une playlist');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(playlistData),
      });
      if (res.ok) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        fetchMyPlaylists();
        setActiveTab('my');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    Alert.alert(
      'Supprimer la playlist',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/api/playlists/${playlistId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchMyPlaylists();
            } catch (err) {
              console.error('Error deleting playlist:', err);
            }
          },
        },
      ]
    );
  };

  const handlePlaylistPress = (playlist: any) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    // Navigate to player with playlist context
    router.push({
      pathname: '/player',
      params: {
        playlistId: playlist._id,
        title: playlist.name,
        artwork: playlist.cover_url,
      },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'discover') {
      await fetchPublicPlaylists();
    } else {
      await fetchMyPlaylists();
    }
    setRefreshing(false);
  }, [activeTab, token]);

  const displayedPlaylists = activeTab === 'discover' ? playlists : myPlaylists;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Playlists</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <PlusIcon size={22} />
        </TouchableOpacity>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            Découvrir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            Mes Playlists
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.terra} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.terra} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : displayedPlaylists.length === 0 ? (
          <View style={styles.emptyState}>
            <MusicIcon size={60} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'my' ? 'Aucune playlist' : 'Aucune playlist disponible'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'my'
                ? 'Créez votre première playlist pour organiser vos titres favoris'
                : 'Les playlists de la communauté apparaîtront ici'}
            </Text>
            {activeTab === 'my' && (
              <TouchableOpacity style={styles.createFirstBtn} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.createFirstBtnText}>Créer une playlist</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {displayedPlaylists.map((playlist, index) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onDelete={handleDeletePlaylist}
                isOwner={activeTab === 'my'}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePlaylist}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: {
    backgroundColor: COLORS.terra,
  },
  tabText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.cream,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 22,
    color: COLORS.cream,
    marginTop: 20,
  },
  emptySubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  createFirstBtn: {
    marginTop: 24,
    backgroundColor: COLORS.terra,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  createFirstBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  playlistCard: {
    width: (SW - 56) / 2,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  playlistCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playlistGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playlistInfo: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    right: 12,
  },
  playlistName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  playlistMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  territoryBadge: {
    backgroundColor: 'rgba(166,93,71,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  territoryText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: COLORS.terra,
    letterSpacing: 1,
  },
  playlistActions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.dark2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 24,
  },
  toggleLabel: {
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: COLORS.terra,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.gray,
  },
  toggleDotActive: {
    backgroundColor: COLORS.cream,
    alignSelf: 'flex-end',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  createBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
  },
  createBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
});
