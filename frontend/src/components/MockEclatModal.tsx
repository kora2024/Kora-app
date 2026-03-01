import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, SPACING } from '../theme';
import { haptic } from '../utils/haptics';
import { MockEclat, ROLE_COLORS } from '../data/mockEclats';

const { width: SW } = Dimensions.get('window');

interface MockEclatModalProps {
  visible: boolean;
  eclat: MockEclat | null;
  onClose: () => void;
}

export default function MockEclatModal({
  visible,
  eclat,
  onClose,
}: MockEclatModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    haptic.light();
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!eclat) return null;

  const roleColor = ROLE_COLORS[eclat.role] || COLORS.gray;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        
        <Animated.View 
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              borderLeftColor: eclat.color,
            },
          ]}
        >
          {/* Color accent bar */}
          <View style={[styles.colorBar, { backgroundColor: eclat.color }]} />
          
          {/* Content */}
          <View style={styles.content}>
            {/* Quote */}
            <Text style={styles.quoteText}>"{eclat.text}"</Text>
            
            {/* Author info */}
            <View style={styles.authorRow}>
              <View style={[styles.avatarCircle, { backgroundColor: eclat.color }]}>
                <Text style={styles.avatarText}>
                  {eclat.author.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{eclat.author}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20`, borderColor: `${roleColor}40` }]}>
                    <Text style={[styles.roleText, { color: roleColor }]}>{eclat.role}</Text>
                  </View>
                  <Text style={styles.territoireText}>· {eclat.territoire}</Text>
                </View>
              </View>
            </View>
            
            {/* Date */}
            <Text style={styles.dateText}>{formatDate(eclat.createdAt)}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  card: {
    width: SW - 48,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 24,
  },
  quoteText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 22,
    color: COLORS.cream,
    lineHeight: 32,
    marginBottom: 24,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.cream,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  territoireText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  dateText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'right',
  },
});
