import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight } from "../chapters";

/**
 * Chapter 10 — The Perfume Wave.
 * A fluid ribbon of perfume energy wraps the bottle, leaving glowing trails,
 * with particles breaking away as the user scrolls.
 */
export function PerfumeWave({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Mesh>(null);
  const ribbon2 = useRef<THREE.Mesh>(null);
  const breakaway = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const a = t * Math.PI * 6;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * (0.32 + Math.sin(t * Math.PI) * 0.14),
          -0.45 + t * 0.95,
          Math.sin(a) * (0.32 + Math.sin(t * Math.PI) * 0.14),
        ),
      );
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.016, 8, false);
  }, []);

  const particles = useMemo(() => {
    const n = 180;
    const positions = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const a = t * Math.PI * 6;
      positions[i * 3] = Math.cos(a) * 0.36;
      positions[i * 3 + 1] = -0.45 + t * 0.95;
      positions[i * 3 + 2] = Math.sin(a) * 0.36;
      seeds[i] = Math.random();
    }
    return { positions, seeds, n };
  }, []);

  useFrame((state, delta) => {
    const w = chapterWeight(journey.c, index);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const time = state.clock.getElapsedTime();
    const boost = 1 + Math.min(1.4, Math.abs(journey.velocity) * 4);

    g.rotation.y += delta * 0.22 * boost;
    g.scale.setScalar(0.9 + w * 0.15);

    if (ribbon.current) {
      (ribbon.current.material as THREE.MeshBasicMaterial).opacity = w * 0.55 * boost;
      ribbon.current.rotation.y = Math.sin(time * 0.4) * 0.25;
    }
    if (ribbon2.current) {
      (ribbon2.current.material as THREE.MeshBasicMaterial).opacity = w * 0.3 * boost;
      ribbon2.current.rotation.y = -time * 0.18;
      ribbon2.current.scale.setScalar(1.18 + Math.sin(time * 0.6) * 0.04);
    }

    const pts = breakaway.current;
    if (pts) {
      const arr = pts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particles.n; i++) {
        arr[i * 3 + 1] += delta * (0.06 + particles.seeds[i] * 0.14) * boost;
        arr[i * 3] *= 1 + delta * 0.05;
        arr[i * 3 + 2] *= 1 + delta * 0.05;
        if (arr[i * 3 + 1] > 0.8) {
          const t = 0;
          const a = particles.seeds[i] * Math.PI * 6;
          arr[i * 3] = Math.cos(a) * 0.34;
          arr[i * 3 + 1] = -0.45 + t;
          arr[i * 3 + 2] = Math.sin(a) * 0.34;
        }
      }
      pts.geometry.attributes.position.needsUpdate = true;
      (pts.material as THREE.PointsMaterial).opacity = w * 0.8;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={ribbon} geometry={geo}>
        <meshBasicMaterial
          color="#f6dfae"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ribbon2} geometry={geo}>
        <meshBasicMaterial
          color="#c9a84c"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <points ref={breakaway}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.014}
          color="#ffeac4"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
