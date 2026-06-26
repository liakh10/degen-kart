import { World } from "./world";
import { buildTrack, TRACK_DEFS, TILE, SURF, Track } from "./track";
import { buildSprites, SpriteSet } from "./sprites";
import { ROSTER, charById } from "./characters";
import { Camera } from "./camera";
import { Input } from "./input";
import { Sfx } from "./sfx";
import { Kart, updateKart, spinOut, slow } from "./kart";
import { aiControl } from "./ai";
import { updateProgress, computePlaces, displayLap } from "./race";
import { Projectile, Hazard, rollItem, ItemType } from "./items";
import { Economy } from "./economy";

export interface ResultRow { name: string; place: number; you: boolean; }
export interface HudState {
  lap: number; laps: number; place: number; total: number;
  item: string | null; coins: number; speed: number;
  countdown: string | null; boost: boolean; driftCharge: number; driftTier: number;
  shield: boolean; wrongWay: boolean;
  lapTime: number; bestLap: number;
  finished: boolean; results: ResultRow[] | null; reward: number;
}
export interface GameOpts { trackIndex?: number; }
export interface GameHandle {
  onState: (cb: (s: HudState) => void) => void;
  useItem: () => void;
  setPaused: (b: boolean) => void;
  setMinimap: (c: HTMLCanvasElement | null) => void;
  dispose: () => void;
}

interface ItemBox { x: number; y: number; respawn: number; }
interface Coin { x: number; y: number; got: boolean; respawn: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; }

