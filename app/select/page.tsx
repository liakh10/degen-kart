"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { display, ui } from "../fonts";
import { ROSTER, CharDef } from "../race/engine/characters";
import { TRACK_DEFS } from "../race/engine/track";
import { Economy, UpgradeId } from "../race/engine/economy";
import { renderFaceCanvas } from "../race/engine/sprites";

export default function SelectPage() {
  const router = useRouter();
  const econRef = useRef<Economy | null>(null);
  if (!econRef.current && typeof window !== "undefined") econRef.current = new Economy();
  const [, force] = useReducer((x) => x + 1, 0);
  const [tab, setTab] = useState<"racer" | "garage">("racer");
  const [mode, setModeState] = useState<"quick" | "cup">("quick");
  const econ = econRef.current;

  useEffect(() => { try { setModeState(sessionStorage.getItem("degenkart_mode") === "cup" ? "cup" : "quick"); } catch { /* */ } }, []);
  function setMode(m: "quick" | "cup") { setModeState(m); try { sessionStorage.setItem("degenkart_mode", m); } catch { /* */ } }

  useEffect(() => { if (!econ) force(); }, [econ]);
  if (!econ) return <div className="fixed inset-0" style={{ background: "#7ec8ff" }} />;

  const sel = econ.selectedChar;

  function pickChar(c: CharDef) { if (econ!.isUnlocked(c.id)) { econ!.setChar(c.id); force(); } }

  return (
    <main className={`fixed inset-0 overflow-auto ${display.variable} ${ui.variable}`} style={{ fontFamily: "var(--font-ui)", background: "linear-gradient(180deg,#9fdcff,#7ec8ff 55%,#ffd6a0)" }}>
      <div className="checker absolute bottom-0 left-0 right-0" style={{ height: 46, borderTop: "5px solid #1a1230", opacity: 0.9 }} />

      <div className="relative max-w-4xl mx-auto p-5 pb-24">
        {/* header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="toy-btn px-4 py-2 text-white text-sm" style={{ background: "#1a1230", borderRadius: 12 }}>◀ MENU</button>
          <div className="toy-card px-4 py-2 text-lg" style={{ background: "#fff", fontFamily: "var(--font-display)", color: "#1a1230" }}>{econ.coins.toLocaleString()} $MLDL</div>
        </div>

        {/* tabs */}
        <div className="flex gap-3 justify-center mt-4">
          {(["racer", "garage"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="toy-btn px-6 py-2 text-white" style={{ fontFamily: "var(--font-display)", background: tab === t ? "linear-gradient(180deg,#ff6b9d,#e6356f)" : "linear-gradient(180deg,#9db4c8,#73879b)", borderRadius: 12 }}>
              {t === "racer" ? "RACER & TRACK" : "GARAGE"}
            </button>
          ))}
        </div>

        {tab === "racer" ? (
          <>
            <div className="text-center mt-5 text-2xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>PICK YOUR MEME LORD</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              {ROSTER.map((c) => {
                const unlocked = econ.isUnlocked(c.id); const selected = c.id === sel;
                return (
                  <button key={c.id} onClick={() => pickChar(c)} className="toy-card p-3 text-left relative" style={{ background: selected ? "#fff3c4" : "#fff", border: selected ? "4px solid #ffd23d" : "4px solid #1a1230", opacity: unlocked ? 1 : 0.85, cursor: unlocked ? "pointer" : "not-allowed" }}>
                    <div className="flex items-center gap-3">
                      <Face id={c.id} size={48} />
                      <div>
                        <div className="text-lg" style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>{c.name}</div>
                        <div className="text-[10px]" style={{ color: "#1f8fe0", fontWeight: 800 }}>{c.item}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      <Stat label="SPD" v={c.stats.speed} />
                      <Stat label="ACC" v={c.stats.accel} />
                      <Stat label="HND" v={c.stats.handling} />
                    </div>
                    {!unlocked && <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(26,18,48,0.45)", borderRadius: 14 }}>
                      <span className="toy-card px-3 py-1 text-sm text-white" style={{ background: "#1a1230", fontFamily: "var(--font-display)" }}>🔒 {c.unlock} $MLDL</span>
                    </div>}
                  </button>
                );
              })}
            </div>

            <div className="text-center mt-6 text-2xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>CHOOSE TRACK</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {TRACK_DEFS.map((t, i) => (
                <button key={t.name} onClick={() => { econ.setTrack(i); force(); }} className="toy-card p-4 text-center" style={{ background: econ.selectedTrack === i ? "#fff3c4" : "#fff", border: econ.selectedTrack === i ? "4px solid #ffd23d" : "4px solid #1a1230" }}>
                  <div className="text-lg" style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>{t.name}</div>
                  <div className="text-[11px] opacity-60" style={{ color: "#1a1230" }}>{t.laps} laps</div>
                </button>
              ))}
            </div>

            <div className="text-center mt-6 text-2xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>MODE</div>
            <div className="grid grid-cols-2 gap-4 mt-3 max-w-md mx-auto">
              <button onClick={() => setMode("quick")} className="toy-card p-3 text-center" style={{ background: mode === "quick" ? "#fff3c4" : "#fff", border: mode === "quick" ? "4px solid #ffd23d" : "4px solid #1a1230" }}>
                <div className="text-lg" style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>QUICK RACE</div>
                <div className="text-[11px] opacity-60" style={{ color: "#1a1230" }}>one race</div>
              </button>
              <button onClick={() => setMode("cup")} className="toy-card p-3 text-center" style={{ background: mode === "cup" ? "#fff3c4" : "#fff", border: mode === "cup" ? "4px solid #ffd23d" : "4px solid #1a1230" }}>
                <div className="text-lg" style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>GRAND PRIX</div>
                <div className="text-[11px] opacity-60" style={{ color: "#1a1230" }}>3 races · points</div>
              </button>
            </div>
          </>
        ) : (
          <Garage econ={econ} onChange={force} />
        )}
      </div>

      {/* start race */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-30">
        <button onClick={() => router.push("/race")} className="toy-btn px-12 py-4 text-3xl text-white" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#39d98a,#1fae66)" }}>
          🏁 RACE!
        </button>
      </div>
    </main>
  );
}

