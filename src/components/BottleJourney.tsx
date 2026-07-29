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
  const inner = useRef<THREE.Group>(null);
  const { scene } = useGLTF(perfumeAsset.url);
  const { camera, size } = useThree();

  // Fixed premium scale — keeps bottle roughly 22–28% of viewport height.
  const baseScale = size.width < 480 ? 0.22 : size.width < 768 ? 0.28 : 0.38;

  const ndc = useMemo(() => new THREE.Vector3(), []);
  const cardWorld = useMemo(() => new THREE.Vector3(), []);
  const emergePos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const showcasePos = useMemo(() => new THREE.Vector3(-0.55, 0.05, 0), []);
  const emergeCaptured = useRef(false);

  useFrame((state) => {
    if (!group.current || !inner.current) return;
    const s = stateRef.current;
    const time = state.clock.getElapsedTime();
    const p = s.p;

    if (s.hasCard) {
      const ndcX = (s.cardX / size.width) * 2 - 1;
      const ndcY = -(s.cardY / size.height) * 2 + 1;
      ndc.set(ndcX, ndcY, 0.5).unproject(camera);
      ndc.sub(camera.position).normalize();
      const dist = -camera.position.z / ndc.z;
      cardWorld.copy(camera.position).add(ndc.multiplyScalar(dist));
    }

    if (p <= 0.15 || !emergeCaptured.current) {
      emergePos.copy(cardWorld);
      if (p > 0.15) emergeCaptured.current = true;
    }

    // Emerge (0 → 0.15): sit on the card. Travel (0.15 → 1): ease to showcase.
    let travelT = 0;
    if (p <= 0.15) {
      target.copy(cardWorld);
    } else {
      travelT = easeInOut((p - 0.15) / 0.85);
      target.lerpVectors(emergePos, showcasePos, travelT);
    }

    // Micro idle — 2–3 px on screen.
    target.x += Math.cos(time * 0.5) * 0.006;
    target.y += Math.sin(time * 0.7) * 0.012;

    group.current.position.lerp(target, 0.08);

    // Cinematic rotation while travelling — graceful full yaw with subtle
    // pitch/roll for weight and inertia. Idle sway when at rest.
    const travelYaw = travelT * Math.PI * 2;
    const travelPitch = Math.sin(travelT * Math.PI) * 0.35;
    const travelRoll = Math.sin(travelT * Math.PI) * 0.14;
    const idleYaw = Math.sin(time * 0.22) * 0.06;
    const idlePitch = Math.sin(time * 0.18) * 0.025;
    inner.current.rotation.y += (travelYaw + idleYaw - inner.current.rotation.y) * 0.06;
    inner.current.rotation.x += (travelPitch + idlePitch - inner.current.rotation.x) * 0.06;
    inner.current.rotation.z += (travelRoll - inner.current.rotation.z) * 0.06;

    const scl = THREE.MathUtils.lerp(group.current.scale.x || baseScale, baseScale, 0.08);
    group.current.scale.setScalar(scl);
  });

  return (
    <group ref={group} scale={baseScale}>
      <group ref={inner}>
        <group rotation={[0, Math.PI, 0]}>
          <primitive object={scene} />
        </group>
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

  useFrame((st) => {
    const p = stateRef.current.p;
    const time = st.clock.getElapsedTime();

    let fovTarget = 24;
    if (p <= 0.15) {
      desired.copy(k0);
      fovTarget = 24;
    } else {
      const t = easeInOut((p - 0.15) / 0.85);
      desired.lerpVectors(k0, k1, t);
      fovTarget = 24 + (21 - 24) * t;
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
      const showcase = document.getElementById("story");
      const cardImg = document.querySelector(
        'img[alt="Riya Sheikh"]',
      ) as HTMLImageElement | null;
      const vh = window.innerHeight;

      if (trio && showcase && cardImg) {
        const cardRect = cardImg.getBoundingClientRect();
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const showRect = showcase.getBoundingClientRect();

        // Journey starts when the featured card's CENTER reaches the viewport center.
        // Journey ends when Showcase's bottom reaches 60% of the viewport.
        const startDelta = vh * 0.5 - cardCenterY;
        const totalRange = showRect.bottom - vh * 0.6 - (cardCenterY - vh * 0.5);
        const raw = totalRange > 0 ? startDelta / totalRange : 0;
        const clamped = Math.max(0, Math.min(1, raw));
        stateRef.current.p = clamped;

        const shouldShow = raw > 0 && raw < 1.01;
        if (shouldShow !== currentlyVisible) {
          currentlyVisible = shouldShow;
          setVisible(shouldShow);
        }

        const handoff = Math.max(0, Math.min(1, clamped / 0.08));
        document.documentElement.style.setProperty("--bottle-handoff", String(handoff));

        stateRef.current.cardX = cardRect.left + cardRect.width / 2;
        stateRef.current.cardY = cardCenterY;
        stateRef.current.hasCard = true;
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
