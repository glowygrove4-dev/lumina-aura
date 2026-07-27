import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import perfumeAsset from "@/assets/perfume.glb.asset.json";

useGLTF.preload(perfumeAsset.url);

/**
 * Journey progress model (t ∈ [0,1] mapped from document scroll between
 * the Trio section start and the Ingredients section end):
 *  0.00  bottle sits inside the featured trio card (screen center)
 *  0.08  lifts out, scales up, slight yaw
 *  0.22  swings down-left, behind text foreground
 *  0.42  arcs down-right toward the hand
 *  0.58  hand catch — motion damps, tiny settle
 *  0.68  lifts out of the hand
 *  0.85  arrives on the left of ingredients
 *  1.00  idle float on the left
 */
const WAYPOINTS: [number, number, number][] = [
  [0.0, 0.0, 0.0],
  [0.15, 0.55, 0.6],
  [-1.7, -0.7, 0.4],
  [-0.4, -1.5, 0.5],
  [1.25, -0.55, 0.9], // hand catch
  [1.15, -0.5, 0.9],  // dwell
  [0.2, 0.5, 0.4],
  [-1.85, 0.15, 0.15],
  [-1.85, 0.15, 0.15],
];
const HAND_T = 0.58;

// Segment breakpoints (t on the curve) matching WAYPOINTS spacing
const SEGMENTS = [0.0, 0.08, 0.22, 0.42, HAND_T, 0.66, 0.78, 0.92, 1.0];

function tOnCurve(scroll: number) {
  // Map scroll (0..1 of journey window) to curve t using SEGMENTS as anchors
  const idx = SEGMENTS.findIndex((s) => scroll <= s);
  if (idx <= 0) return 0;
  if (idx === -1) return 1;
  const a = SEGMENTS[idx - 1];
  const b = SEGMENTS[idx];
  const local = (scroll - a) / (b - a);
  // ease each segment
  const eased = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
  return ((idx - 1) + eased) / (WAYPOINTS.length - 1);
}

