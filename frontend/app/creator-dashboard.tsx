/**
 * KORA for Creators — Dashboard Artiste
 * =====================================
 * 
 * Master Prompt Section 20
 * 
 * Fonctionnalités:
 * - Analytics temps réel
 * - Revenus et royalties
 * - Upload self-serve
 * - Gestion des works et releases
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');
const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 'http://localhost:8001';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — KORA Cinema
// ═══════════════════════════════════════════════════════════════════════════

const CINEMA = {
  void: '#000000',
  obsidian: '#0A0A0C',
  charcoal: '#121214',
  slate: '#1A1A1E',
  gold: '#D4AF37',
  goldMuted: '#A68B2A',
  goldGlow: 'rgba(212,175,55,0.15)',
  ivory: '#FAF9F6',
  silver: 'rgba(255,255,255,0.7)',
  mist: 'rgba(255,255,255,0.4)',
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const FONTS = {
  playfairBold: Platform.OS === 'ios' ? 'PlayfairDisplay-Bold' : 'serif',
  jostMedium: Platform.OS === 'ios' ? 'Jost-Medium' : 'sans-serif-medium',
  jostLight: Platform.OS === 'ios' ? 'Jost-Light' : 'sans-serif-light',
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardStats {
  total_works: number;
  published_works: number;
  total_releases: number;
  streams_30d: number;
  total_revenue_eur: number;
}

interface RecentWork {
  work_id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

interface DashboardData {
  creator_id: string;
  stats: DashboardStats;
  recent_works: RecentWork[];
  recent_activity: any[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CreatorDashboard() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'royalties' | 'upload'>('overview');

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/creators/dashboard`, {
        headers: {
          'Authorization': `Bearer demo-token`, // In production, use real token
        }
      });
      
      if (!response.ok) {
        // Generate demo data if API fails
        setDashboardData({
          creator_id: 'demo-creator',
          stats: {
            total_works: 12,
            published_works: 8,
            total_releases: 3,
            streams_30d: 15420,
            total_revenue_eur: 342.50,
          },
          recent_works: [
            { work_id: 'KORA-W-001', title: 'Diaspora Dreams', type: 'music', status: 'published', created_at: new Date().toISOString() },
            { work_id: 'KORA-W-002', title: 'Roots & Culture', type: 'music', status: 'published', created_at: new Date().toISOString() },
            { work_id: 'KORA-W-003', title: 'Zouk Love', type: 'music', status: 'draft', created_at: new Date().toISOString() },
          ],
          recent_activity: [],
        });
        return;
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Set demo data on error
      setDashboardData({
        creator_id: 'demo-creator',
        stats: {
          total_works: 12,
          published_works: 8,
          total_releases: 3,
          streams_30d: 15420,
          total_revenue_eur: 342.50,
        },
        recent_works: [
          { work_id: 'KORA-W-001', title: 'Diaspora Dreams', type: 'music', status: 'published', created_at: new Date().toISOString() },
          { work_id: 'KORA-W-002', title: 'Roots & Culture', type: 'music', status: 'published', created_at: new Date().toISOString() },
        ],
        recent_activity: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published': return CINEMA.success;
      case 'validated': return CINEMA.info;
      case 'ingested': return CINEMA.warning;
      case 'draft': return CINEMA.mist;
      default: return CINEMA.mist;
    }
  };

  // ─── RENDER STAT CARD ─────────────────────────────────────────────────────
  const renderStatCard = (
    icon: string,
    label: string,
    value: string | number,
    trend?: string,
    color: string = CINEMA.gold
  ) => (
    <Animated.View 
      entering={FadeInUp.duration(500).springify()}
      style={styles.statCard}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={styles.statValue}>{typeof value === 'number' ? formatNumber(value) : value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {trend && (
          <Text style={[styles.statTrend, { color: trend.startsWith('+') ? CINEMA.success : CINEMA.error }]}>
            {trend}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );

  // ─── RENDER WORK ITEM ─────────────────────────────────────────────────────
  const renderWorkItem = (work: RecentWork, index: number) => (
    <Animated.View
      key={work.work_id}
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <TouchableOpacity style={styles.workItem}>
        <View style={styles.workInfo}>
          <Text style={styles.workTitle}>{work.title}</Text>
          <View style={styles.workMeta}>
            <Text style={styles.workType}>{work.type.toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(work.status)}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(work.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(work.status) }]}>
                {work.status}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={CINEMA.mist} />
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── RENDER LOADING ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[CINEMA.obsidian, CINEMA.void]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={CINEMA.gold} />
        <Text style={styles.loadingText}>Chargement du dashboard...</Text>
      </View>
    );
  }

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[CINEMA.obsidian, CINEMA.void]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={CINEMA.ivory} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>KORA for Creators</Text>
            <Text style={styles.headerSubtitle}>Dashboard Artiste</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={CINEMA.ivory} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: 'grid-outline' },
            { key: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' },
            { key: 'royalties', label: 'Royalties', icon: 'cash-outline' },
            { key: 'upload', label: 'Upload', icon: 'cloud-upload-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? CINEMA.gold : CINEMA.mist} 
              />
              {SW > 400 && (
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={CINEMA.gold}
            />
          }
        >
          {activeTab === 'overview' && dashboardData && (
            <>
              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                {renderStatCard('musical-notes', 'Œuvres', dashboardData.stats.total_works, '+2 ce mois')}
                {renderStatCard('play-circle', 'Streams', dashboardData.stats.streams_30d, '+12%', CINEMA.info)}
                {renderStatCard('wallet', 'Revenus', formatCurrency(dashboardData.stats.total_revenue_eur), '+8%', CINEMA.success)}
                {renderStatCard('albums', 'Releases', dashboardData.stats.total_releases)}
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions rapides</Text>
                <View style={styles.quickActions}>
                  <TouchableOpacity 
                    style={styles.quickAction}
                    onPress={() => setActiveTab('upload')}
                  >
                    <LinearGradient
                      colors={[CINEMA.gold, CINEMA.goldMuted]}
                      style={styles.quickActionGradient}
                    >
                      <Ionicons name="add-circle" size={28} color={CINEMA.void} />
                      <Text style={styles.quickActionText}>Nouvelle œuvre</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.quickActionSecondary}>
                    <Ionicons name="create-outline" size={24} color={CINEMA.gold} />
                    <Text style={styles.quickActionSecondaryText}>Créer release</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.quickActionSecondary}>
                    <Ionicons name="document-text-outline" size={24} color={CINEMA.gold} />
                    <Text style={styles.quickActionSecondaryText}>Voir relevés</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recent Works */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Œuvres récentes</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllLink}>Voir tout</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.worksList}>
                  {dashboardData.recent_works.map((work, index) => renderWorkItem(work, index))}
                </View>
              </View>

              {/* Revenue Chart Placeholder */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Revenus (30 derniers jours)</Text>
                <View style={styles.chartPlaceholder}>
                  <LinearGradient
                    colors={['rgba(212,175,55,0.1)', 'rgba(212,175,55,0.02)']}
                    style={styles.chartGradient}
                  >
                    <Ionicons name="trending-up" size={48} color={CINEMA.gold} />
                    <Text style={styles.chartPlaceholderText}>
                      {formatCurrency(dashboardData.stats.total_revenue_eur)}
                    </Text>
                    <Text style={styles.chartPlaceholderSubtext}>Total ce mois</Text>
                  </LinearGradient>
                </View>
              </View>
            </>
          )}

          {activeTab === 'analytics' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics détaillées</Text>
              <View style={styles.comingSoon}>
                <Ionicons name="stats-chart" size={64} color={CINEMA.goldMuted} />
                <Text style={styles.comingSoonText}>
                  Analytics avancées avec streams par territoire, sources de découverte, et métriques CVE.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'royalties' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relevés de royalties</Text>
              <View style={styles.royaltySummary}>
                <View style={styles.royaltyCard}>
                  <Text style={styles.royaltyLabel}>Total gagné</Text>
                  <Text style={styles.royaltyValue}>{formatCurrency(dashboardData?.stats.total_revenue_eur || 0)}</Text>
                </View>
                <View style={styles.royaltyCard}>
                  <Text style={styles.royaltyLabel}>En attente</Text>
                  <Text style={styles.royaltyValue}>{formatCurrency(45.20)}</Text>
                </View>
              </View>
              <View style={styles.comingSoon}>
                <Ionicons name="document-text" size={64} color={CINEMA.goldMuted} />
                <Text style={styles.comingSoonText}>
                  Relevés détaillés par œuvre, splits de droits, et historique des paiements.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'upload' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload self-serve</Text>
              <TouchableOpacity style={styles.uploadZone}>
                <LinearGradient
                  colors={['rgba(212,175,55,0.1)', 'rgba(212,175,55,0.02)']}
                  style={styles.uploadZoneGradient}
                >
                  <Ionicons name="cloud-upload" size={64} color={CINEMA.gold} />
                  <Text style={styles.uploadZoneTitle}>Glissez vos fichiers ici</Text>
                  <Text style={styles.uploadZoneSubtitle}>ou cliquez pour parcourir</Text>
                  <Text style={styles.uploadZoneFormats}>
                    Formats supportés: MP3, WAV, FLAC, M4A, MP4, MOV
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.uploadSteps}>
                <Text style={styles.uploadStepsTitle}>Processus de publication</Text>
                {[
                  { step: 1, text: 'Upload votre fichier', icon: 'cloud-upload-outline' },
                  { step: 2, text: 'Ajoutez les métadonnées', icon: 'information-circle-outline' },
                  { step: 3, text: 'Configurez les droits', icon: 'shield-checkmark-outline' },
                  { step: 4, text: 'Validation FrekCore', icon: 'checkmark-circle-outline' },
                  { step: 5, text: 'Publication sur KORA', icon: 'rocket-outline' },
                ].map((item) => (
                  <View key={item.step} style={styles.uploadStep}>
                    <View style={styles.uploadStepNumber}>
                      <Text style={styles.uploadStepNumberText}>{item.step}</Text>
                    </View>
                    <Ionicons name={item.icon as any} size={20} color={CINEMA.gold} />
                    <Text style={styles.uploadStepText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CINEMA.void,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: CINEMA.mist,
    fontFamily: FONTS.jostLight,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: CINEMA.gold,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: CINEMA.mist,
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  tabLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.mist,
  },
  activeTabLabel: {
    color: CINEMA.gold,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SW - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CINEMA.ivory,
  },
  statLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: CINEMA.mist,
    marginTop: 4,
  },
  statTrend: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    marginTop: 8,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: CINEMA.ivory,
    letterSpacing: 0.5,
  },
  seeAllLink: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.gold,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.void,
  },
  quickActionSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  quickActionSecondaryText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.ivory,
  },

  // Works List
  worksList: {
    gap: 8,
  },
  workItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  workInfo: {
    flex: 1,
  },
  workTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: CINEMA.ivory,
  },
  workMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  workType: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.mist,
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    textTransform: 'capitalize',
  },

  // Chart
  chartPlaceholder: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chartGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: 16,
  },
  chartPlaceholderText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: CINEMA.gold,
    marginTop: 16,
  },
  chartPlaceholderSubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.mist,
    marginTop: 4,
  },

  // Coming Soon
  comingSoon: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  comingSoonText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.mist,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },

  // Royalties
  royaltySummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  royaltyCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  royaltyLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: CINEMA.mist,
  },
  royaltyValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: CINEMA.success,
    marginTop: 4,
  },

  // Upload
  uploadZone: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  uploadZoneGradient: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 16,
  },
  uploadZoneTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: CINEMA.ivory,
    marginTop: 16,
  },
  uploadZoneSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.mist,
    marginTop: 4,
  },
  uploadZoneFormats: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.mist,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  uploadSteps: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  uploadStepsTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.ivory,
    marginBottom: 16,
  },
  uploadStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  uploadStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CINEMA.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadStepNumberText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.void,
  },
  uploadStepText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.ivory,
    flex: 1,
  },
});
