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
  boostTime = 0;
  spinTime = 0;
  slowTime = 0;       // oil/gas slow
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

  const onGrass = world.surfaceAt(k.x, k.y) === SURF.GRASS;
  const onBoostPad = world.surfaceAt(k.x, k.y) === SURF.BOOST;
  if (onBoostPad && k.boostTime < 0.3) k.boostTime = 0.5;

  let maxSpeed = k.maxSpeed;
  if (onGrass) maxSpeed *= 0.46;
  if (k.slowTime > 0) { maxSpeed *= 0.55; k.slowTime -= dt; }
  if (k.boostTime > 0) { maxSpeed = Math.max(maxSpeed, k.boostMax); k.boostTime -= dt; }

  // longitudinal
  if (!started) { k.speed *= (1 - 3 * dt); }
  else if (ctrl.brake) { k.speed -= k.accel * 1.6 * dt; }
  else { k.speed += ctrl.throttle * k.accel * dt; }
  k.speed *= (1 - (onGrass ? 2.4 : 1.1) * dt); // drag
  k.speed = Math.max(-k.maxSpeed * 0.3, Math.min(maxSpeed, k.speed));

  // steering + drift
  const speedFactor = Math.min(1, Math.abs(k.speed) / 60);
  let turn = k.turn;
  const wantDrift = ctrl.drift && Math.abs(ctrl.steer) > 0.2 && k.speed > 70;
  if (wantDrift) {
    if (!k.driftActive) { k.driftActive = true; k.driftDir = Math.sign(ctrl.steer); k.driftCharge = 0; }
    turn *= 1.55;
    k.driftCharge += dt;
    // bias steer toward drift direction
    const steer = k.driftDir * 0.55 + ctrl.steer * 0.55;
    k.angle += steer * turn * speedFactor * dt;
  } else {
    if (k.driftActive) {
      if (k.driftCharge > 0.55) k.boostTime = Math.max(k.boostTime, 0.45 + Math.min(k.driftCharge, 2.2) * 0.38);
      k.driftActive = false; k.driftCharge = 0;
    }
    k.angle += ctrl.steer * turn * speedFactor * (k.speed >= 0 ? 1 : -1) * dt;
  }

  // move with wall collision — SLIDE along walls (no reverse → never sticks)
  const nx = k.x + Math.cos(k.angle) * k.speed * dt;
  const ny = k.y + Math.sin(k.angle) * k.speed * dt;
  let blocked = false;
  if (!world.isWall(nx, k.y)) k.x = nx; else blocked = true;
  if (!world.isWall(k.x, ny)) k.y = ny; else blocked = true;
  if (blocked) k.speed *= 0.6;

  void TILE;
}

export function spinOut(k: Kart) { if (k.spinTime <= 0) { k.spinTime = 0.9; k.speed *= 0.3; k.boostTime = 0; k.driftActive = false; } }
export function slow(k: Kart) { k.slowTime = Math.max(k.slowTime, 1.2); }
