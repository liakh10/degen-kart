export type ItemType = "ROCKET" | "BANANA" | "BOOST" | "WALL" | "OIL" | "GAS" | "SHIELD" | "LIGHTNING";

export const ITEM_LABEL: Record<ItemType, string> = {
  ROCKET: "ROCKET", BANANA: "BANANA", BOOST: "BOOST", WALL: "WALL", OIL: "OIL", GAS: "GAS", SHIELD: "SHIELD", LIGHTNING: "BOLT",
};

// Weighted random — karts further back get punchier (comeback) items.
export function rollItem(placeFromFront: number, total: number): ItemType {
  const back = placeFromFront / Math.max(1, total - 1); // 0 leader .. 1 last
  const pool: ItemType[] = ["BOOST", "BANANA", "OIL", "SHIELD"];
  if (back > 0.2) pool.push("ROCKET", "WALL");
  if (back > 0.5) pool.push("ROCKET", "GAS", "BOOST");
  if (back > 0.75) pool.push("LIGHTNING");           // only the back of the pack can roll the bolt
  return pool[(Math.random() * pool.length) | 0];
}

export class Projectile {
  life = 2.2;
  constructor(public x: number, public y: number, public vx: number, public vy: number, public owner: number) {}
}

export class Hazard {
  constructor(public type: ItemType, public x: number, public y: number, public life: number, public owner: number) {}
}