function Garage({ econ, onChange }: { econ: Economy; onChange: () => void }) {
  const ups: { id: UpgradeId; name: string }[] = [{ id: "speed", name: "TOP SPEED" }, { id: "accel", name: "ACCELERATION" }, { id: "handling", name: "HANDLING" }, { id: "boost", name: "BOOST POWER" }];
  return (
    <>
      <div className="text-center mt-5 text-2xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>GARAGE</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {ups.map((u) => {
          const lvl = econ.upgrades[u.id]; const cost = econ.upCost(u.id); const max = econ.upMax();
          return (
            <div key={u.id} className="toy-card p-3 flex items-center justify-between" style={{ background: "#fff" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>{u.name}</div>
                <div className="flex gap-1 mt-1">{Array.from({ length: max }).map((_, i) => <div key={i} style={{ width: 16, height: 8, borderRadius: 3, background: i < lvl ? "#1fae66" : "#d6d6e0", border: "1px solid #1a1230" }} />)}</div>
              </div>
              <button disabled={cost === null || econ.coins < cost} onClick={() => { if (econ.buyUpgrade(u.id)) onChange(); }} className="toy-btn px-3 py-2 text-white text-sm disabled:opacity-40" style={{ background: "#1f8fe0", borderRadius: 10 }}>
                {cost === null ? "MAX" : `${cost}`}
              </button>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-6 text-xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>UNLOCK RACERS</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
        {ROSTER.filter((c) => c.unlock > 0).map((c) => {
          const owned = econ.isUnlocked(c.id);
          return (
            <div key={c.id} className="toy-card p-3 flex items-center gap-3" style={{ background: "#fff" }}>
              <Face id={c.id} size={40} />
              <div className="flex-1">
                <div style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>{c.name}</div>
                {owned ? <div className="text-xs" style={{ color: "#1fae66", fontWeight: 800 }}>OWNED</div>
                  : <button disabled={econ.coins < c.unlock} onClick={() => { if (econ.unlock(c.id)) onChange(); }} className="toy-btn px-2 py-1 text-white text-xs disabled:opacity-40" style={{ background: "#e6356f", borderRadius: 8 }}>{c.unlock} $MLDL</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return <div className="flex items-center gap-1"><span className="text-[8px] w-6" style={{ color: "#8a86a0", fontWeight: 800 }}>{label}</span><div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#e2e2ec" }}><div className="h-full" style={{ width: `${(v / 5) * 100}%`, background: "#ff6b9d" }} /></div></div>;
}

function Face({ id, size }: { id: string; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current; if (!c) return; const src = renderFaceCanvas(id); const ctx = c.getContext("2d")!; ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, size, size); ctx.drawImage(src, 0, 0, size, size); }, [id, size]);
  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, imageRendering: "pixelated", borderRadius: 8, border: "2px solid #1a1230", background: "#cfeaff" }} />;
}