function Bottle({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(perfumeAsset.url);
  const { camera } = useThree();

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        WAYPOINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        false,
        "catmullrom",
        0.35,
      ),
    [],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmp2 = useMemo(() => new THREE.Vector3(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = Math.max(0, Math.min(1, progressRef.current));
    const t = tOnCurve(p);
    const time = state.clock.getElapsedTime();

    curve.getPointAt(t, tmp);
    curve.getPointAt(Math.min(1, t + 0.01), tmp2);

    // idle float overlay (very small)
    const idle = p > 0.95 ? 1 : 0;
    const floatY = Math.sin(time * 0.9) * (0.02 + idle * 0.015);
    const floatX = Math.cos(time * 0.7) * 0.008;

    // slowdown factor near the hand catch
    const handProximity = 1 - Math.min(1, Math.abs(p - HAND_T) / 0.12);
    const damp = 1 - handProximity * 0.75;

    group.current.position.lerp(
      tmp.clone().add(new THREE.Vector3(floatX, floatY, 0)),
      0.12 * damp + 0.04,
    );

    // scale: small in card, larger during flight, calm at rest
    const flightScale = 2.2 + Math.sin(Math.PI * Math.min(1, p / 0.9)) * 0.55;
    const targetScale = p < 0.02 ? 2.2 : flightScale;
    const s = THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.08);
    group.current.scale.setScalar(s);

    // rotation: subtle yaw/pitch/roll along path + idle spin
    const dir = tmp2.clone().sub(tmp).normalize();
    const yaw = Math.atan2(dir.x, 0.6) * 0.5 + time * (0.05 + idle * 0.02);
    const pitch = Math.sin(time * 0.6) * 0.06 - dir.y * 0.25;
    const roll = Math.sin(time * 0.4 + p * 6) * 0.08 * (1 - handProximity);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pitch, 0.08);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, yaw, 0.08);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, roll, 0.08);

    // camera: slight orbit tracking the bottle
    const orbit = Math.sin(p * Math.PI * 1.4) * 0.35;
    const camX = tmp.x * 0.25 + orbit;
    const camY = tmp.y * 0.15 + 0.15;
    const camZ = 4.6 - Math.sin(p * Math.PI) * 0.35;
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.05);
    camTarget.lerp(tmp, 0.08);
    camera.lookAt(camTarget);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export function BottleJourney() {
  const progressRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const [handOpacity, setHandOpacity] = useState(0);
  const [cardHandoff, setCardHandoff] = useState(0); // 0 = bottle in card, 1 = bottle flying

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const trio = document.getElementById("trio");
      const end = document.getElementById("ingredients");
      if (trio && end) {
        const startY = trio.getBoundingClientRect().top + window.scrollY + trio.offsetHeight * 0.35;
        const endY = end.getBoundingClientRect().top + window.scrollY + end.offsetHeight * 0.6;
        const y = window.scrollY + window.innerHeight * 0.5;
        const p = (y - startY) / (endY - startY);
        const clamped = Math.max(0, Math.min(1, p));
        progressRef.current = clamped;
        setVisible(clamped > 0.001 && clamped < 0.999 ? true : clamped >= 0.999);
        // Fade featured card image out as bottle lifts off
        const handoff = Math.max(0, Math.min(1, (clamped - 0.0) / 0.08));
        setCardHandoff(handoff);
        document.documentElement.style.setProperty("--bottle-handoff", String(handoff));
        // Hand visibility around the catch
        const hp = 1 - Math.min(1, Math.abs(clamped - HAND_T) / 0.14);
        setHandOpacity(hp);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Fixed canvas: sits above card layer, below high-priority foreground text (z-40) */}
      <div
        className="pointer-events-none fixed inset-0 z-30"
        style={{ opacity: visible || cardHandoff > 0 ? 1 : 0, transition: "opacity 400ms" }}
        aria-hidden
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0.15, 4.6], fov: 28 }}
          shadows
        >
          <ambientLight intensity={0.65} />
          <directionalLight position={[4, 6, 4]} intensity={1.6} castShadow />
          <directionalLight position={[-4, 3, -2]} intensity={0.75} color="#a0c8ff" />
          <pointLight position={[0, 2, 3]} intensity={1.1} color="#ffd9a0" />
          <Suspense fallback={null}>
            <Bottle progressRef={progressRef} />
            <ContactShadows position={[0, -1.6, 0]} opacity={0.35} scale={10} blur={3.2} far={5} />
          </Suspense>
        </Canvas>
      </div>

      {/* Stylized hand that receives the bottle */}
      <div
        className="pointer-events-none fixed inset-0 z-20 flex items-end justify-end"
        style={{ opacity: handOpacity, transition: "opacity 500ms cubic-bezier(0.22,1,0.36,1)" }}
        aria-hidden
      >
        <svg
          viewBox="0 0 400 300"
          className="h-[60vh] w-auto translate-x-[8%] translate-y-[10%]"
          style={{
            transform: `translate(${(1 - handOpacity) * 40}%, ${(1 - handOpacity) * 20}%)`,
            transition: "transform 700ms cubic-bezier(0.22,1,0.36,1)",
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))",
          }}
        >
          <defs>
            <linearGradient id="skin" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#efd3bd" />
              <stop offset="0.5" stopColor="#d9b295" />
              <stop offset="1" stopColor="#a5795c" />
            </linearGradient>
          </defs>
          <path
            d="M40,260 C60,150 130,120 180,140 C210,152 230,175 245,205 C260,235 300,255 360,255 L400,300 L40,300 Z"
            fill="url(#skin)"
          />
          <path
            d="M180,140 C185,110 200,95 218,100 C232,104 236,125 228,150"
            fill="url(#skin)"
            opacity="0.9"
          />
          <path
            d="M210,145 C215,115 232,102 250,110 C264,117 262,140 252,160"
            fill="url(#skin)"
            opacity="0.85"
          />
          <path
            d="M238,160 C244,135 262,128 276,138 C288,148 282,168 272,182"
            fill="url(#skin)"
            opacity="0.8"
          />
        </svg>
      </div>
    </>
  );
}
