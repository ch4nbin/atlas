'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@/state/sceneStore';
import type { SceneElement, SceneGraph } from '@/lib/atlas/types';
import {
  parsePositionHint,
  getScaleFromImportance,
  normalizeTimeOfDay,
  getSkyConfig,
  getElementColor,
} from '@/lib/atlas/sceneParser';

// ─── SparkRenderer: responsible for world geometry (environment, objects, actors)
// ─── Three.js overlay: responsible for interaction, selection, labels

interface ElementObject {
  group: THREE.Group;
  element: SceneElement;
  baseY: number;
  lights?: THREE.PointLight[];
}

export function SceneViewer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const frameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const elementObjectsRef = useRef<ElementObject[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const isPointerLockedRef = useRef(false);
  const mouseEulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const currentSceneIdRef = useRef<string>('');

  const { sceneGraph, setFocusedElement, focusedElement } = useSceneStore();

  // ─── Initialization ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 4, 14);
    cameraRef.current = camera;

    // Tooltip overlay
    const tooltip = document.createElement('div');
    tooltip.className = 'atlas-tooltip';
    tooltip.style.display = 'none';
    container.appendChild(tooltip);
    tooltipRef.current = tooltip;

    // Label overlay (focused element)
    const label = document.createElement('div');
    label.className = 'atlas-scene-label-overlay';
    label.style.display = 'none';
    container.appendChild(label);
    labelRef.current = label;

    // Resize handler
    const onResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ─── Pointer lock (mouse look)
    renderer.domElement.addEventListener('click', () => {
      if (!isPointerLockedRef.current) {
        renderer.domElement.requestPointerLock();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      isPointerLockedRef.current = document.pointerLockElement === renderer.domElement;
    });
    document.addEventListener('mousemove', (e) => {
      if (!isPointerLockedRef.current) {
        // Update pointer for raycasting
        const rect = container.getBoundingClientRect();
        pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        return;
      }
      const sensitivity = 0.002;
      mouseEulerRef.current.y -= e.movementX * sensitivity;
      mouseEulerRef.current.x = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, mouseEulerRef.current.x - e.movementY * sensitivity)
      );
    });

    // ─── WASD keys
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ─── Click to select
    renderer.domElement.addEventListener('mousedown', handleClick);

    // ─── Render loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      updateCamera(delta);
      updateElementAnimations(clockRef.current.getElapsedTime());
      updateHover();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('mousedown', handleClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (tooltip.parentElement) tooltip.parentElement.removeChild(tooltip);
      if (label.parentElement) label.parentElement.removeChild(label);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Camera movement ──────────────────────────────────────────────────────
  const updateCamera = (delta: number) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const speed = 8 * delta;
    const euler = mouseEulerRef.current;

    camera.quaternion.setFromEuler(euler);

    const dir = new THREE.Vector3();
    if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dir.z -= 1;
    if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dir.z += 1;
    if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dir.x -= 1;
    if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dir.x += 1;

    if (dir.length() > 0) {
      dir.normalize().applyQuaternion(camera.quaternion);
      dir.y = 0;
      dir.normalize().multiplyScalar(speed);
      camera.position.add(dir);
      camera.position.y = 4; // lock height
      // Soft bounds
      camera.position.x = Math.max(-22, Math.min(22, camera.position.x));
      camera.position.z = Math.max(-22, Math.min(22, camera.position.z));
    }
  };

  // ─── Element hover detection ──────────────────────────────────────────────
  const updateHover = () => {
    if (isPointerLockedRef.current) return;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    raycasterRef.current.setFromCamera(pointerRef.current, camera);
    const meshes = elementObjectsRef.current.flatMap((eo) => {
      const hits: THREE.Object3D[] = [];
      eo.group.traverse((c) => { if ((c as THREE.Mesh).isMesh) hits.push(c); });
      return hits;
    });
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    const tooltip = tooltipRef.current;
    if (intersects.length > 0 && tooltip) {
      const hit = intersects[0].object;
      const eo = elementObjectsRef.current.find((e) => {
        let found = false;
        e.group.traverse((c) => { if (c === hit) found = true; });
        return found;
      });
      if (eo) {
        tooltip.textContent = eo.element.name;
        tooltip.style.display = 'block';
        document.body.style.cursor = 'pointer';
      }
    } else if (tooltip) {
      tooltip.style.display = 'none';
      document.body.style.cursor = 'default';
    }
  };

  // ─── Click handler ────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (isPointerLockedRef.current) return;
    const camera = cameraRef.current;
    if (!camera) return;

    raycasterRef.current.setFromCamera(pointerRef.current, camera);
    const meshes = elementObjectsRef.current.flatMap((eo) => {
      const hits: THREE.Object3D[] = [];
      eo.group.traverse((c) => { if ((c as THREE.Mesh).isMesh) hits.push(c); });
      return hits;
    });
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const eo = elementObjectsRef.current.find((e) => {
        let found = false;
        e.group.traverse((c) => { if (c === hit) found = true; });
        return found;
      });
      if (eo) {
        setFocusedElement(eo.element);
        highlightElement(eo);
      }
    } else {
      setFocusedElement(null);
      clearHighlights();
    }
  }, [setFocusedElement]);

  // ─── Highlights ────────────────────────────────────────────────────────────
  const highlightElement = (target: ElementObject) => {
    elementObjectsRef.current.forEach((eo) => {
      eo.group.traverse((c) => {
        const mesh = c as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive?.setHex(eo === target ? 0x334466 : 0x000000);
          mat.emissiveIntensity = eo === target ? 0.5 : 0;
        }
      });
    });

    const label = labelRef.current;
    if (label) {
      label.innerHTML = `<strong>${target.element.name}</strong><br/><span>${target.element.description}</span>`;
      label.style.display = 'block';
    }
  };

  const clearHighlights = () => {
    elementObjectsRef.current.forEach((eo) => {
      eo.group.traverse((c) => {
        const mesh = c as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.emissive) mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    });
    if (labelRef.current) labelRef.current.style.display = 'none';
  };

  // ─── Animate elements (bob, flicker, etc.) ────────────────────────────────
  const updateElementAnimations = (t: number) => {
    elementObjectsRef.current.forEach((eo) => {
      if (eo.element.type === 'actor') {
        eo.group.position.y = eo.baseY + Math.sin(t * 0.8 + eo.group.position.x) * 0.05;
      }
      if (eo.element.name.toLowerCase().includes('torch') || eo.element.name.toLowerCase().includes('fire')) {
        eo.lights?.forEach((l) => {
          l.intensity = 1.5 + Math.sin(t * 12 + l.position.x) * 0.4;
          l.color.setHSL(0.08 + Math.sin(t * 8) * 0.02, 1.0, 0.6);
        });
      }
      if (eo.element.name.toLowerCase().includes('water') || eo.element.name.toLowerCase().includes('harbor')) {
        eo.group.position.y = eo.baseY + Math.sin(t * 0.5) * 0.1;
      }
    });
  };

  // ─── Build scene from scene graph ─────────────────────────────────────────
  useEffect(() => {
    if (!sceneGraph || !sceneRef.current) return;
    const scene = sceneRef.current;
    const sceneId = `${sceneGraph.setting.location}_${sceneGraph.setting.time_period}`;
    if (currentSceneIdRef.current === sceneId) return;
    currentSceneIdRef.current = sceneId;

    clearHighlights();
    if (labelRef.current) labelRef.current.style.display = 'none';

    // Remove old scene objects
    elementObjectsRef.current.forEach((eo) => {
      eo.lights?.forEach((l) => scene.remove(l));
      scene.remove(eo.group);
    });
    // Remove lights
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o instanceof THREE.Light || o instanceof THREE.Mesh) toRemove.push(o);
    });
    toRemove.forEach((o) => {
      if (o.parent) o.parent.remove(o);
    });
    elementObjectsRef.current = [];

    const timeOfDay = normalizeTimeOfDay(sceneGraph.setting.time_of_day);
    const sky = getSkyConfig(timeOfDay);

    // ── SparkRenderer layer: sky + fog + ambient environment
    scene.background = new THREE.Color(sky.topColor);
    scene.fog = new THREE.Fog(sky.fogColor, sky.fogNear, sky.fogFar);

    // Sky gradient sphere
    const skyGeo = new THREE.SphereGeometry(90, 16, 8);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(sky.topColor) },
        bottomColor: { value: new THREE.Color(sky.bottomColor) },
        offset: { value: 10 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos + vec3(0, offset, 0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.userData.isSceneHelper = true;
    scene.add(skyMesh);

    // Stars for night
    if (timeOfDay === 'night' || timeOfDay === 'dawn' || timeOfDay === 'dusk') {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 800;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 80;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, sizeAttenuation: true });
      const stars = new THREE.Points(starGeo, starMat);
      stars.userData.isSceneHelper = true;
      scene.add(stars);
    }

    // ── Lighting
    const ambient = new THREE.AmbientLight(sky.ambientColor, sky.ambientIntensity);
    ambient.userData.isSceneHelper = true;
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(sky.sunColor, timeOfDay === 'night' ? 0.2 : 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.userData.isSceneHelper = true;
    scene.add(dirLight);

    // Hemisphere for sky bounce
    const hemi = new THREE.HemisphereLight(sky.topColor, sky.bottomColor, 0.3);
    hemi.userData.isSceneHelper = true;
    scene.add(hemi);

    // ── Ground plane (SparkRenderer layer)
    buildGround(scene, sceneGraph);

    // ── Scene elements (SparkRenderer: geometry; Three.js: interaction mesh)
    const { elements } = sceneGraph;
    elements.forEach((el, idx) => {
      const [x, y, z] = parsePositionHint(el.position_hint, idx, elements.length);
      const scale = getScaleFromImportance(el.importance);
      const eo = buildElementObject(el, x, y, z, scale);
      scene.add(eo.group);
      eo.lights?.forEach((l) => scene.add(l));
      elementObjectsRef.current.push(eo);
    });

    // Reset camera
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 4, 14);
      mouseEulerRef.current.set(0, 0, 0);
    }
  }, [sceneGraph]);

  // Update focused element label when it changes externally
  useEffect(() => {
    if (!focusedElement) {
      clearHighlights();
      return;
    }
    const eo = elementObjectsRef.current.find((e) => e.element.id === focusedElement.id);
    if (eo) highlightElement(eo);
  }, [focusedElement]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="atlas-scene-container" ref={canvasRef}>
      {!sceneGraph && (
        <div className="atlas-scene-placeholder">
          <div className="atlas-placeholder-grid" />
          <p className="atlas-placeholder-text">Enter a prompt to begin exploration</p>
        </div>
      )}
      {sceneGraph && (
        <div className="atlas-controls-hint">
          <kbd>W A S D</kbd> Move &nbsp;|&nbsp; <kbd>Click</kbd> Look / Select &nbsp;|&nbsp; <kbd>Esc</kbd> Release
        </div>
      )}
    </div>
  );
}

