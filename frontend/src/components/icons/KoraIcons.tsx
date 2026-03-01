/**
 * KORA Icon System — Noble SVG Icons
 * 
 * Design Philosophy:
 * - Stroke-only, no fills
 * - Fine lines (strokeWidth: 1.2)
 * - Rounded caps and joins
 * - Color inherited from parent
 * 
 * Usage:
 * <GlobeIcon size={24} color={COLORS.cream} />
 */

import React from 'react';
import Svg, { 
  Circle, 
  Path, 
  Line, 
  Rect, 
  G,
  Ellipse,
} from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withRepeat, 
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = '#F4F1EA'; // COLORS.cream
const DEFAULT_STROKE = 1.2;

// ──────────────────────────────────────────────────────────────────────────────
// NAVIGATION ICONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GlobeIcon — Circle + 2 latitude lines + 1 meridian
 * For: Globe tab
 */
export function GlobeIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Main circle */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Vertical meridian */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={r * 0.35}
        ry={r}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        fill="none"
      />
      {/* Upper latitude line */}
      <Path
        d={`M ${cx - r * 0.85} ${cy - r * 0.4} Q ${cx} ${cy - r * 0.2} ${cx + r * 0.85} ${cy - r * 0.4}`}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower latitude line */}
      <Path
        d={`M ${cx - r * 0.85} ${cy + r * 0.4} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.85} ${cy + r * 0.4}`}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * FeedIcon — 3 horizontal lines of decreasing width
 * For: Feed tab
 */
export function FeedIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  const startX = size * 0.2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Top line - longest */}
      <Line
        x1={startX}
        y1={size * 0.3}
        x2={size * 0.8}
        y2={size * 0.3}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Middle line - medium */}
      <Line
        x1={startX}
        y1={size * 0.5}
        x2={size * 0.68}
        y2={size * 0.5}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Bottom line - shortest */}
      <Line
        x1={startX}
        y1={size * 0.7}
        x2={size * 0.55}
        y2={size * 0.7}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * CreateIcon — Circle with pulsing central dot (Noyau concept)
 * For: Create tab
 */
export function CreateIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE,
  animate = false,
}: IconProps & { animate?: boolean }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const dotR = size * 0.08;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer circle */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner dot (represents the Noyau) */}
      <Circle
        cx={cx}
        cy={cy}
        r={dotR}
        fill={color}
      />
    </Svg>
  );
}

/**
 * NebulaIcon — 3 points connected by fine lines (constellation)
 * For: Nebuleuse tab (messages)
 */
export function NebulaIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  // Triangle constellation points
  const p1 = { x: size * 0.5, y: size * 0.2 };   // Top
  const p2 = { x: size * 0.2, y: size * 0.75 };  // Bottom left
  const p3 = { x: size * 0.8, y: size * 0.65 };  // Bottom right
  const dotR = size * 0.04;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Connecting lines */}
      <Line
        x1={p1.x} y1={p1.y}
        x2={p2.x} y2={p2.y}
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        strokeLinecap="round"
      />
      <Line
        x1={p2.x} y1={p2.y}
        x2={p3.x} y2={p3.y}
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        strokeLinecap="round"
      />
      <Line
        x1={p3.x} y1={p3.y}
        x2={p1.x} y2={p1.y}
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        strokeLinecap="round"
      />
      {/* Star points */}
      <Circle cx={p1.x} cy={p1.y} r={dotR} fill={color} />
      <Circle cx={p2.x} cy={p2.y} r={dotR} fill={color} />
      <Circle cx={p3.x} cy={p3.y} r={dotR} fill={color} />
    </Svg>
  );
}

/**
 * TerritoireIcon — Circle with outer ring (territory boundary)
 * For: Territoire tab (profile)
 */
export function TerritoireIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.25;
  const outerR = size * 0.4;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={outerR}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner core */}
      <Circle
        cx={cx}
        cy={cy}
        r={innerR}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION ICONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * MicIcon — Rounded rectangle vertical + line + arc
 * For: Voice capture button
 */
