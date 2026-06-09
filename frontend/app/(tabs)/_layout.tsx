import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GlobeIcon,
  FeedIcon,
  CreateIcon,
  NebulaIcon,
  TerritoireIcon,
  PlayIcon,
} from '../../src/components/icons/KoraIcons';

interface TabIconProps {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={styles.tabIconContainer}>
        {icon}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(13,13,13,0.95)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        },
        tabBarShowLabel: false,
        animation: 'fade',
      }}
      // Feed est le tab initial après connexion
      initialRouteName="feed"
    >
      {/* FEED — Expérience principale post-auth */}
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={<FeedIcon size={22} color={focused ? COLORS.terra : 'rgba(255,255,255,0.4)'} />} 
              label="Feed" 
              focused={focused} 
            />
          ),
        }}
      />
      {/* STREAM — Contenu audio/vidéo */}
      <Tabs.Screen
        name="stream"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={<PlayIcon size={22} color={focused ? COLORS.terra : 'rgba(255,255,255,0.4)'} />} 
              label="Stream" 
              focused={focused} 
            />
          ),
        }}
      />
      {/* GLOBE — Navigation territoriale */}
      <Tabs.Screen
        name="globe"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={<GlobeIcon size={22} color={focused ? COLORS.terra : 'rgba(255,255,255,0.4)'} />} 
              label="Globe" 
              focused={focused} 
            />
          ),
        }}
      />
      {/* CRÉER — Dépôt créateur */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={<CreateIcon size={22} color={focused ? COLORS.terra : 'rgba(255,255,255,0.4)'} />} 
              label="Créer" 
              focused={focused} 
            />
          ),
        }}
      />
      {/* TERRITOIRE — Profil culturel */}
      <Tabs.Screen
        name="territoire"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={<TerritoireIcon size={22} color={focused ? COLORS.terra : 'rgba(255,255,255,0.4)'} />} 
              label="Territoire" 
              focused={focused} 
            />
          ),
        }}
      />
      {/* NÉBULEUSE — Recommandations */}
      <Tabs.Screen
        name="nebuleuse"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={<NebulaIcon size={22} color={focused ? COLORS.terra : 'rgba(255,255,255,0.4)'} />} 
              label="Nébuleuse" 
              focused={focused} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    position: 'relative',
  },
  tabIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...TYPOGRAPHY.nav,
    marginTop: 4,
  },
  tabLabelActive: {
    ...TYPOGRAPHY.navActive,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.terra,
    marginTop: 4,
  },
});
