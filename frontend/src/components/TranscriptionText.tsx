/**
 * KORA Transcription Text — UPGRADE 14
 * 
 * Affichage élégant de la transcription vocale
 * - Maximum 3 lignes visibles
 * - Tap pour expand complet
 * - Style italique (retranscription, pas texte rédigé)
 * 
 * // La transcription est un acte de respect
 * // Pour les sourds. Pour les environnements silencieux.
 * // Pour ceux qui parlent une langue différente.
 */

import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS, FONTS, TYPOGRAPHY } from '../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface TranscriptionTextProps {
  text?: string;
  maxLines?: number;
  showLabel?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function TranscriptionText({
  text,
  maxLines = 3,
  showLabel = true,
}: TranscriptionTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  // If no transcription, show placeholder
  if (!text) {
    return (
      <View style={styles.container}>
        {showLabel && <Text style={styles.label}>TRANSCRIPTION</Text>}
        <Text style={styles.placeholder}>...</Text>
      </View>
    );
  }

  const handlePress = () => {
    if (needsTruncation) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
    }
  };

  const handleTextLayout = (e: any) => {
    const { lines } = e.nativeEvent;
    if (lines.length > maxLines) {
      setNeedsTruncation(true);
    }
  };

  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>TRANSCRIPTION</Text>}
      
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={needsTruncation ? 0.7 : 1}
        disabled={!needsTruncation}
      >
        <Text
          style={styles.transcriptionText}
          numberOfLines={isExpanded ? undefined : maxLines}
          onTextLayout={handleTextLayout}
        >
          {text}
        </Text>
        
        {needsTruncation && !isExpanded && (
          <Text style={styles.moreIndicator}>... tap pour lire</Text>
        )}
        
        {needsTruncation && isExpanded && (
          <Text style={styles.lessIndicator}>▲ réduire</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default memo(TranscriptionText);

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: COLORS.gray,
    letterSpacing: 2,
    marginBottom: 8,
  },
  transcriptionText: {
    fontFamily: FONTS.jostLightItalic || FONTS.jostLight,
    fontStyle: 'italic',
    fontSize: 14,
    color: 'rgba(248, 244, 227, 0.7)', // cream 70%
    lineHeight: 14 * 1.6, // line-height 1.6
  },
  placeholder: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  moreIndicator: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.terra,
    marginTop: 8,
  },
  lessIndicator: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});