// ─── Ground builder ────────────────────────────────────────────────────────────
function buildGround(scene: THREE.Scene, graph: SceneGraph) {
  const loc = graph.setting.location.toLowerCase();
  const isWater = loc.includes('harbor') || loc.includes('bay') || loc.includes('sea') || loc.includes('river');
  const isStone = loc.includes('town') || loc.includes('square') || loc.includes('rome') || loc.includes('forum');

  let groundColor = 0x3a4a3a;
  if (isWater) groundColor = 0x091830;
  else if (isStone) groundColor = 0x5a5a5a;

  const groundGeo = new THREE.PlaneGeometry(60, 60, 20, 20);
  const groundMat = new THREE.MeshStandardMaterial({
    color: groundColor,
    roughness: 0.9,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  ground.userData.isSceneHelper = true;
  scene.add(ground);

  // Water shimmer for harbor scenes
  if (isWater) {
    const waterGeo = new THREE.PlaneGeometry(60, 40, 30, 30);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0d2b45,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.05, -10);
    water.userData.isSceneHelper = true;
    scene.add(water);
  }
}

// ─── Element geometry builders ─────────────────────────────────────────────────
function buildElementObject(
  el: SceneElement,
  x: number,
  y: number,
  z: number,
  scale: number
): ElementObject {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const color = getElementColor(el);
  const name = el.name.toLowerCase();

  const lights: THREE.PointLight[] = [];

  if (el.type === 'environment') {
    buildEnvironmentGeometry(group, el, color, scale);
  } else if (el.type === 'actor') {
    buildActorGeometry(group, color, scale);
  } else if (el.type === 'action') {
    buildActionGeometry(group, color, scale);
  } else {
    // object — route by name
    if (name.includes('ship') || name.includes('vessel')) {
      buildShip(group, color, scale);
    } else if (name.includes('torch') || name.includes('fire')) {
      const light = buildTorch(group, color, scale);
      lights.push(light);
    } else if (name.includes('chest') || name.includes('crate') || name.includes('box') || name.includes('tea')) {
      buildCrates(group, color, scale);
    } else if (name.includes('church') || name.includes('cathedral')) {
      buildChurch(group, color, scale);
    } else if (name.includes('well')) {
      buildWell(group, color, scale);
    } else if (name.includes('stall') || name.includes('market')) {
      buildMarketStall(group, color, scale);
    } else if (name.includes('tavern') || name.includes('alehouse') || name.includes('building') || name.includes('house')) {
      buildBuilding(group, color, scale);
    } else {
      buildGenericObject(group, color, scale);
    }
  }

  return { group, element: el, baseY: y, lights: lights.length > 0 ? lights : undefined };
}

function mat(color: number, roughness = 0.8, metalness = 0.0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function buildEnvironmentGeometry(group: THREE.Group, el: SceneElement, color: number, scale: number) {
  const name = el.name.toLowerCase();
  if (name.includes('harbor') || name.includes('water') || name.includes('sea')) {
    // Water ripple platform
    const geo = new THREE.PlaneGeometry(30 * scale, 20 * scale);
    const mesh = new THREE.Mesh(geo, mat(0x0d2b45, 0.1, 0.8));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    group.add(mesh);
  } else if (name.includes('wharf') || name.includes('dock')) {
    for (let i = -3; i <= 3; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 16 * scale), mat(0x5c3d1a));
      plank.position.set(i * 2, 0.1, 0);
      plank.castShadow = true;
      group.add(plank);
    }
    // Mooring posts
    for (let side = -1; side <= 1; side += 2) {
      for (let pos = -6; pos <= 6; pos += 3) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 6), mat(0x3d2008));
        post.position.set(side * 7, 1, pos);
        group.add(post);
      }
    }
  } else {
    // Generic ground tile
    const geo = new THREE.PlaneGeometry(20 * scale, 20 * scale);
    const mesh = new THREE.Mesh(geo, mat(color, 0.95));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}

