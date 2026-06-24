import { Kart } from "./kart";
import { World } from "./world";
import { Track } from "./track";

export function updateProgress(k: Kart, world: World, track: Track) {
  const N = track.checkpoints.length;
  const nearest = world.nearestCheckpoint(k.x, k.y);
  const expected = (k.cpIndex + 1) % N;
  if (nearest === expected) {
    k.cpIndex = expected;
    if (expected === 0) k.lap++;
  }
  const cur = track.checkpoints[k.cpIndex];
  const next = track.checkpoints[(k.cpIndex + 1) % N];
  const segLen = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
  const dToNext = Math.hypot(next.x - k.x, next.y - k.y);
  const frac = Math.max(0, Math.min(1, 1 - dToNext / segLen));
  k.progress = k.lap * N + k.cpIndex + frac;
}

export function computePlaces(karts: Kart[]): Kart[] {
  const order = [...karts].sort((a, b) => b.progress - a.progress);
  order.forEach((k, i) => { k.place = i + 1; });
  return order;
}

export function displayLap(k: Kart, laps: number): number {
  return Math.max(1, Math.min(laps, k.lap + 1));
}
