// Roster of original pixel caricatures (parody). Faces are drawn procedurally
// from the `face` descriptor in sprites.ts; this holds stats, colours,
// signature item (given at the start of a race) and unlock cost.

export interface CharStats { speed: number; accel: number; handling: number; }
export type FaceKind = "human" | "frog" | "dog" | "anon";
export type HairStyle = "short" | "swoop" | "bald" | "afro" | "long" | "spike" | "buzz" | "grey";
export type FaceAcc = "none" | "glasses" | "shades" | "beard" | "cap" | "tie";

export interface FaceDesc { kind: FaceKind; style: HairStyle; acc: FaceAcc; }

export interface CharDef {
  id: string;
  name: string;
  kart: string;     // kart body colour
  skin: string;     // driver head colour (also body colour for frog/dog/anon)
  hair: string;
  face: FaceDesc;
  stats: CharStats; // 1..5
  item: string;     // signature item, also given at race start
  unlock: number;   // $MLDL cost (0 = free starter)
}

export const ROSTER: CharDef[] = [
  { id: "elon", name: "EELON", kart: "#e23b3b", skin: "#e8b48c", hair: "#5a3a24", face: { kind: "human", style: "short", acc: "none" }, stats: { speed: 5, accel: 3, handling: 3 }, item: "ROCKET", unlock: 0 },
  { id: "trump", name: "DRUMPF", kart: "#f0a500", skin: "#e89b4b", hair: "#f4e07a", face: { kind: "human", style: "swoop", acc: "tie" }, stats: { speed: 4, accel: 3, handling: 4 }, item: "WALL", unlock: 0 },
  { id: "doge", name: "DOGE", kart: "#f2c94c", skin: "#e0a44e", hair: "#caa14a", face: { kind: "dog", style: "short", acc: "none" }, stats: { speed: 3, accel: 4, handling: 5 }, item: "BOOST", unlock: 0 },
  { id: "pepe", name: "PEPE", kart: "#3fbf57", skin: "#5fbf3f", hair: "#2f7d32", face: { kind: "frog", style: "short", acc: "none" }, stats: { speed: 3, accel: 4, handling: 4 }, item: "OIL", unlock: 1200 },
  { id: "wojak", name: "WOJAK", kart: "#cfd6e0", skin: "#f0d3c0", hair: "#bfae9c", face: { kind: "human", style: "bald", acc: "none" }, stats: { speed: 3, accel: 3, handling: 4 }, item: "SHIELD", unlock: 1400 },
  { id: "chad", name: "CHAD", kart: "#ffd23d", skin: "#e8b48c", hair: "#e9c46a", face: { kind: "human", style: "buzz", acc: "none" }, stats: { speed: 5, accel: 4, handling: 3 }, item: "BOOST", unlock: 1600 },
  { id: "brett", name: "BRETT", kart: "#3aa0ff", skin: "#4aa6ff", hair: "#1f6fb2", face: { kind: "frog", style: "short", acc: "none" }, stats: { speed: 3, accel: 5, handling: 4 }, item: "BANANA", unlock: 1600 },
  { id: "vitalik", name: "VITALIK", kart: "#7c5cff", skin: "#e9c6a8", hair: "#3a2c1c", face: { kind: "human", style: "long", acc: "none" }, stats: { speed: 3, accel: 5, handling: 4 }, item: "GAS", unlock: 1800 },
  { id: "cz", name: "CEEZ", kart: "#f3ba2f", skin: "#d9a066", hair: "#1a1a1a", face: { kind: "human", style: "short", acc: "glasses" }, stats: { speed: 4, accel: 4, handling: 3 }, item: "BANANA", unlock: 2000 },
  { id: "armstrong", name: "BRIAN", kart: "#1f6fe0", skin: "#e3b48c", hair: "#3a2a20", face: { kind: "human", style: "bald", acc: "none" }, stats: { speed: 4, accel: 3, handling: 4 }, item: "WALL", unlock: 2000 },
  { id: "hoskinson", name: "CHARLES", kart: "#16a085", skin: "#e8c0a0", hair: "#6a4a2a", face: { kind: "human", style: "short", acc: "beard" }, stats: { speed: 3, accel: 4, handling: 5 }, item: "BOOST", unlock: 2200 },
  { id: "sbf", name: "BANKMAN", kart: "#2bbf6a", skin: "#e3b48c", hair: "#3a2a20", face: { kind: "human", style: "afro", acc: "none" }, stats: { speed: 4, accel: 4, handling: 4 }, item: "OIL", unlock: 2400 },
  { id: "bonk", name: "BONK", kart: "#ff8a2a", skin: "#e8a44e", hair: "#caa14a", face: { kind: "dog", style: "short", acc: "cap" }, stats: { speed: 4, accel: 4, handling: 4 }, item: "ROCKET", unlock: 2400 },
  { id: "justinsun", name: "TRON", kart: "#d6304a", skin: "#e6b487", hair: "#1a1a1a", face: { kind: "human", style: "spike", acc: "none" }, stats: { speed: 4, accel: 4, handling: 3 }, item: "GAS", unlock: 2600 },
  { id: "dokwon", name: "BIG D", kart: "#b22838", skin: "#e6b487", hair: "#1a1a1a", face: { kind: "human", style: "short", acc: "none" }, stats: { speed: 5, accel: 4, handling: 2 }, item: "ROCKET", unlock: 2800 },
  { id: "saylor", name: "SAYLOR", kart: "#e67e22", skin: "#e3b48c", hair: "#c8c8d0", face: { kind: "human", style: "grey", acc: "none" }, stats: { speed: 5, accel: 3, handling: 2 }, item: "SHIELD", unlock: 3000 },
  { id: "ansem", name: "ANSEM", kart: "#159a8a", skin: "#e3b48c", hair: "#3a2a20", face: { kind: "human", style: "short", acc: "shades" }, stats: { speed: 4, accel: 5, handling: 4 }, item: "LIGHTNING", unlock: 3200 },
  { id: "tate", name: "TOP G", kart: "#1a1a22", skin: "#d9a066", hair: "#1a1a1a", face: { kind: "human", style: "bald", acc: "shades" }, stats: { speed: 4, accel: 5, handling: 3 }, item: "BOOST", unlock: 3600 },
  { id: "gensler", name: "REGULATOR", kart: "#7a7f8c", skin: "#ecd0b8", hair: "#9aa0ac", face: { kind: "human", style: "bald", acc: "glasses" }, stats: { speed: 2, accel: 3, handling: 5 }, item: "WALL", unlock: 4000 },
  { id: "satoshi", name: "SATOSHI", kart: "#101018", skin: "#1c2030", hair: "#0c0c12", face: { kind: "anon", style: "bald", acc: "none" }, stats: { speed: 5, accel: 5, handling: 5 }, item: "LIGHTNING", unlock: 9000 },
];

export function charById(id: string): CharDef {
  return ROSTER.find((c) => c.id === id) || ROSTER[0];
}
