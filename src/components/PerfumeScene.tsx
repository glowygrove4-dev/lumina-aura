import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Float } from "@react-three/drei";
import type { Group } from "three";
import perfumeAsset from "@/assets/perfume.glb.asset.json";

useGLTF.preload(perfumeAsset.url);

function Bottle({ scrollY }: { scrollY?: React.MutableRefObject<number> }) {
  const ref = useRef<Group>(null);
  const { scene } = useGLTF(perfumeAsset.url);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const s = scrollY?.current ?? 0;
    // Cursor parallax
    const mx = state.pointer.x;
    const my = state.pointer.y;
    ref.current.rotation.y = t * 0.15 + mx * 0.35 + s * 2.4;
    ref.current.rotation.x = -my * 0.15 + Math.sin(t * 0.6) * 0.03;
    ref.current.position.y = Math.sin(t * 0.9) * 0.08 - s * 0.4;
    ref.current.position.x = s * 1.6;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={2.2} />
    </group>
  );
}

export function PerfumeScene({ scrollY }: { scrollY?: React.MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0.2, 4.5], fov: 32 }}
      shadows
    >
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow />
      <directionalLight position={[-4, 3, -2]} intensity={0.6} color="#a0c8ff" />
      <Suspense fallback={null}>
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
          <Bottle scrollY={scrollY} />
        </Float>
        <ContactShadows position={[0, -1.4, 0]} opacity={0.6} scale={8} blur={2.6} far={4} />
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  );
}
