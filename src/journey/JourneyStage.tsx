import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { Pedestal } from "./scenes/Pedestal";
import { Dust } from "./scenes/Dust";
import { Haze } from "./scenes/Haze";
import { journey } from "./state";

/**
 * The signature act's environment, inside the one persistent Canvas.
 * Only luxury atmospherics: soft haze, floating dust, and the marble plinth.
 * Hidden entirely during the finale, where the object stands alone.
 */
export function JourneyStage() {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (group.current) group.current.visible = !journey.inFinale;
  });

  return (
    <group ref={group}>
      <Haze />
      <Pedestal index={2} />
      <Dust count={140} radius={5} />
    </group>
  );
}
