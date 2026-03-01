import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber/native';
import { useTexture } from '@react-three/drei/native';
import * as THREE from 'three';
import { TERRITORIES, Territory } from '../store/useKoraStore';
import { haptic } from '../utils/haptics';

// Types for Three.js
type ThreeEvent = {
  point: THREE.Vector3;
  nativeEvent: {
    clientX: number;
    clientY: number;
  };
};

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

// Ripple Effect Component
function RippleEffect({ position, onComplete }: { position: THREE.Vector3; onComplete: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [scale, setScale] = useState(0.01);
  const [opacity, setOpacity] = useState(0.8);

  useFrame((_, delta) => {
    if (scale < 0.15) {
      setScale((prev) => prev + delta * 0.15);
      setOpacity((prev) => Math.max(0, prev - delta * 1.5));
    } else {
      onComplete();
    }
  });

  // Orient the ring to face outward from globe center
  const lookAtCenter = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const direction = position.clone().normalize();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    return quaternion;
  }, [position]);

  return (
    <mesh ref={meshRef} position={position} quaternion={lookAtCenter} scale={[scale, scale, scale]}>
      <ringGeometry args={[0.8, 1, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#FFD700"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
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
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const lastTapRef = useRef(0);

  const position = useMemo(() => latLngToVector3(territory.lat, territory.lng, 1.02), [territory]);

  // Pulse animation for ring
  useFrame((state) => {
    if (ringRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = 1 + 0.5 * Math.sin(t * 2 + territory.lat);
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (scale - 1));
    }
    // Hover glow
    if (meshRef.current && hovered) {
      meshRef.current.scale.set(1.3, 1.3, 1.3);
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1);
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

  // Orient ring to face outward
  const lookAt = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    const direction = position.clone().normalize();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    return quaternion;
  }, [position]);

  const size = territory.size / 400;

  return (
    <group position={position}>
      {/* Core dot */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={territory.color} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={ringRef} quaternion={lookAt}>
        <ringGeometry args={[size * 1.2, size * 2.5, 32]} />
        <meshBasicMaterial
          color={territory.color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Connection Arc Component
function ConnectionArc({
  from,
  to,
}: {
  from: Territory;
  to: Territory;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const curve = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, 1.02);
    const end = latLngToVector3(to.lat, to.lng, 1.02);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(1.02 + dist * 0.35);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  const points = useMemo(() => curve.getPoints(50), [curve]);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  // Animate dash offset
  useFrame((_, delta) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineDashedMaterial;
      mat.dashOffset -= delta * 0.1;
    }
  });

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  }, []);

  return (
    <line ref={lineRef as any} geometry={geometry}>
      <lineDashedMaterial
        color={from.color}
        transparent
        opacity={0.4}
        dashSize={0.02}
        gapSize={0.02}
      />
    </line>
  );
}

// Grid Lines Component
function GridLines() {
  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = [];

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      const phi = (90 - lat) * (Math.PI / 180);
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            -1.005 * Math.sin(phi) * Math.cos(theta),
            1.005 * Math.cos(phi),
            1.005 * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      result.push(pts);
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const pts: THREE.Vector3[] = [];
      const theta = (lng + 180) * (Math.PI / 180);
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        pts.push(
          new THREE.Vector3(
            -1.005 * Math.sin(phi) * Math.cos(theta),
            1.005 * Math.cos(phi),
            1.005 * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      result.push(pts);
    }

    return result;
  }, []);

  return (
    <group>
      {lines.map((pts, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={pts.length}
              array={new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.06} />
        </line>
      ))}
    </group>
  );
}

