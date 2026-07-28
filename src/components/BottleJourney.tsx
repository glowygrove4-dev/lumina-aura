import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import perfumeAsset from "@/assets/perfume.glb.asset.json";

useGLTF.preload(perfumeAsset.url);

/**
 * Scroll-driven bottle journey — Trio → Showcase → Ingredients only.
 * The bottle is completely hidden until the Trio section reaches 40% of the
 * viewport. It emerges from the featured card's exact screen position, then
 * travels along an eased path to Showcase and finally to Ingredients, where
 * it comes to rest. Camera does most of the movement; bottle scale is fixed
 * and stays well under 30% of viewport height on desktop.
 */

type JourneyState = {
  p: number;           // 0..1 across trio-start → ingredients-end
  cardX: number;       // featured card center — screen px
  cardY: number;
  hasCard: boolean;
};

function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function Bottle({ stateRef }: { stateRef: React.MutableRefObject<JourneyState> }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(perfumeAsset.url);
  const { camera, size } = useThree();

  // Fixed premium scale — keeps bottle roughly 25–28% of viewport height.
  const baseScale = size.width < 768 ? 0.65 : 0.5;

  const ndc = useMemo(() => new THREE.Vector3(), []);
  const cardWorld = useMemo(() => new THREE.Vector3(), []);
  const emergePos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const showcasePos = useMemo(() => new THREE.Vector3(-0.55, 0.05, 0), []);
  const ingredientsPos = useMemo(() => new THREE.Vector3(-0.8, -0.05, 0), []);
  const emergeCaptured = useRef(false);

  useFrame((state) => {
    if (!group.current) return;
    const s = stateRef.current;
    const time = state.clock.getElapsedTime();
    const p = s.p;

    // Unproject the featured card's screen position to the z=0 world plane.
    if (s.hasCard) {
      const ndcX = (s.cardX / size.width) * 2 - 1;
      const ndcY = -(s.cardY / size.height) * 2 + 1;
      ndc.set(ndcX, ndcY, 0.5).unproject(camera);
      ndc.sub(camera.position).normalize();
      const dist = -camera.position.z / ndc.z;
      cardWorld.copy(camera.position).add(ndc.multiplyScalar(dist));
    }

    // While still emerging, keep emergePos tracking the live card.
    // Once we cross into the travel phase, freeze it as the path origin.
    if (p <= 0.15 || !emergeCaptured.current) {
      emergePos.copy(cardWorld);
      if (p > 0.15) emergeCaptured.current = true;
    }

    if (p <= 0.15) {
      // Emerge from card — bottle sits exactly on the featured card center.
      target.copy(cardWorld);
    } else if (p <= 0.55) {
      const t = easeInOut((p - 0.15) / 0.4);
      target.lerpVectors(emergePos, showcasePos, t);
    } else {
      const t = easeInOut((p - 0.55) / 0.45);
      target.lerpVectors(showcasePos, ingredientsPos, t);
    }

    // Micro idle — 2–3 px on screen.
    target.x += Math.cos(time * 0.5) * 0.006;
    target.y += Math.sin(time * 0.7) * 0.012;

    group.current.position.lerp(target, 0.08);

    // Slow, purposeful rotation — no random drift.
    const idleYaw = Math.sin(time * 0.22) * 0.06;
    const idlePitch = Math.sin(time * 0.18) * 0.025;
    group.current.rotation.y += (idleYaw - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (idlePitch - group.current.rotation.x) * 0.03;

    const scl = THREE.MathUtils.lerp(group.current.scale.x || baseScale, baseScale, 0.08);
    group.current.scale.setScalar(scl);
  });

  return (
    <group ref={group} scale={baseScale}>
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function Rig({ stateRef }: { stateRef: React.MutableRefObject<JourneyState> }) {
  const { camera, size } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);

  // Camera keyframes — camera does most of the work.
  const k0 = useMemo(() => new THREE.Vector3(0.0, 0.15, 3.8), []); // emerge
  const k1 = useMemo(() => new THREE.Vector3(0.55, 0.2, 4.2), []); // showcase
  const k2 = useMemo(() => new THREE.Vector3(0.35, 0.35, 4.6), []); // ingredients

  useFrame((st) => {
    const p = stateRef.current.p;
    const time = st.clock.getElapsedTime();

    let fovTarget = 24;
    if (p <= 0.15) {
      desired.copy(k0);
      fovTarget = 24;
    } else if (p <= 0.55) {
      const t = easeInOut((p - 0.15) / 0.4);
      desired.lerpVectors(k0, k1, t);
      fovTarget = 24 + (21 - 24) * t;
    } else {
      const t = easeInOut((p - 0.55) / 0.45);
      desired.lerpVectors(k1, k2, t);
      fovTarget = 21 + (19 - 21) * t;
    }

    // Gentle continuous breathing — cinematic, never random.
    desired.x += Math.sin(time * 0.08) * 0.05;
    desired.y += Math.sin(time * 0.3) * 0.01;

    camera.position.lerp(desired, 0.05);
    camera.lookAt(0, 0, 0);

    const cam = camera as THREE.PerspectiveCamera;
    const fov = fovTarget + (size.width < 768 ? 6 : 0);
    cam.fov += (fov - cam.fov) * 0.05;
    cam.updateProjectionMatrix();
  });

  return null;
}

export function BottleJourney() {
  const stateRef = useRef<JourneyState>({ p: 0, cardX: 0, cardY: 0, hasCard: false });
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    let currentlyVisible = false;

    const tick = () => {
      const trio = document.getElementById("trio");
      const ing = document.getElementById("ingredients");
      const vh = window.innerHeight;

      if (trio && ing) {
        const trioRect = trio.getBoundingClientRect();
        const ingRect = ing.getBoundingClientRect();

        // Journey starts when Trio's top crosses 40% of the viewport.
        // Journey ends when Ingredients' bottom reaches 60% of the viewport.
        const startDelta = vh * 0.4 - trioRect.top;
        const totalRange = ingRect.bottom - vh * 0.6 - (trioRect.top - vh * 0.4);
        const raw = totalRange > 0 ? startDelta / totalRange : 0;
        const clamped = Math.max(0, Math.min(1, raw));
        stateRef.current.p = clamped;

        // Visibility: strictly Trio → Ingredients. Never in Hero, never after.
        const shouldShow = raw > 0 && raw < 1.01;
        if (shouldShow !== currentlyVisible) {
          currentlyVisible = shouldShow;
          setVisible(shouldShow);
        }

        // Card image handoff — the featured card's <img> fades as the real
        // 3D bottle emerges, so the switchover is invisible.
        const handoff = Math.max(0, Math.min(1, clamped / 0.08));
        document.documentElement.style.setProperty("--bottle-handoff", String(handoff));

        // Featured card screen position — anchor for the emerge phase.
        const cardImg = document.querySelector(
          'img[alt="Riya Sheikh"]',
        ) as HTMLImageElement | null;
        if (cardImg) {
          const r = cardImg.getBoundingClientRect();
          stateRef.current.cardX = r.left + r.width / 2;
          stateRef.current.cardY = r.top + r.height / 2;
          stateRef.current.hasCard = true;
        }
      } else {
        if (currentlyVisible) {
          currentlyVisible = false;
          setVisible(false);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-700"
      aria-hidden
      style={{ opacity: visible ? 1 : 0 }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.15, 3.8], fov: 24 }}
        shadows
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[3.5, 5, 3]}
          intensity={1.8}
          color="#fff2dc"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#ffb37a" />
        <directionalLight position={[-2, 1.5, 4]} intensity={0.5} color="#9ac4ff" />
        <pointLight position={[0, 2.4, 2]} intensity={0.7} color="#ffe8c2" />

        <Suspense fallback={null}>
          <Bottle stateRef={stateRef} />
          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.5}
            scale={5}
            blur={2.6}
            far={2}
            resolution={512}
          />
        </Suspense>
        <Rig stateRef={stateRef} />
      </Canvas>
    </div>
  );
}
