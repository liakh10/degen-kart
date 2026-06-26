import { World } from "./world";
import { CharDef } from "./characters";
import { SURF, TILE } from "./track";

export interface UpgradeMods { speed: number; accel: number; handling: number; boost: number; }
export const NO_MODS: UpgradeMods = { speed: 0, accel: 0, handling: 0, boost: 0 };

export interface DriveControl { throttle: number; brake: boolean; steer: number; drift: boolean; }

export class Kart {
  speed = 0;
  driftActive = false;
  driftDir = 0;
  driftCharge = 0;
  driftTier = 0;      // 0..3 mini-turbo tier while drifting
  boostTime = 0;
  spinTime = 0;
  slowTime = 0;       // oil/gas slow
  shieldTime = 0;     // shield item active
  extraSpeed = 0;     // coin top-speed bonus
  draftBoost = 0;     // slipstream / drafting bonus
  // race state
  lap = 0;
  cpIndex = 0;
  prevCpIndex = 0;
  progress = 0;       // total progress for ranking
  finished = false;
  place = 0;
  item: string | null = null;

  maxSpeed: number; accel: number; turn: number; boostMax: number;

  constructor(public x: number, public y: number, public angle: number, public char: CharDef, public isPlayer: boolean, mods: UpgradeMods = NO_MODS) {
    const s = char.stats;
    this.maxSpeed = 188 + (s.speed + mods.speed) * 20;
    this.accel = 230 + (s.accel + mods.accel) * 42;
    this.turn = 2.3 + (s.handling + mods.handling) * 0.26;
    this.boostMax = this.maxSpeed * (1.33 + mods.boost * 0.05);
  }
}

export function updateKart(k: Kart, world: World, ctrl: DriveControl, dt: number, started: boolean) {
  if (k.spinTime > 0) { k.spinTime -= dt; k.angle += 14 * dt; k.speed *= (1 - 2 * dt); ctrl = { throttle: 0, brake: false, steer: 0, drift: false }; }

  const surf = world.surfaceAt(k.x, k.y);
  const onBoostPad = surf === SURF.BOOST;
  if (onBoostPad && k.boostTime < 0.3) k.boostTime = 0.5;
  // Walls are a slowing rumble strip, NOT a hard wall — so karts can never stick.
  const offRoad = surf === SURF.GRASS || surf === SURF.WALL;

  let maxSpeed = k.maxSpeed + k.extraSpeed + k.draftBoost;
  if (offRoad) maxSpeed *= surf === SURF.WALL ? 0.62 : 0.46;
  if (k.slowTime > 0) { maxSpeed *= 0.55; k.slowTime -= dt; }
  if (k.boostTime > 0) { maxSpeed = Math.max(maxSpeed, k.boostMax + k.extraSpeed + k.draftBoost); k.boostTime -= dt; }
  if (k.shieldTime > 0) k.shieldTime -= dt;

  // longitudinal
  if (!started) { k.speed *= (1 - 3 * dt); }
  else if (ctrl.brake) { k.speed -= k.accel * 1.6 * dt; }
  else { k.speed += ctrl.throttle * k.accel * dt; }
  k.speed *= (1 - (offRoad ? 2.2 : 1.1) * dt); // drag
  k.speed = Math.max(-k.maxSpeed * 0.3, Math.min(maxSpeed, k.speed));

  // steering + drift
  const speedFactor = Math.min(1, Math.abs(k.speed) / 60);
  let turn = k.turn;
  const wantDrift = ctrl.drift && Math.abs(ctrl.steer) > 0.2 && k.speed > 70;
  if (wantDrift) {
    if (!k.driftActive) { k.driftActive = true; k.driftDir = Math.sign(ctrl.steer); k.driftCharge = 0; }
    turn *= 1.55;
    k.driftCharge += dt;
    k.driftTier = k.driftCharge > 1.7 ? 3 : k.driftCharge > 1.0 ? 2 : k.driftCharge > 0.45 ? 1 : 0;
    // bias steer toward drift direction
    const steer = k.driftDir * 0.55 + ctrl.steer * 0.55;
    k.angle += steer * turn * speedFactor * dt;
  } else {
    if (k.driftActive) {
      const byTier = [0, 0.5, 0.95, 1.6];
      if (k.driftTier >= 1) k.boostTime = Math.max(k.boostTime, byTier[k.driftTier]);
      k.driftActive = false; k.driftCharge = 0; k.driftTier = 0;
    }
    k.angle += ctrl.steer * turn * speedFactor * (k.speed >= 0 ? 1 : -1) * dt;
  }

  // move freely (no hard walls → never sticks); clamp to world bounds only
  k.x += Math.cos(k.angle) * k.speed * dt;
  k.y += Math.sin(k.angle) * k.speed * dt;
  k.x = Math.max(8, Math.min(world.W - 8, k.x));
  k.y = Math.max(8, Math.min(world.H - 8, k.y));

  void TILE;
}

// Returns true if the hit landed (false if blocked by shield).
export function spinOut(k: Kart): boolean {
  if (k.shieldTime > 0) { k.shieldTime = 0; return false; }
  if (k.spinTime <= 0) { k.spinTime = 0.9; k.speed *= 0.3; k.boostTime = 0; k.driftActive = false; }
  return true;
}
export function slow(k: Kart) { k.slowTime = Math.max(k.slowTime, 1.2); }