function buildActorGeometry(group: THREE.Group, color: number, scale: number) {
  const count = Math.floor(3 + Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const figureGroup = new THREE.Group();
    const angle = (i / count) * Math.PI * 2;
    const radius = 1.5 * scale;
    figureGroup.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    figureGroup.rotation.y = -angle;

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.3 * scale, 0.8 * scale, 4, 8);
    const body = new THREE.Mesh(bodyGeo, mat(color));
    body.position.y = 0.9 * scale;
    body.castShadow = true;
    figureGroup.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22 * scale, 8, 6);
    const head = new THREE.Mesh(headGeo, mat(0xd4a57a));
    head.position.y = 1.8 * scale;
    head.castShadow = true;
    figureGroup.add(head);

    group.add(figureGroup);
  }
}

function buildActionGeometry(group: THREE.Group, color: number, scale: number) {
  const particleCount = 40;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6 * scale;
    positions[i * 3 + 1] = Math.random() * 4 * scale;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 * scale;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.3, sizeAttenuation: true }));
  group.add(points);
}

function buildShip(group: THREE.Group, _color: number, scale: number) {
  // Hull
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(4 * scale, 2 * scale, 12 * scale),
    mat(0x6b4a1a)
  );
  hull.position.y = 1 * scale;
  hull.castShadow = true;
  group.add(hull);

  // Raised center cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(3 * scale, 2.5 * scale, 4 * scale),
    mat(0x8b6914)
  );
  cabin.position.set(0, 2.5 * scale, 2 * scale);
  cabin.castShadow = true;
  group.add(cabin);

  // Masts
  for (const mz of [-3, 1]) {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 10 * scale, 6),
      mat(0x3d2008)
    );
    mast.position.set(0, 5 * scale + 1 * scale, mz * scale);
    mast.castShadow = true;
    group.add(mast);

    // Crossbar
    const yard = new THREE.Mesh(
      new THREE.BoxGeometry(5 * scale, 0.2 * scale, 0.2 * scale),
      mat(0x3d2008)
    );
    yard.position.set(0, 7 * scale, mz * scale);
    group.add(yard);
  }
}

