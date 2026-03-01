import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export default function Shimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SW, SW],
  });

  return (
    <View
      style={[
        styles.container,
        { width: width as any, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

// Preset skeleton layouts
export function SkeletonFeedItem({ height }: { height: number }) {
  return (
    <View style={[skeletonStyles.feedItem, { height }]}>
      <View style={skeletonStyles.feedBottom}>
        <View style={skeletonStyles.feedAuthorRow}>
          <Shimmer width={44} height={44} borderRadius={22} />
          <View style={skeletonStyles.feedAuthorInfo}>
            <Shimmer width={120} height={14} borderRadius={7} />
            <Shimmer width={80} height={10} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
        </View>
        <Shimmer width="90%" height={14} borderRadius={7} style={{ marginTop: 16 }} />
        <Shimmer width="70%" height={14} borderRadius={7} style={{ marginTop: 8 }} />
        <View style={skeletonStyles.feedReactions}>
          <Shimmer width={80} height={32} borderRadius={16} />
          <Shimmer width={80} height={32} borderRadius={16} />
          <Shimmer width={80} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <Shimmer width="100%" height={120} borderRadius={16} />
      <Shimmer width="80%" height={12} borderRadius={6} style={{ marginTop: 12 }} />
      <Shimmer width="50%" height={10} borderRadius={5} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '40%',
  },
});

const skeletonStyles = StyleSheet.create({
  feedItem: {
    justifyContent: 'flex-end',
    padding: 24,
  },
  feedBottom: {},
  feedAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedAuthorInfo: {
    flex: 1,
  },
  feedReactions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  card: {
    width: '48%',
    padding: 0,
    marginBottom: 10,
  },
});
