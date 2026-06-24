import { Kart, DriveControl } from "./kart";
import { Track } from "./track";

function angDiff(a: number, b: number): number {
  let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d;
}

// Steer toward a checkpoint a few ahead; drift through sharp turns.
export function aiControl(k: Kart, track: Track): DriveControl {
  const cps = track.checkpoints;
  const aheadIdx = (k.cpIndex + 2) % cps.length;
  const t = cps[aheadIdx];
  // small per-kart lane wobble so they don't stack
  const desired = Math.atan2(t.y - k.y, t.x - k.x);
  const diff = angDiff(desired, k.angle);
  const steer = Math.max(-1, Math.min(1, diff * 1.8));
  const drift = Math.abs(diff) > 0.7 && k.speed > 90;
  const throttle = Math.abs(diff) > 1.5 ? 0.7 : 1;
  return { throttle, brake: false, steer, drift };
}
