import { ScentTrail } from "./scenes/ScentTrail";
import { GlassShatter } from "./scenes/GlassShatter";
import { LightTunnel } from "./scenes/LightTunnel";
import { PerfumeAura } from "./scenes/PerfumeAura";
import { PerfumeWave } from "./scenes/PerfumeWave";
import { Pedestal } from "./scenes/Pedestal";
import { Dust } from "./scenes/Dust";

/**
 * All chapter environments live inside the single persistent Canvas.
 * Each scene owns one chapter index and fades itself in/out — the bottle and
 * the camera are never duplicated or re-created.
 *
 * 0 scent trail · 1 glass shatter · 2 light tunnel · 3 aura
 * 4 micro detail (camera only) · 5 perfume wave · 6 pedestal · 7 final hero
 */
export function JourneyStage() {
  return (
    <group>
      <ScentTrail index={0} />
      <GlassShatter index={1} />
      <LightTunnel index={2} />
      <PerfumeAura index={3} />
      <PerfumeWave index={5} />
      <Pedestal index={6} />
      <Dust count={200} radius={4.5} />
    </group>
  );
}
