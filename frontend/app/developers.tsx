/**
 * KORA for Developers — API Portal
 * 
 * Portail développeur avec documentation API, clés, webhooks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS } from '../src/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

export default function DevelopersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [docs, setDocs] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'webhooks'>('docs');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load documentation
      const docsRes = await fetch(`${API_URL}/api/developers/docs`);
      if (docsRes.ok) {
        setDocs(await docsRes.json());
      }

      // Load API keys
      const token = await AsyncStorage.getItem('kora_token');
      if (token) {
        const keysRes = await fetch(`${API_URL}/api/developers/api-keys`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (keysRes.ok) {
          const data = await keysRes.json();
          setApiKeys(data.keys || []);
        }
      }
    } catch (err) {
      console.error('Error loading dev data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la clé');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('kora_token');
      const res = await fetch(`${API_URL}/api/developers/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName, environment: 'sandbox' })
      });

      if (res.ok) {
        const data = await res.json();
        Alert.alert(
          'Clé API Créée',
          `Votre clé: ${data.api_key}\n\nCopiez-la maintenant, elle ne sera plus affichée!`,
          [
            { text: 'Copier', onPress: () => Clipboard.setStringAsync(data.api_key) },
            { text: 'OK' }
          ]
        );
        setNewKeyName('');
        loadData();
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer la clé');
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copié!', 'Code copié dans le presse-papier');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.terra} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KORA for Developers</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['docs', 'keys', 'webhooks'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'docs' ? 'API Docs' : tab === 'keys' ? 'Clés API' : 'Webhooks'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'docs' && docs && (
          <>
            {/* Quick Start */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Start</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {`curl -X GET "${docs.base_url}/catalog/featured" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}
                </Text>
                <TouchableOpacity 
                  style={styles.copyBtn}
                  onPress={() => copyToClipboard(`curl -X GET "${docs.base_url}/catalog/featured" -H "Authorization: Bearer YOUR_API_KEY"`)}
                >
                  <Text style={styles.copyBtnText}>Copier</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SDKs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SDKs Disponibles</Text>
              {Object.entries(docs.sdks || {}).map(([lang, cmd]) => (
                <TouchableOpacity 
                  key={lang} 
                  style={styles.sdkItem}
                  onPress={() => copyToClipboard(cmd as string)}
                >
                  <Text style={styles.sdkLang}>{lang}</Text>
                  <Text style={styles.sdkCmd}>{cmd as string}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Endpoints */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endpoints</Text>
              {Object.entries(docs.endpoints || {}).map(([category, endpoints]) => (
                <View key={category} style={styles.endpointCategory}>
                  <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                  {Object.entries(endpoints as any).map(([endpoint, details]: [string, any]) => (
                    <View key={endpoint} style={styles.endpoint}>
                      <Text style={styles.endpointName}>{endpoint}</Text>
                      <Text style={styles.endpointDesc}>{details.description}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'keys' && (
          <>
            {/* Create Key */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Créer une Clé API</Text>
              <View style={styles.createKeyForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la clé (ex: Mon App)"
                  placeholderTextColor={COLORS.gray}
                  value={newKeyName}
                  onChangeText={setNewKeyName}
                />
                <TouchableOpacity style={styles.createBtn} onPress={createApiKey}>
                  <Text style={styles.createBtnText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Keys List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mes Clés ({apiKeys.length})</Text>
              {apiKeys.length === 0 ? (
                <Text style={styles.emptyText}>Aucune clé API créée</Text>
              ) : (
                apiKeys.map((key, i) => (
                  <View key={i} style={styles.keyItem}>
                    <View>
                      <Text style={styles.keyName}>{key.name}</Text>
                      <Text style={styles.keyPrefix}>{key.key_prefix}</Text>
                      <Text style={styles.keyEnv}>{key.environment}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {activeTab === 'webhooks' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Webhooks</Text>
            <Text style={styles.comingSoon}>Configuration webhooks bientôt disponible</Text>
            
            <Text style={styles.sectionTitle}>Événements Disponibles</Text>
            {['content.created', 'content.approved', 'play.recorded', 'subscription.created'].map(event => (
              <View key={event} style={styles.eventItem}>
                <Text style={styles.eventName}>{event}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    marginRight: 16,
  },
  backText: {
    fontSize: 24,
    color: COLORS.cream,
  },
  headerTitle: {
    fontFamily: FONTS.jostBold,
    fontSize: 20,
    color: COLORS.cream,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.jostBold,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 16,
    position: 'relative',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.cream,
    lineHeight: 20,
  },
  copyBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.terra,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
  },
  sdkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sdkLang: {
    fontFamily: FONTS.jostBold,
    fontSize: 14,
    color: COLORS.terra,
    width: 80,
    textTransform: 'capitalize',
  },
  sdkCmd: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.cream,
    flex: 1,
  },
  endpointCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontFamily: FONTS.jostBold,
    fontSize: 14,
    color: COLORS.terra,
    marginBottom: 8,
  },
  endpoint: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  endpointName: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: COLORS.cream,
  },
  endpointDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  createKeyForm: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  createBtn: {
    backgroundColor: COLORS.terra,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createBtnText: {
    fontFamily: FONTS.jostBold,
    fontSize: 14,
    color: COLORS.cream,
  },
  keyItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  keyName: {
    fontFamily: FONTS.jostBold,
    fontSize: 14,
    color: COLORS.cream,
  },
  keyPrefix: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  keyEnv: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.terra,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  comingSoon: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  eventItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  eventName: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: COLORS.cream,
  },
});