function buildTorch(group: THREE.Group, _color: number, scale: number): THREE.PointLight {
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 1.5 * scale, 6),
    mat(0x3d2008)
  );
  stick.position.y = 0.75 * scale;
  group.add(stick);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.18 * scale, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 1.5 })
  );
  flame.position.y = 1.6 * scale;
  group.add(flame);

  const light = new THREE.PointLight(0xff8822, 2, 8);
  light.position.copy(group.position);
  light.position.y = 1.6 * scale;

  return light;
}

function buildCrates(group: THREE.Group, color: number, scale: number) {
  const positions = [
    [0, 0, 0], [1.2, 0, 0], [-0.8, 0, 1.0],
    [0.3, 1.0, 0.2], [-0.4, 1.0, -0.5],
  ];
  positions.forEach(([x, y, z]) => {
    const size = 0.8 * scale + Math.random() * 0.2 * scale;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat(color));
    crate.position.set(x * scale, y * scale + size / 2, z * scale);
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
  });
}

function buildChurch(group: THREE.Group, color: number, scale: number) {
  // Nave
  const nave = new THREE.Mesh(
    new THREE.BoxGeometry(5 * scale, 6 * scale, 10 * scale),
    mat(color)
  );
  nave.position.y = 3 * scale;
  nave.castShadow = true;
  group.add(nave);

  // Tower
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(3 * scale, 10 * scale, 3 * scale),
    mat(color - 0x111111)
  );
  tower.position.set(0, 5 * scale, -5 * scale);
  tower.castShadow = true;
  group.add(tower);

  // Roof
  const roofGeo = new THREE.ConeGeometry(4 * scale, 3 * scale, 4);
  const roof = new THREE.Mesh(roofGeo, mat(0x8b4513));
  roof.position.set(0, 7.5 * scale, 0);
  roof.castShadow = true;
  group.add(roof);

  // Spire
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.6 * scale, 4 * scale, 4),
    mat(0x666666)
  );
  spire.position.set(0, 12 * scale, -5 * scale);
  group.add(spire);
}

