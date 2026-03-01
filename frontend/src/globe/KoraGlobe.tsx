import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { TERRITORIES, Territory } from '../store/useKoraStore';
import { haptic } from '../utils/haptics';
import { Eclat } from '../utils/eclatStorage';
import { MockEclat } from '../data/mockEclats';

// ============================================
// TYPES & INTERFACES
// ============================================

interface GlobeProps {
  onTerritorySelect?: (territory: Territory) => void;
  onTerritoryDoubleTap?: (territory: Territory) => void;
  onGPSClick?: (lat: number, lng: number) => void;
  onEclatTap?: (eclat: Eclat) => void;
  onMockEclatTap?: (eclat: MockEclat) => void;
  userLocation?: { lat: number; lng: number };
  isUserSovereign?: boolean;
  eclats?: Eclat[];
  mockEclats?: MockEclat[];
}

export interface GlobeRef {
  focusOnTarget: (lat: number, lng: number) => void;
  addEclat: (eclat: Eclat) => void;
  addMockEclat: (eclat: MockEclat, delay?: number) => void;
}

// ============================================
// SOVEREIGN PALETTE COLORS
// ============================================

const PALETTE = {
  ocean: 0x080808,        // Deep Black/Charcoal
  land: 0x1A1D21,         // Dark Slate/Grey
  gold: 0xFFD700,         // Golden (Arcs & Aura only)
  atmosphere: 0x1a3a5c,   // Blue atmosphere glow
  grid: 0x333333,         // Subtle grid
};

// ============================================
// AXE 1 — CYCLE CIRCADIEN (UPGRADE 8 ENHANCED)
// Calculate sun position based on real UTC time
// ============================================

function getSunPosition(): { longitude: number; latitude: number; isNight: (lng: number, utcOffset: number) => boolean } {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Sun longitude: at 12:00 UTC, sun is at longitude 0°
  // Sun moves 15° per hour westward (360° / 24h = 15°/h)
  const sunLongitude = (12 - utcHours) * 15;
  
  // Normalize to -180 to 180
  const normalizedSunLng = ((sunLongitude + 180) % 360) - 180;
  
  // Solar declination (latitude of the sun) varies throughout the year
  // Maximum ~23.45° at summer solstice, minimum ~-23.45° at winter solstice
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  
  return {
    longitude: normalizedSunLng,
    latitude: declination,
    isNight: (lng: number, utcOffset: number) => {
      // Calculate local hour at this longitude
      const localHour = (utcHours + utcOffset + 24) % 24;
      // Night is between 22:00 and 06:00 local time
      return localHour >= 22 || localHour < 6;
    },
  };
}

// Check if a point is in nighttime (for territory dimming)
// Enhanced with more accurate calculation
function isPointInNight(lng: number): boolean {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  
  // Calculate local solar time at this longitude
  // Solar noon occurs when the sun is directly overhead
  const localSolarHour = (utcHours + lng / 15 + 24) % 24;
  
  // Consider night between 19:00 and 05:00 solar time
  return localSolarHour >= 19 || localSolarHour < 5;
}

// Calculate twilight factor (0 = full night, 1 = full day)
function getTwilightFactor(lng: number): number {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const localSolarHour = (utcHours + lng / 15 + 24) % 24;
  
  // Smooth transitions:
  // 05:00-07:00 = dawn (0 to 1)
  // 07:00-17:00 = day (1)
  // 17:00-19:00 = dusk (1 to 0)
  // 19:00-05:00 = night (0)
  
  if (localSolarHour >= 7 && localSolarHour < 17) return 1.0; // Full day
  if (localSolarHour >= 19 || localSolarHour < 5) return 0.0; // Full night
  if (localSolarHour >= 5 && localSolarHour < 7) {
    // Dawn transition
    return (localSolarHour - 5) / 2;
  }
  if (localSolarHour >= 17 && localSolarHour < 19) {
    // Dusk transition
    return 1 - (localSolarHour - 17) / 2;
  }
  return 0.5;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function latLngToVector3(lat: number, lng: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
  const normalized = point.clone().normalize();
  const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI);
  const lng = (Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI)) - 180;
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round((lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng) * 1000) / 1000,
  };
}

function latLngToSpherical(lat: number, lng: number): { theta: number; phi: number } {
  return {
    theta: (lng + 180) * (Math.PI / 180),
    phi: (90 - lat) * (Math.PI / 180),
  };
}

// ============================================
// HIGH-RES PROCEDURAL EARTH TEXTURE (2048x1024)
// Smooth coastlines with Perlin-like noise
// ============================================

function createHighResEarthTexture(): THREE.DataTexture {
  const width = 2048;
  const height = 1024;
  const data = new Uint8Array(width * height * 4);
  
  // Improved noise function for smooth coastlines
  const hash = (x: number, y: number): number => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };
  
  const smoothNoise = (x: number, y: number): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    
    // Smooth interpolation
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    
    const aa = hash(xi, yi);
    const ab = hash(xi, yi + 1);
    const ba = hash(xi + 1, yi);
    const bb = hash(xi + 1, yi + 1);
    
    const x1 = aa + u * (ba - aa);
    const x2 = ab + u * (bb - ab);
    
    return x1 + v * (x2 - x1);
  };
  
  const fractalNoise = (x: number, y: number, octaves: number): number => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += smoothNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return value / maxValue;
  };
  
  // Ocean color (Deep Black/Charcoal #080808)
  const oceanR = 8, oceanG = 8, oceanB = 8;
  
  // Land color (Dark Slate/Grey #1A1D21)
  const landR = 26, landG = 29, landB = 33;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Normalized coordinates
      const nx = x / width;
      const ny = y / height;
      
      // Generate smooth continental shapes
      const continentNoise = fractalNoise(nx * 8, ny * 6, 6);
      const detailNoise = fractalNoise(nx * 20, ny * 15, 4) * 0.3;
      const combined = continentNoise + detailNoise;
      
      // Latitude-based adjustment (more land near equator patterns)
      const latFactor = Math.sin(ny * Math.PI);
      const threshold = 0.42 + latFactor * 0.08;
      
      // Smooth coastline transition
      const coastBlend = Math.max(0, Math.min(1, (combined - threshold + 0.05) * 10));
      
      if (coastBlend > 0.5) {
        // Land with subtle variation
        const variation = fractalNoise(nx * 50, ny * 40, 3) * 0.15;
        data[i] = Math.floor(landR * (1 + variation));
        data[i + 1] = Math.floor(landG * (1 + variation));
        data[i + 2] = Math.floor(landB * (1 + variation));
      } else {
        // Ocean with subtle depth variation
        const depth = fractalNoise(nx * 30, ny * 25, 2) * 0.3;
        data[i] = Math.floor(oceanR * (1 + depth));
        data[i + 1] = Math.floor(oceanG * (1 + depth));
        data[i + 2] = Math.floor(oceanB * (1 + depth));
      }
      
      data[i + 3] = 255; // Alpha
    }
  }
  
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  
  // Anti-aliasing & filtering
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  
  return texture;
}

