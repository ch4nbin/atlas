'use client';

import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '@/state/sceneStore';
import { parsePositionHint } from '@/lib/atlas/sceneParser';
import type { SceneElement } from '@/lib/atlas/types';
import { ChatPanel } from './ChatPanel';

export function SceneViewer() {
  const { world, sceneGraph, isLoading, loadingStep, error, setFocusedElement } = useSceneStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sparkError, setSparkError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  // Ref bridge: lets Three.js loop/handlers read/write React state without stale closures.
  const chatVisibleRef = useRef(false);
  const showChatSetterRef = useRef(setIsChatVisible);
  showChatSetterRef.current = setIsChatVisible;
  useEffect(() => { chatVisibleRef.current = isChatVisible; }, [isChatVisible]);

  const spzUrl =
    world?.assets?.splats?.spz_urls?.['500k'] ||
    world?.assets?.splats?.spz_urls?.['100k'] ||
    world?.assets?.splats?.spz_urls?.full_res ||
    null;

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

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

        // --- Hybrid interaction layer (Three.js hotspot anchors over Spark world)
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(2, 2);
        const hotspotMeshes: any[] = [];
        const hotspotByUuid = new Map<string, SceneElement>();
        let focusedUuid: string | null = null;
        let lastMouseX = 0;
        let lastMouseY = 0;

        const tooltip = document.createElement('div');
        tooltip.className = 'atlas-tooltip';
        tooltip.style.display = 'none';
        container.appendChild(tooltip);
        cleanupFns.push(() => tooltip.remove());

        const focusLabel = document.createElement('div');
        focusLabel.className = 'atlas-scene-label-overlay';
        focusLabel.style.display = 'none';
        container.appendChild(focusLabel);
        cleanupFns.push(() => focusLabel.remove());

        const hotspotGeometry = new THREE.SphereGeometry(0.38, 18, 18);
        const hotspotMaterial = new THREE.MeshBasicMaterial({
          color: 0xff6ea9,
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
        });

        if (sceneGraph?.elements?.length) {
          sceneGraph.elements.forEach((el, i) => {
            const [x, y, z] = parsePositionHint(el.position_hint, i, sceneGraph.elements.length);
            const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial.clone());
            hotspot.position.set(x, y + 1.2, z);
            hotspot.name = el.name;
            hotspot.userData.elementId = el.id;
            hotspot.userData.baseScale = 1;
            hotspotMeshes.push(hotspot);
            hotspotByUuid.set(hotspot.uuid, el);
            scene.add(hotspot);
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

        const MOVE_KEYS = new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

        const onKeyDown = (e: KeyboardEvent) => {
          // Toggle chat guide with C (unless user is typing in an input).
          if (e.code === 'KeyC') {
            const active = document.activeElement;
            const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
            if (!isTyping) {
              e.preventDefault();
              const next = !chatVisibleRef.current;
              chatVisibleRef.current = next;
              showChatSetterRef.current(next);
              return;
            }
          }
          // Block movement keys while the guide is open.
          if (chatVisibleRef.current && MOVE_KEYS.has(e.code)) return;
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

        const onCanvasClick = () => {
          if (!pointerLocked) {
            const picked = pickHotspot();
            if (picked) {
              updateFocusUi(picked);
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

        const updateHover = () => {
          if (pointerLocked) {
            tooltip.style.display = 'none';
            return;
          }
          const picked = pickHotspot();
          if (!picked) {
            tooltip.style.display = 'none';
            hotspotMeshes.forEach((m) => {
              const mat = m.material as any;
              mat.opacity = m.uuid === focusedUuid ? 0.22 : 0.08;
              mat.color.copy(m.uuid === focusedUuid ? focusedColor : idleColor);
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
            mat.opacity = isPicked ? 0.28 : isFocused ? 0.22 : 0.08;
            mat.color.copy(isPicked ? hoverColor : isFocused ? focusedColor : idleColor);
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

          updateHover();

          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        cleanupFns.push(() => cancelAnimationFrame(raf));
        cleanupFns.push(() => {
          hotspotGeometry.dispose();
          hotspotMeshes.forEach((m) => m.material?.dispose?.());
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
          <h3>Spark Renderer Could Not Start</h3>
          <p>
            The SPZ world could not be rendered in this browser session. Use the button below to
            open the world directly in Marble while we keep debugging Spark integration.
          </p>
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

      <div className="atlas-controls-hint">
        Click to lock pointer · <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move ·
        Press <kbd>C</kbd> or click a hotspot to open guide.
      </div>
    </div>
  );
}
