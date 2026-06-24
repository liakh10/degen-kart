import { ROSTER } from "./characters";
import { UpgradeMods } from "./kart";

const SAVE_KEY = "degenkart_save_v1";

export type UpgradeId = "speed" | "accel" | "handling" | "boost";
const UP_COST = [400, 800, 1500, 2500];
const UP_MAX = UP_COST.length;

export interface SaveData {
  coins: number;
  upgrades: Record<UpgradeId, number>;
  unlocked: string[];
  selectedChar: string;
  selectedTrack: number;
}

export class Economy {
  coins = 0;
  upgrades: Record<UpgradeId, number> = { speed: 0, accel: 0, handling: 0, boost: 0 };
  unlocked: string[] = ROSTER.filter((c) => c.unlock === 0).map((c) => c.id);
  selectedChar = "elon";
  selectedTrack = 0;

  constructor() { this.load(); }

  mods(): UpgradeMods { return { speed: this.upgrades.speed, accel: this.upgrades.accel, handling: this.upgrades.handling, boost: this.upgrades.boost }; }

  upCost(id: UpgradeId): number | null { const l = this.upgrades[id]; return l >= UP_MAX ? null : UP_COST[l]; }
  upMax() { return UP_MAX; }

  buyUpgrade(id: UpgradeId): boolean {
    const c = this.upCost(id); if (c === null || this.coins < c) return false;
    this.coins -= c; this.upgrades[id]++; this.save(); return true;
  }

  isUnlocked(id: string): boolean { return this.unlocked.includes(id); }
  unlock(id: string): boolean {
    const ch = ROSTER.find((c) => c.id === id); if (!ch || this.isUnlocked(id) || this.coins < ch.unlock) return false;
    this.coins -= ch.unlock; this.unlocked.push(id); this.save(); return true;
  }

  addCoins(n: number) { this.coins = Math.max(0, this.coins + n); this.save(); }
  setChar(id: string) { this.selectedChar = id; this.save(); }
  setTrack(i: number) { this.selectedTrack = i; this.save(); }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ coins: this.coins, upgrades: this.upgrades, unlocked: this.unlocked, selectedChar: this.selectedChar, selectedTrack: this.selectedTrack })); } catch { /* */ }
  }
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
      const d = JSON.parse(raw) as Partial<SaveData>;
      if (typeof d.coins === "number") this.coins = d.coins;
      if (d.upgrades) this.upgrades = { ...this.upgrades, ...d.upgrades };
      if (Array.isArray(d.unlocked)) this.unlocked = Array.from(new Set([...this.unlocked, ...d.unlocked]));
      if (typeof d.selectedChar === "string") this.selectedChar = d.selectedChar;
      if (typeof d.selectedTrack === "number") this.selectedTrack = d.selectedTrack;
    } catch { /* */ }
  }
  reset() { this.coins = 0; this.upgrades = { speed: 0, accel: 0, handling: 0, boost: 0 }; this.unlocked = ROSTER.filter((c) => c.unlock === 0).map((c) => c.id); this.save(); }
}
