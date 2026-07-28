import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import perfumeAsset from "@/assets/perfume.glb.asset.json";

useGLTF.preload(perfumeAsset.url);

/**
 * Cinematic camera-driven journey.
 * The bottle stays anchored near origin with only a tiny idle float + micro-rotation.
 * The CAMERA moves along a smooth Catmull-Rom path between per-section keyframes
 * as the user scrolls the whole document. Inspired by Apple product films.
 *
 * Scroll t (0..1 over the full page) maps to camera keyframes:
 *  0.00  Hero        — front, spotlight
 *  0.22  Trio        — slight orbit right, dolly in
 *  0.45  Showcase    — orbit left, low angle
 *  0.70  Ingredients — side profile, dolly out, framed left
 *  1.00  Final CTA   — pedestal front, slightly elevated
 */
type CamKey = {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
};

const CAM_KEYS: CamKey[] = [
  { pos: [0.0, 0.15, 3.6],  look: [0, 0, 0],     fov: 26 }, // hero
  { pos: [0.9, 0.25, 3.2],  look: [0, 0.05, 0],  fov: 24 }, // trio
  { pos: [-1.1, 0.05, 3.0], look: [0, 0.0, 0],   fov: 22 }, // showcase
  { pos: [1.4, 0.35, 3.4],  look: [-0.15, 0, 0], fov: 25 }, // ingredients (bottle sits left in frame)
  { pos: [0.0, 0.55, 3.0],  look: [0, -0.05, 0], fov: 22 }, // final cta pedestal
];
const CAM_STOPS = [0.0, 0.22, 0.45, 0.7, 1.0];

function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function sampleCam(scroll: number): CamKey {
  const s = Math.max(0, Math.min(1, scroll));
  let i = 0;
  for (; i < CAM_STOPS.length - 1; i++) {
    if (s <= CAM_STOPS[i + 1]) break;
  }
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[Math.min(i + 1, CAM_KEYS.length - 1)];
  const t = easeInOut((s - CAM_STOPS[i]) / (CAM_STOPS[i + 1] - CAM_STOPS[i] || 1));
  const lerp3 = (u: [number, number, number], v: [number, number, number]): [number, number, number] => [
    u[0] + (v[0] - u[0]) * t,
    u[1] + (v[1] - u[1]) * t,
    u[2] + (v[2] - u[2]) * t,
  ];
  return {
    pos: lerp3(a.pos, b.pos),
    look: lerp3(a.look, b.look),
    fov: a.fov + (b.fov - a.fov) * t,
  };
}

function Rig({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state) => {
    const p = progressRef.current;
    const key = sampleCam(p);
    const time = state.clock.getElapsedTime();

    // Base camera pose from scroll
    desiredPos.set(key.pos[0], key.pos[1], key.pos[2]);

    // Very gentle continuous orbit + breathing dolly — Apple-film cadence
    const orbitAngle = time * 0.06;
    desiredPos.x += Math.sin(orbitAngle) * 0.08;
    desiredPos.y += Math.sin(time * 0.4) * 0.015;
    desiredPos.z += Math.sin(time * 0.25) * 0.04;

    camera.position.lerp(desiredPos, 0.04);

    target.set(key.look[0], key.look[1], key.look[2]);
    currentLook.lerp(target, 0.06);
    camera.lookAt(currentLook);

    // Responsive FOV: tighter on desktop, slightly wider on narrow screens
    const isNarrow = size.width < 768;
    const targetFov = key.fov + (isNarrow ? 6 : 0);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (targetFov - cam.fov) * 0.05;
    cam.updateProjectionMatrix();
  });

  return null;
}

function Bottle({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(perfumeAsset.url);
  const { size } = useThree();

  // Scale target: keep bottle ~28-32% of viewport height on desktop, ~35% on mobile.
  // Model unit is arbitrary — tuned by eye at fov ~24 / dist ~3.2.
  const baseScale = size.width < 768 ? 0.95 : 0.8;

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.getElapsedTime();
    const p = progressRef.current;

    // Bottle stays anchored. Tiny idle breathing motion only.
    const idleY = Math.sin(time * 0.7) * 0.015;   // ~2-3px on screen
    const idleX = Math.cos(time * 0.5) * 0.006;

    group.current.position.lerp(new THREE.Vector3(idleX, idleY, 0), 0.06);

    // Micro rotation: total range ~10°, extremely slow. Small scroll-linked yaw for storytelling.
    const scrollYaw = (p - 0.5) * 0.18;                  // ±~5°
    const idleYaw = Math.sin(time * 0.25) * 0.05;        // ~3° breathing
    const idlePitch = Math.sin(time * 0.2) * 0.03;       // ~1.7°
    group.current.rotation.y += (scrollYaw + idleYaw - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (idlePitch - group.current.rotation.x) * 0.03;
    group.current.rotation.z += (Math.sin(time * 0.18) * 0.02 - group.current.rotation.z) * 0.03;

    const s = THREE.MathUtils.lerp(group.current.scale.x || baseScale, baseScale, 0.08);
    group.current.scale.setScalar(s);
  });

  return (
    <group ref={group} scale={baseScale}>
      <primitive object={scene} />
    </group>
  );
}

export function BottleJourney() {
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const p = scrollable > 0 ? window.scrollY / scrollable : 0;
      progressRef.current = Math.max(0, Math.min(1, p));
      // Fade the featured card image out shortly after leaving hero
      const handoff = Math.max(0, Math.min(1, (progressRef.current - 0.12) / 0.06));
      doc.style.setProperty("--bottle-handoff", String(handoff));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      aria-hidden
      style={{ opacity: 1 }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.15, 3.6], fov: 26 }}
        shadows
      >
        {/* Cinematic three-point lighting */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[3.5, 5, 3]}
          intensity={1.8}
          color="#fff2dc"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Warm rim */}
        <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#ffb37a" />
        {/* Cool fill */}
        <directionalLight position={[-2, 1.5, 4]} intensity={0.5} color="#9ac4ff" />
        {/* Key highlight kicker */}
        <pointLight position={[0, 2.4, 2]} intensity={0.7} color="#ffe8c2" />

        <Suspense fallback={null}>
          <Bottle progressRef={progressRef} />
          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.5}
            scale={5}
            blur={2.6}
            far={2}
            resolution={512}
          />
        </Suspense>
        <Rig progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
