import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { TERRITORIES, Territory } from '../store/useKoraStore';
import { haptic } from '../utils/haptics';

interface GlobeProps {
  onTerritorySelect?: (territory: Territory) => void;
  onTerritoryDoubleTap?: (territory: Territory) => void;
  onGPSClick?: (lat: number, lng: number) => void;
}

// Convert lat/lng to 3D coordinates
function latLngToVector3(lat: number, lng: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Convert 3D point to lat/lng
function vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
  const normalized = point.clone().normalize();
  const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI);
  const lng = (Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI)) - 180;
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round((lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng) * 1000) / 1000,
  };
}

export default function KoraGlobe({ onTerritorySelect, onTerritoryDoubleTap, onGPSClick }: GlobeProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);

  // Interaction state
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef(0);
  const autoRotate = useRef(true);
  const lastTap = useRef(0);
  const selectedId = useRef<string | null>(null);

  // Territory dot meshes for raycasting
  const dotMeshes = useRef<THREE.Mesh[]>([]);

  const [isReady, setIsReady] = useState(false);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      // @ts-ignore - expo-gl provides a compatible context
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
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x0D0D0D, 1);
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
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

    // Create globe group
    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = 0.4;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Create Earth sphere with shader
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
    const sphereMat = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color(0x000000) },
        color2: { value: new THREE.Color(0x0a1829) },
        glowColor: { value: new THREE.Color(0x1a3a5c) },
        urbanColor: { value: new THREE.Color(0xFFD700) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 glowColor;
        uniform vec3 urbanColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }
        
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 base = mix(color1, color2, vPosition.y * 0.5 + 0.5);
          float n = noise(vUv * 20.0);
          float landMask = step(0.45, n);
          vec3 land = mix(base, urbanColor * 0.15, landMask * 0.3);
          vec3 glow = glowColor * intensity * 0.4;
          gl_FragColor = vec4(land + glow, 1.0);
        }
      `,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(1.12, 32, 32);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x1a3a5c) } },
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, intensity * 0.35);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Grid lines
    const addGridLine = (points: THREE.Vector3[], opacity: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity });
      globeGroup.add(new THREE.Line(geo, mat));
    };

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      const phi = (90 - lat) * Math.PI / 180;
      for (let i = 0; i <= 64; i++) {
        const theta = i / 64 * Math.PI * 2;
        pts.push(new THREE.Vector3(
          -1.005 * Math.sin(phi) * Math.cos(theta),
          1.005 * Math.cos(phi),
          1.005 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      addGridLine(pts, 0.06);
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const pts: THREE.Vector3[] = [];
      const theta = (lng + 180) * Math.PI / 180;
      for (let i = 0; i <= 64; i++) {
        const phi = i / 64 * Math.PI;
        pts.push(new THREE.Vector3(
          -1.005 * Math.sin(phi) * Math.cos(theta),
          1.005 * Math.cos(phi),
          1.005 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      addGridLine(pts, 0.05);
    }

    // Territory dots
    dotMeshes.current = [];
    TERRITORIES.forEach((t) => {
      const pos = latLngToVector3(t.lat, t.lng, 1.02);
      const size = t.size / 400;

      // Core dot
      const dotGeo = new THREE.SphereGeometry(size, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(t.color) });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = t;
      globeGroup.add(dot);
      dotMeshes.current.push(dot);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(size * 1.2, size * 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(t.color),
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { baseScale: 1, phase: Math.random() * Math.PI * 2 };
      globeGroup.add(ring);
    });

    // Connection arcs
    const arcs = [
      { from: 'ftf', to: 'par' },
      { from: 'ftf', to: 'lag' },
      { from: 'ftf', to: 'lon' },
      { from: 'ftf', to: 'dak' },
      { from: 'par', to: 'lag' },
      { from: 'nyc', to: 'lon' },
    ];

    arcs.forEach((a) => {
      const from = TERRITORIES.find((t) => t.id === a.from);
      const to = TERRITORIES.find((t) => t.id === a.to);
      if (!from || !to) return;

      const start = latLngToVector3(from.lat, from.lng, 1.02);
      const end = latLngToVector3(to.lat, to.lng, 1.02);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(1.02 + dist * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(48);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(from.color),
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(geo, mat);
      globeGroup.add(line);
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFD700, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    setIsReady(true);

    // Animation loop
    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (globeGroupRef.current) {
        // Auto rotate
        if (autoRotate.current) {
          globeGroupRef.current.rotation.y += 0.002;
        }

        // Momentum
        if (!isDragging.current) {
          velocity.current *= 0.95;
          globeGroupRef.current.rotation.y += velocity.current;
        }

        // Animate pulse rings
        globeGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.phase !== undefined) {
            const phase = child.userData.phase;
            const s = 1 + 0.8 * ((Math.sin(t * 2 + phase) + 1) / 2);
            child.scale.set(s, s, s);
            (child.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((s - 1) / 0.8));
          }
        });
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
    animationRef.current = animFrameId;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback((e: any) => {
    isDragging.current = true;
    autoRotate.current = false;
    const touch = e.nativeEvent.touches[0];
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDragging.current || !globeGroupRef.current) return;
    const touch = e.nativeEvent.touches[0];
    const dx = touch.pageX - prevPointer.current.x;
    velocity.current = dx * 0.005;
    globeGroupRef.current.rotation.y += velocity.current;
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    isDragging.current = false;
    setTimeout(() => { autoRotate.current = true; }, 3000);

    // Handle tap for territory selection
    const touch = e.nativeEvent.changedTouches?.[0];
    if (!touch || !cameraRef.current || !globeGroupRef.current || !glRef.current) return;

    const gl = glRef.current;
    const x = (touch.pageX / gl.drawingBufferWidth) * 2 - 1;
    const y = -(touch.pageY / gl.drawingBufferHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hits = raycaster.intersectObjects(dotMeshes.current);
    if (hits.length > 0) {
      const territory = hits[0].object.userData as Territory;
      const now = Date.now();

      if (selectedId.current === territory.id && now - lastTap.current < 400) {
        // Double tap
        haptic.heavy();
        onTerritoryDoubleTap?.(territory);
      } else {
        haptic.light();
        selectedId.current = territory.id;
        onTerritorySelect?.(territory);
      }
      lastTap.current = now;
    } else {
      // GPS click on empty area
      const sphereHits = raycaster.intersectObjects(
        globeGroupRef.current.children.filter((c) => c instanceof THREE.Mesh && !c.userData.id)
      );
      if (sphereHits.length > 0) {
        const point = sphereHits[0].point;
        const { lat, lng } = vector3ToLatLng(point);
        haptic.medium();
        onGPSClick?.(lat, lng);
      }
    }
  }, [onTerritorySelect, onTerritoryDoubleTap, onGPSClick]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>Globe 3D</Text>
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
}

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
    fontSize: 24,
    color: '#F4F1EA',
    fontWeight: 'bold',
  },
  webFallbackSubtext: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
  },
});
