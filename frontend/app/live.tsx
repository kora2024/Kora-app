/**
 * KORA Live — Événements en Direct
 * 
 * Interface cinématique pour:
 * - Découvrir les événements à venir
 * - Acheter des billets
 * - Rejoindre les lives
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
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/theme';

const { width: SW } = Dimensions.get('window');
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

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M16 2V6M8 2V6M3 10H21" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function TicketIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 9C2 8.44772 2.44772 8 3 8H21C21.5523 8 22 8.44772 22 9V11C20.8954 11 20 11.8954 20 13C20 14.1046 20.8954 15 22 15V17C22 17.5523 21.5523 18 21 18H3C2.44772 18 2 17.5523 2 17V15C3.10457 15 4 14.1046 4 13C4 11.8954 3.10457 11 2 11V9Z" stroke={COLORS.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function LivePulse({ size = 12 }: { size?: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Svg width={size} height={size} viewBox="0 0 12 12">
        <Circle cx="6" cy="6" r="5" fill="#FF3B30" />
      </Svg>
    </Animated.View>
  );
}

function VideoIcon({ size = 50 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M23 7L16 12L23 17V7Z" stroke={COLORS.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M14 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H14C15.1046 19 16 18.1046 16 17V7C16 5.89543 15.1046 5 14 5Z" stroke={COLORS.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENT TYPE BADGES
// ══════════════════════════════════════════════════════════════════════════════

const EVENT_TYPES: { [key: string]: { label: string; color: string } } = {
  concert: { label: 'Concert', color: '#FF6B6B' },
  podcast: { label: 'Podcast Live', color: '#4ECDC4' },
  talk: { label: 'Talk', color: '#95E1D3' },
  workshop: { label: 'Atelier', color: '#F7D794' },
};

// ══════════════════════════════════════════════════════════════════════════════
// EVENT CARD
// ══════════════════════════════════════════════════════════════════════════════

function EventCard({ event, onPress, index }: any) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: index * 120,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, tension: 180, friction: 14, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  const isLive = event.status === 'live';
  const eventType = EVENT_TYPES[event.event_type] || EVENT_TYPES.concert;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Gratuit';
    return `${(cents / 100).toFixed(2)}€`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.eventCard,
          {
            opacity: anim,
            transform: [
              { scale },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
            ],
          },
        ]}
      >
        <Image source={{ uri: event.cover_url }} style={styles.eventCover} />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.95)']}
          style={styles.eventGradient}
        />
        
        {/* Live Badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <LivePulse />
            <Text style={styles.liveBadgeText}>EN DIRECT</Text>
          </View>
        )}

        {/* Event Type */}
        <View style={[styles.eventTypeBadge, { backgroundColor: eventType.color }]}>
          <Text style={styles.eventTypeText}>{eventType.label}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.eventCreator}>{event.creator_name}</Text>
          
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaRow}>
              <CalendarIcon size={14} />
              <Text style={styles.eventMetaText}>{formatDate(event.scheduled_at)}</Text>
            </View>
            <View style={styles.eventMetaRow}>
              <TicketIcon size={14} />
              <Text style={styles.eventMetaText}>
                {event.is_free ? 'Gratuit' : formatPrice(event.ticket_price_cents)}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <Text style={styles.eventAttendees}>
              {event.current_attendees || 0} participants
            </Text>
            <TouchableOpacity
              style={[styles.eventBtn, isLive && styles.eventBtnLive]}
              onPress={onPress}
            >
              <Text style={[styles.eventBtnText, isLive && styles.eventBtnTextLive]}>
                {isLive ? 'Rejoindre' : 'Réserver'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE NOW CARD (Horizontal)
// ══════════════════════════════════════════════════════════════════════════════

function LiveNowCard({ event, onPress }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.liveNowCard, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={{ uri: event.cover_url }} style={styles.liveNowCover} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.liveNowGradient}
        />
        <View style={styles.liveNowBadge}>
          <LivePulse size={8} />
          <Text style={styles.liveNowBadgeText}>LIVE</Text>
        </View>
        <View style={styles.liveNowInfo}>
          <Text style={styles.liveNowTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.liveNowViewers}>{event.current_attendees || 0} en direct</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB SELECTOR
// ══════════════════════════════════════════════════════════════════════════════

function TabSelector({ activeTab, onTabChange }: any) {
  const tabs = [
    { id: 'scheduled', label: 'À venir' },
    { id: 'live', label: 'En direct' },
    { id: 'ended', label: 'Replays' },
  ];

  return (
    <View style={styles.tabSelector}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={[styles.tabItemText, activeTab === tab.id && styles.tabItemTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'scheduled' | 'live' | 'ended'>('scheduled');
  const [events, setEvents] = useState<any[]>([]);
  const [liveNow, setLiveNow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToken();
    fetchLiveNow();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const loadToken = async () => {
    const t = await AsyncStorage.getItem('kora_token');
    setToken(t);
  };

  const fetchLiveNow = async () => {
    try {
      const res = await fetch(`${API_URL}/api/live/events/live`);
      const data = await res.json();
      setLiveNow(data.live_events || []);
    } catch (err) {
      console.error('Error fetching live now:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/live/events?status=${activeTab}&limit=30`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = async (event: any) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    
    if (event.status === 'live') {
      // Join live
      router.push({
        pathname: '/player',
        params: {
          id: event._id,
          title: event.title,
          artist: event.creator_name,
          streamUrl: event.stream_url,
          artwork: event.cover_url,
          type: 'live',
        },
      });
    } else if (event.status === 'scheduled') {
      // Purchase ticket
      if (!token) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver un billet');
        return;
      }
      
      if (event.is_free) {
        // Free event - just register
        try {
          const res = await fetch(`${API_URL}/api/live/events/${event._id}/tickets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity: 1 }),
          });
          const data = await res.json();
          if (res.ok) {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
            Alert.alert('Inscription confirmée', `Votre code: ${data.ticket.ticket_code}`);
            fetchEvents();
          } else {
            Alert.alert('Erreur', data.detail || 'Impossible de réserver');
          }
        } catch (err) {
          Alert.alert('Erreur', 'Erreur de connexion');
        }
      } else {
        // Paid event - show confirmation
        Alert.alert(
          'Réserver un billet',
          `${event.title}\n\nPrix: ${(event.ticket_price_cents / 100).toFixed(2)}€`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Réserver',
              onPress: async () => {
                try {
                  const res = await fetch(`${API_URL}/api/live/events/${event._id}/tickets`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quantity: 1 }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
                    Alert.alert('Billet acheté!', `Code: ${data.ticket.ticket_code}`);
                    fetchEvents();
                  }
                } catch (err) {
                  Alert.alert('Erreur', 'Erreur de connexion');
                }
              },
            },
          ]
        );
      }
    } else if (event.status === 'ended' && event.replay_url) {
      // Watch replay
      router.push({
        pathname: '/player',
        params: {
          id: event._id,
          title: `[Replay] ${event.title}`,
          artist: event.creator_name,
          streamUrl: event.replay_url,
          artwork: event.cover_url,
          type: 'replay',
        },
      });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchLiveNow(), fetchEvents()]);
    setRefreshing(false);
  }, [activeTab]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Events</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.terra} />
        }
      >
        {/* Live Now Section */}
        {liveNow.length > 0 && (
          <View style={styles.liveNowSection}>
            <View style={styles.sectionHeader}>
              <LivePulse size={10} />
              <Text style={styles.sectionTitle}>En direct maintenant</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveNowScroll}>
              {liveNow.map((event) => (
                <LiveNowCard key={event._id} event={event} onPress={() => handleEventPress(event)} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tab Selector */}
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Events List */}
        <View style={styles.eventsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.terra} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyState}>
              <VideoIcon size={60} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'scheduled' ? 'Aucun événement prévu' :
                 activeTab === 'live' ? 'Aucun live en cours' : 'Aucun replay disponible'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Les événements de la communauté apparaîtront ici
              </Text>
            </View>
          ) : (
            events.map((event, index) => (
              <EventCard
                key={event._id}
                event={event}
                onPress={() => handleEventPress(event)}
                index={index}
              />
            ))
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  // Live Now Section
  liveNowSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  liveNowScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  liveNowCard: {
    width: 200,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  liveNowCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveNowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveNowBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveNowBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  liveNowInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  liveNowTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  liveNowViewers: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabItemActive: {
    backgroundColor: COLORS.terra,
  },
  tabItemText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  tabItemTextActive: {
    color: COLORS.cream,
  },
  // Events
  eventsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
    paddingTop: 60,
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
  },
  // Event Card
  eventCard: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  eventCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  eventGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  liveBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  eventTypeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  eventTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 22,
    color: COLORS.cream,
  },
  eventCreator: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.cream,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  eventAttendees: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
  },
  eventBtn: {
    backgroundColor: COLORS.cream,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  eventBtnLive: {
    backgroundColor: '#FF3B30',
  },
  eventBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.dark,
  },
  eventBtnTextLive: {
    color: COLORS.cream,
  },
});