// ============================================
// MAIN GLOBE COMPONENT
// ============================================

const KoraGlobe = forwardRef<GlobeRef, GlobeProps>(({ 
  onTerritorySelect, 
  onTerritoryDoubleTap, 
  onGPSClick,
  onEclatTap,
  onMockEclatTap,
  userLocation,
  isUserSovereign = false,
  eclats = [],
  mockEclats = [],
}, ref) => {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);

  // Camera-following light for golden aura glint
  const cameraLightRef = useRef<THREE.PointLight | null>(null);
  
  // Sovereign aura mesh
  const sovereignAuraRef = useRef<THREE.Mesh | null>(null);
  
  // Territory nodes for nebula float animation
  const territoryNodesRef = useRef<THREE.Mesh[]>([]);
  
  // Cultural resonance arcs
  const resonanceArcsRef = useRef<THREE.Line[]>([]);
  
  // Éclats vocaux (terracotta points)
  const eclatMeshesRef = useRef<THREE.Mesh[]>([]);
  const eclatAurasRef = useRef<THREE.Mesh[]>([]);
  
  // UPGRADE 15 — User's own Éclats (orbiting, gold)
  const userEclatSystemsRef = useRef<{
    eclat: Eclat;
    group: THREE.Group;
    core: THREE.Mesh;
    aura: THREE.Mesh;
    trail: THREE.Mesh[];
    birthPhase: 'birth' | 'travel' | 'orbit';
    birthStartTime: number;
    targetPosition: THREE.Vector3;
    orbitAngle: number;
    orbitCenter: THREE.Vector3;
  }[]>([]);
  
  // Mock Éclats (text-based, custom colors)
  const mockEclatMeshesRef = useRef<THREE.Mesh[]>([]);
  const mockEclatAurasRef = useRef<THREE.Mesh[]>([]);
  
  // Ripple effects
  const ripplesRef = useRef<THREE.Mesh[]>([]);
  
  // UPGRADE 8: Night sphere for day/night cycle
  const nightSphereRef = useRef<{ mesh: THREE.Mesh; material: THREE.ShaderMaterial } | null>(null);

  // Spherical rotation state
  const spherical = useRef({
    theta: 0,
    phi: Math.PI / 2,
  });
  
  // Target for smooth camera interpolation
  const targetSpherical = useRef<{ theta: number; phi: number } | null>(null);
  const isAnimatingToTarget = useRef(false);

  // Interaction state
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);
  const lastTap = useRef(0);
  const selectedId = useRef<string | null>(null);

  // Territory dot meshes for raycasting
  const dotMeshes = useRef<THREE.Mesh[]>([]);

  // Clock for animations
  const clockRef = useRef<THREE.Clock | null>(null);

  const [isReady, setIsReady] = useState(false);

  // ============================================
  // EXPOSE focusOnTarget VIA REF
  // ============================================
  
  // Function to add an Éclat to the globe (from another user - terracotta, static)
  const addEclatToGlobe = useCallback((eclat: Eclat) => {
    if (!globeGroupRef.current || !sceneRef.current) return;
    
    const pos = latLngToVector3(eclat.lat, eclat.lng, 1.04);
    const TERRA = 0xA65D47; // Terracotta color
    
    // Create core point (16px equivalent, ~0.02 in 3D)
    const coreGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const coreMat = new THREE.MeshPhongMaterial({
      color: TERRA,
      emissive: TERRA,
      emissiveIntensity: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.copy(pos);
    coreMesh.userData = { eclat, isEclat: true };
    globeGroupRef.current.add(coreMesh);
    eclatMeshesRef.current.push(coreMesh);
    
    // Create pulsing aura (glow effect)
    const auraGeo = new THREE.RingGeometry(0.025, 0.05, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: TERRA,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.copy(pos);
    auraMesh.lookAt(0, 0, 0);
    auraMesh.userData = { 
      isEclatAura: true, 
      startTime: clockRef.current?.getElapsedTime() || 0,
      eclatId: eclat.id,
    };
    globeGroupRef.current.add(auraMesh);
    eclatAurasRef.current.push(auraMesh);
    
    console.log('Éclat ajouté au globe:', eclat.id);
  }, []);
  
  // ============================================
  // UPGRADE 15 — ADD USER'S OWN ECLAT WITH BIRTH ANIMATION
  // The emotional heart of KORA - seeing your Éclat born and orbit
  // ============================================
  
  const addUserEclatToGlobe = useCallback((eclat: Eclat) => {
    if (!globeGroupRef.current || !sceneRef.current || !clockRef.current) return;
    
    const GOLD = 0xFFD700;
    const targetPos = latLngToVector3(eclat.lat, eclat.lng, 1.04);
    const currentTime = clockRef.current.getElapsedTime();
    
    // Haptic feedback for birth
    haptic.success();
    
    // Create group for the entire éclat system
    const eclatGroup = new THREE.Group();
    eclatGroup.position.set(0, 0, 0); // Start at center of globe
    
    // ─────────────────────────────────────────────────
    // CORE PARTICLE (Gold, brighter than others)
    // ─────────────────────────────────────────────────
    
    const coreGeo = new THREE.SphereGeometry(0.025, 24, 24);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: GOLD,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0, // Starts invisible for birth animation
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.scale.set(0.01, 0.01, 0.01); // Start tiny
    coreMesh.userData = { eclat, isUserEclat: true };
    eclatGroup.add(coreMesh);
    
    // ─────────────────────────────────────────────────
    // GOLDEN AURA (More prominent than others)
    // ─────────────────────────────────────────────────
    
    const auraGeo = new THREE.RingGeometry(0.03, 0.065, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.lookAt(new THREE.Vector3(0, 0, 1)); // Will be updated during orbit
    auraMesh.userData = { isUserEclatAura: true };
    eclatGroup.add(auraMesh);
    
    // ─────────────────────────────────────────────────
    // TRAIL PARTICLES (Golden trail during travel)
    // ─────────────────────────────────────────────────
    
    const trailParticles: THREE.Mesh[] = [];
    const TRAIL_COUNT = 12;
    
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const trailGeo = new THREE.SphereGeometry(0.008 * (1 - i / TRAIL_COUNT), 8, 8);
      const trailMat = new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0,
      });
      const trailMesh = new THREE.Mesh(trailGeo, trailMat);
      trailMesh.userData = { trailIndex: i };
      eclatGroup.add(trailMesh);
      trailParticles.push(trailMesh);
    }
    
    globeGroupRef.current.add(eclatGroup);
    
    // Store the system for animation
    userEclatSystemsRef.current.push({
      eclat,
      group: eclatGroup,
      core: coreMesh,
      aura: auraMesh,
      trail: trailParticles,
      birthPhase: 'birth',
      birthStartTime: currentTime,
      targetPosition: targetPos.clone(),
      orbitAngle: 0,
      orbitCenter: targetPos.clone(),
    });
    
    console.log('🌟 User Éclat birth started:', eclat.id, 'at', eclat.lat, eclat.lng);
  }, []);
  
  // Function to add a Mock Éclat to the globe (with custom color and fade-in)
  const addMockEclatToGlobe = useCallback((mockEclat: MockEclat, delay: number = 0) => {
    setTimeout(() => {
      if (!globeGroupRef.current || !sceneRef.current) return;
      
      const pos = latLngToVector3(mockEclat.lat, mockEclat.lng, 1.04);
      const colorHex = parseInt(mockEclat.color.replace('#', ''), 16);
      
      // Create core point
      const coreGeo = new THREE.SphereGeometry(0.018, 16, 16);
      const coreMat = new THREE.MeshPhongMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0, // Start invisible for fade-in
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.copy(pos);
      coreMesh.userData = { mockEclat, isMockEclat: true, fadeIn: true, fadeStart: clockRef.current?.getElapsedTime() || 0 };
      globeGroupRef.current.add(coreMesh);
      mockEclatMeshesRef.current.push(coreMesh);
      
      // Create pulsing aura
      const auraGeo = new THREE.RingGeometry(0.022, 0.045, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0, // Start invisible
        side: THREE.DoubleSide,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.copy(pos);
      auraMesh.lookAt(0, 0, 0);
      auraMesh.userData = { 
        isMockEclatAura: true, 
        startTime: clockRef.current?.getElapsedTime() || 0,
        mockEclatId: mockEclat.id,
        fadeIn: true,
        fadeStart: clockRef.current?.getElapsedTime() || 0,
      };
      globeGroupRef.current.add(auraMesh);
      mockEclatAurasRef.current.push(auraMesh);
      
      console.log('Mock Éclat ajouté au globe:', mockEclat.id, mockEclat.territoire);
    }, delay);
  }, []);
  
  useImperativeHandle(ref, () => ({
    focusOnTarget: (lat: number, lng: number) => {
      const target = latLngToSpherical(lat, lng);
      targetSpherical.current = {
        theta: target.theta + Math.PI,
        phi: target.phi,
      };
      isAnimatingToTarget.current = true;
      autoRotate.current = false;
    },
    addEclat: addUserEclatToGlobe, // UPGRADE 15: Use user eclat with birth animation
    addMockEclat: addMockEclatToGlobe,
  }));

  // Create ripple effect
  const createRipple = useCallback((point: THREE.Vector3, scene: THREE.Scene) => {
    const rippleGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: PALETTE.gold,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    
    const surfacePoint = point.clone().normalize().multiplyScalar(1.025);
    ripple.position.copy(surfacePoint);
    ripple.lookAt(0, 0, 0);
    ripple.userData = { startTime: clockRef.current?.getElapsedTime() || 0 };
    
    scene.add(ripple);
    ripplesRef.current.push(ripple);
  }, []);

  // ============================================
  // GL CONTEXT CREATION
  // ============================================
  
  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;
    clockRef.current = new THREE.Clock();

    // Create renderer with anti-aliasing
    const renderer = new THREE.WebGLRenderer({
      // @ts-ignore
      context: gl,
      canvas: {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientWidth: gl.drawingBufferWidth,
        clientHeight: gl.drawingBufferHeight,
      } as any,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(Math.min(2, 1)); // Limit for performance
    renderer.setClearColor(0x0D0D0D, 1);
    rendererRef.current = renderer;

    // Create scene with fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.08);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 3.5);
    cameraRef.current = camera;

    // ============================================
    // LIGHTING - Including camera-following light
    // ============================================
    
    // Subtle ambient for base visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light (subtle, not golden)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4A7FA5, 0.3);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);

    // Camera-following PointLight for Golden Aura glint
    const cameraLight = new THREE.PointLight(PALETTE.gold, 0.8, 8);
    cameraLight.position.copy(camera.position);
    scene.add(cameraLight);
    cameraLightRef.current = cameraLight;

    // Create globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // ============================================
    // EARTH SPHERE (High-Res 2048x1024)
    // ============================================
    
    const sphereGeo = new THREE.SphereGeometry(1, 128, 64);
    
    // Create high-resolution procedural earth texture
    const earthTexture = createHighResEarthTexture();
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 5,
      specular: 0x111111,
    });
    
    const earthMesh = new THREE.Mesh(sphereGeo, earthMaterial);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // ============================================
    // ATMOSPHERE GLOW (Blue, not golden)
    // ============================================
    
    const atmosGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(PALETTE.atmosphere) } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, intensity * 0.25);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // ============================================
    // UPGRADE 8 — OMBRE ATMOSPHÉRIQUE VISIBLE
    // Hémisphère de nuit réaliste avec crépuscule
    // ============================================
    
    // Get current sun position
    const sunPos = getSunPosition();
    const sunRotationY = -sunPos.longitude * (Math.PI / 180); // Convert to radians
    
    // Create night shadow sphere (slightly larger than Earth)
    const nightSphereGeo = new THREE.SphereGeometry(1.002, 64, 64);
    
    const nightShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { 
          value: new THREE.Vector3(
            Math.cos(sunRotationY), 
            Math.sin(sunPos.latitude * Math.PI / 180) * 0.2,
            Math.sin(sunRotationY)
          ).normalize() 
        },
        nightColor: { value: new THREE.Color(0x000008) }, // Deep night blue-black
        twilightColor: { value: new THREE.Color(0xA65D47) }, // Terracotta twilight
        nightIntensity: { value: 0.75 }, // Night darkness (0.75 = 75% opacity)
        twilightWidth: { value: 0.15 }, // Width of twilight band
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec3 sunDirection;
        uniform vec3 nightColor;
        uniform vec3 twilightColor;
        uniform float nightIntensity;
        uniform float twilightWidth;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
          // Calculate how much this point faces the sun
          vec3 worldNormal = normalize(vWorldPosition);
          float sunDot = dot(worldNormal, sunDirection);
          
          // sunDot: 1 = facing sun (day), -1 = away from sun (night)
          // We want shadow on the night side
          
          // Night intensity: 0 on day side, increases on night side
          float nightFactor = smoothstep(twilightWidth, -twilightWidth, sunDot);
          
          // Twilight glow: peaks at the terminator (sunDot ≈ 0)
          float twilightFactor = exp(-pow(sunDot / twilightWidth, 2.0) * 2.0) * 0.3;
          
          // Mix colors
          vec3 shadowColor = mix(vec3(0.0), nightColor, nightFactor);
          shadowColor += twilightColor * twilightFactor;
          
          // Final alpha: night gets dark, twilight gets warm glow
          float alpha = nightFactor * nightIntensity + twilightFactor;
          
          gl_FragColor = vec4(shadowColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    
    const nightSphere = new THREE.Mesh(nightSphereGeo, nightShaderMat);
    nightSphere.userData = { isNightSphere: true };
    globeGroup.add(nightSphere);
    
    // Store reference for animation updates
    nightSphereRef.current = { mesh: nightSphere, material: nightShaderMat };

    // ============================================
    // SUBTLE GRID LINES
    // ============================================
    
    const addGridLine = (points: THREE.Vector3[], opacity: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ 
        color: PALETTE.grid, 
        transparent: true, 
        opacity 
      });
      globeGroup.add(new THREE.Line(geo, mat));
    };

    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      const phi = (90 - lat) * Math.PI / 180;
      for (let i = 0; i <= 64; i++) {
        const theta = i / 64 * Math.PI * 2;
        pts.push(new THREE.Vector3(
          -1.003 * Math.sin(phi) * Math.cos(theta),
          1.003 * Math.cos(phi),
          1.003 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      addGridLine(pts, 0.08);
    }

    for (let lng = 0; lng < 360; lng += 30) {
      const pts: THREE.Vector3[] = [];
      const theta = (lng + 180) * Math.PI / 180;
      for (let i = 0; i <= 64; i++) {
        const phi = i / 64 * Math.PI;
        pts.push(new THREE.Vector3(
          -1.003 * Math.sin(phi) * Math.cos(theta),
          1.003 * Math.cos(phi),
          1.003 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      addGridLine(pts, 0.06);
    }

    // ============================================
    // UPGRADE 10 — VIBRANT LIGHT PARTICLES
    // Replace simple dots with particle clusters
    // ============================================
    
    // Mock activity data (Éclats in last 24h)
    const ACTIVITY_DATA: Record<string, number> = {
      'fort-de-france': 12, // Max intensity
      'lagos': 8,           // High intensity
      'paris': 5,           // Medium intensity
      'london': 4,          // Medium intensity
      'dakar': 6,           // Medium-high
      'kinshasa': 3,        // Low-medium
      'atlanta': 2,         // Low
      'toronto': 2,         // Low
      'montreal': 1,        // Very low
    };
    
    // Get activity level for territory
    const getActivityLevel = (id: string): { count: number; level: 'max' | 'high' | 'medium' | 'low' | 'inactive' } => {
      const count = ACTIVITY_DATA[id] || 0;
      if (count >= 10) return { count, level: 'max' };
      if (count >= 6) return { count, level: 'high' };
      if (count >= 3) return { count, level: 'medium' };
      if (count >= 1) return { count, level: 'low' };
      return { count, level: 'inactive' };
    };
    
    // Particle configuration per activity level
    const PARTICLE_CONFIG = {
      max: { particleCount: 7, centralRadius: 0.045, satelliteRadius: 0.012, vibrationSpeed: 2, vibrationAmount: 0.15, glowRadius: 0.08 },
      high: { particleCount: 5, centralRadius: 0.035, satelliteRadius: 0.010, vibrationSpeed: 1.8, vibrationAmount: 0.12, glowRadius: 0.06 },
      medium: { particleCount: 3, centralRadius: 0.025, satelliteRadius: 0.008, vibrationSpeed: 1.2, vibrationAmount: 0.08, glowRadius: 0.04 },
      low: { particleCount: 2, centralRadius: 0.018, satelliteRadius: 0.006, vibrationSpeed: 0.8, vibrationAmount: 0.05, glowRadius: 0.02 },
      inactive: { particleCount: 1, centralRadius: 0.012, satelliteRadius: 0, vibrationSpeed: 0, vibrationAmount: 0, glowRadius: 0 },
    };
    
    dotMeshes.current = [];
    territoryNodesRef.current = [];
    const particleSystemsRef: THREE.Group[] = [];
    
    TERRITORIES.forEach((t, index) => {
      const basePos = latLngToVector3(t.lat, t.lng, 1.02);
      const activity = getActivityLevel(t.id);
      const config = PARTICLE_CONFIG[activity.level];
      
      // Check if territory is in nighttime
      const inNight = isPointInNight(t.lng);
      const nightDimFactor = inNight ? 0.4 : 1.0;
      
      // Create particle system group
      const particleGroup = new THREE.Group();
      particleGroup.position.copy(basePos);
      particleGroup.userData = {
        ...t,
        basePosition: basePos.clone(),
        floatPhase: index * 0.5,
        floatAmplitude: 0.008 + Math.random() * 0.005,
        isNightTime: inNight,
        territoryLng: t.lng,
        activityLevel: activity.level,
        particleConfig: config,
        particles: [] as THREE.Mesh[],
      };
      
      // Determine color based on territory and state
      let particleColor = new THREE.Color(t.color);
      if (activity.level === 'inactive') {
        particleColor = new THREE.Color(0x2a2a3a); // Cold color for inactive
      } else if (inNight) {
        particleColor = particleColor.multiplyScalar(0.6); // Dim at night
      }
      
      // ─────────────────────────────────────────────────
      // CENTRAL PARTICLE (main node)
      // ─────────────────────────────────────────────────
      
      const centralGeo = new THREE.SphereGeometry(config.centralRadius, 16, 16);
      const centralMat = new THREE.MeshPhongMaterial({
        color: inNight ? 0x444444 : 0xffffff,
        emissive: particleColor,
        emissiveIntensity: (activity.level === 'inactive' ? 0.1 : 0.5) * nightDimFactor,
        transparent: true,
        opacity: activity.level === 'inactive' ? 0.2 : (inNight ? 0.7 : 1.0),
      });
      const centralParticle = new THREE.Mesh(centralGeo, centralMat);
      centralParticle.userData = {
        isCentral: true,
        baseScale: 1,
        vibrationPhase: Math.random() * Math.PI * 2,
        scintillationPhase: Math.random() * Math.PI * 2,
      };
      particleGroup.add(centralParticle);
      particleGroup.userData.particles.push(centralParticle);
      
      // ─────────────────────────────────────────────────
      // SATELLITE PARTICLES (orbiting)
      // ─────────────────────────────────────────────────
      
      const satelliteCount = config.particleCount - 1;
      for (let i = 0; i < satelliteCount; i++) {
        const angle = (i / satelliteCount) * Math.PI * 2;
        const orbitRadius = config.centralRadius * 2.5 + Math.random() * config.centralRadius;
        
        const satGeo = new THREE.SphereGeometry(config.satelliteRadius, 8, 8);
        const satMat = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: particleColor,
          emissiveIntensity: 0.4 * nightDimFactor,
          transparent: true,
          opacity: inNight ? 0.5 : 0.8,
        });
        const satellite = new THREE.Mesh(satGeo, satMat);
        
        // Position in orbit around central
        satellite.position.set(
          Math.cos(angle) * orbitRadius,
          (Math.random() - 0.5) * orbitRadius * 0.5,
          Math.sin(angle) * orbitRadius
        );
        
        satellite.userData = {
          isSatellite: true,
          orbitAngle: angle,
          orbitRadius: orbitRadius,
          orbitSpeed: 0.3 + Math.random() * 0.4, // Variable orbit speed
          verticalOffset: (Math.random() - 0.5) * 0.02,
          scintillationPhase: Math.random() * Math.PI * 2,
        };
        
        particleGroup.add(satellite);
        particleGroup.userData.particles.push(satellite);
      }
      
      // ─────────────────────────────────────────────────
      // EXTERNAL GLOW AURA
      // ─────────────────────────────────────────────────
      
      if (config.glowRadius > 0 && activity.level !== 'inactive') {
        const glowGeo = new THREE.SphereGeometry(config.glowRadius, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: particleColor,
          transparent: true,
          opacity: 0.15 * nightDimFactor,
          side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.userData = { isGlow: true };
        particleGroup.add(glow);
      }
      
      // Make the particle group look outward (normal to sphere surface)
      particleGroup.lookAt(0, 0, 0);
      
      globeGroup.add(particleGroup);
      dotMeshes.current.push(centralParticle); // For raycasting
      territoryNodesRef.current.push(particleGroup);
      particleSystemsRef.push(particleGroup);
    });
    
    // Store particle systems for animation
    (globeGroup as any).particleSystems = particleSystemsRef;

    // ============================================
    // SOVEREIGN GOLDEN AURA (Only if sovereign)
    // ============================================
    
    if (userLocation && isUserSovereign) {
      const userPos = latLngToVector3(userLocation.lat, userLocation.lng, 1.035);
      
      // Golden aura shader - the ONLY golden element
      const auraMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(PALETTE.gold) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform float time;
          uniform vec3 color;
          varying vec2 vUv;
          void main() {
            float dist = length(vUv - vec2(0.5));
            float ring = smoothstep(0.4, 0.35, dist) * smoothstep(0.2, 0.3, dist);
            float glow = smoothstep(0.5, 0.1, dist) * 0.5;
            float alpha = (ring + glow) * (0.7 + 0.3 * sin(time * 1.8)); // Breathing
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const auraGeo = new THREE.PlaneGeometry(0.18, 0.18);
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.copy(userPos);
      auraMesh.lookAt(0, 0, 0);
      auraMesh.userData = { isSovereignAura: true };
      globeGroup.add(auraMesh);
      sovereignAuraRef.current = auraMesh;
    }

    // ============================================
    // CULTURAL RESONANCE ARCS (Golden)
    // ============================================
    
    const culturalArcs = [
      { from: 'ftf', to: 'par' },
      { from: 'ftf', to: 'lag' },
      { from: 'ftf', to: 'lon' },
      { from: 'ftf', to: 'dak' },
      { from: 'par', to: 'lag' },
      { from: 'nyc', to: 'lon' },
      { from: 'dak', to: 'abi' },
    ];

    resonanceArcsRef.current = [];

    culturalArcs.forEach((a, index) => {
      const from = TERRITORIES.find((t) => t.id === a.from);
      const to = TERRITORIES.find((t) => t.id === a.to);
      if (!from || !to) return;

      const start = latLngToVector3(from.lat, from.lng, 1.02);
      const end = latLngToVector3(to.lat, to.lng, 1.02);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(1.02 + dist * 0.5);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(80);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      
      // Golden arcs with animated dashes
      const mat = new THREE.LineDashedMaterial({
        color: PALETTE.gold,
        transparent: true,
        opacity: 0.5,
        dashSize: 0.025,
        gapSize: 0.015,
      });
      
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      line.userData = { arcIndex: index, dashOffset: 0 };
      globeGroup.add(line);
      resonanceArcsRef.current.push(line);
    });

    setIsReady(true);

    // ============================================
    // ANIMATION LOOP
    // ============================================
    
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const t = clockRef.current?.getElapsedTime() || 0;

      // Update camera-following light position
      if (cameraLightRef.current && cameraRef.current) {
        cameraLightRef.current.position.copy(cameraRef.current.position);
      }

      if (globeGroupRef.current) {
        // Camera interpolation (Slerp)
        if (isAnimatingToTarget.current && targetSpherical.current) {
          const lerpFactor = 0.04;
          
          let dTheta = targetSpherical.current.theta - spherical.current.theta;
          while (dTheta > Math.PI) dTheta -= Math.PI * 2;
          while (dTheta < -Math.PI) dTheta += Math.PI * 2;
          spherical.current.theta += dTheta * lerpFactor;
          spherical.current.phi += (targetSpherical.current.phi - spherical.current.phi) * lerpFactor;
          
          if (Math.abs(dTheta) < 0.01 && Math.abs(targetSpherical.current.phi - spherical.current.phi) < 0.01) {
            isAnimatingToTarget.current = false;
            setTimeout(() => { autoRotate.current = true; }, 3000);
          }
        } else {
          // Auto rotate
          if (autoRotate.current && !isDragging.current) {
            spherical.current.theta += 0.002;
          }

          // Apply inertia (0.95 damping)
          if (!isDragging.current) {
            velocity.current.x *= 0.95;
            velocity.current.y *= 0.95;
            spherical.current.theta += velocity.current.x;
            spherical.current.phi += velocity.current.y;
          }
        }

        // Normalize phi
        while (spherical.current.phi < 0) spherical.current.phi += Math.PI * 2;
        while (spherical.current.phi > Math.PI * 2) spherical.current.phi -= Math.PI * 2;

        // Apply rotation
        const quaternion = new THREE.Quaternion();
        const euler = new THREE.Euler(
          spherical.current.phi - Math.PI / 2,
          spherical.current.theta,
          0,
          'YXZ'
        );
        quaternion.setFromEuler(euler);
        globeGroupRef.current.quaternion.copy(quaternion);

        // ============================================
        // UPGRADE 10: VIBRANT PARTICLE ANIMATION
        // Vibration, scintillation, and satellite orbits
        // ============================================
        
        territoryNodesRef.current.forEach((node) => {
          const data = node.userData;
          if (data.basePosition && data.floatPhase !== undefined) {
            // Slow sine wave on Y-axis for organic float
            const floatOffset = Math.sin(t * 0.5 + data.floatPhase) * data.floatAmplitude;
            
            // Apply float in the direction away from center (radial)
            const direction = data.basePosition.clone().normalize();
            const newPos = data.basePosition.clone().add(direction.multiplyScalar(floatOffset));
            node.position.copy(newPos);
            
            // ────────────────────────────────────────────
            // PARTICLE SYSTEM ANIMATION
            // ────────────────────────────────────────────
            
            if (data.particleConfig && data.particles) {
              const config = data.particleConfig;
              const particles = data.particles as THREE.Mesh[];
              
              particles.forEach((particle) => {
                const pData = particle.userData;
                
                // ─── CENTRAL PARTICLE: Vibration + Scintillation ───
                if (pData.isCentral && config.vibrationSpeed > 0) {
                  // Vibration: scale sin(t * speed + phase) * amount + 1
                  const vibration = Math.sin(t * config.vibrationSpeed + pData.vibrationPhase) * config.vibrationAmount + 1;
                  
                  // Apply magnetic scale if present
                  const baseScale = data.magneticScale || 1;
                  particle.scale.set(vibration * baseScale, vibration * baseScale, vibration * baseScale);
                  
                  // Scintillation: opacity sin(t * 3) * 0.3 + 0.7
                  const scintillation = Math.sin(t * 3 + pData.scintillationPhase) * 0.3 + 0.7;
                  const mat = particle.material as THREE.MeshPhongMaterial;
                  mat.opacity = scintillation * (data.isNightTime ? 0.7 : 1.0);
                  
                  // Pulsing emissive intensity
                  const emissivePulse = Math.sin(t * 2 + pData.vibrationPhase) * 0.2 + 0.5;
                  mat.emissiveIntensity = emissivePulse * (data.isNightTime ? 0.4 : 1.0);
                }
                
                // ─── SATELLITE PARTICLES: Orbiting + Scintillation ───
                if (pData.isSatellite && pData.orbitRadius) {
                  // Orbit animation
                  const newAngle = pData.orbitAngle + t * pData.orbitSpeed;
                  const verticalWobble = Math.sin(t * 2 + pData.scintillationPhase) * 0.005;
                  
                  particle.position.set(
                    Math.cos(newAngle) * pData.orbitRadius,
                    pData.verticalOffset + verticalWobble,
                    Math.sin(newAngle) * pData.orbitRadius
                  );
                  
                  // Scintillation for satellites
                  const satScint = Math.sin(t * 4 + pData.scintillationPhase) * 0.4 + 0.6;
                  const satMat = particle.material as THREE.MeshPhongMaterial;
                  satMat.opacity = satScint * (data.isNightTime ? 0.5 : 0.8);
                }
              });
              
              // ─── GLOW AURA: Breathing ───
              node.children.forEach((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh && child.userData.isGlow) {
                  const glowBreath = Math.sin(t * 1.5 + data.floatPhase) * 0.05 + 0.15;
                  (child.material as THREE.MeshBasicMaterial).opacity = glowBreath * (data.isNightTime ? 0.5 : 1.0);
                  
                  // Subtle scale breathing
                  const glowScale = 1 + Math.sin(t * 1.2 + data.floatPhase) * 0.1;
                  child.scale.set(glowScale, glowScale, glowScale);
                }
              });
            }
            
            // ============================================
            // UPGRADE 9: Animate magnetic scale
            // Smooth transition to/from magnetic glow state
            // ============================================
            
            if (data.magneticScale !== undefined) {
              const targetScale = data.magneticScale;
              const currentScale = node.scale.x;
              const newScale = currentScale + (targetScale - currentScale) * 0.15; // Smooth lerp
              node.scale.set(newScale, newScale, newScale);
            }
          }
        });

        // Animate pulse rings
        globeGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.isRing) {
            const phase = child.userData.phase;
            const s = 1 + 0.4 * ((Math.sin(t * 2 + phase) + 1) / 2);
            child.scale.set(s, s, s);
            (child.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - ((s - 1) / 0.4));
          }
        });

        // Animate sovereign aura (breathing)
        if (sovereignAuraRef.current) {
          const auraMat = sovereignAuraRef.current.material as THREE.ShaderMaterial;
          auraMat.uniforms.time.value = t;
          
          // Breathing scale animation (1.0 to 1.2)
          const breathScale = 1.0 + 0.2 * ((Math.sin(t * 1.5) + 1) / 2);
          sovereignAuraRef.current.scale.set(breathScale, breathScale, breathScale);
        }
        
        // ============================================
        // UPGRADE 8: Update night sphere sun position
        // Updates every frame for real-time day/night cycle
        // ============================================
        
        if (nightSphereRef.current) {
          const currentSunPos = getSunPosition();
          const sunRotY = -currentSunPos.longitude * (Math.PI / 180);
          const sunDir = new THREE.Vector3(
            Math.cos(sunRotY), 
            Math.sin(currentSunPos.latitude * Math.PI / 180) * 0.2,
            Math.sin(sunRotY)
          ).normalize();
          
          nightSphereRef.current.material.uniforms.sunDirection.value.copy(sunDir);
        }

        // Animate cultural resonance arcs (moving light)
        resonanceArcsRef.current.forEach((arc, index) => {
          const mat = arc.material as THREE.LineDashedMaterial;
          const speed = 0.015 + (index * 0.003);
          arc.userData.dashOffset -= speed;
          mat.dashOffset = arc.userData.dashOffset;
        });

        // ============================================
        // ANIMATE ÉCLATS AURAS (Pulse: scale 1→1.8, opacity 1→0)
        // ============================================
        
        eclatAurasRef.current.forEach((aura) => {
          const startTime = aura.userData.startTime || 0;
          const elapsed = (t - startTime) % 2; // 2 second cycle
          const progress = elapsed / 2;
          
          // Scale from 1 to 1.8
          const scale = 1 + progress * 0.8;
          aura.scale.set(scale, scale, scale);
          
          // Opacity from 0.8 to 0
          (aura.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - progress);
        });
        
        // ============================================
        // UPGRADE 15: ANIMATE USER ÉCLATS (Birth → Travel → Orbit)
        // The emotional heart of KORA
        // ============================================
        
        const BIRTH_DURATION = 0.3; // 300ms
        const TRAVEL_DURATION = 0.5; // 500ms (300-800ms total)
        const ORBIT_RADIUS = 0.025; // ~20px equivalent
        const ORBIT_PERIOD = 8; // 8 seconds per orbit
        
        userEclatSystemsRef.current.forEach((system) => {
          const elapsed = t - system.birthStartTime;
          const coreMat = system.core.material as THREE.MeshPhongMaterial;
          const auraMat = system.aura.material as THREE.MeshBasicMaterial;
          
          // ─────────────────────────────────────────────────
          // PHASE 1: BIRTH (0-300ms)
          // Point lumineux naît au centre, scale 0→1, opacity 0→1
          // ─────────────────────────────────────────────────
          
          if (system.birthPhase === 'birth') {
            const birthProgress = Math.min(1, elapsed / BIRTH_DURATION);
            
            // Ease out cubic for smooth appearance
            const eased = 1 - Math.pow(1 - birthProgress, 3);
            
            // Scale from 0.01 to 1
            const scale = 0.01 + eased * 0.99;
            system.core.scale.set(scale, scale, scale);
            
            // Opacity from 0 to 1
            coreMat.opacity = eased;
            auraMat.opacity = eased * 0.8;
            
            // Emissive intensity pulses during birth
            coreMat.emissiveIntensity = 0.5 + eased * 1.5;
            
            // Transition to travel phase
            if (birthProgress >= 1) {
              system.birthPhase = 'travel';
              console.log('🚀 User Éclat starting travel:', system.eclat.id);
            }
          }
          
          // ─────────────────────────────────────────────────
          // PHASE 2: TRAVEL (300-800ms)
          // Spring animation toward target with golden trail
          // ─────────────────────────────────────────────────
          
          else if (system.birthPhase === 'travel') {
            const travelElapsed = elapsed - BIRTH_DURATION;
            const travelProgress = Math.min(1, travelElapsed / TRAVEL_DURATION);
            
            // Spring easing (tension: 40, friction: 8)
            // Approximation: overshoot then settle
            const springFactor = 1 - Math.exp(-5 * travelProgress) * Math.cos(2 * Math.PI * travelProgress * 0.5);
            const eased = Math.min(1, springFactor);
            
            // Lerp position from center (0,0,0) to target
            const newPos = new THREE.Vector3().lerpVectors(
              new THREE.Vector3(0, 0, 0),
              system.targetPosition,
              eased
            );
            system.group.position.copy(newPos);
            
            // Update trail particles (golden trail fading behind)
            system.trail.forEach((trailMesh, i) => {
              const trailProgress = Math.max(0, travelProgress - (i * 0.05));
              const trailPos = new THREE.Vector3().lerpVectors(
                new THREE.Vector3(0, 0, 0),
                system.targetPosition,
                Math.min(1, trailProgress)
              );
              trailMesh.position.copy(trailPos.sub(system.group.position));
              
              // Fade trail opacity
              const trailMat = trailMesh.material as THREE.MeshBasicMaterial;
              trailMat.opacity = Math.max(0, (1 - travelProgress) * (1 - i / system.trail.length) * 0.8);
            });
            
            // Pulsing during travel
            const pulse = 1 + Math.sin(elapsed * 15) * 0.1;
            system.core.scale.set(pulse, pulse, pulse);
            
            // Emissive intensity high during travel
            coreMat.emissiveIntensity = 1.5 + Math.sin(elapsed * 10) * 0.5;
            
            // Transition to orbit phase
            if (travelProgress >= 1) {
              system.birthPhase = 'orbit';
              system.orbitAngle = 0;
              // Hide trail particles
              system.trail.forEach((trailMesh) => {
                const trailMat = trailMesh.material as THREE.MeshBasicMaterial;
                trailMat.opacity = 0;
              });
              console.log('🌍 User Éclat now orbiting:', system.eclat.id);
            }
          }
          
          // ─────────────────────────────────────────────────
          // PHASE 3: ORBIT (800ms+)
          // Éclat orbits around its territory, pulsing alive
          // ─────────────────────────────────────────────────
          
          else if (system.birthPhase === 'orbit') {
            // Calculate orbit position
            const orbitTime = elapsed - BIRTH_DURATION - TRAVEL_DURATION;
            system.orbitAngle = (orbitTime / ORBIT_PERIOD) * Math.PI * 2;
            
            // Get orbit plane perpendicular to the radius vector
            const centerDir = system.orbitCenter.clone().normalize();
            
            // Create perpendicular vectors for orbit plane
            const up = new THREE.Vector3(0, 1, 0);
            const perpX = new THREE.Vector3().crossVectors(centerDir, up).normalize();
            if (perpX.length() < 0.1) {
              perpX.set(1, 0, 0);
            }
            const perpY = new THREE.Vector3().crossVectors(centerDir, perpX).normalize();
            
            // Calculate orbit offset
            const orbitOffset = new THREE.Vector3()
              .addScaledVector(perpX, Math.cos(system.orbitAngle) * ORBIT_RADIUS)
              .addScaledVector(perpY, Math.sin(system.orbitAngle) * ORBIT_RADIUS);
            
            // Update group position (orbit center + offset)
            system.group.position.copy(system.orbitCenter.clone().add(orbitOffset));
            
            // Update aura to face camera (lookAt center)
            system.aura.lookAt(0, 0, 0);
            
            // Pulsing animation (alive feel)
            const pulse = 1 + Math.sin(t * 3) * 0.15;
            system.core.scale.set(pulse, pulse, pulse);
            
            // Breathing emissive
            const breath = 0.8 + Math.sin(t * 2) * 0.4;
            coreMat.emissiveIntensity = breath;
            
            // Aura pulse (2 second cycle, slightly out of phase)
            const auraCycle = ((t * 0.5) % 1);
            const auraScale = 1 + auraCycle * 0.8;
            system.aura.scale.set(auraScale, auraScale, auraScale);
            auraMat.opacity = 0.8 * (1 - auraCycle);
          }
        });
      }

      // Animate ripples
      const ripplesToRemove: THREE.Mesh[] = [];
      ripplesRef.current.forEach((ripple) => {
        const elapsed = t - ripple.userData.startTime;
        const duration = 1.0;
        const progress = elapsed / duration;

        if (progress < 1) {
          const scale = 1 + progress * 8;
          ripple.scale.set(scale, scale, scale);
          (ripple.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        } else {
          ripplesToRemove.push(ripple);
        }
      });

      ripplesToRemove.forEach((ripple) => {
        sceneRef.current?.remove(ripple);
        ripple.geometry.dispose();
        (ripple.material as THREE.Material).dispose();
        const idx = ripplesRef.current.indexOf(ripple);
        if (idx > -1) ripplesRef.current.splice(idx, 1);
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [createRipple, userLocation, isUserSovereign]);

  // ============================================
  // UPGRADE 9 — MAGNETIC ATTRACTION STATE
  // ============================================
  
  const magneticTargetRef = useRef<Territory | null>(null);
  const magneticStrengthRef = useRef(0);
  const lastMagneticCheckRef = useRef(0);

  // ============================================
  // TOUCH HANDLERS
  // ============================================

  const handleTouchStart = useCallback((e: any) => {
    isDragging.current = true;
    autoRotate.current = false;
    isAnimatingToTarget.current = false;
    magneticTargetRef.current = null;
    magneticStrengthRef.current = 0;
    const touch = e.nativeEvent.touches[0];
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDragging.current || !globeGroupRef.current || !cameraRef.current || !glRef.current) return;
    const touch = e.nativeEvent.touches[0];
    
    const dx = touch.pageX - prevPointer.current.x;
    const dy = touch.pageY - prevPointer.current.y;
    
    const sensitivity = 0.008;
    
    velocity.current.x = dx * sensitivity;
    velocity.current.y = dy * sensitivity;
    
    spherical.current.theta += velocity.current.x;
    spherical.current.phi += velocity.current.y;
    
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
    
    // ============================================
    // UPGRADE 9: MAGNETIC ATTRACTION CHECK
    // Check every 100ms for performance
    // ============================================
    
    const now = Date.now();
    if (now - lastMagneticCheckRef.current < 100) return;
    lastMagneticCheckRef.current = now;
    
    const gl = glRef.current;
    const touchX = touch.pageX;
    const touchY = touch.pageY;
    
    // Find the closest territory to the current touch position
    let closestTerritory: Territory | null = null;
    let closestDistance = Infinity;
    const ATTRACTION_ZONE = 60; // pixels - zone d'attraction
    
    // Get camera matrices for projection
    const camera = cameraRef.current;
    const globeGroup = globeGroupRef.current;
    
    TERRITORIES.forEach((territory) => {
      // Get territory position in world space
      const pos = latLngToVector3(territory.lat, territory.lng, 1.02);
      const worldPos = pos.clone().applyMatrix4(globeGroup.matrixWorld);
      
      // Project to screen coordinates
      const projected = worldPos.clone().project(camera);
      const screenX = ((projected.x + 1) / 2) * gl.drawingBufferWidth;
      const screenY = ((1 - projected.y) / 2) * gl.drawingBufferHeight;
      
      // Check if territory is facing the camera (not on the back side)
      if (projected.z > 1) return; // Behind camera
      
      // Calculate distance to touch
      const distance = Math.sqrt(
        Math.pow(screenX - touchX, 2) + 
        Math.pow(screenY - touchY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTerritory = territory;
      }
    });
    
    // Apply magnetic attraction if within zone
    if (closestTerritory && closestDistance < ATTRACTION_ZONE) {
      const previousTarget = magneticTargetRef.current;
      magneticTargetRef.current = closestTerritory;
      
      // Calculate magnetic strength (stronger when closer)
      // 1.0 at center, 0.0 at edge of attraction zone
      const strength = 1 - (closestDistance / ATTRACTION_ZONE);
      magneticStrengthRef.current = strength;
      
      // Highlight the territory being attracted to
      if (previousTarget?.id !== closestTerritory.id) {
        // Haptic feedback when entering a new territory's magnetic field
        haptic.light();
        
        // Illuminate the attracted territory
        territoryNodesRef.current.forEach((node) => {
          const t = node.userData as Territory;
          if (t.id === closestTerritory!.id) {
            // Scale up and brighten
            node.userData.magneticScale = 1.3;
            node.userData.magneticGlow = true;
            const mat = node.material as THREE.MeshPhongMaterial;
            mat.emissiveIntensity = 0.8;
          } else if (node.userData.magneticGlow) {
            // Reset other territories
            node.userData.magneticScale = 1.0;
            node.userData.magneticGlow = false;
            const mat = node.material as THREE.MeshPhongMaterial;
            mat.emissiveIntensity = 0.4;
          }
        });
      }
      
      // Apply subtle attraction force (30°/s max = 0.52 rad/s)
      // At 60fps, max angular velocity per frame = 0.0087 rad
      const MAX_ANGULAR_VELOCITY = 0.0087;
      const attractionForce = strength * MAX_ANGULAR_VELOCITY * 0.5; // Subtle
      
      // Calculate direction to territory
      const targetTheta = (closestTerritory.lng + 180) * (Math.PI / 180);
      const targetPhi = (90 - closestTerritory.lat) * (Math.PI / 180);
      
      let dTheta = targetTheta - spherical.current.theta;
      while (dTheta > Math.PI) dTheta -= Math.PI * 2;
      while (dTheta < -Math.PI) dTheta += Math.PI * 2;
      
      const dPhi = targetPhi - spherical.current.phi;
      
      // Apply gentle pull toward territory
      if (Math.abs(dTheta) > 0.01) {
        spherical.current.theta += Math.sign(dTheta) * attractionForce;
      }
      if (Math.abs(dPhi) > 0.01) {
        spherical.current.phi += Math.sign(dPhi) * attractionForce * 0.5;
      }
    } else {
      // Clear magnetic target when out of zone
      if (magneticTargetRef.current) {
        magneticTargetRef.current = null;
        magneticStrengthRef.current = 0;
        
        // Reset all territory highlights
        territoryNodesRef.current.forEach((node) => {
          if (node.userData.magneticGlow) {
            node.userData.magneticScale = 1.0;
            node.userData.magneticGlow = false;
            const mat = node.material as THREE.MeshPhongMaterial;
            mat.emissiveIntensity = 0.4;
          }
        });
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    isDragging.current = false;
    
    // ============================================
    // UPGRADE 9: MAGNETIC SNAP ON RELEASE
    // If within magnetic zone, snap to territory
    // ============================================
    
    if (magneticTargetRef.current && magneticStrengthRef.current > 0.3) {
      // Strong enough magnetic pull - snap to territory
      const target = magneticTargetRef.current;
      
      haptic.medium();
      
      // Set target for smooth animation
      targetSpherical.current = {
        theta: (target.lng + 180) * (Math.PI / 180),
        phi: (90 - target.lat) * (Math.PI / 180),
      };
      isAnimatingToTarget.current = true;
      
      // Select the territory
      onTerritorySelect?.(target);
      
      // Reset magnetic state
      magneticTargetRef.current = null;
      magneticStrengthRef.current = 0;
      
      // Reset territory highlights with delay
      setTimeout(() => {
        territoryNodesRef.current.forEach((node) => {
          node.userData.magneticScale = 1.0;
          node.userData.magneticGlow = false;
          const mat = node.material as THREE.MeshPhongMaterial;
          mat.emissiveIntensity = 0.4;
        });
      }, 600);
      
      return;
    }
    
    // Reset magnetic state
    magneticTargetRef.current = null;
    magneticStrengthRef.current = 0;
    territoryNodesRef.current.forEach((node) => {
      if (node.userData.magneticGlow) {
        node.userData.magneticScale = 1.0;
        node.userData.magneticGlow = false;
        const mat = node.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = 0.4;
      }
    });
    
    setTimeout(() => { 
      if (!isDragging.current && !isAnimatingToTarget.current) {
        autoRotate.current = true; 
      }
    }, 4000);

    const touch = e.nativeEvent.changedTouches?.[0];
    if (!touch || !cameraRef.current || !globeGroupRef.current || !glRef.current) return;

    const gl = glRef.current;
    const x = (touch.pageX / gl.drawingBufferWidth) * 2 - 1;
    const y = -(touch.pageY / gl.drawingBufferHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Check Éclats first (highest priority)
    const eclatHits = raycaster.intersectObjects(eclatMeshesRef.current);
    if (eclatHits.length > 0) {
      const eclat = eclatHits[0].object.userData.eclat as Eclat;
      if (eclat) {
        haptic.resonne();
        if (sceneRef.current) {
          createRipple(eclatHits[0].point, sceneRef.current);
        }
        onEclatTap?.(eclat);
        return;
      }
    }

    // Check territory dots
    const territoryHits = raycaster.intersectObjects(dotMeshes.current);
    if (territoryHits.length > 0) {
      const territory = territoryHits[0].object.userData as Territory;
      const now = Date.now();

      if (sceneRef.current) {
        createRipple(territoryHits[0].point, sceneRef.current);
      }

      if (selectedId.current === territory.id && now - lastTap.current < 400) {
        haptic.heavy();
        onTerritoryDoubleTap?.(territory);
      } else {
        haptic.light();
        selectedId.current = territory.id;
        onTerritorySelect?.(territory);
      }
      lastTap.current = now;
      return;
    }

    // Check globe surface for GPS click
    if (earthMeshRef.current) {
      const globeHits = raycaster.intersectObject(earthMeshRef.current);
      if (globeHits.length > 0) {
        const point = globeHits[0].point;
        const localPoint = globeGroupRef.current.worldToLocal(point.clone());
        const { lat, lng } = vector3ToLatLng(localPoint);
        
        if (sceneRef.current) {
          createRipple(point, sceneRef.current);
        }
        
        haptic.medium();
        onGPSClick?.(lat, lng);
      }
    }
  }, [onTerritorySelect, onTerritoryDoubleTap, onGPSClick, createRipple]);

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>🌍 Globe 3D</Text>
        <Text style={styles.webFallbackSubtext}>Disponible sur l'app mobile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </View>
  );
});

KoraGlobe.displayName = 'KoraGlobe';
// Version: 3.0 - Dark Jewel Upgrade

export default KoraGlobe;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  glView: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFallbackText: {
    fontSize: 32,
    color: '#F4F1EA',
    fontWeight: 'bold',
  },
  webFallbackSubtext: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
  },
});
