/**
 * KORA Toast Notification — UPGRADE 19
 * 
 * Notifications discrètes pour les ancrages et émissions
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';
import { haptic } from '../utils/haptics';

const { width: SW } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type ToastType = 'ancrage' | 'emission' | 'info' | 'error' | 'success' | 'pacte';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  icon?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, icon?: string, duration?: number) => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST ITEM COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function ToastItem({ 
  toast, 
  onDismiss 
}: { 
  toast: ToastMessage; 
  onDismiss: (id: string) => void;
}) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const duration = toast.duration || 2500;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss(toast.id));
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  // Style based on toast type
  const getBorderColor = () => {
    switch (toast.type) {
      case 'ancrage':
        return COLORS.terra;
      case 'emission':
        return COLORS.gold;
      case 'error':
      case 'pacte':
        return '#E50914';
      case 'success':
        return '#46D369';
      default:
        return 'rgba(255,255,255,0.2)';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          borderColor: getBorderColor(),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {toast.icon && <Text style={styles.toastIcon}>{toast.icon}</Text>}
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

let toastRef: {
  showToast: (type: ToastType, message: string, icon?: string, duration?: number) => void;
} | null = null;

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    type: ToastType, 
    message: string, 
    icon?: string, 
    duration?: number
  ) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, icon, duration }]);
    
    // Haptic feedback based on type
    if (type === 'ancrage') {
      haptic.success();
    } else if (type === 'emission') {
      haptic.light();
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Expose showToast globally
  useEffect(() => {
    toastRef = { showToast };
    return () => { toastRef = null; };
  }, [showToast]);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 20 }]}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL TOAST FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

export function showToast(
  type: ToastType, 
  message: string, 
  icon?: string, 
  duration?: number
) {
  if (toastRef) {
    toastRef.showToast(type, message, icon, duration);
  } else {
    console.log('Toast:', type, message);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark2,
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
    maxWidth: SW - 40,
  },
  toastIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  toastText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
  },
});
