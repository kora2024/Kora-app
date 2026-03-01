import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { TERRITORIES, Territory } from '../store/useKoraStore';
import { haptic } from '../utils/haptics';
import { Eclat } from '../utils/eclatStorage';

// ============================================
// TYPES & INTERFACES
// ============================================

interface GlobeProps {
  onTerritorySelect?: (territory: Territory) => void;
  onTerritoryDoubleTap?: (territory: Territory) => void;
  onGPSClick?: (lat: number, lng: number) => void;
  onEclatTap?: (eclat: Eclat) => void;
  userLocation?: { lat: number; lng: number };
  isUserSovereign?: boolean;
  eclats?: Eclat[];
}

export interface GlobeRef {
  focusOnTarget: (lat: number, lng: number) => void;
  addEclat: (eclat: Eclat) => void;
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
// AXE 1 — CYCLE CIRCADIEN
// Calculate sun position based on real UTC time
// ============================================

function getSunPosition(): { longitude: number; isNight: (lng: number, utcOffset: number) => boolean } {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  
  // Sun longitude: at 12:00 UTC, sun is at longitude 0°
  // Sun moves 15° per hour westward (360° / 24h = 15°/h)
  const sunLongitude = (12 - utcHours) * 15;
  
  // Normalize to -180 to 180
  const normalizedSunLng = ((sunLongitude + 180) % 360) - 180;
  
  return {
    longitude: normalizedSunLng,
    isNight: (lng: number, utcOffset: number) => {
      // Calculate local hour at this longitude
      const localHour = (utcHours + utcOffset + 24) % 24;
      // Night is between 22:00 and 06:00 local time
      return localHour >= 22 || localHour < 6;
    },
  };
}

// Check if a point is in nighttime (for territory dimming)
function isPointInNight(lng: number): boolean {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  
  // Calculate local solar time at this longitude
  // Solar noon occurs when the sun is directly overhead
  const localSolarHour = (utcHours + lng / 15 + 24) % 24;
  
  // Consider night between 20:00 and 06:00 solar time (generous twilight)
  return localSolarHour >= 20 || localSolarHour < 6;
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
  userLocation,
  isUserSovereign = false,
  eclats = [],
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
  
  // Ripple effects
  const ripplesRef = useRef<THREE.Mesh[]>([]);

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
    // TERRITORY NODES with Nebula Float Animation
    // + AXE 1: Circadian cycle dimming
    // ============================================
    
    dotMeshes.current = [];
    territoryNodesRef.current = [];
    
    TERRITORIES.forEach((t, index) => {
      const pos = latLngToVector3(t.lat, t.lng, 1.02);
      const size = t.size / 350;
      
      // Check if territory is in nighttime
      const inNight = isPointInNight(t.lng);
      const nightDimFactor = inNight ? 0.3 : 1.0;

      // Core node - dimmed if in night
      const dotGeo = new THREE.SphereGeometry(size, 16, 16);
      const dotMat = new THREE.MeshPhongMaterial({ 
        color: inNight ? 0x666666 : 0xcccccc,
        emissive: new THREE.Color(t.color),
        emissiveIntensity: 0.3 * nightDimFactor,
        opacity: inNight ? 0.6 : 1.0,
        transparent: inNight,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { 
        ...t, 
        basePosition: pos.clone(),
        floatPhase: index * 0.5,
        floatAmplitude: 0.008 + Math.random() * 0.005,
        isNightTime: inNight,
        territoryLng: t.lng,
      };
      globeGroup.add(dot);
      dotMeshes.current.push(dot);
      territoryNodesRef.current.push(dot);

      // Pulse ring - subtle, not golden
      const ringGeo = new THREE.RingGeometry(size * 1.5, size * 2.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(t.color),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { phase: Math.random() * Math.PI * 2, isRing: true };
      globeGroup.add(ring);
    });

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
        // NEBULA FLOAT ANIMATION (Zero-gravity drift)
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

        // Animate cultural resonance arcs (moving light)
        resonanceArcsRef.current.forEach((arc, index) => {
          const mat = arc.material as THREE.LineDashedMaterial;
          const speed = 0.015 + (index * 0.003);
          arc.userData.dashOffset -= speed;
          mat.dashOffset = arc.userData.dashOffset;
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
  // TOUCH HANDLERS
  // ============================================

  const handleTouchStart = useCallback((e: any) => {
    isDragging.current = true;
    autoRotate.current = false;
    isAnimatingToTarget.current = false;
    const touch = e.nativeEvent.touches[0];
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDragging.current || !globeGroupRef.current) return;
    const touch = e.nativeEvent.touches[0];
    
    const dx = touch.pageX - prevPointer.current.x;
    const dy = touch.pageY - prevPointer.current.y;
    
    const sensitivity = 0.008;
    
    velocity.current.x = dx * sensitivity;
    velocity.current.y = dy * sensitivity;
    
    spherical.current.theta += velocity.current.x;
    spherical.current.phi += velocity.current.y;
    
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    isDragging.current = false;
    
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
