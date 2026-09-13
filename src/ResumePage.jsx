import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BG_VIDEO = new URL("../music/vid1.mp4", import.meta.url).href;

// Placeholder squares. Names, subtitles, and positions are easy to swap once the
// real content is decided. `x` / `y` are viewport percentages for the box's top-left.
const NODES = [
  { id: "education", label: "EDUCATION", jp: "教育", x: 56, y: 14, from: "top" },
  { id: "skills", label: "SKILLS", jp: "スキル", x: 27, y: 25, from: "left" },
  { id: "experience", label: "EXPERIENCE", jp: "経験", x: 68, y: 40, from: "right" },
  { id: "ambitions", label: "AMBITIONS", jp: "野望", x: 24, y: 52, from: "left" },
  { id: "timeline", label: "TIMELINE", jp: "年表", x: 50, y: 70, from: "bottom" },
];

// Two guide lines echoing the reference: a white one from top-left toward the
// eye, a thin black one from bottom-left rising to the right. Units are % of screen.
const LINES = [
  { id: "white", x1: 6, y1: 11, x2: 66, y2: 50, stroke: "#f4f8ff", width: 3, delay: 0.15 },
  { id: "black", x1: 12, y1: 95, x2: 72, y2: 42, stroke: "#05070c", width: 1.5, delay: 0.3 },
];

function moonPhaseLabel(date) {
  const synodic = 29.530588853;
  const known = Date.UTC(2000, 0, 6, 18, 14); // reference new moon
  const days = (date.getTime() - known) / 86400000;
  const phase = ((days % synodic) + synodic) % synodic;
  if (phase < 1.85) return "NEW MOON";
  if (phase < 12.9) return "WAXING";
  if (phase < 16.6) return "FULL MOON";
  return "WANING";
}

