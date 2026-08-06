import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import perfumeAsset from "@/assets/perfume.glb.asset.json";
import { journey, useJourneyStore } from "@/journey/state";
import {
  CHAPTER_COUNT,
  HOLD_END,
  LIFT_END,
  PEDESTAL_TOP,
  bezier3,
  clamp01,
  easeInOut,
  easeInOutSlow,
  easeOut,
} from "@/journey/chapters";
import { JourneyStage } from "@/journey/JourneyStage";

useGLTF.preload(perfumeAsset.url);

/**
 * One persistent Canvas, one bottle, one continuous camera shot.
 *
 * Act I  (unchanged): the bottle emerges from the featured Trio card and
 *          travels to the Showcase section.
 * Act II  (signature act, after Ingredients): the same object rests in the
 *          model's palm, lifts, rotates through space and settles on marble.
 */

function Bottle() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);

  const { scene } = useGLTF(perfumeAsset.url);
  const { camera, size } = useThree();

  // Height of the raw model in world units — used to derive a scale that keeps
  // the bottle at a fixed fraction of the viewport, whatever the camera does.
  const modelHeight = useRef(0);
  const heightFraction = size.width < 480 ? 0.44 : size.width < 768 ? 0.42 : 0.4;

  const ndc = useMemo(() => new THREE.Vector3(), []);
  const cardWorld = useMemo(() => new THREE.Vector3(), []);
  const palmWorld = useMemo(() => new THREE.Vector3(), []);
  const finaleWorld = useMemo(() => new THREE.Vector3(), []);
  const palmCaptured = useMemo(() => new THREE.Vector3(), []);
  const emergePos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const chapterPos = useMemo(() => new THREE.Vector3(), []);
  const ctrl = useMemo(() => new THREE.Vector3(), []);
  const showcasePos = useMemo(() => new THREE.Vector3(-0.55, 0.05, 0), []);
  const emergeCaptured = useRef(false);
  const palmLocked = useRef(false);

  const unproject = (px: number, py: number, out: THREE.Vector3) => {
    const ndcX = (px / size.width) * 2 - 1;
    const ndcY = -(py / size.height) * 2 + 1;
    ndc.set(ndcX, ndcY, 0.5).unproject(camera);
    ndc.sub(camera.position).normalize();
    const dist = -camera.position.z / ndc.z;
    return out.copy(camera.position).add(ndc.multiplyScalar(dist));
  };

  useFrame((state) => {
    if (!group.current || !inner.current) return;
    const time = state.clock.getElapsedTime();
    const p = journey.p;

    if (journey.hasCard) unproject(journey.cardX, journey.cardY, cardWorld);

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

    // ---- Act II: rest in the palm → lift → land on the marble.
    const c = journey.c;
    if (journey.inChapters) {
      if (journey.hasPalm) unproject(journey.palmX, journey.palmY, palmWorld);

      if (c <= LIFT_END * 0.35 || !palmLocked.current) {
        palmCaptured.copy(palmWorld);
        if (c > LIFT_END * 0.35) palmLocked.current = true;
      }
      if (c < 0.02) palmLocked.current = false;

      if (c <= HOLD_END) {
        // Sitting on the open palm — only a whisper of breath.
        chapterPos.copy(palmWorld);
      } else if (c <= LIFT_END) {
        const t = easeInOutSlow(clamp01((c - HOLD_END) / (LIFT_END - HOLD_END)));
        // A long, soft arc: up out of the hand, over, then down to the marble.
        ctrl.set(
          (palmCaptured.x + PEDESTAL_TOP.x) / 2 - 0.18,
          Math.max(palmCaptured.y, PEDESTAL_TOP.y) + 0.95,
          (palmCaptured.z + PEDESTAL_TOP.z) / 2 + 0.35,
        );
        bezier3(palmCaptured, ctrl, PEDESTAL_TOP, t, chapterPos);
      } else {
        // Landed. No bounce — just an infinitesimal settle.
        const s = easeOut(clamp01((c - LIFT_END) / 0.08));
        chapterPos.copy(PEDESTAL_TOP);
        chapterPos.y += (1 - s) * 0.02;
      }

      const handoff = clamp01(c / 0.06);
      target.lerp(chapterPos, easeInOut(handoff));
    } else {
      palmLocked.current = false;
    }

    // ---- Act III: the finale — dead centre, one full slow revolution.
    if (journey.inFinale) {
      // Dead centre of the frame: the camera looks at the world origin, so the
      // flacon simply stands there — pivot is at its base, hence the half-height
      // drop that puts the body optically in the middle of the ring tunnel.
      finaleWorld.set(0, -(group.current.scale.x * modelHeight.current) / 2, 0);
      target.copy(finaleWorld);
    }

    // Micro idle — a couple of pixels of weightless drift.
    const idle = journey.inChapters && c > LIFT_END ? 0.5 : 1;
    target.x += Math.cos(time * 0.5) * 0.006 * idle;
    target.y += Math.sin(time * 0.7) * 0.012 * idle;

    group.current.position.lerp(target, journey.inFinale ? 0.16 : journey.inChapters ? 0.06 : 0.08);

    // Rotation: cinematic spin during Act I flight, then restrained motion so
    // the label always stays readable (never more than a few degrees away).
    const pointerYaw = journey.pointerX * 0.05; // ≈3°
    const pointerPitch = -journey.pointerY * 0.03;
    let yaw: number;
    let pitch: number;
    let roll: number;

    if (journey.inFinale) {
      // A continuous, perfectly even 360° turntable.
      yaw = journey.f * Math.PI * 4 + time * 0.25 + pointerYaw;
      pitch = Math.sin(time * 0.12) * 0.02 + pointerPitch;
      roll = 0;
    } else if (journey.inChapters) {
      // A single slow, beautiful revolution during the lift, then a very slow
      // turntable once it has landed. The label always comes back to camera.
      const liftT = clamp01((c - HOLD_END) / (LIFT_END - HOLD_END));
      const spin = easeInOutSlow(liftT) * Math.PI * 2;
      const settleSpin = c > LIFT_END ? (c - LIFT_END) * 1.1 : 0;
      yaw = spin + settleSpin + Math.sin(time * 0.14) * 0.05 + pointerYaw;
      pitch = Math.sin(liftT * Math.PI) * 0.06 + Math.sin(time * 0.12) * 0.02 + pointerPitch;
      roll = Math.sin(liftT * Math.PI) * 0.05 + Math.sin(time * 0.1) * 0.008;
    } else {
      yaw = travelT * Math.PI * 2 + Math.sin(time * 0.22) * 0.06 + pointerYaw;
      pitch = Math.sin(travelT * Math.PI) * 0.35 + Math.sin(time * 0.18) * 0.025 + pointerPitch;
      roll = Math.sin(travelT * Math.PI) * 0.14;
    }

    inner.current.rotation.y += (yaw - inner.current.rotation.y) * (journey.inFinale ? 0.2 : 0.05);
    inner.current.rotation.x += (pitch - inner.current.rotation.x) * 0.05;
    inner.current.rotation.z += (roll - inner.current.rotation.z) * 0.05;

    if (!modelHeight.current) {
      const nodes: unknown[] = [];
      scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const bb = new THREE.Box3().setFromObject(o);
          nodes.push({ name: o.name, min: bb.min.toArray(), max: bb.max.toArray(), vis: o.visible });
        }
      });
      (window as unknown as Record<string, unknown>).__nodes = nodes;
      const box = new THREE.Box3().setFromObject(scene);
      const worldScale = group.current.getWorldScale(new THREE.Vector3()).y || 1;
      modelHeight.current = Math.max(0.001, (box.max.y - box.min.y) / worldScale);
      // Re-pivot the model: origin at the centre of its base, so the group
      // position is literally "where the bottle stands".
      if (pivot.current) {
        const center = box.getCenter(new THREE.Vector3());
        pivot.current.position.set(-center.x / worldScale, -box.min.y / worldScale, -center.z / worldScale);
      }
    }

    // Framing-locked scale — a touch larger in the signature act so the
    // flacon reads as a real 100ml object in her hand.
    const cam = camera as THREE.PerspectiveCamera;
    const fraction = heightFraction * (journey.inFinale ? 1.15 : journey.inChapters ? 1.22 : 1);
    const dist = Math.max(0.4, camera.position.distanceTo(group.current.position));
    const visibleHeight = 2 * Math.tan((cam.fov * Math.PI) / 360) * dist;
    const baseScale = (visibleHeight * fraction) / modelHeight.current;
    const scl = THREE.MathUtils.lerp(group.current.scale.x || baseScale, baseScale, 0.08);
    group.current.scale.setScalar(scl);
    (window as unknown as Record<string, unknown>).__dbg = {
      pos: group.current.position.toArray(),
      tgt: target.toArray(), inFinale: journey.inFinale, inChapters: journey.inChapters, f: journey.f,
      scl, baseScale, mh: modelHeight.current, dist, visibleHeight, fov: cam.fov,
      cam: camera.position.toArray(),
    };
  });

  return (
    <group ref={group} scale={0.2}>
      <group ref={inner}>
        <group rotation={[0, Math.PI, 0]}>
          <group ref={pivot}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
    </group>
  );
}


