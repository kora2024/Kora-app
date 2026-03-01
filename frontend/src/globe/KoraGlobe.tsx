import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { TERRITORIES, Territory } from '../store/useKoraStore';
import { haptic } from '../utils/haptics';

// ============================================
// TYPES & INTERFACES
// ============================================

interface GlobeProps {
  onTerritorySelect?: (territory: Territory) => void;
  onTerritoryDoubleTap?: (territory: Territory) => void;
  onGPSClick?: (lat: number, lng: number) => void;
  userLocation?: { lat: number; lng: number };
  isUserSovereign?: boolean;
}

export interface GlobeRef {
  focusOnTarget: (lat: number, lng: number) => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

// Convert lat/lng to spherical angles for camera
function latLngToSpherical(lat: number, lng: number): { theta: number; phi: number } {
  return {
    theta: (lng + 180) * (Math.PI / 180),
    phi: (90 - lat) * (Math.PI / 180),
  };
}

// ============================================
// PROCEDURAL EARTH TEXTURE (No document needed)
// ============================================

function createProceduralEarthTexture(size: number = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  
  // Simple procedural earth colors
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Normalized coordinates
      const nx = x / size;
      const ny = y / size;
      
      // Simple noise for continents
      const noise1 = Math.sin(nx * 12 + ny * 8) * Math.cos(ny * 15 - nx * 5);
      const noise2 = Math.sin(nx * 25) * Math.sin(ny * 20);
      const combined = (noise1 + noise2 * 0.5) / 1.5;
      
      // Land vs ocean threshold
      const isLand = combined > 0.1;
      
      if (isLand) {
        // Land colors - greens and browns
        const green = 40 + Math.floor(combined * 60);
        const brown = 80 + Math.floor(combined * 40);
        data[i] = brown;      // R
        data[i + 1] = green + 40; // G
        data[i + 2] = 30;     // B
        data[i + 3] = 255;    // A
      } else {
        // Ocean colors - deep blue to black
        const depth = Math.abs(combined) * 0.5;
        data[i] = Math.floor(10 + depth * 20);     // R
        data[i + 1] = Math.floor(30 + depth * 40); // G
        data[i + 2] = Math.floor(60 + depth * 80); // B
        data[i + 3] = 255;    // A
      }
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
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
  userLocation,
  isUserSovereign = false,
}, ref) => {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);

  // Sovereign aura mesh
  const sovereignAuraRef = useRef<THREE.Mesh | null>(null);
  
  // Cultural resonance arcs
  const resonanceArcsRef = useRef<THREE.Line[]>([]);
  
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
      // Adjust to face the camera towards the target
      targetSpherical.current = {
        theta: target.theta + Math.PI,
        phi: target.phi,
      };
      isAnimatingToTarget.current = true;
      autoRotate.current = false;
    },
  }));

  // Create ripple effect at a point
  const createRipple = useCallback((point: THREE.Vector3, scene: THREE.Scene) => {
    const rippleGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
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

    // Create renderer
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
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x0D0D0D, 1);
    rendererRef.current = renderer;

    // Create scene with fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.08); // Phase 4 fog
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
    // LIGHTING
    // ============================================
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4A7FA5, 0.5);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);

    const accentLight = new THREE.PointLight(0xFFD700, 0.6, 10);
    accentLight.position.set(3, 2, 3);
    scene.add(accentLight);

    // Create globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // ============================================
    // EARTH SPHERE (Procedural - No document)
    // ============================================
    
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
    
    // Create procedural earth texture
    const earthTexture = createProceduralEarthTexture(512);
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 15,
      specular: 0x222222,
    });
    
    const earthMesh = new THREE.Mesh(sphereGeo, earthMaterial);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // ============================================
    // ATMOSPHERE GLOW
    // ============================================
    
    const atmosGeo = new THREE.SphereGeometry(1.12, 32, 32);
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, intensity * 0.4);
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
      addGridLine(pts, 0.12);
    }

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
      addGridLine(pts, 0.10);
    }

    // ============================================
    // TERRITORY DOTS
    // ============================================
    
    dotMeshes.current = [];
    TERRITORIES.forEach((t) => {
      const pos = latLngToVector3(t.lat, t.lng, 1.025);
      const size = t.size / 350;

      const dotGeo = new THREE.SphereGeometry(size, 16, 16);
      const dotMat = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(t.color),
        emissive: new THREE.Color(t.color),
        emissiveIntensity: 0.4,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = t;
      globeGroup.add(dot);
      dotMeshes.current.push(dot);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(size * 1.5, size * 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(t.color),
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { phase: Math.random() * Math.PI * 2, isRing: true };
      globeGroup.add(ring);
    });

    // ============================================
    // PHASE 3: SOVEREIGN IDENTITY AURA
    // ============================================
    
    if (userLocation && isUserSovereign) {
      const userPos = latLngToVector3(userLocation.lat, userLocation.lng, 1.03);
      
      // Golden aura shader material
      const auraMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0xFFD700) },
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
            float alpha = smoothstep(0.5, 0.2, dist);
            alpha *= 0.6 + 0.4 * sin(time * 2.0); // Breathing effect
            gl_FragColor = vec4(color, alpha * 0.8);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      
      const auraGeo = new THREE.PlaneGeometry(0.15, 0.15);
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.copy(userPos);
      auraMesh.lookAt(0, 0, 0);
      auraMesh.userData = { isSovereignAura: true };
      globeGroup.add(auraMesh);
      sovereignAuraRef.current = auraMesh;
    }

    // ============================================
    // PHASE 4: CULTURAL RESONANCE ARCS
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

      const start = latLngToVector3(from.lat, from.lng, 1.025);
      const end = latLngToVector3(to.lat, to.lng, 1.025);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(1.025 + dist * 0.45);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(64);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      
      // Amber/Gold arc with dashed material for moving light effect
      const mat = new THREE.LineDashedMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.6,
        dashSize: 0.03,
        gapSize: 0.02,
        linewidth: 2,
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
      const delta = clockRef.current?.getDelta() || 0.016;

      if (globeGroupRef.current) {
        // ============================================
        // CAMERA SYNC (Slerp interpolation)
        // ============================================
        
        if (isAnimatingToTarget.current && targetSpherical.current) {
          const lerpFactor = 0.05; // Smooth interpolation
          
          // Interpolate theta (yaw)
          let dTheta = targetSpherical.current.theta - spherical.current.theta;
          // Normalize to shortest path
          while (dTheta > Math.PI) dTheta -= Math.PI * 2;
          while (dTheta < -Math.PI) dTheta += Math.PI * 2;
          spherical.current.theta += dTheta * lerpFactor;
          
          // Interpolate phi (pitch)
          spherical.current.phi += (targetSpherical.current.phi - spherical.current.phi) * lerpFactor;
          
          // Check if close enough to stop
          if (Math.abs(dTheta) < 0.01 && Math.abs(targetSpherical.current.phi - spherical.current.phi) < 0.01) {
            isAnimatingToTarget.current = false;
            setTimeout(() => { autoRotate.current = true; }, 3000);
          }
        } else {
          // Auto rotate
          if (autoRotate.current && !isDragging.current) {
            spherical.current.theta += 0.003;
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

        // Apply rotation using quaternion
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
        // ANIMATE PULSE RINGS
        // ============================================
        
        globeGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.isRing) {
            const phase = child.userData.phase;
            const s = 1 + 0.5 * ((Math.sin(t * 2.5 + phase) + 1) / 2);
            child.scale.set(s, s, s);
            (child.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((s - 1) / 0.5));
          }
        });

        // ============================================
        // ANIMATE SOVEREIGN AURA (Breathing)
        // ============================================
        
        if (sovereignAuraRef.current) {
          const auraMat = sovereignAuraRef.current.material as THREE.ShaderMaterial;
          auraMat.uniforms.time.value = t;
          
          // Breathing scale animation (1.0 to 1.2)
          const breathScale = 1.0 + 0.2 * ((Math.sin(t * 1.5) + 1) / 2);
          sovereignAuraRef.current.scale.set(breathScale, breathScale, breathScale);
        }

        // ============================================
        // ANIMATE CULTURAL RESONANCE ARCS (Moving light)
        // ============================================
        
        resonanceArcsRef.current.forEach((arc, index) => {
          const mat = arc.material as THREE.LineDashedMaterial;
          // Different speeds for each arc
          const speed = 0.02 + (index * 0.005);
          arc.userData.dashOffset -= speed;
          mat.dashOffset = arc.userData.dashOffset;
        });
      }

      // ============================================
      // ANIMATE RIPPLES
      // ============================================
      
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
