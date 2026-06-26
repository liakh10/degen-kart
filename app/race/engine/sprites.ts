import { ROSTER } from "./characters";
import { SURF, TILE } from "./track";

export type Canvas = HTMLCanvasElement;

function make(w: number, h: number) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!; ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
}
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * f) | 0, g = Math.min(255, ((n >> 8) & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0;
  return `rgb(${r},${g},${b})`;
}
function hash(x: number, y: number, s: number) { let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0; h = (h * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

// ── Kart (top-down, facing east) ──
function buildKart(body: string, skin: string, hair: string): Canvas {
  const L = 34, W = 22;
  const { c, ctx } = make(L, W);
  ctx.fillStyle = "rgba(0,0,0,0.28)"; rr(ctx, 3, 4, L - 4, W - 4, 6, "rgba(0,0,0,0.28)");
  // wheels
  ctx.fillStyle = "#181018";
  ctx.fillRect(7, 1, 7, 4); ctx.fillRect(7, W - 5, 7, 4);
  ctx.fillRect(L - 15, 1, 7, 4); ctx.fillRect(L - 15, W - 5, 7, 4);
  // body
  rr(ctx, 2, 4, L - 5, W - 8, 7, body);
  rr(ctx, 2, 4, L - 5, 4, 6, shade(body, 1.2)); // top highlight
  ctx.strokeStyle = shade(body, 0.55); ctx.lineWidth = 1; ctx.strokeRect(2.5, 4.5, L - 6, W - 9);
  // nose
  rr(ctx, L - 9, 6, 7, W - 12, 3, shade(body, 1.1));
  // spoiler
  ctx.fillStyle = shade(body, 0.6); ctx.fillRect(1, 5, 3, W - 10);
  // cockpit
  rr(ctx, 11, 7, 12, W - 14, 4, "#20141e");
  // driver head + hair
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(16, W / 2, 3.4, 0, 6.28); ctx.fill();
  ctx.fillStyle = hair; ctx.fillRect(13, W / 2 - 4, 5, 2);
  return c;
}

// ── Caricature faces (original parody, drawn from scratch) ──
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

function buildFace(id: string): Canvas {
  const S = 22;
  const { c, ctx } = make(S, S);
  const head = (skin: string) => rr(ctx, 4, 3, 14, 16, 4, skin);
  const eyes = (col = "#1a1230") => { px(ctx, 8, 9, 2, 2, col); px(ctx, 13, 9, 2, 2, col); };
  if (id === "elon") {
    head("#e8b48c"); px(ctx, 4, 2, 14, 4, "#5a3a24"); px(ctx, 4, 3, 3, 3, "#5a3a24"); px(ctx, 15, 3, 3, 3, "#5a3a24");
    eyes(); px(ctx, 9, 14, 5, 1, "#7a4a3a"); // smirk
  } else if (id === "trump") {
    head("#e89b4b"); // blonde swoop
    px(ctx, 3, 1, 16, 5, "#f4e07a"); px(ctx, 3, 4, 4, 4, "#f4e07a"); px(ctx, 15, 4, 4, 4, "#efd86a");
    px(ctx, 5, 2, 11, 2, "#fff0a0");
    eyes(); px(ctx, 9, 14, 5, 1, "#b5663a"); px(ctx, 10, 19, 3, 3, "#d33"); // red tie
  } else if (id === "doge") {
    rr(ctx, 4, 4, 14, 14, 5, "#e0a44e"); px(ctx, 7, 9, 8, 7, "#f3d39b"); // muzzle
    px(ctx, 3, 2, 4, 4, "#caa14a"); px(ctx, 15, 2, 4, 4, "#caa14a"); // ears
    px(ctx, 8, 8, 2, 2, "#1a1230"); px(ctx, 12, 8, 2, 2, "#1a1230"); px(ctx, 10, 12, 2, 2, "#1a1230"); // nose
  } else if (id === "vitalik") {
    rr(ctx, 5, 3, 12, 16, 4, "#e9c6a8"); px(ctx, 5, 2, 12, 3, "#3a2c1c");
    eyes(); px(ctx, 9, 15, 4, 1, "#9a7a5a");
  } else if (id === "cz") {
    head("#d9a066"); px(ctx, 4, 2, 14, 4, "#1a1a1a");
    px(ctx, 7, 8, 8, 3, "#1a1230"); px(ctx, 8, 9, 2, 1, "#9fd"); px(ctx, 12, 9, 2, 1, "#9fd"); // glasses
    px(ctx, 9, 15, 5, 1, "#9a6a3a");
  } else { // sbf curly hair
    px(ctx, 3, 1, 16, 8, "#3a2a20"); for (let i = 0; i < 10; i++) px(ctx, 3 + (i % 5) * 3, 1 + Math.floor(i / 5) * 3, 3, 3, "#4a3528");
    head("#e3b48c"); eyes(); px(ctx, 9, 15, 4, 1, "#9a6a4a");
  }
  return c;
}

// ── Tiles per theme ──
const THEMES: Record<string, { road: [number, number, number]; grass: [number, number, number]; wall: string; wall2: string }> = {
  sunset: { road: [60, 56, 70], grass: [104, 156, 72], wall: "#e23b3b", wall2: "#ffffff" },
  beach: { road: [86, 86, 96], grass: [222, 206, 140], wall: "#19a0d0", wall2: "#ffffff" },
  night: { road: [44, 44, 60], grass: [40, 70, 60], wall: "#7c5cff", wall2: "#19e0ff" },
};

function buildTile(surf: number, theme: string, variant: number): Canvas {
  const { c, ctx } = make(TILE, TILE);
  const th = THEMES[theme] || THEMES.sunset;
  const noise = (base: [number, number, number], v: number, seed: number) => {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const n = hash(x, y, seed); const f = 1 - v / 2 + n * v;
      ctx.fillStyle = `rgb(${(base[0] * f) | 0},${(base[1] * f) | 0},${(base[2] * f) | 0})`; ctx.fillRect(x, y, 1, 1);
    }
  };
  if (surf === SURF.ROAD) noise(th.road, 0.14, variant + 1);
  else if (surf === SURF.GRASS) noise(th.grass, 0.26, variant + 5);
  else if (surf === SURF.BOOST) { noise(th.road, 0.1, 2); ctx.fillStyle = "#ffd23d"; ctx.beginPath(); ctx.moveTo(4, 18); ctx.lineTo(12, 6); ctx.lineTo(20, 18); ctx.lineTo(16, 18); ctx.lineTo(12, 12); ctx.lineTo(8, 18); ctx.closePath(); ctx.fill(); }
  else { // wall = guardrail stripes
    noise(th.road, 0.1, 3);
    for (let i = 0; i < TILE; i += 8) { ctx.fillStyle = (i / 8) % 2 === 0 ? th.wall : th.wall2; ctx.fillRect(i, TILE / 2 - 4, 8, 8); }
  }
  return c;
}

function buildItemBox(): Canvas {
  const { c, ctx } = make(20, 20);
  ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(10, 17, 7, 2.5, 0, 0, 6.28); ctx.fill();
  rr(ctx, 3, 2, 14, 14, 4, "#19e0ff"); rr(ctx, 4, 3, 12, 12, 3, "#7cf2ff");
  ctx.fillStyle = "#1a1230"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 10, 9.5);
  return c;
}
function buildCoin(): Canvas {
  const { c, ctx } = make(16, 16);
  ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(8, 13, 5, 2, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = "#caa10a"; ctx.beginPath(); ctx.arc(8, 7, 6, 0, 6.28); ctx.fill();
  ctx.fillStyle = "#ffd23d"; ctx.beginPath(); ctx.arc(8, 7, 4.5, 0, 6.28); ctx.fill();
  ctx.fillStyle = "#7a5a00"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("M", 8, 7.5);
  return c;
}
function buildBanana(): Canvas { const { c, ctx } = make(16, 16); ctx.fillStyle = "#ffd23d"; ctx.beginPath(); ctx.arc(8, 12, 8, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(13, 9); ctx.arc(8, 11, 5, Math.PI * 1.9, Math.PI * 1.1, true); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#5a3a10"; ctx.fillRect(2, 7, 2, 2); return c; }
function buildOil(): Canvas { const { c, ctx } = make(22, 22); ctx.fillStyle = "rgba(20,16,30,0.72)"; ctx.beginPath(); ctx.ellipse(11, 11, 10, 7, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = "rgba(80,70,110,0.6)"; ctx.beginPath(); ctx.ellipse(8, 9, 3, 2, 0, 0, 6.28); ctx.fill(); return c; }
function buildRocket(): Canvas { const { c, ctx } = make(20, 10); rr(ctx, 1, 3, 13, 4, 2, "#e23b3b"); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(14, 1); ctx.lineTo(19, 5); ctx.lineTo(14, 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#ffd23d"; ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(-4, 5); ctx.lineTo(1, 2); ctx.closePath(); ctx.fill(); return c; }

export interface SpriteSet {
  kart: (id: string) => Canvas;
  face: (id: string) => Canvas;
  tile: (surf: number, theme: string, variant: number) => Canvas;
  itemBox: Canvas; coin: Canvas; banana: Canvas; oil: Canvas; rocket: Canvas;
}

export function buildSprites(theme: string): SpriteSet {
  const kartCache = new Map<string, Canvas>();
  const faceCache = new Map<string, Canvas>();
  const tileCache = new Map<string, Canvas>();
  return {
    kart: (id) => { if (!kartCache.has(id)) { const ch = ROSTER.find((r) => r.id === id)!; kartCache.set(id, buildKart(ch.kart, ch.skin, ch.hair)); } return kartCache.get(id)!; },
    face: (id) => { if (!faceCache.has(id)) faceCache.set(id, buildFace(id)); return faceCache.get(id)!; },
    tile: (surf, th, variant) => { const k = `${surf}_${th}_${variant % 3}`; if (!tileCache.has(k)) tileCache.set(k, buildTile(surf, th, variant % 3)); return tileCache.get(k)!; },
    itemBox: buildItemBox(), coin: buildCoin(), banana: buildBanana(), oil: buildOil(), rocket: buildRocket(),
  };
  void theme;
}

// Standalone face for React select screen (returns dataURL-able canvas)
export function renderFaceCanvas(id: string): Canvas { return buildFace(id); }
