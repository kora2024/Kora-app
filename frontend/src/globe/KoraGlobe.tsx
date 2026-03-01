import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
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

// Convert 3D point to lat/lng (GPS Raycasting)
function vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
  const normalized = point.clone().normalize();
  const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI);
  const lng = (Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI)) - 180;
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round((lng > 180 ? lng - 360 : lng < -180 ? lng + 360 : lng) * 1000) / 1000,
  };
}

// Territory Point Component
function TerritoryPoint({
  territory,
  onSelect,
  onDoubleTap,
}: {
  territory: Territory;
  onSelect: (t: Territory) => void;
  onDoubleTap: (t: Territory) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastTapRef = useRef(0);
  const scaleRef = useRef(1);

  const position = useMemo(() => latLngToVector3(territory.lat, territory.lng, 1.02), [territory]);

  // Pulse animation
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      scaleRef.current = 1 + 0.2 * Math.sin(t * 2 + territory.lat * 0.1);
      meshRef.current.scale.setScalar(scaleRef.current);
    }
  });

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      haptic.heavy();
      onDoubleTap(territory);
    } else {
      haptic.light();
      onSelect(territory);
    }
    lastTapRef.current = now;
  }, [territory, onSelect, onDoubleTap]);

  const size = territory.size / 400;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={territory.color} />
    </mesh>
  );
}

// Connection Arc Component
function ConnectionArc({ from, to }: { from: Territory; to: Territory }) {
  const lineRef = useRef<THREE.Line>(null);

  const { geometry, material } = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, 1.02);
    const end = latLngToVector3(to.lat, to.lng, 1.02);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(1.02 + dist * 0.35);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
      color: from.color,
      transparent: true,
      opacity: 0.4,
    });

    return { geometry: geo, material: mat };
  }, [from, to]);

  return <primitive object={new THREE.Line(geometry, material)} />;
}

// Earth Sphere with shader
function EarthSphere({ onGPSClick }: { onGPSClick?: (lat: number, lng: number) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color('#000000') },
        color2: { value: new THREE.Color('#0a1829') },
        glowColor: { value: new THREE.Color('#1a3a5c') },
        urbanColor: { value: new THREE.Color('#FFD700') },
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
  }, []);

  const handleClick = useCallback((event: any) => {
    if (onGPSClick && event.point) {
      const { lat, lng } = vector3ToLatLng(event.point);
      haptic.medium();
      onGPSClick(lat, lng);
    }
  }, [onGPSClick]);

  return (
    <mesh ref={meshRef} onClick={handleClick} material={shaderMaterial}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

// Atmosphere glow
function AtmosphereGlow() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color('#1a3a5c') },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, intensity * 0.35);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={[1.12, 1.12, 1.12]} material={material}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}

// Grid lines
function GridLines() {
  const lines = useMemo(() => {
    const result: JSX.Element[] = [];
    
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      const phi = (90 - lat) * (Math.PI / 180);
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          -1.005 * Math.sin(phi) * Math.cos(theta),
          1.005 * Math.cos(phi),
          1.005 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.06 });
      result.push(<primitive key={`lat-${lat}`} object={new THREE.Line(geometry, material)} />);
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = [];
      const theta = (lng + 180) * (Math.PI / 180);
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        points.push(new THREE.Vector3(
          -1.005 * Math.sin(phi) * Math.cos(theta),
          1.005 * Math.cos(phi),
          1.005 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.05 });
      result.push(<primitive key={`lng-${lng}`} object={new THREE.Line(geometry, material)} />);
    }

    return result;
  }, []);

  return <>{lines}</>;
}

// Scene Controller with globe rotation
function SceneController({
  onTerritorySelect,
  onTerritoryDoubleTap,
  onGPSClick,
}: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  
  // Interaction state
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0 });
  const autoRotate = useRef(true);

  // Connection arcs data
  const arcs = useMemo(() => [
    { from: 'ftf', to: 'par' },
    { from: 'ftf', to: 'lag' },
    { from: 'ftf', to: 'lon' },
    { from: 'ftf', to: 'dak' },
    { from: 'par', to: 'lag' },
    { from: 'nyc', to: 'lon' },
  ], []);

  // Set up camera
  useEffect(() => {
    camera.position.set(0, 0, 3.5);
  }, [camera]);

  // Animation loop
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Auto rotation
    if (autoRotate.current) {
      groupRef.current.rotation.y += 0.002;
    }
    
    // Apply momentum
    if (!isDragging.current) {
      velocity.current.x *= 0.95;
      groupRef.current.rotation.y += velocity.current.x;
    }
  });

  // Handle territory callbacks
  const handleTerritorySelect = useCallback((territory: Territory) => {
    onTerritorySelect?.(territory);
  }, [onTerritorySelect]);

  const handleTerritoryDoubleTap = useCallback((territory: Territory) => {
    onTerritoryDoubleTap?.(territory);
  }, [onTerritoryDoubleTap]);

  // Handle GPS click
  const handleGPSClick = useCallback((lat: number, lng: number) => {
    onGPSClick?.(lat, lng);
  }, [onGPSClick]);

  // Pointer event handlers
  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevPointer.current = { x: e.clientX, y: e.clientY };
      autoRotate.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !groupRef.current) return;

      const dx = e.clientX - prevPointer.current.x;
      velocity.current.x = dx * 0.005;
      groupRef.current.rotation.y += velocity.current.x;
      prevPointer.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      setTimeout(() => { autoRotate.current = true; }, 3000);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [gl]);

  return (
    <group ref={groupRef} rotation={[0.4, 0, 0]}>
      {/* Main Earth sphere */}
      <EarthSphere onGPSClick={handleGPSClick} />

      {/* Atmosphere glow */}
      <AtmosphereGlow />

      {/* Grid lines */}
      <GridLines />

      {/* Territory points */}
      {TERRITORIES.map((territory) => (
        <TerritoryPoint
          key={territory.id}
          territory={territory}
          onSelect={handleTerritorySelect}
          onDoubleTap={handleTerritoryDoubleTap}
        />
      ))}

      {/* Connection arcs */}
      {arcs.map((arc, i) => {
        const from = TERRITORIES.find((t) => t.id === arc.from);
        const to = TERRITORIES.find((t) => t.id === arc.to);
        if (!from || !to) return null;
        return <ConnectionArc key={i} from={from} to={to} />;
      })}
    </group>
  );
}

// Main Globe Component
export default function KoraGlobe(props: GlobeProps) {
  return (
    <View style={styles.container}>
      <Canvas
        style={styles.canvas}
        gl={{
          antialias: true,
          alpha: true,
        }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 100,
          position: [0, 0, 3.5],
        }}
        onCreated={(state) => {
          state.gl.setClearColor('#0D0D0D', 1);
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#FFD700" />
        <pointLight position={[-10, 5, -10]} intensity={0.2} color="#A65D47" />
        <SceneController {...props} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  canvas: {
    flex: 1,
  },
});
