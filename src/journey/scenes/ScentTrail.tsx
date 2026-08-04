import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight } from "../chapters";

/**
 * Chapter 5 — The Scent Trail.
 * Volumetric scent ribbons unfurl behind the bottle, reacting to scrolling,
 * with glowing dust drifting in their wake.
 */
export function ScentTrail({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  const trailRef = useRef<THREE.Points>(null);

  const ribbons = useMemo(() => {
    return [0, 1, 2, 3].map((i) => {
      const pts: THREE.Vector3[] = [];
      const dir = i % 2 === 0 ? 1 : -1;
      for (let s = 0; s <= 8; s++) {
        const t = s / 8;
        pts.push(
          new THREE.Vector3(
            Math.sin(t * Math.PI * (1.4 + i * 0.25)) * 0.55 * dir,
            -0.35 + t * 1.25 + Math.sin(t * 3 + i) * 0.08,
            Math.cos(t * Math.PI * (1.1 + i * 0.2)) * 0.42 * dir,
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      return new THREE.TubeGeometry(curve, 90, 0.012 + i * 0.004, 8, false);
    });
  }, []);

  const trail = useMemo(() => {
    const n = 160;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.25 + Math.random() * 0.7;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = -0.4 + Math.random() * 1.6;
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
    const scrollBoost = 1 + Math.min(1, Math.abs(journey.velocity) * 2.5);

    g.rotation.y += delta * 0.12 * scrollBoost;
    g.scale.setScalar(0.85 + w * 0.25);

    mats.current.forEach((m, i) => {
      if (!m) return;
      m.opacity = w * (0.22 + 0.1 * Math.sin(time * 0.6 + i)) * scrollBoost;
    });

    const pts = trailRef.current;
    if (pts) {
      pts.rotation.y -= delta * 0.08 * scrollBoost;
      (pts.material as THREE.PointsMaterial).opacity = w * 0.7;
    }
  });

  return (
    <group ref={group}>
      {ribbons.map((geo, i) => (
        <mesh key={i} geometry={geo} rotation={[0, (i * Math.PI) / 2, 0]}>
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m as THREE.MeshBasicMaterial;
            }}
            color={i % 2 === 0 ? "#f5d9a0" : "#c9a84c"}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trail, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.016}
          color="#ffe6bd"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
