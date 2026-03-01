/**
 * KORA Index — UPGRADE 16 (Onboarding unique)
 * 
 * L'Éveil est un rite de passage.
 * On ne se marie pas deux fois dans la même cérémonie.
 * Une seule fois. Pour toujours.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/theme';

const EVEIL_COMPLETED_KEY = 'kora_eveil_completed';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedEveil, setHasCompletedEveil] = useState(false);

  useEffect(() => {
    checkEveilStatus();
  }, []);

  const checkEveilStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(EVEIL_COMPLETED_KEY);
      setHasCompletedEveil(completed === 'true');
    } catch (error) {
      console.log('Error checking eveil status:', error);
      setHasCompletedEveil(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.terra} />
      </View>
    );
  }

  // Si l'Éveil est complété → GlobeScreen
  // Sinon → EveilScreen
  return <Redirect href={hasCompletedEveil ? '/(tabs)/globe' : '/eveil'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