export function MicIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Mic body */}
      <Rect
        x={cx - size * 0.12}
        y={size * 0.15}
        width={size * 0.24}
        height={size * 0.38}
        rx={size * 0.12}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Stand arc */}
      <Path
        d={`M ${cx - size * 0.22} ${size * 0.45} 
            Q ${cx - size * 0.22} ${size * 0.68} ${cx} ${size * 0.68}
            Q ${cx + size * 0.22} ${size * 0.68} ${cx + size * 0.22} ${size * 0.45}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Stand line */}
      <Line
        x1={cx}
        y1={size * 0.68}
        x2={cx}
        y2={size * 0.82}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Base */}
      <Line
        x1={cx - size * 0.15}
        y1={size * 0.82}
        x2={cx + size * 0.15}
        y2={size * 0.82}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * BackIcon — Simple left chevron
 * For: Back buttons
 */
export function BackIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path
        d={`M ${size * 0.6} ${size * 0.2} L ${size * 0.35} ${size * 0.5} L ${size * 0.6} ${size * 0.8}`}
        stroke={color}
        strokeWidth={strokeWidth * 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * CloseIcon — Fine cross at 45°
 * For: Modal close buttons
 */
export function CloseIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const margin = size * 0.28;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line
        x1={margin}
        y1={margin}
        x2={size - margin}
        y2={size - margin}
        stroke={color}
        strokeWidth={strokeWidth * 1.2}
        strokeLinecap="round"
      />
      <Line
        x1={size - margin}
        y1={margin}
        x2={margin}
        y2={size - margin}
        stroke={color}
        strokeWidth={strokeWidth * 1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * PlayIcon — Equilateral triangle, stroke only
 * For: Play buttons
 */
export function PlayIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const h = size * 0.5;  // Triangle height
  const w = h * 0.866;   // Width for equilateral
  const cx = size / 2;
  const cy = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path
        d={`M ${cx - w * 0.35} ${cy - h * 0.5} 
            L ${cx + w * 0.65} ${cy} 
            L ${cx - w * 0.35} ${cy + h * 0.5} 
            Z`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * StopIcon — Square, stroke only
 * For: Stop recording
 */
export function StopIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const margin = size * 0.3;
  const s = size - margin * 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect
        x={margin}
        y={margin}
        width={s}
        height={s}
        rx={size * 0.05}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// REACTION ICONS (Feed)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * ResonneIcon — Single wave arc (resonance)
 * For: "Résonne" reaction
 */
export function ResonneIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Central dot */}
      <Circle cx={cx} cy={cy} r={size * 0.06} fill={color} />
      {/* Wave arc */}
      <Path
        d={`M ${cx - size * 0.25} ${cy - size * 0.25}
            Q ${cx + size * 0.15} ${cy - size * 0.15} ${cx + size * 0.25} ${cy + size * 0.25}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * PropulseIcon — Upward stylized arrow
 * For: "Propulse" reaction
 */
export function PropulseIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Vertical line */}
      <Line
        x1={cx}
        y1={size * 0.75}
        x2={cx}
        y2={size * 0.25}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Arrow head */}
      <Path
        d={`M ${cx - size * 0.18} ${size * 0.4} L ${cx} ${size * 0.22} L ${cx + size * 0.18} ${size * 0.4}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * EveillIcon — Minimalist lightbulb (circle + line)
 * For: "Éveille" reaction
 */
export function EveillIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Bulb circle */}
      <Circle
        cx={cx}
        cy={size * 0.38}
        r={size * 0.25}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Base lines */}
      <Line
        x1={cx - size * 0.12}
        y1={size * 0.7}
        x2={cx + size * 0.12}
        y2={size * 0.7}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={cx - size * 0.08}
        y1={size * 0.78}
        x2={cx + size * 0.08}
        y2={size * 0.78}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Connection to bulb */}
      <Line
        x1={cx - size * 0.1}
        y1={size * 0.63}
        x2={cx - size * 0.1}
        y2={size * 0.7}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
      />
      <Line
        x1={cx + size * 0.1}
        y1={size * 0.63}
        x2={cx + size * 0.1}
        y2={size * 0.7}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * AncreIcon — Simplified maritime anchor
 * For: "Ancre" reaction
 */
export function AncreIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Top ring */}
      <Circle
        cx={cx}
        cy={size * 0.22}
        r={size * 0.1}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Vertical shaft */}
      <Line
        x1={cx}
        y1={size * 0.32}
        x2={cx}
        y2={size * 0.78}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Horizontal bar */}
      <Line
        x1={cx - size * 0.18}
        y1={size * 0.42}
        x2={cx + size * 0.18}
        y2={size * 0.42}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Left hook */}
      <Path
        d={`M ${cx - size * 0.28} ${size * 0.58} 
            Q ${cx - size * 0.28} ${size * 0.78} ${cx} ${size * 0.78}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right hook */}
      <Path
        d={`M ${cx + size * 0.28} ${size * 0.58} 
            Q ${cx + size * 0.28} ${size * 0.78} ${cx} ${size * 0.78}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * TransmetIcon — 3 concentric waves from a point
 * For: "Transmet" reaction
 */
export function TransmetIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size * 0.25;
  const cy = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Source point */}
      <Circle cx={cx} cy={cy} r={size * 0.05} fill={color} />
      {/* Wave 1 */}
      <Path
        d={`M ${cx + size * 0.12} ${cy - size * 0.15}
            Q ${cx + size * 0.25} ${cy} ${cx + size * 0.12} ${cy + size * 0.15}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Wave 2 */}
      <Path
        d={`M ${cx + size * 0.25} ${cy - size * 0.25}
            Q ${cx + size * 0.42} ${cy} ${cx + size * 0.25} ${cy + size * 0.25}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Wave 3 */}
      <Path
        d={`M ${cx + size * 0.38} ${cy - size * 0.35}
            Q ${cx + size * 0.6} ${cy} ${cx + size * 0.38} ${cy + size * 0.35}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// UTILITY ICONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * HomeIcon — House outline
 * For: Home/focus button on globe
 */
export function HomeIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Roof */}
      <Path
        d={`M ${size * 0.15} ${size * 0.45} L ${cx} ${size * 0.18} L ${size * 0.85} ${size * 0.45}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* House body */}
      <Path
        d={`M ${size * 0.22} ${size * 0.42} 
            L ${size * 0.22} ${size * 0.78} 
            L ${size * 0.78} ${size * 0.78} 
            L ${size * 0.78} ${size * 0.42}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Door */}
      <Rect
        x={cx - size * 0.08}
        y={size * 0.55}
        width={size * 0.16}
        height={size * 0.23}
        stroke={color}
        strokeWidth={strokeWidth * 0.8}
        fill="none"
      />
    </Svg>
  );
}

