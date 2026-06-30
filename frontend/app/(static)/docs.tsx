/**
 * KORA API Documentation — Spotify/Apple Developer Level
 * 
 * Full API documentation with:
 * - Authentication
 * - Endpoints reference
 * - Code examples in multiple languages
 * - Webhooks
 * - Rate limits
 * - SDKs
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const { width: SW } = Dimensions.get('window');
const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CopyIcon({ size = 16, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </Svg>
  );
}

function ChevronIcon({ size = 16, color = CINEMA.cream, direction = 'down' }: { size?: number; color?: string; direction?: 'down' | 'up' | 'right' }) {
  const rotation = direction === 'up' ? 180 : direction === 'right' ? -90 : 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CODE BLOCK COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function CodeBlock({ language, code, title }: { language: string; code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // In a real app, would use Clipboard API
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <View style={styles.codeHeaderLeft}>
          {title && <Text style={styles.codeTitle}>{title}</Text>}
          <View style={styles.codeLangBadge}>
            <Text style={styles.codeLangText}>{language}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <CopyIcon size={14} />
          <Text style={styles.copyBtnText}>{copied ? 'Copié!' : 'Copier'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.codeText}>{code}</Text>
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPANDABLE SECTION
// ══════════════════════════════════════════════════════════════════════════════

function ExpandableSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const heightAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: expanded ? 1 : 0,
      tension: 100,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <View style={styles.expandableSection}>
      <TouchableOpacity style={styles.expandableHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.expandableTitle}>{title}</Text>
        <ChevronIcon direction={expanded ? 'up' : 'down'} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.expandableContent}>
          {children}
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ENDPOINT CARD
// ══════════════════════════════════════════════════════════════════════════════

function EndpointCard({ method, path, description, params, response }: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  response?: string;
}) {
  const methodColors = {
    GET: '#4ADE80',
    POST: '#60A5FA',
    PUT: '#FBBF24',
    DELETE: '#F87171',
  };

  return (
    <View style={styles.endpointCard}>
      <View style={styles.endpointHeader}>
        <View style={[styles.methodBadge, { backgroundColor: methodColors[method] + '20' }]}>
          <Text style={[styles.methodText, { color: methodColors[method] }]}>{method}</Text>
        </View>
        <Text style={styles.endpointPath}>{path}</Text>
      </View>
      <Text style={styles.endpointDesc}>{description}</Text>
      
      {params && params.length > 0 && (
        <View style={styles.paramsSection}>
          <Text style={styles.paramsTitle}>Paramètres</Text>
          {params.map((param, i) => (
            <View key={i} style={styles.paramRow}>
              <View style={styles.paramNameRow}>
                <Text style={styles.paramName}>{param.name}</Text>
                <Text style={styles.paramType}>{param.type}</Text>
                {param.required && <Text style={styles.paramRequired}>requis</Text>}
              </View>
              <Text style={styles.paramDesc}>{param.desc}</Text>
            </View>
          ))}
        </View>
      )}

      {response && (
        <View style={styles.responseSection}>
          <Text style={styles.paramsTitle}>Réponse</Text>
          <CodeBlock language="JSON" code={response} />
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DOCUMENTATION PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DocumentationPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('getting-started');

  const SECTIONS = [
    { id: 'getting-started', label: 'Démarrage' },
    { id: 'authentication', label: 'Authentification' },
    { id: 'catalog', label: 'Catalog API' },
    { id: 'playback', label: 'Playback API' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'sdks', label: 'SDKs' },
    { id: 'rate-limits', label: 'Rate Limits' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documentation API</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sideNav}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.navItem, activeSection === section.id && styles.navItemActive]}
              onPress={() => setActiveSection(section.id)}
            >
              <Text style={[styles.navItemText, activeSection === section.id && styles.navItemTextActive]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Content */}
        <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
          {/* Getting Started */}
          {activeSection === 'getting-started' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Démarrage Rapide</Text>
              <Text style={styles.sectionDesc}>
                L'API KORA vous permet d'accéder au catalogue de musique et vidéo culturel, 
                de gérer la lecture, et d'intégrer les fonctionnalités KORA dans vos applications.
              </Text>

              <View style={styles.stepsList}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Créer un compte développeur</Text>
                    <Text style={styles.stepDesc}>Inscrivez-vous sur developers.kora.tv pour obtenir vos credentials API.</Text>
                  </View>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Générer une clé API</Text>
                    <Text style={styles.stepDesc}>Dans votre dashboard, créez une application et récupérez votre API Key.</Text>
                  </View>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Faire votre premier appel</Text>
                    <Text style={styles.stepDesc}>Testez l'API avec l'exemple ci-dessous.</Text>
                  </View>
                </View>
              </View>

              <CodeBlock 
                language="cURL"
                title="Premier appel API"
                code={`curl -X GET "https://api.kora.tv/v1/catalog/featured" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Base URL</Text>
                <Text style={styles.infoBoxCode}>https://api.kora.tv/v1</Text>
              </View>
            </View>
          )}

          {/* Authentication */}
          {activeSection === 'authentication' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentification</Text>
              <Text style={styles.sectionDesc}>
                L'API KORA utilise des tokens Bearer pour l'authentification. 
                Incluez votre clé API dans le header Authorization de chaque requête.
              </Text>

              <CodeBlock 
                language="HTTP Header"
                code={`Authorization: Bearer kora_live_xxxxxxxxxxxxx`}
              />

              <ExpandableSection title="OAuth 2.0 Flow" defaultOpen={true}>
                <Text style={styles.expandText}>
                  Pour les applications qui accèdent aux données utilisateur, utilisez OAuth 2.0 :
                </Text>
                <CodeBlock 
                  language="JavaScript"
                  code={`// 1. Redirect to authorization
const authUrl = \`https://accounts.kora.tv/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=streaming user-read-playback\`;

// 2. Exchange code for token
const response = await fetch('https://accounts.kora.tv/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: AUTH_CODE,
    redirect_uri: YOUR_REDIRECT_URI,
    client_id: YOUR_CLIENT_ID,
    client_secret: YOUR_CLIENT_SECRET,
  })
});`}
                />
              </ExpandableSection>

              <ExpandableSection title="Scopes disponibles">
                <View style={styles.scopesList}>
                  {[
                    { scope: 'streaming', desc: 'Lecture de contenu audio/vidéo' },
                    { scope: 'user-read-playback', desc: 'État de lecture actuel' },
                    { scope: 'user-library-read', desc: 'Bibliothèque utilisateur' },
                    { scope: 'user-library-modify', desc: 'Modifier la bibliothèque' },
                    { scope: 'playlist-read', desc: 'Lire les playlists' },
                    { scope: 'playlist-modify', desc: 'Créer/modifier playlists' },
                  ].map((s, i) => (
                    <View key={i} style={styles.scopeRow}>
                      <Text style={styles.scopeName}>{s.scope}</Text>
                      <Text style={styles.scopeDesc}>{s.desc}</Text>
                    </View>
                  ))}
                </View>
              </ExpandableSection>
            </View>
          )}

          {/* Catalog API */}
          {activeSection === 'catalog' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catalog API</Text>
              <Text style={styles.sectionDesc}>
                Accédez au catalogue KORA : pistes, albums, artistes, playlists.
              </Text>

              <EndpointCard
                method="GET"
                path="/catalog/tracks"
                description="Récupère une liste de pistes avec pagination et filtres."
                params={[
                  { name: 'limit', type: 'integer', required: false, desc: 'Nombre de résultats (max 50)' },
                  { name: 'offset', type: 'integer', required: false, desc: 'Position de départ' },
                  { name: 'genre', type: 'string', required: false, desc: 'Filtrer par genre (zouk, reggae, afrobeats...)' },
                  { name: 'territory', type: 'string', required: false, desc: 'Filtrer par territoire' },
                ]}
                response={`{
  "items": [
    {
      "id": "trk_xxxxxxxx",
      "title": "Zouk Love Classics",
      "artist": { "id": "art_xxx", "name": "Kassav'" },
      "album": { "id": "alb_xxx", "title": "Best Of" },
      "duration_ms": 234000,
      "stream_url": "https://stream.kora.tv/...",
      "quality": { "codec": "AAC", "bitrate": 320, "spatial": true }
    }
  ],
  "total": 1250,
  "limit": 20,
  "offset": 0
}`}
              />

              <EndpointCard
                method="GET"
                path="/catalog/tracks/{id}"
                description="Récupère les détails d'une piste spécifique."
                params={[
                  { name: 'id', type: 'string', required: true, desc: 'ID de la piste' },
                ]}
              />

              <EndpointCard
                method="GET"
                path="/catalog/artists/{id}"
                description="Récupère le profil d'un artiste et sa discographie."
                params={[
                  { name: 'id', type: 'string', required: true, desc: 'ID de l\'artiste' },
                  { name: 'include', type: 'string', required: false, desc: 'albums,top_tracks,related' },
                ]}
              />

              <EndpointCard
                method="GET"
                path="/search"
                description="Recherche dans le catalogue KORA."
                params={[
                  { name: 'q', type: 'string', required: true, desc: 'Terme de recherche' },
                  { name: 'type', type: 'string', required: false, desc: 'track,album,artist,playlist' },
                  { name: 'limit', type: 'integer', required: false, desc: 'Nombre de résultats par type' },
                ]}
              />
            </View>
          )}

          {/* Playback API */}
          {activeSection === 'playback' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Playback API</Text>
              <Text style={styles.sectionDesc}>
                Contrôlez la lecture sur les appareils connectés.
              </Text>

              <EndpointCard
                method="GET"
                path="/me/player"
                description="Récupère l'état de lecture actuel de l'utilisateur."
                response={`{
  "is_playing": true,
  "progress_ms": 45000,
  "item": { "id": "trk_xxx", "title": "..." },
  "device": {
    "id": "dev_xxx",
    "name": "iPhone de Jean",
    "type": "smartphone",
    "volume_percent": 75
  },
  "shuffle_state": false,
  "repeat_state": "off"
}`}
              />

              <EndpointCard
                method="PUT"
                path="/me/player/play"
                description="Lance la lecture ou reprend si en pause."
                params={[
                  { name: 'uris', type: 'array', required: false, desc: 'Liste d\'URIs à jouer' },
                  { name: 'context_uri', type: 'string', required: false, desc: 'URI d\'un album/playlist' },
                  { name: 'position_ms', type: 'integer', required: false, desc: 'Position de départ' },
                ]}
              />

              <EndpointCard
                method="PUT"
                path="/me/player/pause"
                description="Met en pause la lecture."
              />

              <EndpointCard
                method="POST"
                path="/me/player/next"
                description="Passe à la piste suivante."
              />

              <EndpointCard
                method="POST"
                path="/me/player/previous"
                description="Revient à la piste précédente."
              />
            </View>
          )}

          {/* Webhooks */}
          {activeSection === 'webhooks' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Webhooks</Text>
              <Text style={styles.sectionDesc}>
                Recevez des notifications en temps réel sur les événements KORA.
              </Text>

              <View style={styles.webhooksList}>
                {[
                  { event: 'playback.started', desc: 'Lecture démarrée' },
                  { event: 'playback.paused', desc: 'Lecture mise en pause' },
                  { event: 'playback.ended', desc: 'Lecture terminée' },
                  { event: 'track.liked', desc: 'Piste ajoutée aux favoris' },
                  { event: 'playlist.created', desc: 'Nouvelle playlist créée' },
                  { event: 'subscription.changed', desc: 'Changement d\'abonnement' },
                ].map((wh, i) => (
                  <View key={i} style={styles.webhookItem}>
                    <Text style={styles.webhookEvent}>{wh.event}</Text>
                    <Text style={styles.webhookDesc}>{wh.desc}</Text>
                  </View>
                ))}
              </View>

              <CodeBlock
                language="JSON"
                title="Exemple de payload webhook"
                code={`{
  "event": "playback.started",
  "timestamp": "2026-06-30T12:00:00Z",
  "data": {
    "user_id": "usr_xxx",
    "track_id": "trk_xxx",
    "device_id": "dev_xxx"
  },
  "signature": "sha256=xxxxx"
}`}
              />
            </View>
          )}

          {/* SDKs */}
          {activeSection === 'sdks' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SDKs & Bibliothèques</Text>
              <Text style={styles.sectionDesc}>
                Utilisez nos SDKs officiels pour une intégration rapide.
              </Text>

              <View style={styles.sdksList}>
                {[
                  { name: 'JavaScript/TypeScript', pkg: '@kora/sdk', version: '2.1.0' },
                  { name: 'Python', pkg: 'kora-sdk', version: '1.8.0' },
                  { name: 'Swift (iOS)', pkg: 'KoraSDK', version: '3.0.0' },
                  { name: 'Kotlin (Android)', pkg: 'tv.kora:sdk', version: '2.5.0' },
                  { name: 'React Native', pkg: '@kora/react-native-sdk', version: '1.2.0' },
                ].map((sdk, i) => (
                  <View key={i} style={styles.sdkCard}>
                    <Text style={styles.sdkName}>{sdk.name}</Text>
                    <View style={styles.sdkMeta}>
                      <Text style={styles.sdkPkg}>{sdk.pkg}</Text>
                      <Text style={styles.sdkVersion}>v{sdk.version}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <CodeBlock
                language="bash"
                title="Installation JavaScript"
                code={`npm install @kora/sdk
# ou
yarn add @kora/sdk`}
              />

              <CodeBlock
                language="JavaScript"
                title="Utilisation"
                code={`import { KoraClient } from '@kora/sdk';

const kora = new KoraClient({
  apiKey: 'kora_live_xxxxx',
});

// Rechercher des pistes
const results = await kora.catalog.search({
  query: 'zouk',
  type: ['track', 'artist'],
  limit: 10,
});

// Lancer la lecture
await kora.player.play({
  uris: ['kora:track:trk_xxxxx'],
});`}
              />
            </View>
          )}

          {/* Rate Limits */}
          {activeSection === 'rate-limits' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rate Limits</Text>
              <Text style={styles.sectionDesc}>
                L'API KORA applique des limites de requêtes pour garantir la stabilité.
              </Text>

              <View style={styles.rateLimitsTable}>
                <View style={styles.rateLimitHeader}>
                  <Text style={styles.rateLimitHeaderText}>Plan</Text>
                  <Text style={styles.rateLimitHeaderText}>Requêtes/min</Text>
                  <Text style={styles.rateLimitHeaderText}>Requêtes/jour</Text>
                </View>
                {[
                  { plan: 'Free', perMin: '30', perDay: '1,000' },
                  { plan: 'Developer', perMin: '100', perDay: '10,000' },
                  { plan: 'Pro', perMin: '500', perDay: '100,000' },
                  { plan: 'Enterprise', perMin: 'Illimité', perDay: 'Illimité' },
                ].map((limit, i) => (
                  <View key={i} style={styles.rateLimitRow}>
                    <Text style={styles.rateLimitPlan}>{limit.plan}</Text>
                    <Text style={styles.rateLimitValue}>{limit.perMin}</Text>
                    <Text style={styles.rateLimitValue}>{limit.perDay}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Headers de réponse</Text>
                <Text style={styles.infoBoxText}>
                  X-RateLimit-Limit: Limite totale{'\n'}
                  X-RateLimit-Remaining: Requêtes restantes{'\n'}
                  X-RateLimit-Reset: Timestamp de réinitialisation
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: insets.bottom + 60 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINEMA.black },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.cream, letterSpacing: 1 },
  content: { flex: 1 },
  sideNav: { 
    flexGrow: 0,
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navItem: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navItemActive: { backgroundColor: CINEMA.gold + '20' },
  navItemText: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  navItemTextActive: { color: CINEMA.gold, fontFamily: FONTS.jostMedium },
  mainScroll: { flex: 1, paddingHorizontal: 20 },
  section: { paddingTop: 24 },
  sectionTitle: { fontFamily: FONTS.playfairBold, fontSize: 24, color: CINEMA.cream, marginBottom: 12 },
  sectionDesc: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 24, marginBottom: 24 },
  
  // Steps
  stepsList: { marginBottom: 24 },
  step: { flexDirection: 'row', marginBottom: 20 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: CINEMA.gold, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  stepNumberText: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.black },
  stepContent: { flex: 1 },
  stepTitle: { fontFamily: FONTS.jostMedium, fontSize: 15, color: CINEMA.cream, marginBottom: 4 },
  stepDesc: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  // Code Block
  codeBlock: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 12, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  codeHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  codeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeTitle: { fontFamily: FONTS.jostMedium, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  codeLangBadge: { 
    backgroundColor: CINEMA.gold + '15', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 4 
  },
  codeLangText: { fontFamily: FONTS.jostMedium, fontSize: 10, color: CINEMA.gold },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  copyBtnText: { fontFamily: FONTS.jostRegular, fontSize: 11, color: CINEMA.gold },
  codeText: { 
    fontFamily: 'monospace', 
    fontSize: 12, 
    color: CINEMA.cream, 
    lineHeight: 20,
    padding: 16,
  },

  // Info Box
  infoBox: { 
    backgroundColor: 'rgba(201,168,76,0.08)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: CINEMA.gold,
  },
  infoBoxTitle: { fontFamily: FONTS.jostMedium, fontSize: 13, color: CINEMA.gold, marginBottom: 8 },
  infoBoxCode: { fontFamily: 'monospace', fontSize: 14, color: CINEMA.cream },
  infoBoxText: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },

  // Expandable
  expandableSection: { marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' },
  expandableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  expandableTitle: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream },
  expandableContent: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  expandText: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 16 },

  // Scopes
  scopesList: { gap: 8 },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scopeName: { fontFamily: 'monospace', fontSize: 12, color: CINEMA.gold, width: 140 },
  scopeDesc: { fontFamily: FONTS.jostRegular, fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 },

  // Endpoint Card
  endpointCard: { 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  endpointHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  methodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  methodText: { fontFamily: FONTS.jostMedium, fontSize: 11, letterSpacing: 1 },
  endpointPath: { fontFamily: 'monospace', fontSize: 14, color: CINEMA.cream },
  endpointDesc: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 12 },
  paramsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  paramsTitle: { fontFamily: FONTS.jostMedium, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 12 },
  paramRow: { marginBottom: 12 },
  paramNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paramName: { fontFamily: 'monospace', fontSize: 13, color: CINEMA.cream },
  paramType: { fontFamily: FONTS.jostRegular, fontSize: 11, color: CINEMA.gold },
  paramRequired: { fontFamily: FONTS.jostMedium, fontSize: 9, color: CINEMA.terra, backgroundColor: CINEMA.terra + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  paramDesc: { fontFamily: FONTS.jostRegular, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  responseSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },

  // Webhooks
  webhooksList: { gap: 8, marginBottom: 20 },
  webhookItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  webhookEvent: { fontFamily: 'monospace', fontSize: 12, color: CINEMA.gold, width: 160 },
  webhookDesc: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1 },

  // SDKs
  sdksList: { gap: 10, marginBottom: 20 },
  sdkCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 10, 
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sdkName: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream },
  sdkMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sdkPkg: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  sdkVersion: { fontFamily: FONTS.jostMedium, fontSize: 11, color: CINEMA.gold, backgroundColor: CINEMA.gold + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },

  // Rate Limits
  rateLimitsTable: { marginBottom: 20 },
  rateLimitHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  rateLimitHeaderText: { flex: 1, fontFamily: FONTS.jostMedium, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  rateLimitRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  rateLimitPlan: { flex: 1, fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream },
  rateLimitValue: { flex: 1, fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
});
