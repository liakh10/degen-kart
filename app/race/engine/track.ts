// Track = closed Catmull-Rom spline of control points, rasterized into a
// surface grid (grass/road/wall/boost) plus checkpoints, item boxes and coins.

export const TILE = 24;
export const SURF = { GRASS: 0, ROAD: 1, WALL: 2, BOOST: 3 } as const;

export interface TrackDef {
  name: string;
  theme: string;          // palette key
  points: [number, number][];
  roadHalf: number;       // half road width in px
  laps: number;
}

export interface Checkpoint { x: number; y: number; angle: number; }
export interface Vec { x: number; y: number; }

export interface Track {
  name: string;
  theme: string;
  laps: number;
  W: number; H: number;        // world px
  cols: number; rows: number;
  surf: Uint8Array;            // surface per tile
  centerline: Vec[];           // dense polyline (closed)
  checkpoints: Checkpoint[];
  startPos: Vec; startAngle: number;
  itemBoxes: Vec[];
  coins: Vec[];
  roadHalf: number;
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function sampleLoop(pts: [number, number][], perSeg: number): Vec[] {
  const n = pts.length;
  const out: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      out.push({ x: catmull(p0[0], p1[0], p2[0], p3[0], t), y: catmull(p0[1], p1[1], p2[1], p3[1], t) });
    }
  }
  return out;
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function buildTrack(def: TrackDef): Track {
  const centerline = sampleLoop(def.points, 22);
  // bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of centerline) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const margin = def.roadHalf + 160;
  // normalise so world starts at 0
  const offX = margin - minX, offY = margin - minY;
  for (const p of centerline) { p.x += offX; p.y += offY; }
  const W = Math.ceil((maxX - minX) + margin * 2);
  const H = Math.ceil((maxY - minY) + margin * 2);
  const cols = Math.ceil(W / TILE), rows = Math.ceil(H / TILE);
  const surf = new Uint8Array(cols * rows);

  const wall = def.roadHalf + 16;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const wx = tx * TILE + TILE / 2, wy = ty * TILE + TILE / 2;
      let d = Infinity;
      for (let i = 0; i < centerline.length; i++) {
        const a = centerline[i], b = centerline[(i + 1) % centerline.length];
        const dd = distToSeg(wx, wy, a.x, a.y, b.x, b.y);
        if (dd < d) d = dd;
        if (d < def.roadHalf - 4) break;
      }
      surf[ty * cols + tx] = d <= def.roadHalf ? SURF.ROAD : d <= wall ? SURF.WALL : SURF.GRASS;
    }
  }

  // checkpoints (evenly along centerline)
  const NCP = 24;
  const checkpoints: Checkpoint[] = [];
  for (let i = 0; i < NCP; i++) {
    const idx = Math.floor((i / NCP) * centerline.length);
    const a = centerline[idx], b = centerline[(idx + 4) % centerline.length];
    checkpoints.push({ x: a.x, y: a.y, angle: Math.atan2(b.y - a.y, b.x - a.x) });
  }
  const startPos = { x: checkpoints[0].x, y: checkpoints[0].y };
  const startAngle = checkpoints[0].angle;

  // item boxes — a few rows across the road at spots around the loop
  const itemBoxes: Vec[] = [];
  for (let k = 0; k < 6; k++) {
    const idx = Math.floor(((k + 0.5) / 6) * centerline.length);
    const a = centerline[idx], b = centerline[(idx + 3) % centerline.length];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
    for (let lane = -1; lane <= 1; lane++) itemBoxes.push({ x: a.x + nx * lane * (def.roadHalf * 0.5), y: a.y + ny * lane * (def.roadHalf * 0.5) });
  }

  // coins along the racing line
  const coins: Vec[] = [];
  for (let i = 0; i < centerline.length; i += 10) {
    if (Math.random() < 0.6) coins.push({ x: centerline[i].x, y: centerline[i].y });
  }

  return { name: def.name, theme: def.theme, laps: def.laps, W, H, cols, rows, surf, centerline, checkpoints, startPos, startAngle, itemBoxes, coins, roadHalf: def.roadHalf };
}

export const TRACK_DEFS: TrackDef[] = [
  {
    name: "SUNSET SPEEDWAY", theme: "sunset", roadHalf: 64, laps: 3,
    points: [[300, 250], [900, 170], [1430, 320], [1520, 680], [1250, 980], [700, 1030], [260, 820], [180, 480]],
  },
  {
    name: "PALM CIRCUIT", theme: "beach", roadHalf: 58, laps: 3,
    points: [[300, 400], [650, 200], [1050, 230], [1250, 480], [1500, 520], [1480, 880], [1050, 950], [820, 720], [520, 920], [240, 720]],
  },
  {
    name: "MOON RALLY", theme: "night", roadHalf: 70, laps: 3,
    points: [[350, 300], [1000, 250], [1450, 450], [1300, 800], [1550, 1050], [950, 1150], [400, 1000], [250, 600]],
  },
];
