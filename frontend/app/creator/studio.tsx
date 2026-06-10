/**
 * KORA for Creators — Dashboard Créateur Complet
 * 
 * Espace dédié pour les créateurs KORA avec :
 * - Gestion profil/compte
 * - Analytics & Statistiques revenus
 * - Upload management
 * - Outils de promotion (avant/pendant/après release)
 * - Planification contenu
 * - Interaction communauté
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS, FONTS } from '../../src/theme';

const { width: SW } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function BackIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function DashboardIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x="3" y="3" width="7" height="7" rx="1" />
      <Rect x="14" y="3" width="7" height="7" rx="1" />
      <Rect x="3" y="14" width="7" height="7" rx="1" />
      <Rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  );
}

function AnalyticsIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M3 3v18h18" />
      <Path d="M7 16l4-4 4 4 6-8" />
    </Svg>
  );
}

function ContentIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Path d="M10 8l6 4-6 4V8z" fill={color} />
    </Svg>
  );
}

function PromoIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M11 5.08V2M17.66 6.34L19.78 4.22M20.92 11H23M17.66 17.66L19.78 19.78M11 20.92V23M4.22 19.78L6.34 17.66M2 11H4.08M4.22 4.22L6.34 6.34" />
      <Circle cx="12" cy="12" r="4" />
    </Svg>
  );
}

function CommunityIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function RevenueIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v12M8 10h8M8 14h8" />
    </Svg>
  );
}

function CalendarIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function SettingsIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </Svg>
  );
}

function PlusIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABS DEFINITION
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'dashboard', label: 'Vue générale', icon: DashboardIcon },
  { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
  { id: 'content', label: 'Contenus', icon: ContentIcon },
  { id: 'promo', label: 'Promotion', icon: PromoIcon },
  { id: 'community', label: 'Communauté', icon: CommunityIcon },
  { id: 'revenue', label: 'Revenus', icon: RevenueIcon },
  { id: 'planning', label: 'Planning', icon: CalendarIcon },
  { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
];

// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

const MOCK_CREATOR_STATS = {
  totalStreams: 1247853,
  totalFollowers: 23456,
  monthlyListeners: 18234,
  totalRevenue: 3456.78,
  pendingRevenue: 234.56,
  frekScore: 87,
  contentCount: 24,
  avgEngagement: 4.7,
};

const MOCK_CONTENT = [
  { id: '1', title: 'Sunset Vibes', type: 'audio', streams: 45678, status: 'published', date: '2024-01-15' },
  { id: '2', title: 'Caribbean Dreams', type: 'audio', streams: 23456, status: 'published', date: '2024-01-10' },
  { id: '3', title: 'Live @ Paris', type: 'video', streams: 12345, status: 'pending', date: '2024-01-20' },
  { id: '4', title: 'Behind the Scenes', type: 'video', streams: 8901, status: 'published', date: '2024-01-05' },
];

const MOCK_PROMOS = [
  { id: 'p1', title: 'Nouveau single - Teaser', phase: 'before', status: 'scheduled', date: '2024-02-01', engagement: 0 },
  { id: 'p2', title: 'Live Countdown', phase: 'during', status: 'active', date: '2024-01-25', engagement: 1234 },
  { id: 'p3', title: 'Merci les fans!', phase: 'after', status: 'completed', date: '2024-01-20', engagement: 5678 },
];

const MOCK_COMMUNITY_FEED = [
  { id: 'c1', user: 'Marie L.', message: "J'adore ce nouveau son! 🔥", time: '2h', likes: 45 },
  { id: 'c2', user: 'Jean P.', message: 'Quand le prochain concert?', time: '4h', likes: 23 },
  { id: 'c3', user: 'Sophie K.', message: 'Tu gères! Continue comme ça 💪', time: '6h', likes: 67 },
];

// ══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function StatCard({ title, value, subtitle, trend, color = COLORS.terra }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
      {trend && (
        <View style={[styles.trendBadge, trend > 0 ? styles.trendPositive : styles.trendNegative]}>
          <Text style={styles.trendText}>{trend > 0 ? '+' : ''}{trend}%</Text>
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ══════════════════════════════════════════════════════════════════════════════

function DashboardTab({ stats, onNavigate }: { stats: typeof MOCK_CREATOR_STATS; onNavigate: (tab: string) => void }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Bienvenue dans votre studio</Text>
      <Text style={styles.tabSubtitle}>Aperçu de votre activité KORA</Text>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard title="Streams totaux" value={stats.totalStreams.toLocaleString()} trend={12} />
        <StatCard title="Abonnés" value={stats.totalFollowers.toLocaleString()} trend={8} />
        <StatCard title="Écoutes/mois" value={stats.monthlyListeners.toLocaleString()} trend={-2} />
        <StatCard title="FREK Score" value={stats.frekScore} color={COLORS.gold} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('content')}>
          <LinearGradient colors={[COLORS.terra, '#8B4D3B']} style={styles.quickActionGradient}>
            <PlusIcon size={20} color={COLORS.cream} />
            <Text style={styles.quickActionText}>Nouveau contenu</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('promo')}>
          <LinearGradient colors={[COLORS.gold, '#A89040']} style={styles.quickActionGradient}>
            <PromoIcon size={20} color={COLORS.dark} />
            <Text style={[styles.quickActionText, { color: COLORS.dark }]}>Créer promo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Activité récente</Text>
      <View style={styles.activityList}>
        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: COLORS.terra }]} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>+1,234 streams sur "Sunset Vibes"</Text>
            <Text style={styles.activityTime}>Il y a 2h</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: COLORS.gold }]} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>+156 nouveaux abonnés</Text>
            <Text style={styles.activityTime}>Aujourd'hui</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: '#46D369' }]} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>Vidéo "Live @ Paris" approuvée</Text>
            <Text style={styles.activityTime}>Hier</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ══════════════════════════════════════════════════════════════════════════════

function AnalyticsTab({ stats }: { stats: typeof MOCK_CREATOR_STATS }) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Analytics</Text>
      <Text style={styles.tabSubtitle}>Performance de vos contenus</Text>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['7d', '30d', '90d', 'all'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p === 'all' ? 'Tout' : p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <StatCard title="Streams" value="45.6K" trend={15} />
        <StatCard title="Heures écoutées" value="2,345" trend={8} />
        <StatCard title="Engagement" value={`${stats.avgEngagement}%`} trend={3} color={COLORS.gold} />
        <StatCard title="Partages" value="892" trend={22} />
      </View>

      {/* Chart Placeholder */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Évolution des streams</Text>
        <View style={styles.chartPlaceholder}>
          <View style={styles.chartBars}>
            {[60, 45, 70, 85, 75, 90, 65].map((h, i) => (
              <View key={i} style={[styles.chartBar, { height: `${h}%` }]} />
            ))}
          </View>
          <View style={styles.chartLabels}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
              <Text key={i} style={styles.chartLabel}>{d}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Top Content */}
      <Text style={styles.sectionTitle}>Top contenus</Text>
      {MOCK_CONTENT.slice(0, 3).map((item, i) => (
        <View key={item.id} style={styles.topContentItem}>
          <Text style={styles.topContentRank}>#{i + 1}</Text>
          <View style={styles.topContentInfo}>
            <Text style={styles.topContentTitle}>{item.title}</Text>
            <Text style={styles.topContentStreams}>{item.streams.toLocaleString()} streams</Text>
          </View>
          <View style={[styles.contentTypeBadge, item.type === 'video' && styles.contentTypeBadgeVideo]}>
            <Text style={styles.contentTypeBadgeText}>{item.type === 'audio' ? '🎵' : '🎬'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT TAB
// ══════════════════════════════════════════════════════════════════════════════

function ContentTab({ router }: { router: any }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Mes contenus</Text>
          <Text style={styles.tabSubtitle}>{MOCK_CONTENT.length} éléments</Text>
        </View>
        <TouchableOpacity 
          style={styles.addContentBtn}
          onPress={() => router.push('/upload')}
        >
          <PlusIcon size={20} color={COLORS.cream} />
          <Text style={styles.addContentBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
          <Text style={[styles.filterTabText, styles.filterTabTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>Vidéo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>En attente</Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {MOCK_CONTENT.map((item) => (
        <TouchableOpacity key={item.id} style={styles.contentItem}>
          <View style={styles.contentItemLeft}>
            <View style={[styles.contentIcon, item.type === 'video' && styles.contentIconVideo]}>
              <Text style={styles.contentIconText}>{item.type === 'audio' ? '🎵' : '🎬'}</Text>
            </View>
            <View style={styles.contentItemInfo}>
              <Text style={styles.contentItemTitle}>{item.title}</Text>
              <Text style={styles.contentItemMeta}>
                {item.streams.toLocaleString()} streams • {item.date}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'published' ? styles.statusPublished : styles.statusPending
          ]}>
            <Text style={styles.statusBadgeText}>
              {item.status === 'published' ? 'Publié' : 'En attente'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTION TAB — Avant / Pendant / Après Release
// ══════════════════════════════════════════════════════════════════════════════

function PromoTab() {
  const [activePhase, setActivePhase] = useState<'before' | 'during' | 'after'>('before');

  const phases = [
    { id: 'before', label: 'Avant', icon: '🚀', desc: 'Créez le buzz' },
    { id: 'during', label: 'Pendant', icon: '🔥', desc: 'Engagez live' },
    { id: 'after', label: 'Après', icon: '💫', desc: 'Maintenez le lien' },
  ];

  const promoTools = {
    before: [
      { id: 'teaser', title: 'Teaser vidéo', desc: 'Extrait de 15-30s pour créer l\'attente', icon: '🎬' },
      { id: 'countdown', title: 'Countdown', desc: 'Compte à rebours interactif', icon: '⏰' },
      { id: 'presave', title: 'Pre-save', desc: 'Permettez les pré-enregistrements', icon: '💾' },
      { id: 'exclusive', title: 'Contenu exclusif', desc: 'Behind the scenes pour VIP', icon: '🎁' },
    ],
    during: [
      { id: 'live', title: 'Live Q&A', desc: 'Session live avec vos fans', icon: '📺' },
      { id: 'listening', title: 'Listening party', desc: 'Écoute collective en direct', icon: '🎧' },
      { id: 'reaction', title: 'Réactions', desc: 'Partagez vos réactions en live', icon: '💬' },
      { id: 'challenge', title: 'Challenge', desc: 'Lancez un défi à votre communauté', icon: '🏆' },
    ],
    after: [
      { id: 'thanks', title: 'Remerciements', desc: 'Message personnalisé aux fans', icon: '🙏' },
      { id: 'stats', title: 'Stats publiques', desc: 'Partagez vos milestones', icon: '📊' },
      { id: 'remix', title: 'Remix contest', desc: 'Concours de remix par la commu', icon: '🎛️' },
      { id: 'merch', title: 'Merch drop', desc: 'Produits dérivés exclusifs', icon: '👕' },
    ],
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Outils de promotion</Text>
      <Text style={styles.tabSubtitle}>Engagez votre communauté avant, pendant et après vos releases</Text>

      {/* Phase Selector */}
      <View style={styles.phaseSelector}>
        {phases.map((phase) => (
          <TouchableOpacity
            key={phase.id}
            style={[styles.phaseBtn, activePhase === phase.id && styles.phaseBtnActive]}
            onPress={() => {
              setActivePhase(phase.id as any);
              try { Haptics.selectionAsync(); } catch {}
            }}
          >
            <Text style={styles.phaseIcon}>{phase.icon}</Text>
            <Text style={[styles.phaseLabel, activePhase === phase.id && styles.phaseLabelActive]}>
              {phase.label}
            </Text>
            <Text style={styles.phaseDesc}>{phase.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tools Grid */}
      <Text style={styles.sectionTitle}>
        {activePhase === 'before' && '🚀 Créer le buzz'}
        {activePhase === 'during' && '🔥 Engagement live'}
        {activePhase === 'after' && '💫 Maintenir le lien'}
      </Text>
      
      <View style={styles.promoToolsGrid}>
        {promoTools[activePhase].map((tool) => (
          <TouchableOpacity key={tool.id} style={styles.promoToolCard}>
            <Text style={styles.promoToolIcon}>{tool.icon}</Text>
            <Text style={styles.promoToolTitle}>{tool.title}</Text>
            <Text style={styles.promoToolDesc}>{tool.desc}</Text>
            <View style={styles.promoToolAction}>
              <Text style={styles.promoToolActionText}>Créer</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Promos */}
      <Text style={styles.sectionTitle}>Promotions actives</Text>
      {MOCK_PROMOS.map((promo) => (
        <View key={promo.id} style={styles.activePromoItem}>
          <View style={[
            styles.promoPhaseIndicator,
            promo.phase === 'before' && styles.promoPhaseBefore,
            promo.phase === 'during' && styles.promoPhaseDuring,
            promo.phase === 'after' && styles.promoPhaseAfter,
          ]} />
          <View style={styles.activePromoInfo}>
            <Text style={styles.activePromoTitle}>{promo.title}</Text>
            <Text style={styles.activePromoMeta}>
              {promo.status === 'active' ? '🟢 En cours' : promo.status === 'scheduled' ? '🟡 Planifié' : '✅ Terminé'}
              {promo.engagement > 0 && ` • ${promo.engagement.toLocaleString()} interactions`}
            </Text>
          </View>
          <TouchableOpacity style={styles.promoEditBtn}>
            <Text style={styles.promoEditBtnText}>Gérer</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMUNITY TAB
// ══════════════════════════════════════════════════════════════════════════════

function CommunityTab() {
  const [message, setMessage] = useState('');

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Ma communauté</Text>
      <Text style={styles.tabSubtitle}>Interagissez avec vos fans</Text>

      {/* Community Stats */}
      <View style={styles.communityStats}>
        <View style={styles.communityStatItem}>
          <Text style={styles.communityStatValue}>23.4K</Text>
          <Text style={styles.communityStatLabel}>Abonnés</Text>
        </View>
        <View style={styles.communityStatDivider} />
        <View style={styles.communityStatItem}>
          <Text style={styles.communityStatValue}>4.7%</Text>
          <Text style={styles.communityStatLabel}>Engagement</Text>
        </View>
        <View style={styles.communityStatDivider} />
        <View style={styles.communityStatItem}>
          <Text style={styles.communityStatValue}>156</Text>
          <Text style={styles.communityStatLabel}>Actifs 24h</Text>
        </View>
      </View>

      {/* Quick Post */}
      <View style={styles.quickPostContainer}>
        <TextInput
          style={styles.quickPostInput}
          placeholder="Partagez quelque chose avec votre communauté..."
          placeholderTextColor={COLORS.gray}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <View style={styles.quickPostActions}>
          <View style={styles.quickPostMedia}>
            <TouchableOpacity style={styles.mediaBtn}><Text>📷</Text></TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn}><Text>🎵</Text></TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn}><Text>📊</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.postBtn}>
            <Text style={styles.postBtnText}>Publier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Feed */}
      <Text style={styles.sectionTitle}>Derniers messages de fans</Text>
      {MOCK_COMMUNITY_FEED.map((item) => (
        <View key={item.id} style={styles.feedItem}>
          <View style={styles.feedAvatar}>
            <Text style={styles.feedAvatarText}>{item.user.charAt(0)}</Text>
          </View>
          <View style={styles.feedContent}>
            <View style={styles.feedHeader}>
              <Text style={styles.feedUser}>{item.user}</Text>
              <Text style={styles.feedTime}>{item.time}</Text>
            </View>
            <Text style={styles.feedMessage}>{item.message}</Text>
            <View style={styles.feedActions}>
              <TouchableOpacity style={styles.feedAction}>
                <Text style={styles.feedActionText}>❤️ {item.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedAction}>
                <Text style={styles.feedActionText}>💬 Répondre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE TAB
// ══════════════════════════════════════════════════════════════════════════════

function RevenueTab({ stats }: { stats: typeof MOCK_CREATOR_STATS }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Mes revenus</Text>
      <Text style={styles.tabSubtitle}>Suivi de vos gains KORA</Text>

      {/* Revenue Cards */}
      <View style={styles.revenueCards}>
        <View style={styles.revenueCardMain}>
          <LinearGradient colors={[COLORS.terra, '#8B4D3B']} style={styles.revenueCardGradient}>
            <Text style={styles.revenueCardLabel}>Revenus totaux</Text>
            <Text style={styles.revenueCardValue}>{stats.totalRevenue.toLocaleString()}€</Text>
            <Text style={styles.revenueCardTrend}>+12% ce mois</Text>
          </LinearGradient>
        </View>
        <View style={styles.revenueCardSecondary}>
          <Text style={styles.revenueSecondaryLabel}>En attente</Text>
          <Text style={styles.revenueSecondaryValue}>{stats.pendingRevenue.toLocaleString()}€</Text>
          <Text style={styles.revenueSecondaryNote}>Prochain versement: 1er Fév</Text>
        </View>
      </View>

      {/* Revenue Breakdown */}
      <Text style={styles.sectionTitle}>Répartition</Text>
      <View style={styles.revenueBreakdown}>
        <View style={styles.revenueBreakdownItem}>
          <View style={styles.revenueBreakdownBar}>
            <View style={[styles.revenueBreakdownFill, { width: '65%', backgroundColor: COLORS.terra }]} />
          </View>
          <View style={styles.revenueBreakdownInfo}>
            <Text style={styles.revenueBreakdownLabel}>Streams</Text>
            <Text style={styles.revenueBreakdownValue}>2,246€ (65%)</Text>
          </View>
        </View>
        <View style={styles.revenueBreakdownItem}>
          <View style={styles.revenueBreakdownBar}>
            <View style={[styles.revenueBreakdownFill, { width: '25%', backgroundColor: COLORS.gold }]} />
          </View>
          <View style={styles.revenueBreakdownInfo}>
            <Text style={styles.revenueBreakdownLabel}>Vidéos</Text>
            <Text style={styles.revenueBreakdownValue}>864€ (25%)</Text>
          </View>
        </View>
        <View style={styles.revenueBreakdownItem}>
          <View style={styles.revenueBreakdownBar}>
            <View style={[styles.revenueBreakdownFill, { width: '10%', backgroundColor: '#46D369' }]} />
          </View>
          <View style={styles.revenueBreakdownInfo}>
            <Text style={styles.revenueBreakdownLabel}>Tips</Text>
            <Text style={styles.revenueBreakdownValue}>346€ (10%)</Text>
          </View>
        </View>
      </View>

      {/* Payout Settings */}
      <Text style={styles.sectionTitle}>Paramètres de versement</Text>
      <TouchableOpacity style={styles.payoutSettingsBtn}>
        <View style={styles.payoutSettingsInfo}>
          <Text style={styles.payoutSettingsLabel}>Compte bancaire</Text>
          <Text style={styles.payoutSettingsValue}>FR76 •••• •••• 4532</Text>
        </View>
        <Text style={styles.payoutSettingsEdit}>Modifier</Text>
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLANNING TAB
// ══════════════════════════════════════════════════════════════════════════════

function PlanningTab() {
  const upcomingReleases = [
    { id: 'r1', title: 'Nouveau Single', date: '2024-02-15', status: 'scheduled' },
    { id: 'r2', title: 'EP "Diaspora"', date: '2024-03-01', status: 'draft' },
    { id: 'r3', title: 'Live Session', date: '2024-02-20', status: 'scheduled' },
  ];

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Planning</Text>
          <Text style={styles.tabSubtitle}>Gérez vos sorties</Text>
        </View>
        <TouchableOpacity style={styles.addContentBtn}>
          <PlusIcon size={20} color={COLORS.cream} />
          <Text style={styles.addContentBtnText}>Planifier</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Preview */}
      <View style={styles.calendarPreview}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonth}>Février 2024</Text>
          <View style={styles.calendarNav}>
            <TouchableOpacity><Text style={styles.calendarNavText}>←</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.calendarNavText}>→</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.calendarGrid}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <Text key={i} style={styles.calendarDayLabel}>{d}</Text>
          ))}
          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
            <View key={day} style={[styles.calendarDay, day === 15 && styles.calendarDayHighlight]}>
              <Text style={[styles.calendarDayText, day === 15 && styles.calendarDayTextHighlight]}>
                {day}
              </Text>
              {day === 15 && <View style={styles.calendarDot} />}
              {day === 20 && <View style={[styles.calendarDot, { backgroundColor: COLORS.gold }]} />}
            </View>
          ))}
        </View>
      </View>

      {/* Upcoming Releases */}
      <Text style={styles.sectionTitle}>Sorties à venir</Text>
      {upcomingReleases.map((release) => (
        <TouchableOpacity key={release.id} style={styles.releaseItem}>
          <View style={styles.releaseDate}>
            <Text style={styles.releaseDateDay}>{release.date.split('-')[2]}</Text>
            <Text style={styles.releaseDateMonth}>Fév</Text>
          </View>
          <View style={styles.releaseInfo}>
            <Text style={styles.releaseTitle}>{release.title}</Text>
            <View style={[
              styles.releaseStatusBadge,
              release.status === 'scheduled' ? styles.releaseStatusScheduled : styles.releaseStatusDraft
            ]}>
              <Text style={styles.releaseStatusText}>
                {release.status === 'scheduled' ? '📅 Planifié' : '📝 Brouillon'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.releaseEditBtn}>
            <Text style={styles.releaseEditBtnText}>•••</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ══════════════════════════════════════════════════════════════════════════════

function SettingsTab({ profile, onLogout }: { profile: any; onLogout: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [publicStats, setPublicStats] = useState(true);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Paramètres créateur</Text>
      <Text style={styles.tabSubtitle}>Gérez votre compte et préférences</Text>

      {/* Profile Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Profil</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemInfo}>
            <Text style={styles.settingsItemLabel}>Nom d'artiste</Text>
            <Text style={styles.settingsItemValue}>{profile?.display_name || 'Non défini'}</Text>
          </View>
          <Text style={styles.settingsItemArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemInfo}>
            <Text style={styles.settingsItemLabel}>Bio</Text>
            <Text style={styles.settingsItemValue}>Modifier votre biographie</Text>
          </View>
          <Text style={styles.settingsItemArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemInfo}>
            <Text style={styles.settingsItemLabel}>Photo de profil</Text>
            <Text style={styles.settingsItemValue}>Changer l'image</Text>
          </View>
          <Text style={styles.settingsItemArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Préférences</Text>
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemInfo}>
            <Text style={styles.settingsItemLabel}>Notifications</Text>
            <Text style={styles.settingsItemDesc}>Nouveaux fans, commentaires, streams</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: COLORS.dark3, true: COLORS.terra }}
            thumbColor={COLORS.cream}
          />
        </View>
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemInfo}>
            <Text style={styles.settingsItemLabel}>Stats publiques</Text>
            <Text style={styles.settingsItemDesc}>Montrer vos stats sur votre profil</Text>
          </View>
          <Switch
            value={publicStats}
            onValueChange={setPublicStats}
            trackColor={{ false: COLORS.dark3, true: COLORS.terra }}
            thumbColor={COLORS.cream}
          />
        </View>
      </View>

      {/* FREK-ID */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Identité FREK</Text>
        <View style={styles.frekIdCard}>
          <Text style={styles.frekIdLabel}>Votre FREK-ID</Text>
          <Text style={styles.frekIdValue}>{profile?.frek_id || 'FRK-XXXXXXXXXX'}</Text>
          <Text style={styles.frekIdNote}>Identité souveraine KORA</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CREATOR STUDIO SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function CreatorStudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        // Show the studio in demo mode instead of redirecting
        // For real usage, user needs to be logged in
        setProfile({
          display_name: 'Demo Creator',
          frek_id: 'FRK-DEMO123456',
          is_creator: true,
        });
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.is_creator) {
          // Not a creator, redirect to upload to become one
          router.replace('/upload');
          return;
        }
        setProfile(data);
      } else {
        // Token invalid, show demo mode
        setProfile({
          display_name: 'Demo Creator',
          frek_id: 'FRK-DEMO123456',
          is_creator: true,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Show demo mode on error
      setProfile({
        display_name: 'Demo Creator',
        frek_id: 'FRK-DEMO123456',
        is_creator: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('auth_token');
            router.replace('/landing');
          }
        }
      ]
    );
  };

  const navigateToTab = (tabId: string) => {
    setActiveTab(tabId);
    try { Haptics.selectionAsync(); } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.terra} />
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab stats={MOCK_CREATOR_STATS} onNavigate={navigateToTab} />;
      case 'analytics':
        return <AnalyticsTab stats={MOCK_CREATOR_STATS} />;
      case 'content':
        return <ContentTab router={router} />;
      case 'promo':
        return <PromoTab />;
      case 'community':
        return <CommunityTab />;
      case 'revenue':
        return <RevenueTab stats={MOCK_CREATOR_STATS} />;
      case 'planning':
        return <PlanningTab />;
      case 'settings':
        return <SettingsTab profile={profile} onLogout={handleLogout} />;
      default:
        return <DashboardTab stats={MOCK_CREATOR_STATS} onNavigate={navigateToTab} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon size={24} color={COLORS.cream} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KORA for Creators</Text>
          <Text style={styles.headerSubtitle}>Studio Créateur</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.frekBadge}>
            <Text style={styles.frekBadgeText}>FREK</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabNav}
        contentContainerStyle={styles.tabNavContent}
      >
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabNavItem, isActive && styles.tabNavItemActive]}
              onPress={() => navigateToTab(tab.id)}
            >
              <IconComponent size={20} color={isActive ? COLORS.terra : COLORS.gray} />
              <Text style={[styles.tabNavLabel, isActive && styles.tabNavLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.terra}
          />
        }
      >
        {renderTabContent()}
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },

  // Header
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.gold,
  },
  headerSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  frekBadge: {
    backgroundColor: 'rgba(166,93,71,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  frekBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 1,
  },

  // Tab Navigation
  tabNav: {
    maxHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabNavContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  tabNavItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 4,
  },
  tabNavItemActive: {
    backgroundColor: 'rgba(166,93,71,0.15)',
  },
  tabNavLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
  },
  tabNavLabelActive: {
    color: COLORS.terra,
  },

  // Tab Content
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 4,
  },
  tabSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  // Section Title
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SW - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statCardTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
  },
  statCardValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  statCardSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  trendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  trendPositive: {
    backgroundColor: 'rgba(70,211,105,0.15)',
  },
  trendNegative: {
    backgroundColor: 'rgba(229,9,20,0.15)',
  },
  trendText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: '#46D369',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  quickActionText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },

  // Activity List
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
  },
  activityTime: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: COLORS.terra,
  },
  periodBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.gray,
  },
  periodBtnTextActive: {
    color: COLORS.cream,
  },

  // Chart
  chartContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 160,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  chartBar: {
    width: 24,
    backgroundColor: COLORS.terra,
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  chartLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.gray,
    width: 24,
    textAlign: 'center',
  },

  // Top Content
  topContentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topContentRank: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.gold,
    width: 40,
  },
  topContentInfo: {
    flex: 1,
  },
  topContentTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  topContentStreams: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  contentTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(166,93,71,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentTypeBadgeVideo: {
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  contentTypeBadgeText: {
    fontSize: 14,
  },

  // Content Tab
  addContentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.terra,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  addContentBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterTabActive: {
    backgroundColor: COLORS.terra,
  },
  filterTabText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.gray,
  },
  filterTabTextActive: {
    color: COLORS.cream,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  contentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contentIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(166,93,71,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentIconVideo: {
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  contentIconText: {
    fontSize: 20,
  },
  contentItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contentItemTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  contentItemMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusPublished: {
    backgroundColor: 'rgba(70,211,105,0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  statusBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.cream,
  },

  // Promo Tab
  phaseSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  phaseBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  phaseBtnActive: {
    borderColor: COLORS.terra,
    backgroundColor: 'rgba(166,93,71,0.1)',
  },
  phaseIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  phaseLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  phaseLabelActive: {
    color: COLORS.cream,
  },
  phaseDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
  },
  promoToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  promoToolCard: {
    width: (SW - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  promoToolIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  promoToolTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 4,
  },
  promoToolDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 12,
  },
  promoToolAction: {
    backgroundColor: COLORS.terra,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  promoToolActionText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
  },
  activePromoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  promoPhaseIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  promoPhaseBefore: {
    backgroundColor: '#3498db',
  },
  promoPhaseDuring: {
    backgroundColor: COLORS.terra,
  },
  promoPhaseAfter: {
    backgroundColor: COLORS.gold,
  },
  activePromoInfo: {
    flex: 1,
  },
  activePromoTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  activePromoMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  promoEditBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  promoEditBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
  },

  // Community Tab
  communityStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  communityStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  communityStatValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  communityStatLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  communityStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quickPostContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickPostInput: {
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: COLORS.cream,
    minHeight: 60,
  },
  quickPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  quickPostMedia: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtn: {
    backgroundColor: COLORS.terra,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  postBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  feedItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  feedContent: {
    flex: 1,
    marginLeft: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedUser: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  feedTime: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
  },
  feedMessage: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 4,
  },
  feedActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  feedAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedActionText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },

  // Revenue Tab
  revenueCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  revenueCardMain: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  revenueCardGradient: {
    padding: 20,
  },
  revenueCardLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  revenueCardValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: COLORS.cream,
    marginTop: 8,
  },
  revenueCardTrend: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: '#46D369',
    marginTop: 8,
  },
  revenueCardSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  revenueSecondaryLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.gray,
  },
  revenueSecondaryValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: COLORS.gold,
    marginTop: 4,
  },
  revenueSecondaryNote: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: COLORS.gray,
    marginTop: 8,
  },
  revenueBreakdown: {
    gap: 16,
  },
  revenueBreakdownItem: {},
  revenueBreakdownBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  revenueBreakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  revenueBreakdownInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueBreakdownLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  revenueBreakdownValue: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
  },
  payoutSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
  },
  payoutSettingsInfo: {},
  payoutSettingsLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  payoutSettingsValue: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  payoutSettingsEdit: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.terra,
  },

  // Planning Tab
  calendarPreview: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 16,
  },
  calendarNavText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: COLORS.gray,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 8,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayHighlight: {
    backgroundColor: COLORS.terra,
    borderRadius: 18,
  },
  calendarDayText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.gray,
  },
  calendarDayTextHighlight: {
    color: COLORS.cream,
  },
  calendarDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.terra,
  },
  releaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  releaseDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 14,
  },
  releaseDateDay: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  releaseDateMonth: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  releaseInfo: {
    flex: 1,
  },
  releaseTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  releaseStatusBadge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  releaseStatusScheduled: {
    backgroundColor: 'rgba(70,211,105,0.15)',
  },
  releaseStatusDraft: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  releaseStatusText: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.cream,
  },
  releaseEditBtn: {
    padding: 8,
  },
  releaseEditBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: COLORS.gray,
  },

  // Settings Tab
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.terra,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingsItemInfo: {
    flex: 1,
  },
  settingsItemLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  settingsItemValue: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  settingsItemDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  settingsItemArrow: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.gray,
  },
  frekIdCard: {
    backgroundColor: 'rgba(166,93,71,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.3)',
  },
  frekIdLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.terra,
    letterSpacing: 1,
  },
  frekIdValue: {
    fontFamily: FONTS.jetbrainsMono || FONTS.jostMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: 8,
    letterSpacing: 1,
  },
  frekIdNote: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 8,
  },
  logoutBtn: {
    backgroundColor: 'rgba(229,9,20,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: '#E50914',
  },
});
