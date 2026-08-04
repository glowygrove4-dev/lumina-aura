import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import perfumeAsset from "@/assets/perfume.glb.asset.json";
import { journey, useJourneyStore } from "@/journey/state";
import {
  CAMERA_PATH,
  CHAPTER_COUNT,
  bottleTargetFor,
  clamp01,
  easeInOut,
  fovFor,
} from "@/journey/chapters";
import { JourneyStage } from "@/journey/JourneyStage";

useGLTF.preload(perfumeAsset.url);

/**
 * One persistent Canvas, one bottle, one continuous camera shot.
 *
 * Act I  (unchanged): the bottle emerges from the featured Trio card and
 *          travels to the Showcase section.
 * Act II  (chapters 5–12): the same object continues through the scent trail,
 *          glass shatter, light tunnel, aura, macro, wave, pedestal and final
 *          hero — driven by scroll progress across #journey-chapters.
 */

function Bottle() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { scene } = useGLTF(perfumeAsset.url);
  const { camera, size } = useThree();

  // Height of the raw model in world units — used to derive a scale that keeps
  // the bottle at a fixed fraction of the viewport, whatever the camera does.
  const modelHeight = useRef(0);
  const heightFraction = size.width < 480 ? 0.32 : size.width < 768 ? 0.28 : 0.24;

  const ndc = useMemo(() => new THREE.Vector3(), []);
  const cardWorld = useMemo(() => new THREE.Vector3(), []);
  const emergePos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const chapterPos = useMemo(() => new THREE.Vector3(), []);
  const showcasePos = useMemo(() => new THREE.Vector3(-0.55, 0.05, 0), []);
  const emergeCaptured = useRef(false);

  useFrame((state) => {
    if (!group.current || !inner.current) return;
    const time = state.clock.getElapsedTime();
    const p = journey.p;

    if (journey.hasCard) {
      const ndcX = (journey.cardX / size.width) * 2 - 1;
      const ndcY = -(journey.cardY / size.height) * 2 + 1;
      ndc.set(ndcX, ndcY, 0.5).unproject(camera);
      ndc.sub(camera.position).normalize();
      const dist = -camera.position.z / ndc.z;
      cardWorld.copy(camera.position).add(ndc.multiplyScalar(dist));
    }

    if (p <= 0.15 || !emergeCaptured.current) {
      emergePos.copy(cardWorld);
      if (p > 0.15) emergeCaptured.current = true;
    }

    // ---- Act I: emerge from the card, then travel to Showcase.
    let travelT = 0;
    if (p <= 0.15) {
      target.copy(cardWorld);
    } else {
      travelT = easeInOut((p - 0.15) / 0.85);
      target.lerpVectors(emergePos, showcasePos, travelT);
    }

    // ---- Act II: hand the same object to the chapter keyframes.
    const c = journey.c;
    if (journey.inChapters) {
      bottleTargetFor(c, chapterPos);
      const handoff = clamp01(c / 0.08);
      target.lerp(chapterPos, easeInOut(handoff));
    }

    // Micro idle — a couple of pixels of weightless drift.
    target.x += Math.cos(time * 0.5) * 0.006;
    target.y += Math.sin(time * 0.7) * 0.012;

    group.current.position.lerp(target, 0.08);

    // Rotation: cinematic spin during Act I flight, then restrained motion so
    // the label always stays readable (never more than a few degrees away).
    const pointerYaw = journey.pointerX * 0.05; // ≈3°
    const pointerPitch = -journey.pointerY * 0.03;
    let yaw: number;
    let pitch: number;
    let roll: number;

    if (journey.inChapters) {
      const drift = 1 - clamp01(c / 0.1);
      yaw = travelT * Math.PI * 2 * drift + Math.sin(time * 0.16) * 0.09 + pointerYaw;
      pitch = Math.sin(time * 0.13) * 0.025 + pointerPitch;
      roll = Math.sin(time * 0.1) * 0.012;
    } else {
      yaw = travelT * Math.PI * 2 + Math.sin(time * 0.22) * 0.06 + pointerYaw;
      pitch = Math.sin(travelT * Math.PI) * 0.35 + Math.sin(time * 0.18) * 0.025 + pointerPitch;
      roll = Math.sin(travelT * Math.PI) * 0.14;
    }

    inner.current.rotation.y += (yaw - inner.current.rotation.y) * 0.06;
    inner.current.rotation.x += (pitch - inner.current.rotation.x) * 0.06;
    inner.current.rotation.z += (roll - inner.current.rotation.z) * 0.06;

    if (!modelHeight.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const worldScale = group.current.getWorldScale(new THREE.Vector3()).y || 1;
      modelHeight.current = Math.max(0.001, (box.max.y - box.min.y) / worldScale);
    }

    // Framing-locked scale: never more than ~27-34% of the viewport height.
    const cam = camera as THREE.PerspectiveCamera;
    const dist = Math.max(0.4, camera.position.distanceTo(group.current.position));
    const visibleHeight = 2 * Math.tan((cam.fov * Math.PI) / 360) * dist;
    const baseScale = (visibleHeight * heightFraction) / modelHeight.current;
    const scl = THREE.MathUtils.lerp(group.current.scale.x || baseScale, baseScale, 0.08);
    group.current.scale.setScalar(scl);
  });

  return (
    <group ref={group} scale={0.2}>
      <group ref={inner}>
        <group rotation={[0, Math.PI, 0]}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

function Rig() {
  const { camera, size } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const pathPos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const smoothLook = useMemo(() => new THREE.Vector3(), []);

  const k0 = useMemo(() => new THREE.Vector3(0.0, 0.15, 3.8), []); // emerge
  const k1 = useMemo(() => new THREE.Vector3(0.55, 0.2, 4.2), []); // showcase

  useFrame((st) => {
    const p = journey.p;
    const time = st.clock.getElapsedTime();
    const mobileBoost = size.width < 768 ? 6 : 0;
    let fovTarget: number;

    if (journey.inChapters) {
      // One unbroken Bézier-like camera path across all chapters.
      CAMERA_PATH.getPoint(clamp01(journey.c), pathPos);
      desired.copy(pathPos);
      // Very subtle orbit + scroll-velocity inertia.
      const orbit = 0.16;
      desired.x += Math.sin(time * 0.1) * orbit;
      desired.z += Math.cos(time * 0.09) * orbit * 0.6;
      desired.y += Math.sin(time * 0.24) * 0.02 + journey.velocity * 0.12;
      fovTarget = fovFor(journey.c, mobileBoost);
      look.set(Math.sin(time * 0.07) * 0.02, journey.velocity * -0.04, 0);
    } else if (p <= 0.15) {
      desired.copy(k0);
      fovTarget = 24 + mobileBoost;
      look.set(0, 0, 0);
    } else {
      const t = easeInOut((p - 0.15) / 0.85);
      desired.lerpVectors(k0, k1, t);
      fovTarget = 24 + (21 - 24) * t + mobileBoost;
      look.set(0, 0, 0);
    }

    desired.x += Math.sin(time * 0.08) * 0.05;
    desired.y += Math.sin(time * 0.3) * 0.01;

    camera.position.lerp(desired, 0.05);
    smoothLook.lerp(look, 0.04);
    camera.lookAt(smoothLook);

    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (fovTarget - cam.fov) * 0.05;
    cam.updateProjectionMatrix();
  });

  return null;
}

export function BottleJourney() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const setChapter = useJourneyStore((s) => s.setChapter);
  const setActive = useJourneyStore((s) => s.setActive);

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    let currentlyVisible = false;
    let lastScroll = window.scrollY;

    const onPointer = (e: PointerEvent) => {
      journey.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      journey.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const tick = () => {
      const trio = document.getElementById("trio");
      const showcase = document.getElementById("story");
      const chapters = document.getElementById("journey-chapters");
      const cardImg = document.querySelector('img[alt="Riya Sheikh"]') as HTMLImageElement | null;
      const vh = window.innerHeight;

      // Smoothed scroll velocity (drives camera inertia + scent reactivity).
      const y = window.scrollY;
      const raw = (y - lastScroll) / vh;
      lastScroll = y;
      journey.velocity += (raw - journey.velocity) * 0.12;

      let actIVisible = false;
      if (trio && showcase && cardImg) {
        const cardRect = cardImg.getBoundingClientRect();
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const showRect = showcase.getBoundingClientRect();

        const startDelta = vh * 0.5 - cardCenterY;
        const totalRange = showRect.bottom - vh * 0.6 - (cardCenterY - vh * 0.5);
        const rawP = totalRange > 0 ? startDelta / totalRange : 0;
        journey.p = Math.max(0, Math.min(1, rawP));
        actIVisible = rawP > 0 && rawP < 1.01;

        const handoff = Math.max(0, Math.min(1, journey.p / 0.08));
        document.documentElement.style.setProperty("--bottle-handoff", String(handoff));

        journey.cardX = cardRect.left + cardRect.width / 2;
        journey.cardY = cardCenterY;
        journey.hasCard = true;
      }

      // ---- Act II progress across the chapter container.
      let chaptersVisible = false;
      if (chapters) {
        const r = chapters.getBoundingClientRect();
        const span = r.height - vh;
        const c = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
        chaptersVisible = r.top < vh && r.bottom > 0;
        journey.c = c;
        journey.inChapters = chaptersVisible;
        const f = c * CHAPTER_COUNT;
        const ch = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor(f)));
        journey.chapter = ch;
        journey.chapterT = Math.max(0, Math.min(1, f - ch));
        if (chaptersVisible) setChapter(ch);
      } else {
        journey.inChapters = false;
      }

      const shouldShow = actIVisible || chaptersVisible;
      if (shouldShow !== currentlyVisible) {
        currentlyVisible = shouldShow;
        setVisible(shouldShow);
        setActive(shouldShow);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [setChapter, setActive]);

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
          <Bottle />
          <JourneyStage />
          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.5}
            scale={5}
            blur={2.6}
            far={2}
            resolution={512}
          />
        </Suspense>
        <Rig />
      </Canvas>
    </div>
  );
}
