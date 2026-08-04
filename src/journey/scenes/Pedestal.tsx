import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight, easeOut } from "../chapters";

/**
 * Chapter 11 — Luxury Pedestal.
 * A marble plinth rises, a warm spotlight blooms, fog rolls across the floor
 * and the landing kicks up a little elegant dust.
 */
export function Pedestal({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const plinth = useRef<THREE.Mesh>(null);
  const fog = useRef<THREE.Group>(null);
  const impact = useRef<THREE.Points>(null);
  const spot = useRef<THREE.SpotLight>(null);

  const dust = useMemo(() => {
    const n = 120;
    const positions = new Float32Array(n * 3);
    const seeds = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.1 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = -0.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i * 2] = Math.random();
      seeds[i * 2 + 1] = Math.random();
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
    const local = journey.chapter === index ? journey.chapterT : journey.c * 8 > index ? 1 : 0;
    const rise = easeOut(Math.min(1, local * 1.6));

    if (plinth.current) {
      plinth.current.position.y = -1.35 + rise * 0.72;
      (plinth.current.material as THREE.MeshStandardMaterial).opacity = w;
    }
    if (spot.current) spot.current.intensity = w * rise * 24;

    if (fog.current) {
      fog.current.rotation.y += delta * 0.05;
      fog.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = w * rise * (0.06 + 0.03 * Math.sin(time * 0.4 + i));
        c.scale.setScalar(1 + Math.sin(time * 0.25 + i) * 0.05);
      });
    }

    const pts = impact.current;
    if (pts) {
      const arr = pts.geometry.attributes.position.array as Float32Array;
      const burst = Math.max(0, 1 - Math.abs(local - 0.62) / 0.28);
      for (let i = 0; i < dust.n; i++) {
        arr[i * 3 + 1] += delta * (0.04 + dust.seeds[i * 2] * 0.1);
        if (arr[i * 3 + 1] > -0.1) arr[i * 3 + 1] = -0.55;
      }
      pts.geometry.attributes.position.needsUpdate = true;
      (pts.material as THREE.PointsMaterial).opacity = w * burst * 0.85;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={plinth} position={[0, -1.35, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.85, 0.92, 0.5, 64]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.32} metalness={0.06} transparent opacity={0} />
      </mesh>

      <spotLight
        ref={spot}
        position={[0.6, 3.2, 1.4]}
        angle={0.42}
        penumbra={0.9}
        intensity={0}
        color="#ffdfae"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <group ref={fog} position={[0, -0.62, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, i * 0.7]} position={[0, i * 0.035, 0]}>
            <circleGeometry args={[2.2 - i * 0.35, 48]} />
            <meshBasicMaterial
              color="#f2e6cf"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      <points ref={impact} position={[0, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.016}
          color="#ffe9c6"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