// Atmosphere Glow Component
function AtmosphereGlow() {
  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        uniforms={{
          glowColor: { value: new THREE.Color('#1a3a5c') },
        }}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 glowColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(glowColor, intensity * 0.35);
          }
        `}
      />
    </mesh>
  );
}

// Main Globe Sphere with Textures
function EarthSphere({ onGPSClick }: { onGPSClick?: (lat: number, lng: number, point: THREE.Vector3) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // NASA Blue Marble Texture URLs (public domain)
  const textureURLs = useMemo(() => ({
    // Blue Marble midnight-style with dark oceans
    map: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/World_map_blank_without_borders.svg/2560px-World_map_blank_without_borders.svg.png',
    // Fallback to generated shader if texture fails
  }), []);

  // Handle click for GPS raycasting
  const handleClick = useCallback((event: ThreeEvent) => {
    if (onGPSClick && event.point) {
      const { lat, lng } = vector3ToLatLng(event.point);
      onGPSClick(lat, lng, event.point.clone().normalize().multiplyScalar(1.02));
    }
  }, [onGPSClick]);

  return (
    <mesh ref={meshRef} onClick={handleClick as any}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial
        uniforms={{
          color1: { value: new THREE.Color('#000000') }, // Deep black oceans
          color2: { value: new THREE.Color('#0a1829') },
          glowColor: { value: new THREE.Color('#1a3a5c') },
          urbanColor: { value: new THREE.Color('#FFD700') }, // Golden urban areas
          time: { value: 0 },
        }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 glowColor;
          uniform vec3 urbanColor;
          uniform float time;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          
          // Simple noise function for terrain
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
            // Edge glow intensity
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            
            // Base dark color (deep space black to dark blue)
            vec3 base = mix(color1, color2, vPosition.y * 0.5 + 0.5);
            
            // Add terrain detail with noise
            float n = noise(vUv * 20.0);
            float landMask = step(0.45, n);
            
            // Golden urban glow on "land" areas
            vec3 land = mix(base, urbanColor * 0.15, landMask * 0.3);
            
            // Add subtle glow at edges
            vec3 glow = glowColor * intensity * 0.4;
            
            gl_FragColor = vec4(land + glow, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// Scene Controller with Camera Controls
function SceneController({
  onTerritorySelect,
  onTerritoryDoubleTap,
  onGPSClick,
}: GlobeProps) {
  const { camera, gl } = useThree();
  const globeRef = useRef<THREE.Group>(null);
  const [ripples, setRipples] = useState<{ id: number; position: THREE.Vector3 }[]>([]);

  // Interaction state
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);
  const zoomLevel = useRef(3.5);

  // Set up atmospheric fog
  useEffect(() => {
    const scene = gl.domElement.parentElement?.__r3f?.scene;
    if (scene) {
      scene.fog = new THREE.FogExp2('#000000', 0.05);
    }
  }, [gl]);

  // Camera initial position
  useEffect(() => {
    camera.position.set(0, 0, 3.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Animation loop
  useFrame((state, delta) => {
    if (!globeRef.current) return;

    // Auto rotation
    if (autoRotate.current) {
      globeRef.current.rotation.y += 0.002;
    }

    // Apply momentum
    if (!isDragging.current) {
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;
      globeRef.current.rotation.y += velocity.current.x;
      globeRef.current.rotation.x += velocity.current.y;
      globeRef.current.rotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, globeRef.current.rotation.x)
      );
    }
  });

  // Connection arcs data
  const arcs = useMemo(
    () => [
      { from: 'ftf', to: 'par' },
      { from: 'ftf', to: 'lag' },
      { from: 'ftf', to: 'lon' },
      { from: 'ftf', to: 'dak' },
      { from: 'par', to: 'lag' },
      { from: 'nyc', to: 'lon' },
    ],
    []
  );

  // Handle territory selection
  const handleTerritorySelect = useCallback(
    (territory: Territory) => {
      onTerritorySelect?.(territory);
    },
    [onTerritorySelect]
  );

  const handleTerritoryDoubleTap = useCallback(
    (territory: Territory) => {
      onTerritoryDoubleTap?.(territory);
    },
    [onTerritoryDoubleTap]
  );

  // Handle GPS click with ripple effect
  const handleGPSClick = useCallback(
    (lat: number, lng: number, point: THREE.Vector3) => {
      haptic.medium();
      setRipples((prev) => [...prev, { id: Date.now(), position: point }]);
      onGPSClick?.(lat, lng);
    },
    [onGPSClick]
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Pointer event handlers for rotation
  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevPointer.current = { x: e.clientX, y: e.clientY };
      autoRotate.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !globeRef.current) return;

      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;

      // Sensitivity decreases as zoom increases (closer = slower rotation)
      const sensitivity = Math.max(0.001, 0.005 * (zoomLevel.current / 3.5));

      velocity.current.x = dx * sensitivity;
      velocity.current.y = dy * sensitivity * 0.5;

      globeRef.current.rotation.y += velocity.current.x;
      globeRef.current.rotation.x += velocity.current.y;
      globeRef.current.rotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, globeRef.current.rotation.x)
      );

      prevPointer.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      setTimeout(() => {
        autoRotate.current = true;
      }, 3000);
    };

    // Zoom handler (wheel for web, pinch handled elsewhere)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      zoomLevel.current = Math.max(0.8, Math.min(6, zoomLevel.current + delta));
      camera.position.z = zoomLevel.current;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl, camera]);

  return (
    <group ref={globeRef} rotation={[0.4, 0, 0]}>
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

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <RippleEffect
          key={ripple.id}
          position={ripple.position}
          onComplete={() => removeRipple(ripple.id)}
        />
      ))}
    </group>
  );
}

// Main Globe Component
export default function KoraGlobe(props: GlobeProps) {
  return (
    <Canvas
      style={styles.canvas}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      }}
      camera={{
        fov: 45,
        near: 0.1,
        far: 100,
        position: [0, 0, 3.5],
      }}
      onCreated={(state) => {
        // Fix texture flipping on native
        const gl = state.gl.getContext();
        if (gl) {
          const pixelStorei = gl.pixelStorei.bind(gl);
          gl.pixelStorei = function (...args: any[]) {
            const [parameter] = args;
            if (parameter === gl.UNPACK_FLIP_Y_WEBGL) return;
            return pixelStorei(...args);
          };
        }

        // Set background color
        state.gl.setClearColor('#0D0D0D', 1);

        // Add fog to scene
        state.scene.fog = new THREE.FogExp2('#000000', 0.05);
      }}
    >
      {/* Ambient light */}
      <ambientLight intensity={0.3} />

      {/* Directional light for terrain shadows */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={0.8}
        color="#FFD700"
      />

      {/* Point lights for golden glow effect */}
      <pointLight position={[-10, 5, -10]} intensity={0.2} color="#A65D47" />
      <pointLight position={[10, -5, 10]} intensity={0.2} color="#4A7FA5" />

      {/* Scene with all globe elements */}
      <SceneController {...props} />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
});