/**
 * SettingsIcon — Gear/cog
 * For: Settings button
 */
export function SettingsIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.15;
  const outerR = size * 0.35;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Inner circle */}
      <Circle
        cx={cx}
        cy={cy}
        r={innerR}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Gear teeth (6 teeth) */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (innerR + size * 0.05);
        const y1 = cy + Math.sin(rad) * (innerR + size * 0.05);
        const x2 = cx + Math.cos(rad) * outerR;
        const y2 = cy + Math.sin(rad) * outerR;
        return (
          <Line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={strokeWidth * 1.3}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

/**
 * PinIcon — Location pin
 * For: GPS indicators
 */
export function PinIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Pin body */}
      <Path
        d={`M ${cx} ${size * 0.85}
            L ${cx - size * 0.25} ${size * 0.45}
            A ${size * 0.25} ${size * 0.25} 0 1 1 ${cx + size * 0.25} ${size * 0.45}
            Z`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner dot */}
      <Circle
        cx={cx}
        cy={size * 0.35}
        r={size * 0.08}
        fill={color}
      />
    </Svg>
  );
}

/**
 * OrbiteIcon — Chat/comment bubble
 * For: Orbite (comments) action
 */
export function OrbiteIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Bubble */}
      <Path
        d={`M ${size * 0.18} ${size * 0.25}
            L ${size * 0.82} ${size * 0.25}
            Q ${size * 0.88} ${size * 0.25} ${size * 0.88} ${size * 0.32}
            L ${size * 0.88} ${size * 0.55}
            Q ${size * 0.88} ${size * 0.62} ${size * 0.82} ${size * 0.62}
            L ${size * 0.4} ${size * 0.62}
            L ${size * 0.25} ${size * 0.78}
            L ${size * 0.28} ${size * 0.62}
            L ${size * 0.18} ${size * 0.62}
            Q ${size * 0.12} ${size * 0.62} ${size * 0.12} ${size * 0.55}
            L ${size * 0.12} ${size * 0.32}
            Q ${size * 0.12} ${size * 0.25} ${size * 0.18} ${size * 0.25}
            Z`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * LinkIcon — Chain link
 * For: Share/link action
 */
export function LinkIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* First link */}
      <Path
        d={`M ${size * 0.45} ${size * 0.35}
            L ${size * 0.32} ${size * 0.35}
            Q ${size * 0.18} ${size * 0.35} ${size * 0.18} ${size * 0.5}
            Q ${size * 0.18} ${size * 0.65} ${size * 0.32} ${size * 0.65}
            L ${size * 0.45} ${size * 0.65}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Second link */}
      <Path
        d={`M ${size * 0.55} ${size * 0.35}
            L ${size * 0.68} ${size * 0.35}
            Q ${size * 0.82} ${size * 0.35} ${size * 0.82} ${size * 0.5}
            Q ${size * 0.82} ${size * 0.65} ${size * 0.68} ${size * 0.65}
            L ${size * 0.55} ${size * 0.65}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Connection line */}
      <Line
        x1={size * 0.42}
        y1={size * 0.5}
        x2={size * 0.58}
        y2={size * 0.5}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * SparkleIcon — Four-pointed star
 * For: Decorative/success indicators (replaces ✨)
 */
