import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GlobeIcon,
  FeedIcon,
  CreateIcon,
  NebulaIcon,
  TerritoireIcon,
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
      }}
    >
      <Tabs.Screen
        name="globe"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◉" label="Globe" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="▤" label="Feed" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="✦" label="Créer" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nebuleuse"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="✧" label="Nébuleuse" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="territoire"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◎" label="Territoire" focused={focused} />
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
  tabIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
  },
  tabIconActive: {
    color: COLORS.terra,
  },
  tabLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.terra,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.terra,
    marginTop: 4,
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
});
