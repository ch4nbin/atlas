'use client';

import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '@/state/sceneStore';
import { parsePositionHint } from '@/lib/atlas/sceneParser';
import type { SceneElement } from '@/lib/atlas/types';
import { ChatPanel } from './ChatPanel';

export function SceneViewer() {
  const {
    world,
    sceneGraph,
    isLoading,
    loadingStep,
    error,
    setFocusedElement,
    refreshCurrentWorld,
    stemExperiment,
    triggerStemInteraction,
  } = useSceneStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sparkError, setSparkError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [assetRefreshCount, setAssetRefreshCount] = useState(0);
  // Ref bridge: lets Three.js loop/handlers read/write React state without stale closures.
  const chatVisibleRef = useRef(false);
  const showChatSetterRef = useRef(setIsChatVisible);
  showChatSetterRef.current = setIsChatVisible;
  useEffect(() => { chatVisibleRef.current = isChatVisible; }, [isChatVisible]);
  const stemExperimentRef = useRef(stemExperiment);
  useEffect(() => { stemExperimentRef.current = stemExperiment; }, [stemExperiment]);

  const spzUrl =
    world?.assets?.splats?.spz_urls?.['500k'] ||
    world?.assets?.splats?.spz_urls?.['100k'] ||
    world?.assets?.splats?.spz_urls?.full_res ||
    null;

  useEffect(() => {
    if (!world || spzUrl) return;
    const timer = window.setInterval(() => {
      void refreshCurrentWorld();
      setAssetRefreshCount((v) => v + 1);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [world, spzUrl, refreshCurrentWorld]);

  useEffect(() => {
    if (!world || !spzUrl || !containerRef.current) return;
    if (useIframeFallback) return;

    let disposed = false;
    let raf = 0;
    let cleanupFns: Array<() => void> = [];

    async function setup() {
      try {
        const THREE = await import('three');
        const sparkModule = await import('@sparkjsdev/spark');
        const SparkRenderer =
          (sparkModule as any).SparkRenderer ||
          (sparkModule as any).default?.SparkRenderer;
        const SplatMesh =
          (sparkModule as any).SplatMesh ||
          (sparkModule as any).default?.SplatMesh;

        if (!SparkRenderer || !SplatMesh) {
          throw new Error('Spark package exports not found for SparkRenderer/SplatMesh');
        }

        const container = containerRef.current;
        if (!container || disposed) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.01,
          2000
        );
        camera.position.set(0, 1.7, 4);

        const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const spark = new SparkRenderer({ renderer });
        scene.add(spark);

        const splat = new SplatMesh({ url: spzUrl });
        // World Labs SPZ assets can come in a coordinate frame that appears upside-down
        // relative to our first-person camera setup. Apply a one-time upright correction.
        splat.rotation.x = Math.PI;
        splat.updateMatrixWorld(true);
        scene.add(splat);

        const isStemExperimentScene = sceneGraph?.scene_type === 'science_experiment';
        if (!isStemExperimentScene) {
          // Humanities scenes feel better with a lower eye height.
          camera.position.set(0.5, 1.02, 4);
          const worldId = world?.world_id || world?.id || '';
          const label = `${world?.display_name || ''} ${sceneGraph?.setting?.location || ''}`.toLowerCase();
          const isCastleWorld =
            worldId === '7dedbd85-3dbd-49b3-8750-9280aaca1da5' ||
            label.includes('medieval castle');
          if (isCastleWorld) {
            // Castle-specific spawn: start much farther forward.
            camera.position.set(0.5, 1.02, 1.65);
          }
        }
        let plantVisual: any = null;
        let petalsGroup: any = null;
        let flowerCenter: any = null;
        let fallbackPlantGroup: any = null;
        let flowerModel: any = null;
        let flowerKeyLight: any = null;
        let flowerFillLight: any = null;
        let contactShadow: any = null;
        if (isStemExperimentScene) {
          const plantBaseY = -0.68;
          const plantGroup = new THREE.Group();
          plantGroup.position.set(0, plantBaseY, -0.9);
          fallbackPlantGroup = new THREE.Group();
          plantGroup.add(fallbackPlantGroup);

          flowerKeyLight = new THREE.DirectionalLight(0xfff3cc, 1.15);
          flowerKeyLight.position.set(1.4, 2.3, 1.1);
          scene.add(flowerKeyLight);

          flowerFillLight = new THREE.HemisphereLight(0xffffff, 0x91b08d, 0.55);
          scene.add(flowerFillLight);

          const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.28, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0x8f5f45, roughness: 0.88, metalness: 0.08 })
          );
          pot.position.y = -0.2;
          fallbackPlantGroup.add(pot);

          contactShadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.33, 24),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })
          );
          contactShadow.rotation.x = -Math.PI / 2;
          contactShadow.position.y = -0.305;
          fallbackPlantGroup.add(contactShadow);

          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.045, 0.8, 12),
            new THREE.MeshStandardMaterial({ color: 0x4a9d61, roughness: 0.72, metalness: 0.03 })
          );
          stem.position.y = 0.18;
          fallbackPlantGroup.add(stem);

          const bud = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 14, 14),
            new THREE.MeshStandardMaterial({ color: 0x58b970, roughness: 0.68, metalness: 0.04 })
          );
          bud.position.y = 0.67;
          fallbackPlantGroup.add(bud);

          petalsGroup = new THREE.Group();
          petalsGroup.position.y = 0.67;
          petalsGroup.scale.setScalar(0.12);
          for (let i = 0; i < 6; i++) {
            const petal = new THREE.Mesh(
              new THREE.SphereGeometry(0.085, 12, 12),
              new THREE.MeshStandardMaterial({ color: 0xf79bc1, roughness: 0.58, metalness: 0.02 })
            );
            const angle = (i / 6) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0);
            petalsGroup.add(petal);
          }
          flowerCenter = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xffd664, roughness: 0.5, metalness: 0.06 })
          );
          petalsGroup.add(flowerCenter);
          fallbackPlantGroup.add(petalsGroup);

          // Optional: drop a realistic flower model at public/models/stem-flower.glb.
          // If unavailable, geometry fallback above remains active.
          try {
            const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
            const loader = new GLTFLoader();
            let gltf: any = null;
            try {
              gltf = await loader.loadAsync('/models/stem-flower.glb');
            } catch {
              gltf = await loader.loadAsync('/models/white_flower.glb');
            }
            flowerModel = gltf.scene;
            // Manual offset tuning: simple guessed placement (requested).
            flowerModel.position.set(0, -0.04, 0);
            flowerModel.scale.setScalar(0.028);
            flowerModel.traverse((obj: any) => {
              if (obj.isMesh) {
                obj.castShadow = false;
                obj.receiveShadow = false;
              }
            });
            // Hide fallback geometry when realistic model is available.
            fallbackPlantGroup.visible = false;
            plantGroup.add(flowerModel);
          } catch {
            // No model found; keep fallback geometry.
          }

          scene.add(plantGroup);
          plantVisual = plantGroup;
        }

        // --- Hybrid interaction layer (Three.js hotspot anchors over Spark world)
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(2, 2);
        const hotspotMeshes: any[] = [];
        const objectiveHitMeshes: any[] = [];
        const objectiveRootByElementId = new Map<string, any>();
        const hotspotByUuid = new Map<string, SceneElement>();
        let focusedUuid: string | null = null;
        let lastMouseX = 0;
        let lastMouseY = 0;

        const tooltip = document.createElement('div');
        tooltip.className = 'atlas-tooltip';
        tooltip.style.display = 'none';
        container.appendChild(tooltip);
        cleanupFns.push(() => tooltip.remove());

        const targetHint = document.createElement('div');
        targetHint.className = 'atlas-target-hint';
        targetHint.style.display = 'none';
        container.appendChild(targetHint);
        cleanupFns.push(() => targetHint.remove());

        const focusLabel = document.createElement('div');
        focusLabel.className = 'atlas-scene-label-overlay';
        focusLabel.style.display = 'none';
        container.appendChild(focusLabel);
        cleanupFns.push(() => focusLabel.remove());

        const targetBeacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 16, 16),
          new THREE.MeshBasicMaterial({
            color: 0xffd664,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
          })
        );
        targetBeacon.visible = false;
        scene.add(targetBeacon);

        const hotspotGeometry = new THREE.SphereGeometry(
          sceneGraph?.scene_type === 'science_experiment' ? 0.52 : 0.38,
          12,
          12
        );
        const hotspotMaterial = new THREE.MeshBasicMaterial({
          color: 0xff6ea9,
          transparent: true,
          opacity: isStemExperimentScene ? 0.0 : 0.08,
          depthWrite: false,
        });

        const STEM_OBJECTIVE_POSITIONS: Record<string, [number, number, number]> = {
          // Debug cluster: keep all objectives near flower anchor (0, -0.68, -0.9).
          sunlight_lamp: [-0.92, -0.2, 0.25],
          water_channel: [0.9, -0.2, -0.15],
          stomata_gate: [-0.96, -0.2, -2.25],
          chloroplast_core: [0.0, -0.14, -1.25],
          glucose_meter: [0.96, -0.2, -2.55],
        };

        const STEM_DEBUG_CLUSTER_POSITIONS: [number, number, number][] = [
          [-0.92, -0.2, 0.25],
          [0.9, -0.2, -0.15],
          [-0.96, -0.2, -2.25],
          [0.0, -0.14, -1.25],
          [0.96, -0.2, -2.55],
          [0.0, -0.2, 0.65],
          [-1.16, -0.2, -1.75],
          [1.16, -0.2, -1.95],
        ];

        const makeObjectiveProp = (id: string, THREERef: any) => {
          const g = new THREERef.Group();
          if (id === 'sunlight_lamp') {
            const orb = new THREERef.Mesh(
              new THREERef.SphereGeometry(0.15, 16, 16),
              new THREERef.MeshBasicMaterial({ color: 0xffe27a })
            );
            const ring = new THREERef.Mesh(
              new THREERef.TorusGeometry(0.21, 0.03, 12, 24),
              new THREERef.MeshBasicMaterial({ color: 0xfff2bf, transparent: true, opacity: 0.9 })
            );
            ring.rotation.x = Math.PI / 2;
            g.add(orb, ring);
          } else if (id === 'water_channel') {
            const drop = new THREERef.Mesh(
              new THREERef.SphereGeometry(0.13, 14, 14),
              new THREERef.MeshBasicMaterial({ color: 0x6ecbff })
            );
            drop.scale.set(0.9, 1.15, 0.9);
            g.add(drop);
          } else if (id === 'stomata_gate') {
            const ring = new THREERef.Mesh(
              new THREERef.TorusGeometry(0.17, 0.04, 10, 22),
              new THREERef.MeshBasicMaterial({ color: 0x9df0b5 })
            );
            const core = new THREERef.Mesh(
              new THREERef.SphereGeometry(0.07, 12, 12),
              new THREERef.MeshBasicMaterial({ color: 0xc9ffd7 })
            );
            g.add(ring, core);
          } else if (id === 'chloroplast_core') {
            const core = new THREERef.Mesh(
              new THREERef.IcosahedronGeometry(0.14, 0),
              new THREERef.MeshBasicMaterial({ color: 0x79d98d })
            );
            g.add(core);
          } else if (id === 'glucose_meter') {
            const cube = new THREERef.Mesh(
              new THREERef.BoxGeometry(0.2, 0.2, 0.2),
              new THREERef.MeshBasicMaterial({ color: 0xffc877 })
            );
            cube.rotation.set(0.3, 0.6, 0.15);
            g.add(cube);
          } else {
            const marker = new THREERef.Mesh(
              new THREERef.SphereGeometry(0.11, 14, 14),
              new THREERef.MeshBasicMaterial({ color: 0xff9ec2, transparent: true, opacity: 0.95 })
            );
            g.add(marker);
          }
          return g;
        };

        if (sceneGraph?.elements?.length) {
          sceneGraph.elements.forEach((el, i) => {
            const [x, y, z] = parsePositionHint(el.position_hint, i, sceneGraph.elements.length);
            const debugClusterPos = STEM_DEBUG_CLUSTER_POSITIONS[i % STEM_DEBUG_CLUSTER_POSITIONS.length];
            const objectivePos = isStemExperimentScene
              ? (STEM_OBJECTIVE_POSITIONS[el.id] || debugClusterPos)
              : null;
            const hx = objectivePos ? objectivePos[0] : x;
            const hy = objectivePos ? objectivePos[1] : y + 1.2;
            const hz = objectivePos ? objectivePos[2] : z;
            const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial.clone());
            hotspot.position.set(hx, hy, hz);
            hotspot.name = el.name;
            hotspot.userData.elementId = el.id;
            hotspot.userData.baseScale = 1;
            hotspotMeshes.push(hotspot);
            hotspotByUuid.set(hotspot.uuid, el);
            scene.add(hotspot);

            if (isStemExperimentScene) {
              const objectiveProp = makeObjectiveProp(el.id, THREE);
              if (objectiveProp) {
                objectiveProp.position.set(hx, hy - 0.05, hz);
                objectiveProp.userData.elementId = el.id;
                objectiveRootByElementId.set(el.id, objectiveProp);
                scene.add(objectiveProp);
                objectiveProp.traverse((n: any) => {
                  if (n.isMesh) {
                    objectiveHitMeshes.push(n);
                    hotspotByUuid.set(n.uuid, el);
                  }
                });
              }
            }
          });
        }

        const updateFocusUi = (el: SceneElement | null) => {
          if (!el) {
            focusedUuid = null;
            focusLabel.style.display = 'none';
            setFocusedElement(null);
            return;
          }
          focusedUuid = hotspotMeshes.find((m) => m.userData.elementId === el.id)?.uuid || null;
          focusLabel.innerHTML = `<strong>${el.name}</strong><span>${el.description}</span>`;
          focusLabel.style.display = 'block';
          setFocusedElement(el);
        };

        const pickHotspot = () => {
          raycaster.setFromCamera(pointer, camera);
          const objectiveHits = raycaster.intersectObjects(objectiveHitMeshes, false);
          if (objectiveHits.length) {
            const picked = objectiveHits[0].object;
            return hotspotByUuid.get(picked.uuid) || null;
          }
          const hits = raycaster.intersectObjects(hotspotMeshes, false);
          if (!hits.length) return null;
          const picked = hits[0].object;
          return hotspotByUuid.get(picked.uuid) || null;
        };

        const keys: Record<string, boolean> = {};
        let pointerLocked = false;
        let yaw = 0;
        let pitch = 0;

        const onResize = () => {
          if (!container) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', onResize);
        cleanupFns.push(() => window.removeEventListener('resize', onResize));

        const MOVE_KEYS = new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight']);

        const onKeyDown = (e: KeyboardEvent) => {
          // Toggle chat guide with C (unless user is typing in an input).
          const active = document.activeElement;
          const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;

          if (e.code === 'KeyC') {
            if (!isTyping) {
              e.preventDefault();
              const next = !chatVisibleRef.current;
              chatVisibleRef.current = next;
              showChatSetterRef.current(next);
              return;
            }
          }
          // STEM fallback: press E to activate current guided target.
          if (e.code === 'KeyE' && !isTyping) {
            const exp = stemExperimentRef.current;
            if (exp?.isActive && exp.nextTargetId) {
              const nextEl = sceneGraph?.elements?.find((el) => el.id === exp.nextTargetId) || null;
              if (nextEl) {
                e.preventDefault();
                updateFocusUi(nextEl);
                triggerStemInteraction(nextEl);
                chatVisibleRef.current = true;
                showChatSetterRef.current(true);
                return;
              }
            }
          }
          // Keep movement available even when the guide is open.
          // Only suppress movement key registration while user is typing in an input.
          if (MOVE_KEYS.has(e.code) && isTyping) return;
          keys[e.code] = true;
        };
        const onKeyUp = (e: KeyboardEvent) => {
          keys[e.code] = false;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        cleanupFns.push(() => {
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
        });

        const onPointerLock = () => {
          pointerLocked = document.pointerLockElement === renderer.domElement;
        };
        document.addEventListener('pointerlockchange', onPointerLock);
        cleanupFns.push(() => document.removeEventListener('pointerlockchange', onPointerLock));

        const onMouseMove = (e: MouseEvent) => {
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
          if (pointerLocked) {
            const sensitivity = 0.002;
            yaw -= e.movementX * sensitivity;
            pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch - e.movementY * sensitivity));
          } else if (container) {
            // Keep pointer in NDC for hover raycasting.
            const rect = container.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          }
        };
        document.addEventListener('mousemove', onMouseMove);
        cleanupFns.push(() => document.removeEventListener('mousemove', onMouseMove));

        const onCanvasClick = (e: MouseEvent) => {
          if (container && !pointerLocked) {
            const rect = container.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          }
          if (!pointerLocked) {
            const picked = pickHotspot();
            if (picked) {
              updateFocusUi(picked);
              triggerStemInteraction(picked);
              chatVisibleRef.current = true;
              showChatSetterRef.current(true);
              return;
            }
            renderer.domElement.requestPointerLock();
            return;
          }
          // Pointer locked: raycast from the center of the view.
          pointer.set(0, 0);
          const picked = pickHotspot();
          if (picked) {
            updateFocusUi(picked);
            triggerStemInteraction(picked);
            chatVisibleRef.current = true;
            showChatSetterRef.current(true);
          }
        };
        renderer.domElement.addEventListener('click', onCanvasClick);
        cleanupFns.push(() => renderer.domElement.removeEventListener('click', onCanvasClick));

        const velocity = new THREE.Vector3();
        const move = new THREE.Vector3();
        const clock = new THREE.Clock();
        const hoverColor = new THREE.Color(0xff8cc0);
        const focusedColor = new THREE.Color(0xff4f9a);
        const idleColor = new THREE.Color(0xff6ea9);
        const targetColor = new THREE.Color(0xffd664);

        const updateHover = () => {
          if (pointerLocked) {
            tooltip.style.display = 'none';
            return;
          }
          const exp = stemExperimentRef.current;
          const nextTargetId = exp?.isActive ? exp.nextTargetId : null;
          const picked = pickHotspot();
          if (!picked) {
            tooltip.style.display = 'none';
            hotspotMeshes.forEach((m) => {
              const mat = m.material as any;
              const isFocused = m.uuid === focusedUuid;
              const isTarget = nextTargetId && m.userData.elementId === nextTargetId;
              if (isStemExperimentScene) {
                mat.opacity = 0;
              } else {
                mat.opacity = isTarget ? 0.3 : isFocused ? 0.22 : 0.08;
                mat.color.copy(isTarget ? targetColor : isFocused ? focusedColor : idleColor);
              }
            });
            return;
          }

          tooltip.textContent = picked.name;
          tooltip.style.display = 'block';
          tooltip.style.left = `${lastMouseX - container.getBoundingClientRect().left + 12}px`;
          tooltip.style.top = `${lastMouseY - container.getBoundingClientRect().top + 12}px`;
          tooltip.style.transform = 'none';

          hotspotMeshes.forEach((m) => {
            const mat = m.material as any;
            const isPicked = m.userData.elementId === picked.id;
            const isFocused = m.uuid === focusedUuid;
            const isTarget = nextTargetId && m.userData.elementId === nextTargetId;
            if (isStemExperimentScene) {
              mat.opacity = 0;
            } else {
              mat.opacity = isPicked ? 0.28 : isTarget ? 0.3 : isFocused ? 0.22 : 0.08;
              mat.color.copy(isPicked ? hoverColor : isTarget ? targetColor : isFocused ? focusedColor : idleColor);
            }
          });
        };

        const loop = () => {
          if (disposed) return;
          const delta = Math.min(0.05, clock.getDelta());
          const speed = 3.5;

          camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
          move.set(0, 0, 0);
          if (keys['KeyW'] || keys['ArrowUp']) move.z -= 1;
          if (keys['KeyS'] || keys['ArrowDown']) move.z += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) move.x -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) move.x += 1;
          if (keys['Space']) move.y += 1;
          if (keys['ShiftLeft'] || keys['ShiftRight']) move.y -= 1;

          if (move.lengthSq() > 0) {
            move.normalize();
            velocity.copy(move).multiplyScalar(speed * delta).applyQuaternion(camera.quaternion);
            camera.position.add(velocity);
          }

          // Proximity trigger: if player gets close enough to a hotspot while moving.
          if (pointerLocked && hotspotMeshes.length) {
            for (const m of hotspotMeshes) {
              if (camera.position.distanceTo(m.position) < 1.2) {
                const el = hotspotByUuid.get(m.uuid);
                if (el) {
                  updateFocusUi(el);
                  break;
                }
              }
            }
          }

          if (isStemExperimentScene && plantVisual) {
            const exp = stemExperimentRef.current;
            const growth = exp?.plantGrowth ?? 0;
            const growthScale = 0.42 + (growth / 100) * 0.95;
            plantVisual.scale.setScalar(growthScale);

            // Flower blooming progression: petals open as steps complete.
            if (petalsGroup && !flowerModel) {
              const bloom = Math.max(0, (growth - 35) / 65);
              petalsGroup.scale.setScalar(0.12 + bloom * 1.08);
              petalsGroup.rotation.z += delta * (0.12 + bloom * 0.22);
            }
            if (flowerCenter && !flowerModel) {
              const centerMat = flowerCenter.material as any;
              centerMat.color.setHex(growth >= 90 ? 0xfff07a : 0xffd664);
            }
            if (flowerModel) {
              const bloom = Math.max(0, growth / 100);
              // Smaller baseline and softer growth curve to avoid large jumps.
              const smoothBloom = Math.pow(bloom, 1.8);
              flowerModel.scale.setScalar(0.028 + smoothBloom * 0.008);
              flowerModel.rotation.y += delta * (0.15 + bloom * 0.2);
            }
            if (contactShadow) {
              const shadowMat = contactShadow.material as any;
              shadowMat.opacity = 0.16 + (growth / 100) * 0.1;
            }
          }

          const exp = stemExperimentRef.current;
          const nextTargetId = exp?.isActive ? exp.nextTargetId : null;
          const nextTargetLabel = exp?.nextTargetLabel || 'Next Step';
          const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.12;
          let targetMesh: any = null;
          hotspotMeshes.forEach((m) => {
            const isTarget = !!nextTargetId && m.userData.elementId === nextTargetId;
            m.scale.setScalar(isTarget ? 1.15 * pulse : 1);
            if (isTarget) targetMesh = m;
          });

          objectiveRootByElementId.forEach((root, elementId) => {
            const isTarget = !!nextTargetId && elementId === nextTargetId;
            root.scale.setScalar(isTarget ? 1.1 * pulse : 1);
            root.rotation.y += delta * (isTarget ? 0.9 : 0.25);
          });

          const targetObjective = nextTargetId ? objectiveRootByElementId.get(nextTargetId) : null;
          const labelAnchor = targetObjective || targetMesh;

          if (labelAnchor) {
            const projected = labelAnchor.position.clone().project(camera);
            const x = (projected.x * 0.5 + 0.5) * container.clientWidth;
            const y = (-projected.y * 0.5 + 0.5) * container.clientHeight;
            targetHint.textContent = `Activate: ${nextTargetLabel}`;
            targetHint.style.left = `${x}px`;
            targetHint.style.top = `${Math.max(24, y - 26)}px`;
            targetHint.style.display = 'block';

            // Keep one guidance marker style: objective pulse + label.
            targetBeacon.visible = false;
          } else {
            targetHint.style.display = 'none';
            targetBeacon.visible = false;
          }

          updateHover();

          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        cleanupFns.push(() => cancelAnimationFrame(raf));
        cleanupFns.push(() => {
          hotspotGeometry.dispose();
          hotspotMeshes.forEach((m) => m.material?.dispose?.());
          targetBeacon.geometry?.dispose?.();
          targetBeacon.material?.dispose?.();
          flowerKeyLight?.dispose?.();
          scene.remove(flowerKeyLight);
          scene.remove(flowerFillLight);
          contactShadow?.geometry?.dispose?.();
          contactShadow?.material?.dispose?.();
          renderer.dispose();
          spark.dispose?.();
          container.innerHTML = '';
        });

        setSparkError(null);
      } catch (err) {
        console.error(err);
        setSparkError('Spark renderer failed to load; using Marble web viewer fallback.');
        setUseIframeFallback(true);
      }
    }

    void setup();

    return () => {
      disposed = true;
      setFocusedElement(null);
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, [world, spzUrl, useIframeFallback, sceneGraph, setFocusedElement]);

  if (!world) {
    return (
      <div className="atlas-scene-placeholder">
        <div className="atlas-placeholder-grid" />
        <div className="atlas-placeholder-text">
          {isLoading ? loadingStep || 'Generating world...' : 'Generate a world to begin'}
        </div>
        {error && <div className="atlas-error atlas-scene-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="atlas-scene-container">
      {spzUrl && !useIframeFallback ? (
        <>
          <div ref={containerRef} className="atlas-world-canvas" />
          <div className="atlas-crosshair" aria-hidden="true" />
        </>
      ) : (
        <div className="atlas-world-fallback-panel">
          <h3>{spzUrl ? 'Spark Renderer Could Not Start' : 'World Assets Still Processing'}</h3>
          <p>
            {spzUrl
              ? 'The SPZ world could not be rendered in this browser session. Use the button below to open the world directly in Marble while we keep debugging Spark integration.'
              : 'This world is available in Marble, but SPZ assets are not ready for the in-app renderer yet. Open it in Marble now, or retry once assets finish processing.'}
          </p>
          {!spzUrl && (
            <button
              className="atlas-world-open atlas-world-open-lg"
              onClick={() => void refreshCurrentWorld()}
              type="button"
            >
              Retry Asset Check ({assetRefreshCount})
            </button>
          )}
          <a
            className="atlas-world-open atlas-world-open-lg"
            href={world.world_marble_url}
            target="_blank"
            rel="noreferrer"
          >
            Open in Marble
          </a>
        </div>
      )}

      <div className="atlas-world-meta">
        <div className="atlas-world-title">{world.display_name || 'Generated World'}</div>
        <a
          className="atlas-world-open"
          href={world.world_marble_url}
          target="_blank"
          rel="noreferrer"
        >
          Open in Marble
        </a>
      </div>

      {sparkError && (
        <div className="atlas-mode-badge atlas-mode-backend_only">
          Spark failed in this browser session.
        </div>
      )}

      {sceneGraph && isChatVisible && (
        <ChatPanel onClose={() => { chatVisibleRef.current = false; setIsChatVisible(false); }} />
      )}

      {stemExperiment?.isActive && (
        <div className="atlas-stem-hud">
          <div className="atlas-stem-hud-title">Photosynthesis Lab</div>
          <div className="atlas-stem-hud-step">
            Step {Math.min(stemExperiment.currentStep + 1, stemExperiment.totalSteps)} / {stemExperiment.totalSteps}
          </div>
          <div className="atlas-stem-hud-tip">{stemExperiment.tip}</div>
          <div className="atlas-stem-meters">
            <div>Growth {stemExperiment.plantGrowth}%</div>
            <div>O₂ {stemExperiment.oxygenLevel}%</div>
          </div>
        </div>
      )}

      <div className="atlas-controls-hint">
        {stemExperiment?.isActive ? (
          <>
            Follow the glowing marker and click the highlighted hotspot to activate each step · Press <kbd>C</kbd> to open guide
          </>
        ) : (
          <>
            Click to lock pointer · <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move ·
            Press <kbd>C</kbd> or click a hotspot to open guide.
          </>
        )}
      </div>
    </div>
  );
}