export function SparkleIcon({ 
  size = DEFAULT_SIZE, 
  color = DEFAULT_COLOR, 
  strokeWidth = DEFAULT_STROKE 
}: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path
        d={`M ${cx} ${size * 0.15}
            Q ${cx + size * 0.05} ${cy} ${size * 0.85} ${cy}
            Q ${cx + size * 0.05} ${cy} ${cx} ${size * 0.85}
            Q ${cx - size * 0.05} ${cy} ${size * 0.15} ${cy}
            Q ${cx - size * 0.05} ${cy} ${cx} ${size * 0.15}
            Z`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// BIOMETRIC ICONS — UPGRADE 17
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fingerprint Icon — For biometric authentication
 * Elegant fingerprint pattern
 */
export function FingerprintIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Fingerprint arcs */}
      <Path
        d="M12 2C10.67 2 9.4 2.28 8.23 2.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M4 7.28C2.74 8.85 2 10.84 2 13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M6.8 4C5.45 4.92 4.34 6.16 3.57 7.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M22 13c0-2.16-.74-4.15-2-5.72"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M20.43 7.6c-.77-1.44-1.88-2.68-3.23-3.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M15.77 2.8A9.93 9.93 0 0012 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M7 13c0 2.76 2.24 5 5 5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17 13c0-2.76-2.24-5-5-5s-5 2.24-5 5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M12 18v4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M14.5 13c0 1.38-1.12 2.5-2.5 2.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M12 10.5c1.38 0 2.5 1.12 2.5 2.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Face ID Icon — For facial recognition
 * Minimal face scan pattern
 */
export function FaceIdIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Corner brackets */}
      <Path
        d="M7 2H4a2 2 0 00-2 2v3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M17 2h3a2 2 0 012 2v3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M22 17v3a2 2 0 01-2 2h-3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M7 22H4a2 2 0 01-2-2v-3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Eyes */}
      <Circle
        cx="9"
        cy="9"
        r="0.5"
        fill={color}
      />
      <Circle
        cx="15"
        cy="9"
        r="0.5"
        fill={color}
      />
      {/* Smile */}
      <Path
        d="M9 15c1 1 5 1 6 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Lock Icon — For security/blocked state
 */
export function LockIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Circle
        cx="12"
        cy="16"
        r="1"
        fill={color}
      />
    </Svg>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
// SETTINGS ICONS — UPGRADE 18
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Key Icon — For sacred words / memory key
 */
export function KeyIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx="8"
        cy="8"
        r="5"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M12 12l9 9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M17 17l2 -2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M19.5 19.5l2 -2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Copy Icon — For clipboard operations
 */
export function CopyIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Alert/Warning Icon — For important messages
 */
export function AlertIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2L2 22h20L12 2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Line
        x1="12"
        y1="9"
        x2="12"
        y2="13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle
        cx="12"
        cy="17"
        r="0.5"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Settings Icon — Gear icon for settings
 */
export function SettingsIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

