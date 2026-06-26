"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GAME_CONFIG, X_URL, CA, TICKER } from "./config";
import { display, ui } from "./fonts";
import { MusicEngine } from "./music";
import { ROSTER } from "./race/engine/characters";
import { renderFaceCanvas } from "./race/engine/sprites";

export default function Home() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [modal, setModal] = useState<null | "leaderboard" | "settings" | "howto">(null);
  const [intro, setIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const engineRef = useRef<MusicEngine | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  useEffect(() => { const e = new MusicEngine(); engineRef.current = e; return () => e.dispose(); }, []);

  function enterSite() {
    const off = (() => { try { return localStorage.getItem("degenkart_music_off") === "1"; } catch { return false; } })();
    const e = engineRef.current; if (e && !off) { e.play(); setMusicOn(true); }
    setIntroLeaving(true); setTimeout(() => setIntro(false), 650);
  }
  function toggleMusic() { const e = engineRef.current; if (!e) return; e.toggle(); setMusicOn(e.playing); try { localStorage.setItem("degenkart_music_off", e.playing ? "0" : "1"); } catch { /* */ } }

  function enter(mode: "guest" | "wallet", address?: string) { sessionStorage.setItem("degenkart_player", JSON.stringify({ mode, address: address ?? null })); router.push("/select"); }
  useEffect(() => {
    if (connected && publicKey && sessionStorage.getItem("degenkart_wallet_pending")) { sessionStorage.removeItem("degenkart_wallet_pending"); enter("wallet", publicKey.toBase58()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);
  function walletClick() { if (connected && publicKey) enter("wallet", publicKey.toBase58()); else { sessionStorage.setItem("degenkart_wallet_pending", "1"); setVisible(true); } }

  return (
    <main className={`fixed inset-0 overflow-hidden ${display.variable} ${ui.variable}`} style={{ fontFamily: "var(--font-ui)" }}>
      {/* sky */}
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg,#9fdcff 0%,#7ec8ff 38%,#ffd6a0 78%,#ffb27a 100%)" }} />
      {/* sun */}
      <div className="absolute z-0" style={{ right: "10%", top: "14%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,#fff7c0,#ffd23d 60%,#ff9a3d)", boxShadow: "0 0 80px #ffd23d88" }} />
      {/* clouds */}
      <Clouds />
      {/* checkered ground strip */}
      <div className="checker absolute bottom-0 left-0 right-0 z-0" style={{ height: 70, borderTop: "5px solid #1a1230" }} />
      <div className="absolute z-0" style={{ bottom: 70, left: 0, right: 0, height: 120, background: "linear-gradient(180deg, transparent, rgba(26,18,48,0.12))" }} />

      {/* intro */}
      {intro && (
        <div className={`absolute inset-0 z-[60] flex flex-col items-center justify-center text-center px-6 ${introLeaving ? "intro-leaving" : ""}`}
          style={{ background: "linear-gradient(180deg,#9fdcff,#7ec8ff 45%,#ffd6a0)" }}>
          <Clouds />
          <div className="relative pop-in flex flex-col items-center">
            <Logo />
            <div className="mt-6 text-2xl md:text-4xl text-white text-outline-2 wobble" style={{ fontFamily: "var(--font-display)" }}>START YOUR ENGINES</div>
            <div className="mt-2 text-base md:text-lg" style={{ color: "#1a1230", fontWeight: 700 }}>welcome to the grid, degen</div>
            <button onClick={enterSite} className="toy-btn mt-9 px-16 py-5 text-3xl text-white" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#ff6b9d,#e6356f)" }}>
              START
            </button>
          </div>
        </div>
      )}
      {introLeaving && <div className="absolute inset-0 z-[70] pointer-events-none speed-flash" style={{ background: "radial-gradient(circle at 50% 50%,#ffffff,#ffe08a 55%,transparent)" }} />}

      {/* TOP BAR: ticker (left) · X + music (right) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3" style={{ opacity: intro ? 0 : 1, transition: "opacity .5s .2s" }}>
        <div className="toy-card px-3 py-1.5 text-sm" style={{ background: "#fff", color: "#1a1230", fontFamily: "var(--font-display)" }}>{TICKER}</div>
        <div className="flex items-center gap-2">
          <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="X" className="toy-btn flex items-center justify-center text-white" style={{ width: 40, height: 40, borderRadius: 12, background: "#1a1230" }}><XIcon size={16} /></a>
        </div>
      </div>

      {/* CENTER: logo + showcase + buttons in a row */}
      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-4 ${!intro ? "menu-enter" : ""}`} style={{ opacity: intro ? 0 : 1 }}>
        <div className="bob"><Logo /></div>
        <div className="mt-1 text-lg md:text-2xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>MEME KART RACING</div>

        <Showcase />

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
          <button onClick={() => enter("guest")} className="toy-btn px-12 py-5 text-3xl text-white" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#ff6b9d,#e6356f)" }}>PLAY</button>
          <button onClick={walletClick} className="toy-btn px-7 py-4 text-lg text-white" style={{ fontFamily: "var(--font-display)", background: connected ? "linear-gradient(180deg,#39d98a,#1fae66)" : "linear-gradient(180deg,#8a6bff,#6b3fe0)" }}>
            {connected ? `✓ ${publicKey?.toBase58().slice(0, 4)}…${publicKey?.toBase58().slice(-4)}` : "◈ WALLET"}
          </button>
        </div>
      </div>

      {/* BOTTOM NAV BAR: secondary actions + CA, horizontal */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-wrap items-center justify-center gap-2 px-3 pb-4" style={{ opacity: intro ? 0 : 1, transition: "opacity .5s .2s" }}>
        <Chip label="RANKS" onClick={() => setModal("leaderboard")} />
        <Chip label="HOW TO PLAY" onClick={() => setModal("howto")} />
        <Chip label="SETTINGS" onClick={() => setModal("settings")} />
        <div className="w-full sm:w-auto sm:min-w-[280px]"><CADisplay /></div>
      </div>

      {modal && <Modal onClose={() => setModal(null)} title={modal === "leaderboard" ? "RANKINGS" : modal === "settings" ? "SETTINGS" : "HOW TO PLAY"}>
        {modal === "leaderboard" && <Leaderboard />}
        {modal === "settings" && <Settings musicOn={musicOn} onToggleMusic={toggleMusic} />}
        {modal === "howto" && <HowTo />}
      </Modal>}
    </main>
  );
}

function Logo() {
  return (
    <div className="select-none text-center leading-none" style={{ fontFamily: "var(--font-display)" }}>
      <div className="text-xl md:text-2xl" style={{ color: "#1a1230" }}>DEGEN</div>
      <div className="text-7xl md:text-9xl text-outline" style={{ color: "#ffd23d", filter: "drop-shadow(0 6px 0 #b97a00)" }}>KART</div>
    </div>
  );
}

function Showcase() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % ROSTER.length), 1500); return () => clearInterval(t); }, []);
  const c = ROSTER[i];
  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="wobble"><FaceBig id={c.id} key={c.id} /></div>
      <div className="mt-2 text-xl text-white text-outline-2" style={{ fontFamily: "var(--font-display)" }}>{c.name}</div>
    </div>
  );
}

function FaceBig({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const SZ = 92;
  useEffect(() => { const cv = ref.current; if (!cv) return; const src = renderFaceCanvas(id); const ctx = cv.getContext("2d")!; ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, SZ, SZ); ctx.drawImage(src, 0, 0, SZ, SZ); }, [id]);
  return <canvas ref={ref} width={SZ} height={SZ} className="pop-in" style={{ width: SZ, height: SZ, imageRendering: "pixelated", borderRadius: 16, border: "4px solid #1a1230", background: "#cfeaff", boxShadow: "0 6px 0 #1a1230" }} />;
}

function Clouds() {
  const clouds = [{ t: "12%", l: "8%", s: 1 }, { t: "26%", l: "62%", s: 1.3 }, { t: "48%", l: "20%", s: 0.8 }, { t: "60%", l: "78%", s: 1 }];
  return (<>{clouds.map((c, i) => (
    <div key={i} className="absolute z-0" style={{ top: c.t, left: c.l, transform: `scale(${c.s})`, animation: `cloudDrift ${18 + i * 5}s linear infinite alternate` }}>
      <div style={{ width: 90, height: 30, background: "#fff", borderRadius: 30, boxShadow: "26px -12px 0 6px #fff, -26px -6px 0 2px #fff, 0 0 0 4px #1a123022" }} />
    </div>))}</>);
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="toy-btn py-2 text-[11px] md:text-xs text-white flex items-center justify-center text-center leading-tight" style={{ fontFamily: "var(--font-display)", background: "linear-gradient(180deg,#4ab6ff,#1f8fe0)", borderRadius: 12 }}>{label}</button>;
}

function CADisplay() {
  const [copied, setCopied] = useState(false);
  const isReal = CA !== "SOON" && CA !== "";
  function copy() { if (!isReal) return; navigator.clipboard.writeText(CA); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  return (
    <div className="toy-card flex items-center justify-center gap-2 px-3 py-2 overflow-x-auto" style={{ background: "#fff", whiteSpace: "nowrap" }}>
      <span className="text-sm shrink-0" style={{ color: "#1f8fe0", fontWeight: 900 }}>CA:</span>
      <span className="text-xs md:text-sm" style={{ color: copied ? "#1fae66" : isReal ? "#1a1230" : "#8a86a0", fontWeight: 700 }}>{copied ? "COPIED!" : CA}</span>
      {isReal && <button onClick={copy} className="shrink-0 flex items-center justify-center cursor-pointer" style={{ width: 26, height: 26, border: "2px solid #1a1230", borderRadius: 6, color: copied ? "#1fae66" : "#1f8fe0" }}>{copied ? "✓" : "⧉"}</button>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(26,18,48,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="toy-card w-full max-w-md" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "4px solid #1a1230" }}>
          <span className="text-xl" style={{ fontFamily: "var(--font-display)", color: "#1a1230" }}>{title}</span>
          <button onClick={onClose} className="text-xl cursor-pointer" style={{ color: "#1a1230", fontWeight: 900 }}>✕</button>
        </div>
        <div className="p-5" style={{ color: "#1a1230" }}>{children}</div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [rows, setRows] = useState<{ name: string; score: number; you?: boolean }[]>([]);
  useEffect(() => {
    let mine = 0; try { const s = localStorage.getItem("degenkart_save_v1"); if (s) mine = JSON.parse(s).coins || 0; } catch { /* */ }
    const fake = [{ name: "SpeedDemon", score: 18400 }, { name: "DriftKing", score: 14200 }, { name: "GigaWheels", score: 11800 }, { name: "NitroNerd", score: 9200 }, { name: "BananaBoss", score: 6400 }, { name: "RugRacer", score: 4100 }];
    setRows([...fake, { name: "YOU", score: mine, you: true }].sort((a, b) => b.score - a.score).slice(0, 8));
  }, []);
  return (<div className="flex flex-col gap-1.5" style={{ fontWeight: 700 }}>
    {rows.map((r, i) => <div key={i} className="flex items-center justify-between px-3 py-1.5" style={{ background: r.you ? "#ffe9a8" : "#f0f0f7", border: r.you ? "3px solid #ffd23d" : "3px solid transparent", borderRadius: 10 }}><span>{i + 1}. {r.name}</span><span style={{ color: "#1fae66" }}>{r.score.toLocaleString()} $KART</span></div>)}
    <div className="mt-2 text-center text-xs opacity-60">your $KART balance is your rank score</div>
  </div>);
}

function Settings({ musicOn, onToggleMusic }: { musicOn: boolean; onToggleMusic: () => void }) {
  const [muted, setMuted] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { try { setMuted(localStorage.getItem("degenkart_muted") === "1"); } catch { /* */ } }, []);
  function toggle() { const n = !muted; setMuted(n); try { localStorage.setItem("degenkart_muted", n ? "1" : "0"); } catch { /* */ } }
  function reset() { try { localStorage.removeItem("degenkart_save_v1"); } catch { /* */ } setDone(true); setTimeout(() => setDone(false), 1500); }
  return (<div className="flex flex-col gap-4" style={{ fontWeight: 700 }}>
    <div className="flex items-center justify-between text-lg"><span>MUSIC</span><button onClick={onToggleMusic} className="toy-btn px-4 py-1.5 text-white" style={{ background: musicOn ? "#1fae66" : "#e6356f", borderRadius: 10 }}>{musicOn ? "ON" : "OFF"}</button></div>
    <div className="flex items-center justify-between text-lg"><span>SFX</span><button onClick={toggle} className="toy-btn px-4 py-1.5 text-white" style={{ background: muted ? "#e6356f" : "#1fae66", borderRadius: 10 }}>{muted ? "OFF" : "ON"}</button></div>
    <div className="flex items-center justify-between text-lg"><span>PROGRESS</span><button onClick={reset} className="toy-btn px-4 py-1.5 text-white" style={{ background: "#e6356f", borderRadius: 10 }}>{done ? "DONE ✓" : "RESET"}</button></div>
    <div className="text-xs opacity-60">saved on this device.</div>
  </div>);
}

function HowTo() {
  const rows = [["↑ / W", "accelerate"], ["↓ / S", "brake"], ["← → / A D", "steer"], ["SHIFT / SPACE", "drift (hold to boost)"], ["Z / ENTER", "use item"]];
  return (<div className="flex flex-col gap-2" style={{ fontWeight: 700 }}>
    {rows.map(([k, v], i) => <div key={i} className="flex items-center justify-between"><span className="px-2 py-0.5" style={{ background: "#1a1230", color: "#fff", borderRadius: 6 }}>{k}</span><span>{v}</span></div>)}
    <div className="mt-2 text-sm opacity-70">Drift around corners to charge a turbo boost. Grab item boxes, blast rivals, collect $KART and finish first.</div>
  </div>);
}

function XIcon({ size = 14 }: { size?: number }) { return (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>); }