export default function ResumePage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [keyNav, setKeyNav] = useState(false);
  const [size, setSize] = useState({ w: 1600, h: 900 });

  useLayoutEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    document.querySelectorAll("video").forEach((v) => v.play().catch(() => { }));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("button") && (e.key === "Enter" || e.key === " ")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { setKeyNav(true); setCursor((i) => (i + 1) % NODES.length); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setKeyNav(true); setCursor((i) => (i - 1 + NODES.length) % NODES.length); }
      if (e.key === "Enter") setSelected((s) => (s === cursor ? null : cursor));
      if (e.key === "Escape" || e.key === "Backspace") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, navigate]);

  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}/${now.getDate()} ${now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}`;
  const activeIndex = hovered ?? (keyNav ? cursor : null);

  return (
    <div id="menu-screen" className="fp-screen">
      <video className="fp-video" src={BG_VIDEO} autoPlay loop muted playsInline />
      <div className="fp-tint" aria-hidden="true" />
      <div className="fp-grain" aria-hidden="true" />

      <div className="fp-entry-mask" aria-hidden="true">
        <video className="fp-entry-video" src={BG_VIDEO} autoPlay loop muted playsInline />
      </div>

      <svg className={`fp-lines${mounted ? " mounted" : ""}`} viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h} aria-hidden="true">
        {LINES.map((l) => {
          const x1 = (l.x1 / 100) * size.w, y1 = (l.y1 / 100) * size.h;
          const x2 = (l.x2 / 100) * size.w, y2 = (l.y2 / 100) * size.h;
          const len = Math.hypot(x2 - x1, y2 - y1);
          return (
            <line
              key={l.id}
              className={`fp-line fp-line-${l.id}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={l.stroke}
              strokeWidth={l.width}
              style={{ strokeDasharray: len, strokeDashoffset: mounted ? 0 : len, transitionDelay: `${l.delay}s` }}
            />
          );
        })}
      </svg>

      <header className={`fp-command${mounted ? " mounted" : ""}`}>
        <button type="button" className="fp-back" onClick={() => navigate("/")} aria-label="Back to main menu">
          <span aria-hidden="true">‹</span>
        </button>
        <div className="fp-command-text">
          <span className="fp-command-title">FUTURE PERSONA</span>
          <span className="fp-command-sub">未来のペルソナ / 確認</span>
        </div>
      </header>

      <nav className="fp-nodes" aria-label="Future Persona sections">
        {NODES.map((node, i) => {
          const isActive = activeIndex === i;
          const isSelected = selected === i;
          return (
            <button
              key={node.id}
              type="button"
              className={`fp-node from-${node.from}${mounted ? " mounted" : ""}${isActive ? " active" : ""}${isSelected ? " selected" : ""}`}
              style={{ left: `${node.x}vw`, top: `${node.y}vh`, transitionDelay: mounted ? `${0.25 + i * 0.09}s` : "0s" }}
              onMouseEnter={() => { setHovered(i); setCursor(i); setKeyNav(false); }}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setCursor(i)}
              onClick={() => setSelected((s) => (s === i ? null : i))}
              aria-pressed={isSelected}
            >
              <span className="fp-node-face">
                <span className="fp-node-label">{node.label}</span>
              </span>
              <span className="fp-node-sub" aria-hidden="true">{node.jp}</span>
              <span className="fp-node-ping" aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <div className={`fp-readout${mounted ? " mounted" : ""}`} aria-hidden="true">
        <span className="fp-readout-date">{dateLabel}</span>
        <span className="fp-readout-moon">{moonPhaseLabel(now)}</span>
      </div>

      <footer className={`fp-hint${mounted ? " mounted" : ""}`}>
        <span><i className="fp-dot" />BACK</span>
        <span><i className="fp-dot" />SELECT</span>
        <span className="fp-hint-keys">◄ ► MOVE · ↵ CONFIRM · ESC MENU</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Michroma&family=Bebas+Neue&family=Noto+Sans+JP:wght@500;700&display=swap');

        .fp-screen { background: #061a4a; }

        /* ── Background: video with a blue duotone tint + grain, like the reference ── */
        .fp-video {
          filter: saturate(0.55) contrast(1.08) brightness(0.95);
        }
        .fp-tint {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(115deg, rgba(24, 70, 190, 0.55) 0%, rgba(90, 150, 255, 0.35) 55%, rgba(200, 225, 255, 0.25) 100%);
          mix-blend-mode: color;
        }
        .fp-grain {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          opacity: 0.55;
          background-image:
            repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.10) 2px 3px),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          mix-blend-mode: overlay;
          animation: fp-grain-shift 0.9s steps(3) infinite;
        }
        @keyframes fp-grain-shift {
          0%   { background-position: 0 0, 0 0; }
          33%  { background-position: 0 0, -40px 20px; }
          66%  { background-position: 0 0, 30px -35px; }
          100% { background-position: 0 0, 0 0; }
        }

        /* ── Circle reveal entry ── */
        .fp-entry-mask {
          position: absolute;
          inset: 0;
          z-index: 4;
          overflow: hidden;
          background: #0047ff;
          clip-path: circle(0 at 50% 50%);
          animation: fp-entry-reveal 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: none;
        }
        .fp-entry-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.55) contrast(1.08) brightness(0.95);
        }
        @keyframes fp-entry-reveal {
          from { clip-path: circle(0 at 50% 50%); opacity: 1; }
          80%  { clip-path: circle(150vmax at 50% 50%); opacity: 1; }
          to   { clip-path: circle(150vmax at 50% 50%); opacity: 0; }
        }

        /* ── Guide lines ── */
        .fp-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
          pointer-events: none;
        }
        .fp-line {
          stroke-linecap: square;
          transition: stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .fp-line-white { filter: drop-shadow(0 0 4px rgba(255,255,255,0.55)); }

        /* ── Command header (top-left) ── */
        .fp-command {
          position: absolute;
          top: 4vh;
          left: 3vw;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 14px;
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.4s ease 0.1s, transform 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s;
        }
        .fp-command.mounted { opacity: 1; transform: translateX(0); }
        .fp-back {
          width: 52px;
          height: 52px;
          border: 0;
          background: rgba(5, 7, 12, 0.85);
          color: #fff;
          font: 44px/1 'Michroma', sans-serif;
          cursor: pointer;
          display: grid;
          place-items: center;
          padding-bottom: 6px;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .fp-back:hover { background: #fff; color: #05070c; }
        .fp-command-text { display: flex; flex-direction: column; gap: 4px; }
        .fp-command-title {
          font-family: 'Michroma', sans-serif;
          font-size: clamp(16px, 1.6vw, 24px);
          letter-spacing: 3px;
          color: #05070c;
          background: rgba(255, 255, 255, 0.92);
          padding: 8px 18px 6px 14px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        .fp-command-sub {
          font-family: 'Noto Sans JP', sans-serif;
          font-weight: 500;
          font-size: 13px;
          letter-spacing: 2px;
          color: #fff;
          background: rgba(5, 7, 12, 0.85);
          padding: 3px 12px;
          width: fit-content;
        }

        /* ── The five squares ── */
        .fp-nodes {
          position: absolute;
          inset: 0;
          z-index: 7;
        }
        .fp-node {
          position: absolute;
          border: 0;
          padding: 0;
          background: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: center;
        }
        .fp-node.from-left   { transform: translateX(-70px) skewX(-6deg); }
        .fp-node.from-right  { transform: translateX(70px) skewX(-6deg); }
        .fp-node.from-top    { transform: translateY(-50px) skewX(-6deg); }
        .fp-node.from-bottom { transform: translateY(50px) skewX(-6deg); }
        .fp-node.mounted { opacity: 1; transform: translate(0, 0) skewX(-6deg); }

        .fp-node-face {
          display: block;
          position: relative;
          padding: 12px 34px 10px 30px;
          background: #05070c;
          color: #fff;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 6px 6px 0 rgba(0, 0, 0, 0.35);
          transition: background 0.18s ease, color 0.18s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
        }
        .fp-node-label {
          display: block;
          font-family: 'Michroma', sans-serif;
          font-size: clamp(13px, 1.35vw, 21px);
          letter-spacing: 2px;
          line-height: 1;
          white-space: nowrap;
          transform: skewX(6deg);
        }
        /* subtitle bar that pops out under the box on hover / focus */
        .fp-node-sub {
          position: absolute;
          right: -10px;
          top: calc(100% + 4px);
          font-family: 'Noto Sans JP', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 3px;
          color: #fff;
          background: #05070c;
          padding: 3px 14px 2px;
          white-space: nowrap;
          opacity: 0;
          transform: translateY(-8px) scaleX(0.6);
          transform-origin: left center;
          transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .fp-node-ping {
          position: absolute;
          inset: -6px;
          border: 2px solid #fff;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes fp-pop {
          0%   { transform: scale(0.94); }
          55%  { transform: scale(1.12); }
          100% { transform: scale(1.06); }
        }
        @keyframes fp-ping {
          0%   { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        .fp-node.active { z-index: 2; }
        .fp-node.active .fp-node-face {
          background: #fff;
          color: #05070c;
          box-shadow: 0 0 0 2px #05070c, 8px 8px 0 rgba(0, 0, 0, 0.55), 0 0 28px rgba(255,255,255,0.45);
          animation: fp-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .fp-node.active .fp-node-sub { opacity: 1; transform: translateY(0) scaleX(1); }
        .fp-node.active .fp-node-ping { animation: fp-ping 0.6s ease-out forwards; }
        .fp-node.selected .fp-node-face {
          background: #fff;
          color: #05070c;
          box-shadow: 0 0 0 2px #05070c, 8px 8px 0 #c4001a;
        }
        .fp-node.selected .fp-node-sub { opacity: 1; transform: translateY(0) scaleX(1); }
        .fp-node:focus-visible { outline: 0; }
        .fp-node:focus-visible .fp-node-face { box-shadow: 0 0 0 3px #fff, 0 0 0 5px #05070c; }

        /* ── Date + moon readout (bottom-right) ── */
        .fp-readout {
          position: absolute;
          right: 3vw;
          bottom: 5vh;
          z-index: 8;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.5s ease 0.6s;
        }
        .fp-readout.mounted { opacity: 1; }
        .fp-readout-date {
          font-family: 'Michroma', sans-serif;
          font-size: clamp(18px, 2vw, 30px);
          letter-spacing: 2px;
          color: #fff;
          text-shadow: 2px 2px 0 #05070c, 0 0 14px rgba(0,0,0,0.5);
        }
        .fp-readout-moon {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 4px;
          color: #05070c;
          background: rgba(255,255,255,0.9);
          padding: 2px 10px;
        }

        /* ── Bottom-left hint ── */
        .fp-hint {
          position: absolute;
          left: 3vw;
          bottom: 4vh;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 18px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 3px;
          color: #fff;
          background: rgba(5, 7, 12, 0.7);
          padding: 6px 16px 5px;
          border-left: 4px solid #fff;
          opacity: 0;
          transition: opacity 0.5s ease 0.7s;
        }
        .fp-hint.mounted { opacity: 1; }
        .fp-hint span { display: inline-flex; align-items: center; gap: 6px; }
        .fp-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; display: inline-block; }
        .fp-hint-keys { font-size: 13px; letter-spacing: 2px; opacity: 0.55; }

        /* Phones in portrait: the scattered layout can't fit, so the squares stack in a column. */
        @media (max-width: 720px) {
          .fp-nodes {
            inset: 18vh 6vw 16vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 14px;
          }
          .fp-node { position: static !important; width: 100%; }
          .fp-node-face { padding: 14px 18px 12px; text-align: center; }
          .fp-node-label { font-size: 15px; letter-spacing: 2px; }
          .fp-node-sub { right: 8px; }
          .fp-node.active .fp-node-face { animation: none; transform: scale(1.03); }
          .fp-lines { opacity: 0.45; }
          .fp-command { top: 3vh; }
          .fp-command-title { font-size: 14px; letter-spacing: 2px; }
          .fp-back { width: 44px; height: 44px; font-size: 36px; }
          .fp-hint { font-size: 15px; gap: 12px; padding: 5px 12px 4px; }
          .fp-hint .fp-hint-keys { display: none; }
          .fp-readout-date { font-size: 18px; }
          .fp-readout-moon { font-size: 12px; letter-spacing: 3px; }
        }
        /* Phones sideways: keep the scatter but tighten it. */
        @media (max-height: 520px) and (min-width: 721px) {
          .fp-node-face { padding: 8px 20px 6px 16px; }
          .fp-node-label { font-size: 13px; }
          .fp-command { top: 3vh; }
          .fp-command-title { font-size: 14px; }
          .fp-command-sub { font-size: 11px; }
          .fp-back { width: 40px; height: 40px; font-size: 32px; }
          .fp-hint { font-size: 14px; padding: 4px 10px 3px; }
          .fp-hint .fp-hint-keys { display: none; }
          .fp-readout-date { font-size: 18px; }
          .fp-readout-moon { font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-grain, .fp-entry-mask, .fp-node.active .fp-node-face, .fp-node.active .fp-node-ping { animation: none !important; }
          .fp-entry-mask { display: none; }
          .fp-node, .fp-line, .fp-command, .fp-hint, .fp-readout { transition: none; }
        }
      `}</style>
    </div>
  );
}