export function createGame(container: HTMLElement, opts: GameOpts = {}): GameHandle {
  const econ = new Economy();
  const trackIndex = (opts.trackIndex ?? econ.selectedTrack) % TRACK_DEFS.length;
  const trackDef = TRACK_DEFS[trackIndex];
  const track: Track = buildTrack(trackDef);
  const world = new World(track);
  const sprites: SpriteSet = buildSprites(track.theme);
  const sfx = new Sfx();

  const canvas = document.createElement("canvas");
  canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.height = "100%";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const cam = new Camera(container.clientWidth, container.clientHeight, 1.7);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.floor(container.clientWidth * dpr);
    canvas.height = Math.floor(container.clientHeight * dpr);
    cam.resize(container.clientWidth, container.clientHeight); cam.dpr = dpr;
    ctx.imageSmoothingEnabled = false;
  }
  resize(); window.addEventListener("resize", resize);
  const input = new Input(canvas);

  // ── Build grid of karts ──
  const playerChar = charById(econ.selectedChar);
  const others = ROSTER.filter((c) => c.id !== playerChar.id);
  for (let i = others.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [others[i], others[j]] = [others[j], others[i]]; }
  const field = [playerChar, ...others.slice(0, 5)];

  const karts: Kart[] = [];
  const back = track.startAngle + Math.PI;
  const side = track.startAngle + Math.PI / 2;
  field.forEach((ch, i) => {
    const row = Math.floor(i / 2), col = i % 2;
    const bx = track.startPos.x + Math.cos(back) * (30 + row * 34) + Math.cos(side) * (col === 0 ? -20 : 20);
    const by = track.startPos.y + Math.sin(back) * (30 + row * 34) + Math.sin(side) * (col === 0 ? -20 : 20);
    const isP = ch.id === playerChar.id;
    const k = new Kart(bx, by, track.startAngle, ch, isP, isP ? econ.mods() : { speed: 0, accel: 0, handling: 0, boost: 0 });
    k.cpIndex = 0;
    karts.push(k);
  });
  const player = karts.find((k) => k.isPlayer)!;
  const aiItemTimers = new Map<Kart, number>();

  // ── items / coins on track ──
  const boxes: ItemBox[] = track.itemBoxes.map((b) => ({ x: b.x, y: b.y, respawn: 0 }));
  const coins: Coin[] = track.coins.map((c) => ({ x: c.x, y: c.y, got: false, respawn: 0 }));
  const projectiles: Projectile[] = [];
  const hazards: Hazard[] = [];
  const particles: Particle[] = [];
  let raceCoins = 0;

  function burst(x: number, y: number, color: string, n: number, spd = 80) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = spd * (0.3 + Math.random()); particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.3, max: 0.7, color, size: 1 + Math.random() * 2 }); }
  }

  // ── countdown / race state ──
  let countdown = 3.0;       // 3..0 then GO
  let started = false;
  let goTimer = 0;
  let finished = false;
  let results: ResultRow[] | null = null;
  let reward = 0;
  let lastBeep = 4;
  let lapStart = 0;
  let curLapTime = 0;
  let prevLap = 0;
  let wrongWay = false;
  let bestLap = (() => { try { return Number(localStorage.getItem(`degenkart_best_${trackIndex}`)) || 0; } catch { return 0; } })();

  function useItem(k: Kart) {
    if (!k.item) return;
    const t = k.item as ItemType; k.item = null;
    const bx = k.x - Math.cos(k.angle) * 22, by = k.y - Math.sin(k.angle) * 22;
    if (t === "ROCKET") { projectiles.push(new Projectile(k.x + Math.cos(k.angle) * 24, k.y + Math.sin(k.angle) * 24, Math.cos(k.angle) * 460, Math.sin(k.angle) * 460, karts.indexOf(k))); sfx.rocket(); }
    else if (t === "BOOST") { k.boostTime = Math.max(k.boostTime, 0.9); sfx.boost(); }
    else if (t === "BANANA") { hazards.push(new Hazard("BANANA", bx, by, 22, karts.indexOf(k))); sfx.item(); }
    else if (t === "WALL") { hazards.push(new Hazard("WALL", bx, by, 12, karts.indexOf(k))); sfx.item(); }
    else if (t === "OIL") { hazards.push(new Hazard("OIL", bx, by, 14, karts.indexOf(k))); sfx.item(); }
    else if (t === "GAS") { hazards.push(new Hazard("GAS", k.x, k.y, 3.2, karts.indexOf(k))); sfx.item(); }
    else if (t === "SHIELD") { k.shieldTime = 6; sfx.boost(); burst(k.x, k.y, "#19e0ff", 10, 60); }
    else if (t === "LIGHTNING") {
      computePlaces(karts);
      for (const o of karts) { if (o !== k && o.place < k.place && !o.finished) { if (spinOut(o)) { burst(o.x, o.y, "#ffe66b", 12, 110); } } }
      if (k.isPlayer) cam.shake(5, 0.3); sfx.rocket();
    }
  }

  // ── update ──
  function update(dt: number) {
    if (!started) {
      countdown -= dt;
      const n = Math.ceil(countdown);
      if (n < lastBeep && n >= 1) { lastBeep = n; sfx.countBeep(); }
      if (countdown <= 0) { started = true; goTimer = 1.0; sfx.go(); lapStart = performance.now(); }
    }
    if (goTimer > 0) goTimer -= dt;

    // controls
    karts.forEach((k) => {
      if (k.finished) { updateKart(k, world, { throttle: 0.4, brake: false, steer: 0, drift: false }, dt, started); return; }
      if (k.isPlayer) {
        const steer = (input.down("ArrowRight") || input.down("KeyD") ? 1 : 0) - (input.down("ArrowLeft") || input.down("KeyA") ? 1 : 0);
        const throttle = input.down("ArrowUp") || input.down("KeyW") ? 1 : 0;
        const brake = input.down("ArrowDown") || input.down("KeyS");
        const drift = input.down("ShiftLeft") || input.down("Space");
        updateKart(k, world, { throttle, brake, steer, drift }, dt, started);
        if (input.consumePressed("KeyZ") || input.consumePressed("Enter")) useItem(k);
      } else {
        updateKart(k, world, started ? aiControl(k, track, world) : { throttle: 0, brake: false, steer: 0, drift: false }, dt, started);
        // AI uses items
        if (k.item) {
          const tmr = (aiItemTimers.get(k) ?? 1.5) - dt;
          if (tmr <= 0) { useItem(k); aiItemTimers.delete(k); } else aiItemTimers.set(k, tmr);
        }
      }
      if (started) updateProgress(k, world, track);
      // drift sparks coloured by mini-turbo tier
      if (k.driftActive && Math.random() < 0.75) {
        const col = k.driftTier >= 3 ? "#b066ff" : k.driftTier === 2 ? "#ff8a3d" : k.driftTier === 1 ? "#19e0ff" : "#dddddd";
        burst(k.x - Math.cos(k.angle) * 12, k.y - Math.sin(k.angle) * 12, col, 1, 34);
      }
      if (k.boostTime > 0 && Math.random() < 0.7) burst(k.x - Math.cos(k.angle) * 14, k.y - Math.sin(k.angle) * 14, "#ffd23d", 1, 50);
    });

    // separate overlapping karts so they don't stack / pin each other
    for (let i = 0; i < karts.length; i++) {
      for (let j = i + 1; j < karts.length; j++) {
        const a = karts[i], b = karts[j];
        const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy);
        if (d > 0.1 && d < 22) {
          const push = (22 - d) / 2, ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
    }

    // item boxes
    for (const b of boxes) {
      if (b.respawn > 0) { b.respawn -= dt; continue; }
      for (const k of karts) {
        if (k.item || k.finished) continue;
        if (Math.hypot(k.x - b.x, k.y - b.y) < 20) {
          computePlaces(karts);
          k.item = rollItem(k.place - 1, karts.length);
          if (!k.isPlayer) aiItemTimers.set(k, 1 + Math.random() * 2.5);
          b.respawn = 4; if (k.isPlayer) sfx.item();
          break;
        }
      }
    }
    // coins
    for (const c of coins) {
      if (c.got) { c.respawn -= dt; if (c.respawn <= 0) c.got = false; continue; }
      if (Math.hypot(player.x - c.x, player.y - c.y) < 16) { c.got = true; c.respawn = 8; raceCoins += 5; sfx.coin(); burst(c.x, c.y, "#ffd23d", 5, 60); }
    }
    // coins give a small top-speed bonus (up to +40 at 10 coins)
    player.extraSpeed = Math.min(40, (raceCoins / 5) * 4);

    // projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      let hit = world.isWall(p.x, p.y);
      if (!hit) for (let ki = 0; ki < karts.length; ki++) { if (ki === p.owner) continue; const k = karts[ki]; if (Math.hypot(k.x - p.x, k.y - p.y) < 16) { if (spinOut(k)) { burst(k.x, k.y, "#ff5b3a", 12, 110); if (k.isPlayer) { cam.shake(6, 0.3); sfx.spin(); } } else { burst(k.x, k.y, "#19e0ff", 10, 80); } hit = true; break; } }
      if (hit || p.life <= 0) { burst(p.x, p.y, "#ffae3a", 6, 80); projectiles.splice(i, 1); }
    }
    // hazards
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i]; h.life -= dt;
      const r = h.type === "WALL" ? 18 : h.type === "GAS" ? 42 : 15;
      for (let ki = 0; ki < karts.length; ki++) {
        const k = karts[ki]; const d = Math.hypot(k.x - h.x, k.y - h.y);
        if (d < r) {
          if (h.type === "OIL" || h.type === "GAS") slow(k);
          else { if (ki === h.owner && h.life > (h.type === "BANANA" ? 21 : 11)) continue; if (spinOut(k)) { burst(k.x, k.y, "#dddddd", 8); if (k.isPlayer) { cam.shake(4, 0.2); sfx.spin(); } } else { burst(k.x, k.y, "#19e0ff", 8); } h.life = 0; }
        }
      }
      if (h.life <= 0) hazards.splice(i, 1);
    }

    // finishing
    computePlaces(karts);
    for (const k of karts) {
      if (!k.finished && k.lap >= track.laps) { k.finished = true; if (k.isPlayer && !finished) finishRace(); }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; if (p.life <= 0) particles.splice(i, 1); }

    // lap time + best lap + wrong-way
    if (started && !finished) {
      curLapTime = (performance.now() - lapStart) / 1000;
      if (player.lap > prevLap) {
        if (player.lap >= 1 && (bestLap === 0 || curLapTime < bestLap)) { bestLap = curLapTime; try { localStorage.setItem(`degenkart_best_${trackIndex}`, String(bestLap)); } catch { /* */ } }
        prevLap = player.lap; lapStart = performance.now(); curLapTime = 0;
      }
      const N = track.checkpoints.length;
      const nextCp = track.checkpoints[(player.cpIndex + 1) % N];
      const desired = Math.atan2(nextCp.y - player.y, nextCp.x - player.x);
      let dd = desired - player.angle; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2;
      wrongWay = Math.abs(dd) > 2.2 && player.speed > 50;
    }

    // camera — pull in slightly on boost for a sense of speed
    cam.zoom += ((player.boostTime > 0 ? 1.62 : 1.7) - cam.zoom) * Math.min(1, dt * 6);
    cam.follow(player.x, player.y, world.W, world.H, dt);
  }

  function finishRace() {
    finished = true;
    const order = computePlaces(karts);
    const place = player.place;
    const payouts = [600, 420, 300, 200, 130, 80];
    reward = (payouts[place - 1] ?? 60) + raceCoins;
    econ.addCoins(reward);
    results = order.map((k) => ({ name: k.char.name, place: k.place, you: k.isPlayer }));
  }

  // ── render ──
  function render() {
    const dpr = cam.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0d0b1a"; ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);
    cam.apply(ctx);

    const x0 = Math.floor(cam.x / TILE) - 1, y0 = Math.floor(cam.y / TILE) - 1;
    const x1 = Math.ceil((cam.x + cam.viewW / cam.zoom) / TILE) + 1, y1 = Math.ceil((cam.y + cam.viewH / cam.zoom) / TILE) + 1;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= track.cols || ty >= track.rows) continue;
      const surf = track.surf[ty * track.cols + tx];
      ctx.drawImage(sprites.tile(surf, track.theme, (tx * 7 + ty * 13) % 3), tx * TILE, ty * TILE);
    }
    // start/finish checker line
    drawStartLine();

    // coins + boxes
    const now = performance.now();
    for (const c of coins) if (!c.got) ctx.drawImage(sprites.coin, c.x - 8, c.y - 8 + Math.sin(now / 250 + c.x) * 2);
    for (const b of boxes) if (b.respawn <= 0) ctx.drawImage(sprites.itemBox, b.x - 10, b.y - 10 + Math.sin(now / 260 + b.x) * 2);

    // hazards
    for (const h of hazards) {
      if (h.type === "BANANA") ctx.drawImage(sprites.banana, h.x - 8, h.y - 8);
      else if (h.type === "OIL") ctx.drawImage(sprites.oil, h.x - 11, h.y - 11);
      else if (h.type === "WALL") { ctx.fillStyle = "#e0a500"; ctx.fillRect(h.x - 12, h.y - 5, 24, 10); ctx.strokeStyle = "#1a1230"; ctx.lineWidth = 1.5; ctx.strokeRect(h.x - 12, h.y - 5, 24, 10); }
      else if (h.type === "GAS") { ctx.globalAlpha = 0.4 * Math.min(1, h.life); ctx.fillStyle = "#7c5cff"; ctx.beginPath(); ctx.arc(h.x, h.y, 40, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
    }
    // projectiles
    for (const p of projectiles) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.drawImage(sprites.rocket, -10, -5); ctx.restore(); }

    // karts: rotated body + player ring + UPRIGHT founder head + floating name
    for (const k of karts) {
      if (k.isPlayer) {
        ctx.strokeStyle = "#19e0ff"; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.ellipse(k.x, k.y + 8, 16, 8, 0, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (k.shieldTime > 0) {
        ctx.strokeStyle = "#19e0ff"; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now / 90);
        ctx.beginPath(); ctx.arc(k.x, k.y, 17, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
      }
      const img = sprites.kart(k.char.id);
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.angle);
      if (k.spinTime > 0 && Math.floor(k.spinTime * 20) % 2 === 0) ctx.globalAlpha = 0.7;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore(); ctx.globalAlpha = 1;
      // founder head sticking up (upright, not rotated)
      const fimg = sprites.face(k.char.id);
      const hs = 17;
      ctx.drawImage(fimg, Math.round(k.x - hs / 2), Math.round(k.y - hs / 2 - 5), hs, hs);
      // floating name tag
      ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.lineWidth = 3; ctx.strokeStyle = "#1a1230"; ctx.lineJoin = "round";
      ctx.strokeText(k.char.name, k.x, k.y - 16);
      ctx.fillStyle = k.isPlayer ? "#19e0ff" : "#ffffff";
      ctx.fillText(k.char.name, k.x, k.y - 16);
    }
    // particles
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.globalAlpha = 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // subtle vignette
    const g = ctx.createRadialGradient(container.clientWidth / 2, container.clientHeight / 2, container.clientHeight * 0.4, container.clientWidth / 2, container.clientHeight / 2, container.clientHeight * 0.8);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.32)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);

    // speed lines while boosting
    if (player.boostTime > 0) {
      const W = container.clientWidth, H = container.clientHeight, cx = W / 2, cy = H / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 6.28 + now / 400;
        const r0 = Math.min(W, H) * (0.42 + (i % 3) * 0.05);
        const r1 = r0 + 60;
        ctx.globalAlpha = 0.35 + 0.25 * Math.random();
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawStartLine() {
    const sp = track.startPos, a = track.startAngle + Math.PI / 2;
    const nx = Math.cos(a), ny = Math.sin(a);
    for (let s = -track.roadHalf; s < track.roadHalf; s += 8) {
      for (let r = -1; r <= 1; r++) {
        const cellOn = (Math.floor(s / 8) + r) % 2 === 0;
        ctx.fillStyle = cellOn ? "#ffffff" : "#1a1230";
        const px = sp.x + nx * s + Math.cos(track.startAngle) * r * 8;
        const py = sp.y + ny * s + Math.sin(track.startAngle) * r * 8;
        ctx.fillRect(px - 4, py - 4, 8, 8);
      }
    }
  }

  // ── minimap ──
  let mini: HTMLCanvasElement | null = null;
  function drawMinimap() {
    if (!mini) return;
    const m = mini.getContext("2d")!; const MW = mini.width, MH = mini.height;
    const sc = Math.min(MW / world.W, MH / world.H);
    m.clearRect(0, 0, MW, MH); m.fillStyle = "rgba(10,8,22,0.6)"; m.fillRect(0, 0, MW, MH);
    m.strokeStyle = "#ffffff"; m.lineWidth = Math.max(2, track.roadHalf * sc * 0.8);
    m.beginPath();
    track.centerline.forEach((p, i) => { const x = p.x * sc, y = p.y * sc; i === 0 ? m.moveTo(x, y) : m.lineTo(x, y); });
    m.closePath(); m.globalAlpha = 0.5; m.stroke(); m.globalAlpha = 1;
    for (const k of karts) { m.fillStyle = k.isPlayer ? "#19e0ff" : "#ff4d6d"; m.beginPath(); m.arc(k.x * sc, k.y * sc, k.isPlayer ? 3.2 : 2.2, 0, 6.28); m.fill(); }
  }

  // ── HUD ──
  let stateCb: (s: HudState) => void = () => {};
  function pushState() {
    const cd = !started ? (countdown > 0 ? String(Math.ceil(countdown)) : "GO!") : (goTimer > 0 ? "GO!" : null);
    stateCb({
      lap: displayLap(player, track.laps), laps: track.laps,
      place: player.place, total: karts.length,
      item: player.item, coins: econ.coins + (finished ? 0 : raceCoins), speed: Math.round(Math.abs(player.speed)),
      countdown: cd, boost: player.boostTime > 0, driftCharge: Math.min(1, player.driftCharge / 1.7), driftTier: player.driftTier,
      shield: player.shieldTime > 0, wrongWay,
      lapTime: curLapTime, bestLap,
      finished, results, reward,
    });
  }

  // ── loop ──
  let raf = 0, last = performance.now(), acc = 0, paused = false;
  function loop() {
    const now = performance.now(); let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    if (!paused && !finished) { update(dt); input.endFrame(); }
    else if (!paused && finished) { for (const k of karts) updateKart(k, world, { throttle: 0, brake: true, steer: 0, drift: false }, dt, started); }
    render(); drawMinimap();
    acc += dt; if (acc > 0.06) { acc = 0; pushState(); }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    onState: (cb) => { stateCb = cb; pushState(); },
    useItem: () => useItem(player),
    setPaused: (b) => { paused = b; last = performance.now(); },
    setMinimap: (c) => { mini = c; },
    dispose: () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); input.dispose(); if (canvas.parentElement === container) container.removeChild(canvas); },
  };
}

export { TRACK_DEFS };
