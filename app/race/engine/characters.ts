// Roster of original pixel caricatures (parody). Faces are drawn from scratch
// in sprites.ts; this holds stats, colours, signature item and unlock cost.

export interface CharStats { speed: number; accel: number; handling: number; }

export interface CharDef {
  id: string;
  name: string;
  kart: string;     // kart body colour
  skin: string;
  hair: string;
  stats: CharStats; // 1..5
  item: string;     // signature item label
  unlock: number;   // $KART cost (0 = free starter)
}

export const ROSTER: CharDef[] = [
  { id: "elon", name: "EELON", kart: "#e23b3b", skin: "#e8b48c", hair: "#5a3a24", stats: { speed: 5, accel: 3, handling: 3 }, item: "ROCKET", unlock: 0 },
  { id: "trump", name: "DRUMPF", kart: "#f0a500", skin: "#e89b4b", hair: "#f4e07a", stats: { speed: 4, accel: 3, handling: 4 }, item: "WALL", unlock: 0 },
  { id: "doge", name: "DOGE", kart: "#f2c94c", skin: "#e0a44e", hair: "#caa14a", stats: { speed: 3, accel: 4, handling: 5 }, item: "BOOST", unlock: 0 },
  { id: "vitalik", name: "VITALIK", kart: "#7c5cff", skin: "#e9c6a8", hair: "#3a2c1c", stats: { speed: 3, accel: 5, handling: 4 }, item: "GAS", unlock: 1500 },
  { id: "cz", name: "CEEZ", kart: "#f3ba2f", skin: "#d9a066", hair: "#1a1a1a", stats: { speed: 4, accel: 4, handling: 3 }, item: "BANANA", unlock: 2000 },
  { id: "sbf", name: "BANKMAN", kart: "#2bbf6a", skin: "#e3b48c", hair: "#3a2a20", stats: { speed: 4, accel: 4, handling: 4 }, item: "OIL", unlock: 2500 },
];

export function charById(id: string): CharDef {
  return ROSTER.find((c) => c.id === id) || ROSTER[0];
}
