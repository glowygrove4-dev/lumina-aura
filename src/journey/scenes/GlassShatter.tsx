import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../state";
import { chapterWeight, easeOut } from "../chapters";

/**
 * Chapter 6 — The Glass Shatter Illusion.
 * A floating glass wall fractures around the bottle; shards drift outward in
 * ultra slow motion, then dissolve into glowing particles.
 */
const SHARDS = 90;

export function GlassShatter({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const wall = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);

  const shards = useMemo(() => {
    const arr: {
      base: THREE.Vector3;
      dir: THREE.Vector3;
      rot: THREE.Euler;
      spin: THREE.Vector3;
      scale: THREE.Vector3;
      delay: number;
    }[] = [];
    for (let i = 0; i < SHARDS; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.18 + Math.pow(Math.random(), 0.6) * 1.5;
      const base = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.75, (Math.random() - 0.5) * 0.05);
      arr.push({
        base,
        dir: base.clone().normalize().multiplyScalar(0.6 + Math.random() * 1.2),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.7),
        scale: new THREE.Vector3(0.08 + Math.random() * 0.16, 0.08 + Math.random() * 0.2, 0.006),
        delay: r / 1.8,
      });
    }
    return arr;
  }, []);

  const sparkle = useMemo(() => {
    const positions = new Float32Array(SHARDS * 3);
    return positions;
  }, []);

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const w = chapterWeight(journey.c, index);
    const g = group.current;
    if (!g || !mesh.current) return;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const time = state.clock.getElapsedTime();
    const local = journey.chapter === index ? journey.chapterT : journey.c * 8 > index ? 1 : 0;
    const t = easeOut(local);

    if (wall.current) {
      const mat = wall.current.material as THREE.MeshPhysicalMaterial;
      mat.opacity = w * (1 - Math.min(1, local * 2.2)) * 0.5;
    }

    const sparkleArr = dustRef.current?.geometry.attributes.position.array as Float32Array | undefined;

    for (let i = 0; i < SHARDS; i++) {
      const s = shards[i];
      const st = Math.max(0, Math.min(1, (t - s.delay * 0.35) / 0.65));
      const drift = easeOut(st);
      v.copy(s.base).addScaledVector(s.dir, drift * 1.1);
      v.z += drift * 0.5 + Math.sin(time * 0.4 + i) * 0.01;
      v.y += Math.sin(time * 0.3 + i * 0.7) * 0.02 * drift;
      e.set(
        s.rot.x + s.spin.x * drift * 2.2,
        s.rot.y + s.spin.y * drift * 2.2,
        s.rot.z + s.spin.z * drift * 2.2,
      );
      q.setFromEuler(e);
      const shrink = 1 - drift * 0.85;
      m4.compose(v, q, v.clone().set(s.scale.x * shrink, s.scale.y * shrink, s.scale.z));
      mesh.current.setMatrixAt(i, m4);
      if (sparkleArr) {
        sparkleArr[i * 3] = v.x;
        sparkleArr[i * 3 + 1] = v.y;
        sparkleArr[i * 3 + 2] = v.z;
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    (mesh.current.material as THREE.MeshPhysicalMaterial).opacity = w * (1 - t * 0.9);

    if (dustRef.current) {
      dustRef.current.geometry.attributes.position.needsUpdate = true;
      (dustRef.current.material as THREE.PointsMaterial).opacity = w * Math.min(1, t * 1.4) * 0.9;
    }
  });

  return (
    <group ref={group} position={[0, 0.05, -0.55]}>
      <mesh ref={wall}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0}
          roughness={0.03}
          metalness={0}
          transmission={0.95}
          thickness={0.35}
          ior={1.5}
          color="#eaf2ff"
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <instancedMesh ref={mesh} args={[undefined, undefined, SHARDS]} castShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          transparent
          opacity={0}
          roughness={0.02}
          metalness={0.1}
          transmission={0.9}
          thickness={0.2}
          ior={1.55}
          color="#f2f7ff"
          depthWrite={false}
        />
      </instancedMesh>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkle, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.026}
          color="#ffeecd"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
