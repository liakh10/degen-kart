"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { display, ui } from "../fonts";
import { MusicEngine } from "../music";
import type { GameHandle, HudState } from "./engine/game";

const EMPTY: HudState = { lap: 1, laps: 3, place: 1, total: 6, item: null, coins: 0, speed: 0, countdown: "3", boost: false, driftCharge: 0, finished: false, results: null, reward: 0 };

export default function RacePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const musicRef = useRef<MusicEngine | null>(null);
  const [hud, setHud] = useState<HudState>(EMPTY);
  const [phase, setPhase] = useState<"loading" | "racing">("loading");
  const [paused, setPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [trackName, setTrackName] = useState("TURBO RUSH");
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    musicRef.current = new MusicEngine();
    const e = musicRef.current; const off = (() => { try { return localStorage.getItem("degenkart_music_off") === "1"; } catch { return false; } })();
    if (!off) { e.play(); setMusicOn(true); setTrackName(e.trackName); } else setMusicOn(false);
    const startOnce = () => { if (!off && !e.playing) { e.play(); setMusicOn(true); } window.removeEventListener("pointerdown", startOnce); };
    window.addEventListener("pointerdown", startOnce);
    return () => { window.removeEventListener("pointerdown", startOnce); e.dispose(); };
  }, []);

  useEffect(() => {
    let handle: GameHandle | null = null; let disposed = false;
    setPhase("loading"); setPaused(false); setHud(EMPTY);
    import("./engine/game").then(({ createGame }) => {
      if (disposed || !containerRef.current) return;
      handle = createGame(containerRef.current);
      handleRef.current = handle; handle.onState(setHud);
      if (miniRef.current) handle.setMinimap(miniRef.current);
      setPhase("racing");
    });
    return () => { disposed = true; handle?.dispose(); handleRef.current = null; };
  }, [runId]);

  const doPause = useCallback((p: boolean) => { setPaused(p); handleRef.current?.setPaused(p); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Escape" && phase === "racing" && !hud.finished) { e.preventDefault(); doPause(!paused); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [phase, paused, hud.finished, doPause]);

  function toggleMusic() { const m = musicRef.current; if (!m) return; m.toggle(); setMusicOn(m.playing); try { localStorage.setItem("degenkart_music_off", m.playing ? "0" : "1"); } catch { /* */ } }
  function raceAgain() { setRunId((n) => n + 1); }

  const itemColors: Record<string, string> = { ROCKET: "#e23b3b", BANANA: "#ffd23d", BOOST: "#ff8a3d", WALL: "#f0a500", OIL: "#3a3358", GAS: "#7c5cff" };

  return (
    <div className={`fixed inset-0 overflow-hidden ${display.variable} ${ui.variable}`} style={{ background: "#0d0b1a", fontFamily: "var(--font-ui)" }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: phase === "racing" ? 1 : 0, transition: "opacity .3s" }}>
        {/* lap + position */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="toy-card px-3 py-1.5" style={{ background: "#fff", fontFamily: "var(--font-display)", color: "#1a1230" }}>LAP {hud.lap}/{hud.laps}</div>
          <div className="toy-card px-3 py-1.5 text-2xl" style={{ background: "#ffd23d", fontFamily: "var(--font-display)", color: "#1a1230" }}>{ordinal(hud.place)} <span className="text-sm">/ {hud.total}</span></div>
        </div>

        {/* minimap */}
        <div className="absolute top-3 right-3 toy-card" style={{ width: 150, height: 120, background: "#13112a", padding: 4 }}>
          <canvas ref={miniRef} width={150} height={120} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
        </div>

        {/* item slot */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          <div className="toy-card flex items-center justify-center" style={{ width: 64, height: 64, background: hud.item ? itemColors[hud.item] || "#fff" : "#ffffff22" }}>
            <span style={{ fontFamily: "var(--font-display)", color: "#1a1230", fontSize: hud.item ? 11 : 22 }}>{hud.item || "?"}</span>
          </div>
          <div className="toy-card px-3 py-2" style={{ background: "#fff" }}>
            <div className="text-[9px] opacity-50" style={{ color: "#1a1230" }}>SPEED</div>
            <div style={{ fontFamily: "var(--font-display)", color: hud.boost ? "#e6356f" : "#1a1230" }}>{hud.speed}</div>
          </div>
        </div>

        {/* coins */}
        <div className="absolute bottom-3 right-3 toy-card px-3 py-2" style={{ background: "#fff", fontFamily: "var(--font-display)", color: "#1a1230" }}>{hud.coins.toLocaleString()} $MLDL</div>

        {/* drift charge */}
        {hud.driftCharge > 0.05 && !hud.finished && (
          <div className="absolute bottom-20 left-3" style={{ width: 64 }}>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#ffffff33", border: "2px solid #1a1230" }}><div className="h-full" style={{ width: `${hud.driftCharge * 100}%`, background: hud.driftCharge > 0.7 ? "#ff7b2e" : "#19e0ff" }} /></div>
          </div>
        )}

        {/* pause button */}
        <button onClick={() => doPause(true)} className="toy-btn absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto px-4 py-2 text-white text-sm" style={{ background: "#1a1230", borderRadius: 10 }}>❚❚</button>

        {/* countdown */}
        {hud.countdown && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pop-in" key={hud.countdown} style={{ fontFamily: "var(--font-display)", fontSize: 120, color: hud.countdown === "GO!" ? "#39d98a" : "#ffd23d", WebkitTextStroke: "5px #1a1230", paintOrder: "stroke fill" }}>{hud.countdown}</div>
          </div>
        )}
      </div>

      {/* loading */}
      {phase === "loading" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg,#9fdcff,#7ec8ff)" }}>
          <div className="text-5xl text-outline" style={{ fontFamily: "var(--font-display)", color: "#ffd23d" }}>MEME LORDS</div>
          <div className="mt-4 text-lg" style={{ color: "#1a1230", fontWeight: 800 }}>warming up the engines…</div>
        </div>
      )}

      {/* pause */}
      {paused && !hud.finished && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center" style={{ background: "rgba(26,18,48,0.66)" }}>
          <div className="text-6xl text-outline mb-8" style={{ fontFamily: "var(--font-display)", color: "#ffd23d" }}>PAUSED</div>
          <div className="flex flex-col gap-3 w-full max-w-xs px-6">
            <button onClick={() => doPause(false)} className="toy-btn py-4 text-2xl text-white" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#39d98a,#1fae66)" }}>RESUME</button>
            <button onClick={toggleMusic} className="toy-btn py-3 text-white" style={{ fontFamily: "var(--font-display)", background: "#1f8fe0" }}>MUSIC {musicOn ? "ON" : "OFF"}</button>
            <button onClick={() => router.push("/select")} className="toy-btn py-3 text-white" style={{ fontFamily: "var(--font-display)", background: "#8a6bff" }}>GARAGE</button>
            <button onClick={() => router.push("/")} className="toy-btn py-4 text-xl text-white" style={{ fontFamily: "var(--font-display)", background: "#e6356f" }}>MAIN MENU</button>
          </div>
        </div>
      )}

      {/* results */}
      {hud.finished && hud.results && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(26,18,48,0.72)" }}>
          <div className="toy-card w-full max-w-md p-5" style={{ background: "#fff" }}>
            <div className="text-center text-4xl text-outline-2" style={{ fontFamily: "var(--font-display)", color: hud.results.find((r) => r.you)!.place === 1 ? "#ffd23d" : "#1f8fe0" }}>
              {hud.results.find((r) => r.you)!.place === 1 ? "YOU WIN!" : `${ordinal(hud.results.find((r) => r.you)!.place)} PLACE`}
            </div>
            <div className="text-center mt-2 text-lg" style={{ color: "#1fae66", fontFamily: "var(--font-display)" }}>+{hud.reward.toLocaleString()} $MLDL</div>
            <div className="flex flex-col gap-1.5 mt-4">
              {hud.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5" style={{ background: r.you ? "#ffe9a8" : "#f0f0f7", border: r.you ? "3px solid #ffd23d" : "3px solid transparent", borderRadius: 10, fontWeight: 700, color: "#1a1230" }}>
                  <span>{ordinal(r.place)} {r.name}</span>{r.you && <span style={{ color: "#1f8fe0" }}>YOU</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={raceAgain} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#39d98a,#1fae66)" }}>RACE AGAIN</button>
              <button onClick={() => router.push("/select")} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "#1f8fe0" }}>GARAGE</button>
            </div>
            <button onClick={() => router.push("/")} className="toy-btn w-full mt-3 py-2 text-white" style={{ fontFamily: "var(--font-display)", background: "#1a1230" }}>MAIN MENU</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ordinal(n: number): string { return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`; }
