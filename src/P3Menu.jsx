import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import menuBg from "./assets/menu-bg.mp4";

// Main menu in the style of the Persona 3 Reload pause menu.
const ITEMS = [
  { id: "about",   label: "ABOUT ME",       page: "about",   description: "View Profile",        rotation: -15, zIndex: 0, offsetX: 0,   offsetY: 30 },
  { id: "resume",  label: "FUTURE PERSONA", page: "future-persona",  description: "View Future Plans",   rotation: -20, zIndex: 1, offsetX: -50, offsetY: 35 },
  { id: "socials", label: "SOCIALS",        page: "socials", description: "View Social Links",   rotation: -8,  zIndex: 2, offsetX: -20, offsetY: 20 },
  { id: "music",   label: "MUSIC",          page: "music",   description: "Play the Soundtrack", rotation: 8,   zIndex: 0, offsetX: 0,   offsetY: 0 },
];

const COLORS = ["#16CFFB", "#7DE6FD", "#77FEFC"];
const SELECTOR_PATH = "M 24.853754,93.31573 135.14625,49.684266 114.14751,97.331142 Z";
const SELECTOR_BG_PATH = "M 12.7428765,95.50088 144.25712,47.499123 116.75625,95.465764 Z";
const NAV_SOUND = "/sfx/navigation.wav";

const isTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function MenuOption({ item, index, isSelected, onSelect, onConfirm }) {
  const maskId = `p3r-mask-${item.id}`;
  const textRef = useRef(null);
  const [hit, setHit] = useState(null);

  // Measure the label once the font is in, so the hit area hugs the glyphs (with padding).
  useLayoutEffect(() => {
    const measure = () => {
      const t = textRef.current;
      if (!t) return;
      try {
        const b = t.getBBox();
        setHit({ x: b.x, y: b.y, w: b.width, h: b.height });
      } catch { /* not rendered yet */ }
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [item.label]);

  // The highlighted label keeps a tight zone; the others get a generous one, so
  // sliding onto a neighbour switches promptly instead of sticking.
  const pad = isSelected ? 2 : 22;
  const padY = isSelected ? 2 : 12;

  const handleClick = () => {
    // On touch screens the first tap highlights, the second opens.
    if (isTouch() && !isSelected) { onSelect(); return; }
    onConfirm();
  };
  const stretch = item.label.replaceAll(" ", "").length * 0.5 + 1.5;
  const selectorTransform = `translate(-60, -10) rotate(8, 0, 100) scale(${stretch}, 3)`;
  const color = COLORS[(index + 2) % COLORS.length];

  return (
    <div className={`p3r-opt${isSelected ? " selected" : ""}`} style={{ zIndex: isSelected ? 5 : item.zIndex }}>
      <button
        type="button"
        className="p3r-opt-hit"
        onFocus={onSelect}
        onClick={onConfirm}
        aria-label={`${item.label}: ${item.description}`}
        aria-current={isSelected ? "page" : undefined}
      />
      <svg
        className="p3r-opt-svg"
        viewBox="0 0 950 200"
        style={{ "--ox": item.offsetX, "--oy": item.offsetY, "--rot": `${item.rotation}deg` }}
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="950" height="200">
            <rect width="100%" height="100%" fill="black" />
            <g transform={selectorTransform} className="p3r-selector">
              <path fill="white" d={SELECTOR_PATH} />
              <path className="p3r-tri-blink" fill="white" d={SELECTOR_BG_PATH} />
            </g>
          </mask>
        </defs>

        {isSelected && (
          <g transform={selectorTransform} className="p3r-selector">
            <path className="p3r-tri-blink p3r-tri-pink" d={SELECTOR_BG_PATH} />
            <path fill="#fff" d={SELECTOR_PATH} />
          </g>
        )}

        <text ref={textRef} x="150" y="120" className="p3r-text" fill={isSelected ? "#000" : color}>
          {item.label}
        </text>

        {isSelected && (
          <g mask={`url(#${maskId})`}>
            <text x="150" y="120" className="p3r-text" fill="#F00">{item.label}</text>
          </g>
        )}

        {hit && (
          <rect
            className="p3r-hit-rect"
            x={hit.x - pad} y={hit.y - padY} width={hit.w + pad * 2} height={hit.h + padY * 2}
            fill="transparent"
            onMouseEnter={onSelect}
            onPointerDown={(e) => { if (e.pointerType === "touch") onSelect(); }}
            onClick={handleClick}
          />
        )}
      </svg>
    </div>
  );
}

export default function P3Menu({ onNavigate }) {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [optWidth, setOptWidth] = useState(950);
  const soundRef = useRef(null);

  // Options are drawn in a 950x200 coordinate space; pick how wide that space is on this screen.
  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      let w;
      if (vw <= 720) w = vw * 1.12;
      else if (vh <= 520) w = Math.min(700, Math.max(440, vw * 0.52));
      else if (vw <= 1100) w = Math.min(950, Math.max(520, vw * 0.7));
      else w = Math.min(950, Math.max(560, vw * 0.62));
      setOptWidth(Math.round(w));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const select = useCallback((idx) => {
    setActive((prev) => {
      if (prev === idx) return prev;
      try {
        if (!soundRef.current) { soundRef.current = new Audio(NAV_SOUND); soundRef.current.volume = 0.5; }
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(() => {});
      } catch { /* sound is optional */ }
      return idx;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowDown" || e.key === "s") select((active + 1) % ITEMS.length);
      if (e.key === "ArrowUp" || e.key === "w") select((active - 1 + ITEMS.length) % ITEMS.length);
      if (e.key === "Enter") onNavigate?.(ITEMS[active].page);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onNavigate, select]);

  return (
    <div className={`p3r-screen${mounted ? " mounted" : ""}`} style={{ "--w": `${optWidth}px`, "--k": optWidth / 950 }}>
      <video className="p3r-bg" src={menuBg} autoPlay loop muted playsInline />

      <div className="p3r-index" aria-hidden="true">0{active + 1}</div>

      <h1 className="p3r-title" aria-label="Ahmed's Persona">
        <span className="p3r-title-top">ahmed's</span>
        <span className="p3r-title-main">persona</span>
      </h1>

      <nav className="p3r-options" aria-label="Main menu">
        {ITEMS.map((item, i) => (
          <MenuOption
            key={item.id}
            item={item}
            index={i}
            isSelected={active === i}
            onSelect={() => select(i)}
            onConfirm={() => onNavigate?.(item.page)}
          />
        ))}
      </nav>

      <div className="p3r-hud">
        <p className="p3r-desc" key={active}>{ITEMS[active].description}</p>
        <div className="p3r-command">
          <span>Command</span>
          <hr />
        </div>
        <div className="p3r-controls">
          <span className="p3r-control"><i className="p3r-key">↵</i><span>Confirm</span></span>
          <span className="p3r-control"><i className="p3r-key">esc</i><span>Close</span></span>
        </div>
      </div>

      <style>{`
        .p3r-screen {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #015FCC;
          color: #fff;
          font-family: 'Rodin Pro', 'Bebas Neue', sans-serif;
        }
        .p3r-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: left center;
          z-index: 0;
        }

        /* Giant faded index number on the left */
        .p3r-index {
          position: absolute;
          left: -4.5rem;
          top: -18rem;
          z-index: 1;
          font-family: 'Rodin Pro', sans-serif;
          font-style: italic;
          font-size: 37vh;
          letter-spacing: -0.2em;
          color: #808080;
          transform: rotate(90deg);
          transform-origin: center;
          line-height: 1;
          user-select: none;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease 0.2s;
        }
        .p3r-screen.mounted .p3r-index { opacity: 1; }

        /* Title, top-left: the original name tag — Anton italic, tilted, black over grey */
        .p3r-title {
          position: absolute;
          top: calc(18px + env(safe-area-inset-top, 0px));
          right: calc(28px + env(safe-area-inset-right, 0px));
          z-index: 4;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          font-family: 'Anton', sans-serif;
          font-weight: 400;
          font-style: italic;
          font-size: clamp(40px, 5.6vw, 88px);
          line-height: 0.88;
          letter-spacing: 2px;
          text-transform: uppercase;
          transform: none;
          user-select: none;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease 0.1s;
        }
        .p3r-screen.mounted .p3r-title { opacity: 1; }
        .p3r-title-top { color: rgba(0, 0, 0, 0.86); }
        .p3r-title-main { color: rgba(10, 10, 14, 0.64); }
        .p3r-title::after { content: none; }

        /* Options column */
        .p3r-options {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 40vw;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          width: var(--w);
          z-index: 2;
        }
        .p3r-opt {
          position: relative;
          width: var(--w);
          pointer-events: none;
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.4s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .p3r-opt + .p3r-opt { margin-top: calc(-112px * var(--k)); }
        .p3r-screen.mounted .p3r-opt { opacity: 1; transform: translateX(0); }
        .p3r-opt:nth-child(1) { transition-delay: 0.05s; }
        .p3r-opt:nth-child(2) { transition-delay: 0.12s; }
        .p3r-opt:nth-child(3) { transition-delay: 0.19s; }
        .p3r-opt:nth-child(4) { transition-delay: 0.26s; }
        .p3r-opt-hit {
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: calc(64px * var(--k));
          transform: translateY(-50%);
          background: none;
          border: 0;
          padding: 0;
          pointer-events: none;
          z-index: 2;
        }
        .p3r-hit-rect { pointer-events: all; cursor: pointer; }
        .p3r-opt.selected { z-index: 6 !important; }
        .p3r-opt-hit:focus-visible { outline: 3px solid #fff; outline-offset: -3px; }
        .p3r-opt-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
          pointer-events: none;
          position: relative;
          z-index: 1;
          transform: translate(calc(var(--ox) * var(--k) * 1px), calc(var(--oy) * var(--k) * 1px)) rotate(var(--rot));
          transform-origin: 25% center;
        }
        .p3r-text {
          font-family: 'Rodin Pro', 'Bebas Neue', sans-serif;
          font-weight: 800;
          font-style: italic;
          font-size: 72px;
          letter-spacing: -0.14em;
          transform-origin: 237px 100px;
          transform-box: view-box;
        }
        .p3r-opt.selected .p3r-text { animation: p3r-pulse 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes p3r-pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        .p3r-selector { transform-origin: left center; transform-box: view-box; }
        .p3r-tri-pink { fill: #FD77D9; }
        .p3r-tri-blink {
          transform-origin: 52px 100px;
          transform-box: view-box;
          animation: p3r-blink 0.75s linear infinite;
        }
        @keyframes p3r-blink {
          0%, 80%  { transform: scale(1); }
          93%      { transform: scale(1.05); }
          100%     { transform: scale(1); }
        }

        /* Bottom-right HUD */
        .p3r-hud {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          font-family: 'NewRodin Pro', sans-serif;
          --shadow-under: 0 1px 6px rgba(0,0,0,0.5), 0 -1px 6px rgba(0,0,0,0.5), 1px 0 6px rgba(0,0,0,0.5), -1px 0 6px rgba(0,0,0,0.5);
          opacity: 0;
          transition: opacity 0.5s ease 0.35s;
        }
        .p3r-screen.mounted .p3r-hud { opacity: 1; }
        .p3r-desc {
          font-style: italic;
          font-size: 30px;
          padding-right: 80px;
          text-shadow: var(--shadow-under);
          animation: p3r-desc-in 0.25s ease-out;
        }
        @keyframes p3r-desc-in {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .p3r-command {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
          font-size: 16px;
          text-shadow: var(--shadow-under);
        }
        .p3r-command hr {
          flex: 1;
          border: 0;
          border-top: 2px solid #fff;
          margin: 0;
          box-shadow: var(--shadow-under);
        }
        .p3r-controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          width: 100%;
          padding-right: 80px;
          margin: 16px 0 24px;
        }
        .p3r-control {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-style: italic;
          font-size: 30px;
          letter-spacing: -0.02em;
          text-shadow:
            0 2px 0 #5D6A88, 0 -2px 0 #5D6A88, 2px 0 0 #5D6A88, -2px 0 0 #5D6A88,
            -2px -2px 0 #5D6A88, 2px -2px 0 #5D6A88, 2px 2px 0 #5D6A88, -2px 2px 0 #5D6A88,
            var(--shadow-under);
        }
        .p3r-key {
          display: inline-grid;
          place-items: center;
          min-width: 32px;
          height: 32px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(3, 31, 100, 0.8);
          border: 3px solid #fff;
          outline: 3px solid #5D6A88;
          box-shadow: var(--shadow-under);
          font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-style: normal;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          text-shadow: none;
        }

        @media (max-width: 1100px) {
          .p3r-options { left: 24vw; }
        }
        @media (max-width: 720px) and (orientation: portrait) {
          .p3r-bg { object-position: 10% 50%; }
        }
        @media (max-width: 720px) {
          .p3r-options { left: -3vw; justify-content: center; padding-bottom: 18vh; }
          .p3r-index { font-size: 26vh; left: -3rem; top: -12rem; }
          .p3r-title { top: calc(12px + env(safe-area-inset-top, 0px)); right: 14px; font-size: 40px; }
          .p3r-desc { font-size: 20px; padding-right: 20px; }
          .p3r-command { font-size: 13px; }
          .p3r-controls { padding-right: 20px; gap: 12px; margin: 10px 0 14px; }
          .p3r-control { font-size: 18px; }
          .p3r-key { min-width: 26px; height: 26px; font-size: 12px; border-width: 2px; outline-width: 2px; }
        }
        @media (max-height: 520px) {
          .p3r-index { font-size: 30vh; }
          .p3r-title { top: 8px; right: 14px; font-size: 34px; }
          .p3r-desc { font-size: 20px; }
          .p3r-control { font-size: 18px; }
          .p3r-key { min-width: 26px; height: 26px; font-size: 12px; }
          .p3r-controls { margin: 8px 0 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .p3r-opt.selected .p3r-text, .p3r-tri-blink, .p3r-desc { animation: none; }
          .p3r-opt, .p3r-index, .p3r-hud { transition: none; }
        }
      `}</style>
    </div>
  );
}
