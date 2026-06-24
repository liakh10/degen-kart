export type ItemType = "ROCKET" | "BANANA" | "BOOST" | "WALL" | "OIL" | "GAS";

export const ITEM_LABEL: Record<ItemType, string> = {
  ROCKET: "ROCKET", BANANA: "BANANA", BOOST: "BOOST", WALL: "WALL", OIL: "OIL", GAS: "GAS",
};

// Weighted random — karts further back get slightly punchier items.
export function rollItem(placeFromFront: number, total: number): ItemType {
  const back = placeFromFront / Math.max(1, total - 1); // 0 leader .. 1 last
  const pool: ItemType[] = ["BOOST", "BANANA", "OIL"];
  if (back > 0.2) pool.push("ROCKET", "WALL");
  if (back > 0.5) pool.push("ROCKET", "GAS", "BOOST");
  return pool[(Math.random() * pool.length) | 0];
}

export class Projectile {
  life = 2.2;
  constructor(public x: number, public y: number, public vx: number, public vy: number, public owner: number) {}
}

export class Hazard {
  constructor(public type: ItemType, public x: number, public y: number, public life: number, public owner: number) {}
}