function buildWell(group: THREE.Group, _color: number, scale: number) {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2 * scale, 1.3 * scale, 0.8 * scale, 12),
    mat(0x9a9a9a)
  );
  base.position.y = 0.4 * scale;
  base.castShadow = true;
  group.add(base);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0 * scale, 1.0 * scale, 0.6 * scale, 12, 1, true),
    mat(0x8a8a8a)
  );
  wall.position.y = 0.9 * scale;
  group.add(wall);

  // Roof supports
  for (const dx of [-1.4, 1.4]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 2.5 * scale, 5),
      mat(0x4a2e0a)
    );
    post.position.set(dx * scale, 1.5 * scale, 0);
    group.add(post);
  }
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(3 * scale, 0.15 * scale, 0.15 * scale),
    mat(0x4a2e0a)
  );
  beam.position.y = 2.8 * scale;
  group.add(beam);
}

function buildMarketStall(group: THREE.Group, color: number, scale: number) {
  // Counter
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3 * scale, 0.8 * scale, 1.5 * scale),
    mat(0x7a5c2a)
  );
  counter.position.y = 0.7 * scale;
  counter.castShadow = true;
  group.add(counter);

  // Awning posts
  for (const dx of [-1.3, 1.3]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * scale, 0.06 * scale, 2.5 * scale, 5),
      mat(0x4a2e0a)
    );
    post.position.set(dx * scale, 1.5 * scale, -0.5 * scale);
    group.add(post);
  }

  // Awning fabric
  const awningGeo = new THREE.BoxGeometry(3.5 * scale, 0.1 * scale, 2 * scale);
  const awning = new THREE.Mesh(awningGeo, mat(color, 0.9));
  awning.position.set(0, 2.5 * scale, -0.2 * scale);
  awning.rotation.x = 0.2;
  group.add(awning);

  // Goods on counter (small boxes)
  for (let i = -1; i <= 1; i++) {
    const item = new THREE.Mesh(
      new THREE.BoxGeometry(0.5 * scale, 0.4 * scale, 0.5 * scale),
      mat(0xcc8844)
    );
    item.position.set(i * 0.8 * scale, 1.3 * scale, 0);
    group.add(item);
  }
}

function buildBuilding(group: THREE.Group, color: number, scale: number) {
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(5 * scale, 5 * scale, 6 * scale),
    mat(color)
  );
  walls.position.y = 2.5 * scale;
  walls.castShadow = true;
  group.add(walls);

  // Roof (gable)
  const roofGeo = new THREE.CylinderGeometry(0.1 * scale, 4 * scale, 2 * scale, 4);
  const roof = new THREE.Mesh(roofGeo, mat(0x5c2a0a));
  roof.position.y = 6 * scale;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 0.3 });
  for (const [wx, wy, wz] of [[-1.5, 3, 3.05], [1.5, 3, 3.05], [0, 3, -3.05]]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * scale, 1.0 * scale), winMat);
    win.position.set(wx * scale, wy * scale, wz * scale);
    if (Math.abs(wz) > 2) win.rotation.y = wz > 0 ? 0 : Math.PI;
    group.add(win);
  }
}

function buildGenericObject(group: THREE.Group, color: number, scale: number) {
  const geo = new THREE.BoxGeometry(1.5 * scale, 2 * scale, 1.5 * scale);
  const mesh = new THREE.Mesh(geo, mat(color));
  mesh.position.y = 1 * scale;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}