function Rig() {
  const { camera, size } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const smoothLook = useMemo(() => new THREE.Vector3(), []);

  const k0 = useMemo(() => new THREE.Vector3(0.0, 0.15, 3.8), []); // emerge
  const k1 = useMemo(() => new THREE.Vector3(0.55, 0.2, 4.2), []); // showcase
  const a0 = useMemo(() => new THREE.Vector3(0.55, 0.2, 4.2), []); // act II in
  const a1 = useMemo(() => new THREE.Vector3(0.3, 0.12, 3.5), []); // push in
  const a2 = useMemo(() => new THREE.Vector3(0.1, 0.18, 4.0), []); // lift wide

  useFrame((st) => {
    const p = journey.p;
    const c = journey.c;
    const time = st.clock.getElapsedTime();
    const mobileBoost = size.width < 768 ? 6 : 0;
    let fovTarget: number;

    if (journey.inFinale) {
      desired.set(0, 0.06, 3.9);
      fovTarget = 24 + mobileBoost;
      look.set(0, 0, 0);
      desired.x += Math.sin(time * 0.08) * 0.05;
      desired.y += Math.sin(time * 0.3) * 0.01;
      camera.position.lerp(desired, 0.05);
      smoothLook.lerp(look, 0.05);
      camera.lookAt(smoothLook);
      const camF = camera as THREE.PerspectiveCamera;
      camF.fov += (fovTarget - camF.fov) * 0.05;
      camF.updateProjectionMatrix();
      return;
    }

    if (journey.inChapters) {
      if (c <= HOLD_END) {
        // Slow editorial push toward the model.
        desired.lerpVectors(a0, a1, easeInOut(clamp01(c / HOLD_END)));
        fovTarget = 22 - 1.5 * clamp01(c / HOLD_END) + mobileBoost;
      } else if (c <= LIFT_END) {
        desired.lerpVectors(a1, a2, easeInOut((c - HOLD_END) / (LIFT_END - HOLD_END)));
        fovTarget = 20.5 + mobileBoost;
      } else {
        // Apple-style turntable: the camera circles the landed bottle.
        const t = clamp01((c - LIFT_END) / (1 - LIFT_END));
        const angle = Math.atan2(a2.x, a2.z) + easeInOut(t) * 0.85;
        const radius = a2.length();
        desired.set(Math.sin(angle) * radius, a2.y + easeInOut(t) * 0.12, Math.cos(angle) * radius);
        fovTarget = 20 + mobileBoost;
      }
      // Very subtle breathing orbit + scroll inertia.
      desired.x += Math.sin(time * 0.09) * 0.07;
      desired.z += Math.cos(time * 0.08) * 0.05;
      desired.y += Math.sin(time * 0.22) * 0.015 + journey.velocity * 0.08;
      look.set(0, c > LIFT_END ? PEDESTAL_TOP.y * 0.5 : 0, 0);
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

    camera.position.lerp(desired, 0.04);
    smoothLook.lerp(look, 0.035);
    camera.lookAt(smoothLook);

    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (fovTarget - cam.fov) * 0.04;
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
      const palm = document.getElementById("palm-anchor");
      const finale = document.getElementById("finale-act");
      const finaleAnchor = document.getElementById("finale-anchor");
      const cardImg = document.querySelector('img[alt="Riya Sheikh"]') as HTMLImageElement | null;
      const vh = window.innerHeight;

      // Smoothed scroll velocity (drives camera inertia).
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

      // ---- Palm anchor of the model photograph.
      if (palm) {
        const r = palm.getBoundingClientRect();
        journey.palmX = r.left + r.width / 2;
        journey.palmY = r.top + r.height / 2;
        journey.hasPalm = true;
      } else {
        journey.hasPalm = false;
      }

      // ---- Act II progress across the signature act container.
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

      // ---- Act III: the finale ring tunnel.
      let finaleVisible = false;
      if (finale) {
        const r = finale.getBoundingClientRect();
        const span = r.height - vh;
        journey.f = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
        finaleVisible = r.top < vh * 0.9 && r.bottom > vh * 0.1;
        journey.inFinale = finaleVisible;
      } else {
        journey.inFinale = false;
      }
      if (finaleAnchor) {
        const r = finaleAnchor.getBoundingClientRect();
        journey.finaleX = r.left + r.width / 2;
        journey.finaleY = r.top + r.height / 2;
        journey.hasFinale = true;
      } else {
        journey.hasFinale = false;
      }

      const shouldShow = actIVisible || chaptersVisible || finaleVisible;
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
        <ambientLight intensity={0.32} />
        {/* Key softbox */}
        <directionalLight
          position={[3.5, 5, 3]}
          intensity={1.7}
          color="#fff2dc"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Warm rim */}
        <directionalLight position={[-4, 2, -3]} intensity={1.15} color="#ffb37a" />
        {/* Cool fill */}
        <directionalLight position={[-2, 1.5, 4]} intensity={0.45} color="#9ac4ff" />
        {/* Back light for glass separation */}
        <directionalLight position={[0, 1.2, -5]} intensity={0.8} color="#ffe8c2" />
        <pointLight position={[0, 2.4, 2]} intensity={0.6} color="#ffe8c2" />

        <Suspense fallback={null}>
          <Bottle />
          <JourneyStage />
          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.45}
            scale={5}
            blur={2.8}
            far={2}
            resolution={512}
          />
        </Suspense>
        <Rig />
      </Canvas>
    </div>
  );
}
