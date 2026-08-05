import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Cinematic haze — two enormous, almost invisible soft planes that drift very
 * slowly behind the object. Reads as volumetric studio air, never as an effect.
 */
export function Haze() {
  const group = useRef<THREE.Group>(null);
  const layers = useMemo(() => [0, 1, 2], []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    g.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.03 + 0.018 * Math.sin(t * 0.12 + i * 1.7);
      c.position.x = Math.sin(t * 0.05 + i) * 0.6;
      c.rotation.z = t * 0.008 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={group} position={[0, 0, -2.2]}>
      {layers.map((i) => (
        <mesh key={i} position={[0, -0.2 + i * 0.35, -i * 0.6]}>
          <planeGeometry args={[14 - i * 2, 7 - i]} />
          <meshBasicMaterial
            color="#e9dcc6"
            transparent
            opacity={0.03}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
