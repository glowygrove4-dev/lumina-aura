import { Pedestal } from "./scenes/Pedestal";
import { Dust } from "./scenes/Dust";
import { Haze } from "./scenes/Haze";

/**
 * The signature act's environment, inside the one persistent Canvas.
 * Only luxury atmospherics: soft haze, floating dust, and the marble plinth.
 */
export function JourneyStage() {
  return (
    <group>
      <Haze />
      <Pedestal index={2} />
      <Dust count={140} radius={5} />
    </group>
  );
}
