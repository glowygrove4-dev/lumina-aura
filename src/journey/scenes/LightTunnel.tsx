import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight } from "../chapters";

/**
 * Chapter 7 — Light Tunnel.
 * Animated light rings streaming past the bottle along a gently bending path.
 */
const RINGS = 26;

export function LightTunnel({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const refs = useRef<THREE.Mesh[]>([]);

  const ring = useMemo(() => new THREE.TorusGeometry(1.25, 0.012, 8, 96), []);

  useFrame((state, delta) => {
    const w = chapterWeight(journey.c, index);
    const g = group.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const time = state.clock.getElapsedTime();
    const speed = 0.5 + Math.min(1.6, Math.abs(journey.velocity) * 5);

    refs.current.forEach((m, i) => {
      if (!m) return;
      let z = m.position.z + delta * speed * 1.6;
      if (z > 3.2) z -= RINGS * 0.55;
      const depth = z;
      m.position.z = z;
      // Gentle bend of the tunnel.
      m.position.x = Math.sin(depth * 0.22) * 0.55;
      m.position.y = Math.cos(depth * 0.18) * 0.28;
      const pulse = 0.6 + 0.4 * Math.sin(time * 1.2 - i * 0.4);
      m.scale.setScalar(0.8 + pulse * 0.16);
      const mat = m.material as THREE.MeshBasicMaterial;
      const fade = Math.max(0, 1 - Math.abs(depth) / 7);
      mat.opacity = w * fade * (0.25 + pulse * 0.5);
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh
          key={i}
          geometry={ring}
          position={[0, 0, -RINGS * 0.55 + i * 0.55]}
          ref={(m) => {
            if (m) refs.current[i] = m as THREE.Mesh;
          }}
        >
          <meshBasicMaterial
            color={i % 3 === 0 ? "#ffdca6" : "#c9a84c"}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0, 1.2]} intensity={1.2} color="#ffd9a0" distance={6} />
    </group>
  );
}
