import { Track, TILE, SURF } from "./track";

export class World {
  constructor(public track: Track) {}

  get W() { return this.track.W; }
  get H() { return this.track.H; }

  surfaceAt(x: number, y: number): number {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.track.cols || ty >= this.track.rows) return SURF.WALL;
    return this.track.surf[ty * this.track.cols + tx];
  }

  isWall(x: number, y: number): boolean { return this.surfaceAt(x, y) === SURF.WALL; }
  isOffRoad(x: number, y: number): boolean { const s = this.surfaceAt(x, y); return s === SURF.GRASS; }

  // nearest checkpoint index to a point (for lap/position progress)
  nearestCheckpoint(x: number, y: number): number {
    const cps = this.track.checkpoints;
    let best = 0, bd = Infinity;
    for (let i = 0; i < cps.length; i++) {
      const d = (cps[i].x - x) ** 2 + (cps[i].y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
}
