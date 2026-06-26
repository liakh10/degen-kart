"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { display, ui } from "../fonts";
import { MusicEngine } from "../music";
import type { GameHandle, HudState } from "./engine/game";

const EMPTY: HudState = {
  lap: 1, laps: 3, place: 1, total: 6, item: null, coins: 0, speed: 0,
  countdown: "3", boost: false, driftCharge: 0, driftTier: 0, shield: false, wrongWay: false,
  lapTime: 0, bestLap: 0, finished: false, results: null, reward: 0,
};

const POINTS = [10, 8, 6, 4, 2, 1];
const fmt = (s: number) => (s > 0 ? `${s.toFixed(2)}s` : "--");

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
  const [runId, setRunId] = useState(0);

  // cup mode
  const [mode, setMode] = useState<"quick" | "cup">("quick");
  const cupRoundRef = useRef(0);
  const [cupRound, setCupRound] = useState(0);
  const [cupPoints, setCupPoints] = useState<Record<string, number>>({});
  const talliedRef = useRef(false);

  useEffect(() => {
    try { setMode(sessionStorage.getItem("degenkart_mode") === "cup" ? "cup" : "quick"); } catch { /* */ }
    musicRef.current = new MusicEngine();
    const e = musicRef.current; const off = (() => { try { return localStorage.getItem("degenkart_music_off") === "1"; } catch { return false; } })();
    if (!off) { e.play(); setMusicOn(true); } else setMusicOn(false);
    const startOnce = () => { if (!off && !e.playing) { e.play(); setMusicOn(true); } window.removeEventListener("pointerdown", startOnce); };
    window.addEventListener("pointerdown", startOnce);
    return () => { window.removeEventListener("pointerdown", startOnce); e.dispose(); };
  }, []);

  useEffect(() => {
    let handle: GameHandle | null = null; let disposed = false;
    setPhase("loading"); setPaused(false); setHud(EMPTY); talliedRef.current = false;
    const trackIndex = (sessionStorage.getItem("degenkart_mode") === "cup") ? cupRoundRef.current : undefined;
    import("./engine/game").then(({ createGame }) => {
      if (disposed || !containerRef.current) return;
      handle = createGame(containerRef.current, { trackIndex });
      handleRef.current = handle; handle.onState(setHud);
      if (miniRef.current) handle.setMinimap(miniRef.current);
      setPhase("racing");
    });
    return () => { disposed = true; handle?.dispose(); handleRef.current = null; };
  }, [runId]);

  // tally cup points when a race finishes
  useEffect(() => {
    if (!hud.finished || !hud.results || mode !== "cup" || talliedRef.current) return;
    talliedRef.current = true;
    setCupPoints((prev) => {
      const next = { ...prev };
      for (const r of hud.results!) next[r.name] = (next[r.name] || 0) + (POINTS[r.place - 1] ?? 0);
      return next;
    });
  }, [hud.finished, hud.results, mode]);

  const doPause = useCallback((p: boolean) => { setPaused(p); handleRef.current?.setPaused(p); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Escape" && phase === "racing" && !hud.finished) { e.preventDefault(); doPause(!paused); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [phase, paused, hud.finished, doPause]);

  function toggleMusic() { const m = musicRef.current; if (!m) return; m.toggle(); setMusicOn(m.playing); try { localStorage.setItem("degenkart_music_off", m.playing ? "0" : "1"); } catch { /* */ } }
  function restart() { cupRoundRef.current = 0; setCupRound(0); setCupPoints({}); setRunId((n) => n + 1); }
  function nextCupRace() { cupRoundRef.current += 1; setCupRound(cupRoundRef.current); setRunId((n) => n + 1); }

  const itemColors: Record<string, string> = { ROCKET: "#e23b3b", BANANA: "#ffd23d", BOOST: "#ff8a3d", WALL: "#f0a500", OIL: "#3a3358", GAS: "#7c5cff", SHIELD: "#19e0ff", BOLT: "#ffe66b" };
  const driftColor = hud.driftTier >= 3 ? "#b066ff" : hud.driftTier === 2 ? "#ff8a3d" : hud.driftTier === 1 ? "#19e0ff" : "#9fb4c8";
  const cupStandings = Object.entries(cupPoints).sort((a, b) => b[1] - a[1]);
  const isLastCupRace = cupRoundRef.current >= 2;

  return (
    <div className={`fixed inset-0 overflow-hidden ${display.variable} ${ui.variable}`} style={{ background: "#0d0b1a", fontFamily: "var(--font-ui)" }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: phase === "racing" ? 1 : 0, transition: "opacity .3s" }}>
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="toy-card px-3 py-1.5" style={{ background: "#fff", fontFamily: "var(--font-display)", color: "#1a1230" }}>LAP {hud.lap}/{hud.laps}</div>
          <div className="toy-card px-3 py-1.5 text-2xl" style={{ background: "#ffd23d", fontFamily: "var(--font-display)", color: "#1a1230" }}>{ordinal(hud.place)} <span className="text-sm">/ {hud.total}</span></div>
          {mode === "cup" && <div className="toy-card px-3 py-1 text-[11px]" style={{ background: "#8a6bff", color: "#fff", fontFamily: "var(--font-display)" }}>CUP {cupRound + 1}/3</div>}
        </div>

        <div className="absolute top-3 right-3 toy-card" style={{ width: 150, height: 120, background: "#13112a", padding: 4 }}>
          <canvas ref={miniRef} width={150} height={120} style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
        </div>

        {/* lap times */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="toy-card px-3 py-1 text-[11px]" style={{ background: "#fff", color: "#1a1230", fontFamily: "var(--font-display)" }}>TIME {fmt(hud.lapTime)}</div>
          <div className="toy-card px-3 py-1 text-[11px]" style={{ background: "#1a1230", color: "#ffd23d", fontFamily: "var(--font-display)" }}>BEST {fmt(hud.bestLap)}</div>
        </div>

        {/* wrong way */}
        {hud.wrongWay && !hud.finished && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 toy-card px-5 py-2 text-2xl blink" style={{ background: "#e6356f", color: "#fff", fontFamily: "var(--font-display)" }}>WRONG WAY</div>
        )}

        {/* item slot + drift bar */}
        <div className="absolute bottom-3 left-3 flex items-end gap-3">
          <div className="toy-card flex items-center justify-center" style={{ width: 64, height: 64, background: hud.item ? itemColors[hud.item] || "#fff" : "#ffffff22" }}>
            <span style={{ fontFamily: "var(--font-display)", color: "#1a1230", fontSize: hud.item ? 10 : 22 }}>{hud.item || "?"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="toy-card px-3 py-1.5" style={{ background: "#fff" }}>
              <span className="text-[9px] opacity-50" style={{ color: "#1a1230" }}>SPEED </span>
              <span style={{ fontFamily: "var(--font-display)", color: hud.boost ? "#e6356f" : "#1a1230" }}>{hud.speed}</span>
            </div>
            {hud.driftCharge > 0.05 && !hud.finished && (
              <div className="h-2.5 rounded-full overflow-hidden" style={{ width: 90, background: "#ffffff33", border: "2px solid #1a1230" }}>
                <div className="h-full transition-all" style={{ width: `${hud.driftCharge * 100}%`, background: driftColor }} />
              </div>
            )}
            {hud.shield && <div className="toy-card px-2 py-0.5 text-[10px] text-center" style={{ background: "#19e0ff", color: "#1a1230", fontFamily: "var(--font-display)" }}>SHIELD</div>}
          </div>
        </div>

        <div className="absolute bottom-3 right-3 toy-card px-3 py-2" style={{ background: "#fff", fontFamily: "var(--font-display)", color: "#1a1230" }}>{hud.coins.toLocaleString()} $MLDL</div>

        <button onClick={() => doPause(true)} className="toy-btn absolute top-3 left-1/2 translate-x-[100px] pointer-events-auto px-4 py-2 text-white text-sm" style={{ background: "#1a1230", borderRadius: 10 }}>❚❚</button>

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
          <div className="flex flex-col gap-4 w-full max-w-xs px-6">
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
            {mode === "cup" ? (
              <>
                <div className="text-center text-3xl text-outline-2" style={{ fontFamily: "var(--font-display)", color: "#8a6bff" }}>{isLastCupRace ? "CUP FINISHED" : `RACE ${cupRound + 1}/3 DONE`}</div>
                <div className="text-center mt-1 text-sm" style={{ color: "#1fae66", fontFamily: "var(--font-display)" }}>you finished {ordinal(hud.results.find((r) => r.you)!.place)} · +{hud.reward.toLocaleString()} $MLDL</div>
                <div className="text-center mt-3 text-xs opacity-60">CUP STANDINGS</div>
                <div className="flex flex-col gap-1.5 mt-1">
                  {cupStandings.map(([name, pts], i) => (
                    <div key={name} className="flex items-center justify-between px-3 py-1.5" style={{ background: i === 0 ? "#ffe9a8" : "#f0f0f7", border: i === 0 ? "3px solid #ffd23d" : "3px solid transparent", borderRadius: 10, fontWeight: 700, color: "#1a1230" }}>
                      <span>{i + 1}. {name}</span><span style={{ color: "#8a6bff" }}>{pts} pts</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  {isLastCupRace
                    ? <button onClick={restart} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#39d98a,#1fae66)" }}>NEW CUP</button>
                    : <button onClick={nextCupRace} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#39d98a,#1fae66)" }}>NEXT RACE</button>}
                  <button onClick={() => router.push("/select")} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "#1f8fe0" }}>GARAGE</button>
                </div>
                <button onClick={() => router.push("/")} className="toy-btn w-full mt-3 py-2 text-white" style={{ fontFamily: "var(--font-display)", background: "#1a1230" }}>MAIN MENU</button>
              </>
            ) : (
              <>
                <div className="text-center text-4xl text-outline-2" style={{ fontFamily: "var(--font-display)", color: hud.results.find((r) => r.you)!.place === 1 ? "#ffd23d" : "#1f8fe0" }}>
                  {hud.results.find((r) => r.you)!.place === 1 ? "YOU WIN!" : `${ordinal(hud.results.find((r) => r.you)!.place)} PLACE`}
                </div>
                <div className="text-center mt-2 text-lg" style={{ color: "#1fae66", fontFamily: "var(--font-display)" }}>+{hud.reward.toLocaleString()} $MLDL</div>
                <div className="text-center mt-1 text-xs opacity-60">best lap {fmt(hud.bestLap)}</div>
                <div className="flex flex-col gap-1.5 mt-4">
                  {hud.results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5" style={{ background: r.you ? "#ffe9a8" : "#f0f0f7", border: r.you ? "3px solid #ffd23d" : "3px solid transparent", borderRadius: 10, fontWeight: 700, color: "#1a1230" }}>
                      <span>{ordinal(r.place)} {r.name}</span>{r.you && <span style={{ color: "#1f8fe0" }}>YOU</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={restart} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#39d98a,#1fae66)" }}>RACE AGAIN</button>
                  <button onClick={() => router.push("/select")} className="toy-btn flex-1 py-3 text-white text-lg" style={{ fontFamily: "var(--font-display)", background: "#1f8fe0" }}>GARAGE</button>
                </div>
                <button onClick={() => router.push("/")} className="toy-btn w-full mt-3 py-2 text-white" style={{ fontFamily: "var(--font-display)", background: "#1a1230" }}>MAIN MENU</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ordinal(n: number): string { return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`; }
