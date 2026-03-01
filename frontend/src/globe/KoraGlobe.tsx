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
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);

  // Ripple effects
  const ripplesRef = useRef<THREE.Mesh[]>([]);

  // Spherical rotation state (for 360° freedom)
  const spherical = useRef({
    theta: 0,      // Yaw (horizontal rotation)
    phi: Math.PI / 2, // Pitch (vertical rotation) - start at equator view
  });

  // Interaction state
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 }); // Now tracking both axes
  const autoRotate = useRef(true);
  const lastTap = useRef(0);
  const selectedId = useRef<string | null>(null);

  // Territory dot meshes for raycasting
  const dotMeshes = useRef<THREE.Mesh[]>([]);

  // Clock for animations
  const clockRef = useRef<THREE.Clock | null>(null);

  const [isReady, setIsReady] = useState(false);

  // Create ripple effect at a point
  const createRipple = useCallback((point: THREE.Vector3, scene: THREE.Scene) => {
    const rippleGeo = new THREE.RingGeometry(0.02, 0.03, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    
    // Position slightly above surface
    const surfacePoint = point.clone().normalize().multiplyScalar(1.02);
    ripple.position.copy(surfacePoint);
    ripple.lookAt(0, 0, 0);
    ripple.userData = { startTime: clockRef.current?.getElapsedTime() || 0, startScale: 1 };
    
    scene.add(ripple);
    ripplesRef.current.push(ripple);
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;
    clockRef.current = new THREE.Clock();

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
    // LIGHTING - Critical for visibility!
    // ============================================
    
    // Strong ambient light for base visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Main directional light (sun-like)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0x4A7FA5, 0.4);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);

    // Golden accent light for territories
    const accentLight = new THREE.PointLight(0xFFD700, 0.5, 10);
    accentLight.position.set(3, 2, 3);
    scene.add(accentLight);

    // Create globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // ============================================
    // EARTH SPHERE WITH TEXTURE
    // ============================================
    
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
    
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // High-contrast Earth texture URL
    const textureURL = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
    
    // Create initial material with a visible color while texture loads
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244aa, // Blue fallback color
      shininess: 25,
      specular: 0x333333,
    });
    
    const earthMesh = new THREE.Mesh(sphereGeo, earthMaterial);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Load texture
    textureLoader.load(
      textureURL,
      (texture) => {
        // Texture loaded successfully
        texture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = texture;
        earthMaterial.color.setHex(0xffffff); // Reset color to show texture properly
        earthMaterial.needsUpdate = true;
        console.log('Earth texture loaded successfully');
      },
      undefined,
      (error) => {
        // Texture failed to load - use procedural fallback
        console.log('Texture load failed, using procedural material');
        
        // Create a more visible procedural material
        const fallbackMaterial = new THREE.MeshPhongMaterial({
          color: 0x1a4d7a,
          emissive: 0x0a2040,
          emissiveIntensity: 0.3,
          shininess: 30,
        });
        earthMesh.material = fallbackMaterial;
      }
    );

    // ============================================
    // ATMOSPHERE GLOW
    // ============================================
    
    const atmosGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x4A7FA5) } },
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, intensity * 0.5);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // ============================================
    // GRID LINES
    // ============================================
    
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
      addGridLine(pts, 0.15);
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
      addGridLine(pts, 0.12);
    }

    // ============================================
    // TERRITORY DOTS
    // ============================================
    
    dotMeshes.current = [];
    TERRITORIES.forEach((t) => {
      const pos = latLngToVector3(t.lat, t.lng, 1.03);
      const size = t.size / 350;

      // Core dot - now using MeshPhongMaterial for better visibility
      const dotGeo = new THREE.SphereGeometry(size, 16, 16);
      const dotMat = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(t.color),
        emissive: new THREE.Color(t.color),
        emissiveIntensity: 0.5,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = t;
      globeGroup.add(dot);
      dotMeshes.current.push(dot);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(size * 1.5, size * 3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(t.color),
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { baseScale: 1, phase: Math.random() * Math.PI * 2, isRing: true };
      globeGroup.add(ring);
    });

    // ============================================
    // CONNECTION ARCS
    // ============================================
    
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

      const start = latLngToVector3(from.lat, from.lng, 1.03);
      const end = latLngToVector3(to.lat, to.lng, 1.03);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(1.03 + dist * 0.4);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(48);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(from.color),
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(geo, mat);
      globeGroup.add(line);
    });

    setIsReady(true);

    // ============================================
    // ANIMATION LOOP
    // ============================================
    
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const t = clockRef.current?.getElapsedTime() || 0;

      if (globeGroupRef.current) {
        // Auto rotate (only yaw when not dragging)
        if (autoRotate.current && !isDragging.current) {
          spherical.current.theta += 0.003;
        }

        // Apply inertia (0.95 damping) - BOTH AXES
        if (!isDragging.current) {
          velocity.current.x *= 0.95;
          velocity.current.y *= 0.95;
          spherical.current.theta += velocity.current.x;
          spherical.current.phi += velocity.current.y;
        }

        // NO CLAMPING - Allow full 360° rotation through poles
        // Just normalize phi to prevent floating point issues
        while (spherical.current.phi < 0) spherical.current.phi += Math.PI * 2;
        while (spherical.current.phi > Math.PI * 2) spherical.current.phi -= Math.PI * 2;

        // Apply spherical rotation to globe
        // Using quaternion for smooth pole traversal
        const quaternion = new THREE.Quaternion();
        const euler = new THREE.Euler(
          spherical.current.phi - Math.PI / 2, // Pitch
          spherical.current.theta,              // Yaw
          0,
          'YXZ'
        );
        quaternion.setFromEuler(euler);
        globeGroupRef.current.quaternion.copy(quaternion);

        // Animate pulse rings
        globeGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.isRing) {
            const phase = child.userData.phase;
            const s = 1 + 0.6 * ((Math.sin(t * 2.5 + phase) + 1) / 2);
            child.scale.set(s, s, s);
            (child.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - ((s - 1) / 0.6));
          }
        });
      }

      // Animate ripples
      const ripplesToRemove: THREE.Mesh[] = [];
      ripplesRef.current.forEach((ripple) => {
        const elapsed = t - ripple.userData.startTime;
        const duration = 1.0; // 1 second animation
        const progress = elapsed / duration;

        if (progress < 1) {
          const scale = 1 + progress * 8; // Expand from 1 to 9x
          ripple.scale.set(scale, scale, scale);
          (ripple.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        } else {
          ripplesToRemove.push(ripple);
        }
      });

      // Remove completed ripples
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
    animationRef.current = animFrameId;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createRipple]);

  // ============================================
  // TOUCH HANDLERS - 360° Spherical Rotation
  // ============================================

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
    const dy = touch.pageY - prevPointer.current.y;
    
    // Sensitivity factor
    const sensitivity = 0.008;
    
    // Update velocities for both axes
    velocity.current.x = dx * sensitivity;
    velocity.current.y = dy * sensitivity;
    
    // Apply immediate rotation
    spherical.current.theta += velocity.current.x;
    spherical.current.phi += velocity.current.y;
    
    prevPointer.current = { x: touch.pageX, y: touch.pageY };
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    isDragging.current = false;
    
    // Re-enable auto-rotate after 4 seconds of inactivity
    setTimeout(() => { 
      if (!isDragging.current) {
        autoRotate.current = true; 
      }
    }, 4000);

    // Handle tap for territory selection and ripple effect
    const touch = e.nativeEvent.changedTouches?.[0];
    if (!touch || !cameraRef.current || !globeGroupRef.current || !glRef.current) return;

    const gl = glRef.current;
    const x = (touch.pageX / gl.drawingBufferWidth) * 2 - 1;
    const y = -(touch.pageY / gl.drawingBufferHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Check territory dots first
    const territoryHits = raycaster.intersectObjects(dotMeshes.current);
    if (territoryHits.length > 0) {
      const territory = territoryHits[0].object.userData as Territory;
      const now = Date.now();

      // Create ripple at hit point
      if (sceneRef.current) {
        createRipple(territoryHits[0].point, sceneRef.current);
      }

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
      return;
    }

    // Check globe surface for GPS click
    if (earthMeshRef.current) {
      const globeHits = raycaster.intersectObject(earthMeshRef.current);
      if (globeHits.length > 0) {
        const point = globeHits[0].point;
        
        // Transform point from world to local coordinates
        const localPoint = globeGroupRef.current.worldToLocal(point.clone());
        const { lat, lng } = vector3ToLatLng(localPoint);
        
        // Create ripple effect
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
