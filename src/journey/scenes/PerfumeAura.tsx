import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight, easeBack } from "../chapters";

/**
 * Chapter 8 — Perfume Aura.
 * Luxury ingredients orbit the bottle, each slowly rotating, connected by a
 * veil of tiny perfume particles.
 */
type Orb = {
  radius: number;
  speed: number;
  phase: number;
  y: number;
  scale: number;
  color: string;
  kind: "petal" | "wood" | "crystal" | "flower" | "orchid" | "flake";
};

const ORBS: Orb[] = [
  { radius: 0.72, speed: 0.22, phase: 0, y: 0.16, scale: 0.09, color: "#e58ba0", kind: "petal" },
  { radius: 0.86, speed: -0.17, phase: 1.1, y: -0.1, scale: 0.075, color: "#7a5230", kind: "wood" },
  { radius: 0.66, speed: 0.19, phase: 2.3, y: 0.3, scale: 0.07, color: "#e8a94f", kind: "crystal" },
  { radius: 0.94, speed: -0.13, phase: 3.4, y: 0.05, scale: 0.08, color: "#f4ecd6", kind: "flower" },
  { radius: 0.78, speed: 0.15, phase: 4.6, y: -0.24, scale: 0.075, color: "#f0dca6", kind: "orchid" },
  { radius: 1.02, speed: -0.24, phase: 5.5, y: 0.24, scale: 0.05, color: "#d9b45a", kind: "flake" },
];

function Geo({ kind }: { kind: Orb["kind"] }) {
  switch (kind) {
    case "petal":
      return <sphereGeometry args={[1, 20, 14]} />;
    case "wood":
      return <boxGeometry args={[1.6, 0.6, 0.6]} />;
    case "crystal":
      return <octahedronGeometry args={[1, 0]} />;
    case "flower":
      return <dodecahedronGeometry args={[1, 0]} />;
    case "orchid":
      return <icosahedronGeometry args={[1, 0]} />;
    default:
      return <planeGeometry args={[1.6, 1.6]} />;
  }
}

export function PerfumeAura({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const items = useRef<THREE.Group[]>([]);
  const linkRef = useRef<THREE.Points>(null);

  const links = useMemo(() => {
    const n = 220;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 0.65;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    const w = chapterWeight(journey.c, index);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const time = state.clock.getElapsedTime();
    const enter = easeBack(Math.min(1, w * 1.15));

    ORBS.forEach((o, i) => {
      const item = items.current[i];
      if (!item) return;
      const a = o.phase + time * o.speed;
      const r = o.radius * enter;
      item.position.set(Math.cos(a) * r, o.y + Math.sin(time * 0.5 + i) * 0.03, Math.sin(a) * r * 0.8);
      item.rotation.x += delta * 0.25;
      item.rotation.y += delta * 0.35;
      item.scale.setScalar(o.scale * enter);
      const mat = (item.children[0] as THREE.Mesh)?.material as THREE.MeshStandardMaterial | undefined;
      if (mat) mat.opacity = w;
    });

    if (linkRef.current) {
      linkRef.current.rotation.y += delta * 0.05;
      (linkRef.current.material as THREE.PointsMaterial).opacity = w * 0.55;
    }
  });

  return (
    <group ref={group}>
      {ORBS.map((o, i) => (
        <group
          key={i}
          ref={(m) => {
            if (m) items.current[i] = m as THREE.Group;
          }}
        >
          <mesh castShadow receiveShadow scale={o.kind === "petal" ? [1, 0.35, 0.7] : 1}>
            <Geo kind={o.kind} />
            <meshStandardMaterial
              color={o.kind === "crystal" ? "#e8a94f" : o.color}
              transparent
              opacity={0}
              roughness={o.kind === "flake" ? 0.15 : 0.45}
              metalness={o.kind === "flake" ? 0.9 : 0.1}
              emissive={o.kind === "crystal" ? "#8a5a12" : "#000000"}
              emissiveIntensity={o.kind === "crystal" ? 0.35 : 0}
            />
          </mesh>
        </group>
      ))}
      <points ref={linkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[links, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.012}
          color="#ffe3b0"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
