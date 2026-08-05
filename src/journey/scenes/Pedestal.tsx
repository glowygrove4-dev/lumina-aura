import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight, clamp01, easeOut, LIFT_END, PEDESTAL_TOP } from "../chapters";

/**
 * The Pedestal — a dark marble plinth that rises out of the fog just before
 * the bottle lands on it. No bounce, no physics: only a gentle arrival.
 */
export function Pedestal({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const plinth = useRef<THREE.Mesh>(null);
  const fog = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);

  useFrame((state, delta) => {
    const w = chapterWeight(journey.c, index);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const time = state.clock.getElapsedTime();
    // Rises across the second half of the lift, so it is already there to meet
    // the bottle at LIFT_END.
    const rise = easeOut(clamp01((journey.c - (LIFT_END - 0.3)) / 0.28));

    if (plinth.current) {
      plinth.current.position.y = PEDESTAL_TOP.y - 1.5 + rise * 0.94;
      (plinth.current.material as THREE.MeshStandardMaterial).opacity = w * rise;
    }
    if (spot.current) spot.current.intensity = w * rise * 18;

    if (fog.current) {
      fog.current.rotation.y += delta * 0.03;
      fog.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = w * rise * (0.035 + 0.02 * Math.sin(time * 0.3 + i));
        c.scale.setScalar(1 + Math.sin(time * 0.2 + i) * 0.04);
      });
    }
  });

  return (
    <group ref={group}>
      <mesh ref={plinth} position={[0, -1.7, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.62, 0.66, 0.95, 96]} />
        <meshStandardMaterial
          color="#1c1d20"
          roughness={0.28}
          metalness={0.15}
          transparent
          opacity={0}
        />
      </mesh>

      <spotLight
        ref={spot}
        position={[0.9, 3.4, 1.8]}
        angle={0.4}
        penumbra={0.95}
        intensity={0}
        color="#ffe4bb"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <group ref={fog} position={[0, -0.78, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, i * 0.8]} position={[0, i * 0.03, 0]}>
            <circleGeometry args={[2.4 - i * 0.4, 48]} />
            <meshBasicMaterial
              color="#efe3cd"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
