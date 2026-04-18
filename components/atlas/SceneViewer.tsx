'use client';

import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '@/state/sceneStore';

export function SceneViewer() {
  const { world, isLoading, loadingStep, error } = useSceneStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sparkError, setSparkError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

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
        const { SparkRenderer, SplatMesh } = await import('@sparkjsdev/spark');

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
        scene.add(splat);

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

        const onKeyDown = (e: KeyboardEvent) => {
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
          if (!pointerLocked) return;
          const sensitivity = 0.002;
          yaw -= e.movementX * sensitivity;
          pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch - e.movementY * sensitivity));
        };
        document.addEventListener('mousemove', onMouseMove);
        cleanupFns.push(() => document.removeEventListener('mousemove', onMouseMove));

        const onCanvasClick = () => {
          renderer.domElement.requestPointerLock();
        };
        renderer.domElement.addEventListener('click', onCanvasClick);
        cleanupFns.push(() => renderer.domElement.removeEventListener('click', onCanvasClick));

        const velocity = new THREE.Vector3();
        const move = new THREE.Vector3();
        const clock = new THREE.Clock();

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

          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        cleanupFns.push(() => cancelAnimationFrame(raf));
        cleanupFns.push(() => {
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
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, [world, spzUrl, useIframeFallback]);

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
        <div ref={containerRef} className="atlas-world-canvas" />
      ) : (
        <iframe
          className="atlas-world-frame"
          src={world.world_marble_url}
          title={world.display_name || 'World Labs Marble World'}
          allow="fullscreen; xr-spatial-tracking"
          loading="eager"
        />
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
          Spark failed in this browser session, using Marble viewer fallback.
        </div>
      )}

      <div className="atlas-controls-hint">
        Click to lock pointer and move with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>.
        Use <kbd>Back</kbd> to return to prompt.
      </div>
    </div>
  );
}
