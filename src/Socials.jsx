import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaDiscord, FaInstagram, FaTiktok } from "react-icons/fa6";
import { useContent } from "./useContent.js";
import EditModal, { EditButton } from "./EditModal.jsx";
import char1 from "./assets/char1.png";
import char2 from "./assets/char2.png";
import char3 from "./assets/char3.png";
import bgVideo from "./assets/main3.mp4";

const CHARS = [char1, char2, char3];

const ROLES = [
  { text: "LEADER", color: "#e8c100", bg: "rgba(232,193,0,0.12)", border: "rgba(232,193,0,0.5)" },
  { text: "PARTY", color: "#4a8fff", bg: "rgba(74,143,255,0.12)", border: "rgba(74,143,255,0.5)" },
  { text: "PARTY", color: "#4a8fff", bg: "rgba(74,143,255,0.12)", border: "rgba(74,143,255,0.5)" },
];

const BASE_ITEMS = [
  {
    id: "instagram", label: "INSTAGRAM", handle: "@ahmd.ftt", href: "https://www.instagram.com/ahmd.ftt?stkn=NnUxZGhrdWl2MmJ2", icon: FaInstagram,
    details: [
      { label: "USER", value: "@ahmd.ftt", icon: "" },
      { label: "STATUS", value: "Active", icon: "" }
    ],
    stats: [],
  },
  {
    id: "tiktok", label: "TIKTOK", handle: "@d4n0b", href: "https://www.tiktok.com/@d4n0b?_r=1&_t=ZS-99hROEMBQn6", icon: FaTiktok,
    details: [
      { label: "USER", value: "@d4n0b", icon: "" },
      { label: "STATUS", value: "Active", icon: "" }
    ],
    stats: [],
  },
  {
    id: "discord", label: "DISCORD", handle: "718015166717100073", href: "https://discord.com/users/718015166717100073", icon: FaDiscord,
    details: [
      { label: "USER", value: "@d1n0B", icon: "" },
      { label: "STATUS", value: "Active", icon: "" }
    ],
    stats: [],
  },
];

export default function Socials() {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeInfoBar, setActiveInfoBar] = useState(0);
  const [focus, setFocus] = useState("left"); // "left" | "right"
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const { content, update } = useContent();

  // Details and links come from the editable content store.
  const ITEMS = BASE_ITEMS.map((item) => {
    const s = content.socials[item.id] || {};
    return {
      ...item,
      href: s.url || item.href,
      details: [
        { label: "USER", value: s.user || item.details[0].value, icon: "" },
        { label: "STATUS", value: s.status || item.details[1].value, icon: "" },
      ],
    };
  });
  const saveSocial = async (values) => update((c) => ({
    ...c,
    socials: { ...c.socials, [ITEMS[active].id]: { user: values.user.trim(), status: values.status.trim(), url: values.url.trim() } },
  }));

  useEffect(() => {
    const v = document.querySelector('video');
    if (v) v.play().catch(() => { });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (document.body.classList.contains("p3-modal-open")) return;
      if (focus === "left") {
        if (e.key === "ArrowUp") setActive(i => Math.max(0, i - 1));
        if (e.key === "ArrowDown") setActive(i => Math.min(ITEMS.length - 1, i + 1));
        if (e.key === "ArrowRight") { setFocus("right"); setActiveInfoBar(0); }
        if (e.key === "Enter") window.open(ITEMS[active].href, "_blank");
      } else {
        const barCount = ITEMS[active].bars;
        if (e.key === "ArrowUp") setActiveInfoBar(i => Math.max(0, i - 1));
        if (e.key === "ArrowDown") setActiveInfoBar(i => Math.min(barCount - 1, i + 1));
        if (e.key === "ArrowLeft") setFocus("left");
        if (e.key === "Enter") {
          let url = ITEMS[active].links[activeInfoBar];
          if (!url.startsWith("http")) url = "https://" + url;
          window.open(url, "_blank");
        }
      }
      if ((e.key === "ArrowLeft" && focus === "left") || e.key === "Escape" || e.key === "Backspace") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, navigate, focus]);

  return (
    <div id="menu-screen">
      <video src={bgVideo} autoPlay loop muted playsInline />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,400;0,700;1,700&display=swap');

        .sc-root {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 14px;
          padding-left: 0;
        }

        /* ── Each bar ── */
        .sc-bar {
          position: relative;
          width: min(46vw, 680px);
          height: 64px;
          transition: height 0.3s cubic-bezier(0.22,1,0.36,1), transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
          background: #111;
          cursor: pointer;
          pointer-events: all;
          clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
          box-shadow: 0 6px 24px rgba(0,0,0,0.65);
          z-index: 1;
        }
        .sc-bar-outer.active .sc-bar {
          transform: translateX(6px) scale(1.02);
          box-shadow: 10px 8px 0 #d63232;
        }

        /* wrapper holds both the red underlay and the bar */
        .sc-bar-outer {
          position: relative;
          flex-shrink: 0;
          opacity: 0;
          transform: translateX(-48px);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sc-bar-outer.active .sc-bar     { height: 90px; }
        .sc-bar-outer.active .sc-bar-red { height: 90px; }
        .sc-bar-outer.mounted { opacity: 1; transform: translateX(0); }
        .sc-bar-outer:nth-child(1) { transition-delay: 0ms; }
        .sc-bar-outer:nth-child(2) { transition-delay: 80ms; }
        .sc-bar-outer:nth-child(3) { transition-delay: 160ms; }

        /* red underlay — peeks out below the bar when active */
        .sc-bar-red {
          position: absolute;
          top: 0; left: 0;
          width: min(46vw, 680px);
          height: 64px;
          background: #c4001a;
          clip-path: polygon(50% 0, 100% 0, 100% 100%, calc(50% - 10px) 100%);
          transform: translateY(-7px);
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 0;
          pointer-events: none;
        }
        .sc-bar-outer.active .sc-bar-red { opacity: 1; }

        /* white fill — skewed parallelogram on the right 25% */
        .sc-bar-fill {
          position: absolute;
          inset: 0;
          width: 100%;
          background: var(--p3-blue-light);
          clip-path: polygon(100% 0, 100% 0, calc(100% - 32px) 100%, calc(100% - 32px) 100%);
          transition: clip-path 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 0;
        }
        .sc-bar-outer.active .sc-bar-fill {
          clip-path: polygon(22% 0, 100% 0, calc(100% - 14px) 100%, calc(22% + 138px) 100%);
        }

        /* shade on the left edge of the white fill */
        .sc-bar-shade {
          position: absolute;
          top: 0; bottom: 0;
          left: 73%;
          width: 6%;
          background: linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%);
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .sc-bar-outer.active .sc-bar-shade { opacity: 1; }

        /* bottom shadow line under each bar */
        .sc-bar::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%);
          z-index: 10;
          pointer-events: none;
        }

        /* content layout inside each bar */
        .sc-bar-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px 0 20px;
        }

        /* left: role label */
        .sc-role {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          font-family: 'Anton', sans-serif;
          font-size: clamp(1.8rem, 3.2vw, 3.1rem);
          letter-spacing: -2px;
          color: #ffffff;
          transform: rotate(-30deg);
          user-select: none;
          line-height: 1;
          padding: 0 16px 0 8px;
        }

        /* left: icon + name centered in remaining space */
        .sc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }
        .sc-main-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sc-icon {
          font-size: clamp(1.1rem, 1.6vw, 1.6rem);
          width: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ffffff;
          transition: color 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
        }
        .sc-bar-outer.active .sc-icon { color: #111111; transform: scale(1.15); }

        .sc-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.5rem, 2.2vw, 2.1rem);
          letter-spacing: 4px;
          line-height: 1;
          color: rgba(255,255,255,0.85);
          transition: color 0.2s ease, transform 0.2s ease;
          user-select: none;
        }
        .sc-bar-outer.active .sc-label { 
          color: var(--p3-text-on-light); 
          transform: scale(1.1);
        }

        /* lb/rb nav row */
        @keyframes sc-arrow-left {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50%       { transform: translateX(-5px); opacity: 0.4; }
        }
        @keyframes sc-arrow-right {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50%       { transform: translateX(5px); opacity: 0.4; }
        }
        .sc-nav-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: #111;
          border: 1px solid rgba(0,0,0,0.35);
          padding: 1px 7px;
          line-height: 1.5;
          user-select: none;
        }
        .sc-nav-arrow {
          font-size: 12px;
          color: #c4001a;
          display: inline-block;
        }
        .sc-nav-arrow.left  { animation: sc-arrow-left  0.8s ease-in-out infinite; }
        .sc-nav-arrow.right { animation: sc-arrow-right 0.8s ease-in-out infinite; }

        /* character portrait */
        .sc-char {
          position: absolute;
          top: 0;
          left: 100px;
          height: 100%;
          width: auto;
          max-width: 150px;
          object-fit: cover;
          object-position: left top;
          pointer-events: none;
          z-index: 3;
          clip-path: polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%);
        }

        /* right-side nav bar */
        @keyframes sc-right-nav-pop {
          0%   { opacity: 0; transform: scale(0.55) translateY(-10px); }
          65%  { opacity: 1; transform: scale(1.1) translateY(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .sc-right-nav {
          position: fixed;
          top: 40px;
          right: 40px;
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: none;
          z-index: 50;
          animation: sc-right-nav-pop 0.38s cubic-bezier(0.22,1,0.36,1) both;
        }
        .sc-right-nav .sc-nav-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          letter-spacing: 3px;
          line-height: 1;
          user-select: none;
          color: var(--p3-text-on-dark);
          -webkit-text-stroke: 2px var(--p3-bg-dark);
          paint-order: stroke fill;
          background: none;
          border: none;
          padding: 0 6px;
        }
        .sc-right-nav .sc-nav-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 3px;
          line-height: 1;
          user-select: none;
          color: #111;
          padding: 0 8px;
        }
        .sc-right-nav .sc-nav-arrow {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #c4001a;
          display: inline-block;
          user-select: none;
        }
        .sc-right-nav .sc-nav-arrow.left  { animation: sc-arrow-left  0.8s ease-in-out infinite; }
        .sc-right-nav .sc-nav-arrow.right { animation: sc-arrow-right 0.8s ease-in-out infinite; }

        /* info bar under nav */
        @keyframes sc-infobar-in {
          0%   { opacity: 0; transform: translateX(40px); }
          60%  { opacity: 1; transform: translateX(-4px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .sc-info-bar-wrap {
          position: fixed;
          right: 0;
          left: 58%;
          height: 58px;
          background: rgba(17,17,17,0.94);
          pointer-events: all;
          cursor: pointer;
          z-index: 50;
          padding: 0;
          animation: sc-infobar-in 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .sc-info-bar-wrap.selected {
          background: #111;
          padding: 1.5px;
          border-radius: 8px;
        }
        .sc-info-bar {
          position: relative;
          width: 100%;
          height: 100%;
          background: rgba(17,17,17,0.94);
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .sc-info-bar-wrap.selected .sc-info-bar {
          background: var(--p3-blue-light);
          border-radius: 7px;
        }
        .sc-info-bar-new {
          position: absolute;
          left: -40px;
          bottom: 0;
          height: 65%;
          width: auto;
          pointer-events: none;
          z-index: 3;
        }
        .sc-info-bar-wrap.selected .sc-info-bar::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: #c4001a;
          z-index: 1;
        }
        .sc-info-bar-text {
          flex: 1;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.1rem, 1.6vw, 1.5rem);
          letter-spacing: 2px;
          color: #ffffff;
          font-weight: 700;
          padding: 0 14px;
          user-select: none;
          transition: color 0.15s ease;
        }
        .sc-info-bar-wrap.selected .sc-info-bar-text {
          color: #000;
        }

        .sc-info-bar-count {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 1px;
          color: #ffffff;
          flex-shrink: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          user-select: none;
          white-space: nowrap;
          transition: color 0.15s ease;
        }
        .sc-info-bar-wrap.selected .sc-info-bar-count {
          color: #000;
        }

        /* footer hints */
        .sc-footer {
          position: fixed;
          bottom: 20px; right: 28px;
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 5px;
          font-family: 'Bebas Neue', sans-serif;
          z-index: 50;
          opacity: 0;
          transition: opacity 0.4s ease 0.6s;
        }
        .sc-footer.mounted { opacity: 1; }
        .sc-footer-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; letter-spacing: 2px;
          color: rgba(255,255,255,0.22);
        }
        .sc-footer-key {
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 3px;
          padding: 1px 6px; font-size: 11px;
        }

        .sc-edit-wrap {
          position: fixed;
          right: 28px;
          top: 258px;
          z-index: 50;
          pointer-events: none;
        }
        .sc-edit-wrap > * { pointer-events: auto; }
        @media (max-width: 720px) {
          /* just above the detail rows, clear of the LB/RB switcher at the top */
          .sc-edit-wrap { top: auto; bottom: calc(15vh + 134px + env(safe-area-inset-bottom, 0px)); right: 4vw; }
        }
        @media (max-height: 520px) and (min-width: 721px) {
          .sc-edit-wrap { top: auto; bottom: 26px; right: 16px; }
        }

        .sc-back-button {
          position: fixed;
          bottom: 26px;
          left: 28px;
          z-index: 50;
          pointer-events: all;
          border: 1px solid rgba(141,246,255,0.5);
          background: rgba(17,17,17,0.9);
          color: #8df6ff;
          padding: 10px 18px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 2px;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%);
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.4s ease 0.35s, transform 0.4s ease 0.35s, background 0.2s ease, color 0.2s ease;
        }
        .sc-back-button.mounted {
          opacity: 1;
          transform: translateX(0);
        }
        .sc-back-button:hover,
        .sc-back-button:focus-visible {
          background: #8df6ff;
          color: #111;
          outline: none;
        }

        @media (max-width: 720px) and (orientation: portrait) {
          #menu-screen > video { object-position: 70% 50%; }
        }
        /* Phones in portrait: party bars in the upper half, detail rows stacked underneath. */
        @media (max-width: 720px) {
          .sc-root { gap: 10px; justify-content: flex-start; padding-top: 16vh; }
          .sc-bar,
          .sc-bar-red {
            width: 92vw;
            height: 64px;
          }
          .sc-bar-outer.active .sc-bar,
          .sc-bar-outer.active .sc-bar-red { height: 84px; }
          .sc-role { font-size: clamp(1.5rem, 7vw, 2.4rem); }
          .sc-label {
            font-size: clamp(1.4rem, 6vw, 2.1rem);
            letter-spacing: 3px;
          }
          .sc-main-top { padding-right: 16px !important; padding-left: 64px; }
          .sc-char {
            left: 60px;
            max-width: 86px;
          }
          .sc-right-nav { top: calc(14px + env(safe-area-inset-top, 0px)); right: auto; left: 4vw; gap: 4px; }
          .sc-right-nav .sc-nav-btn { font-size: 44px; padding: 0 4px; }
          .sc-right-nav .sc-nav-label { font-size: 16px; letter-spacing: 2px; }
          .sc-right-nav .sc-nav-arrow { font-size: 16px; }
          .sc-info-bar-wrap {
            top: auto !important;
            bottom: calc(15vh + env(safe-area-inset-bottom, 0px) + (1 - var(--i, 0)) * 66px);
            left: 4vw;
            right: 4vw;
            height: 58px;
          }
          .sc-info-bar-text { font-size: 1.1rem; }
          .sc-info-bar-count {
            font-size: 1.35rem;
            margin-right: 12px;
          }
        }
        /* Phones sideways: bars on the left, details on the right, everything shorter. */
        @media (max-height: 520px) and (min-width: 721px) {
          .sc-root { gap: 6px; }
          .sc-bar, .sc-bar-red { width: 50vw; height: 54px; }
          .sc-bar-outer.active .sc-bar, .sc-bar-outer.active .sc-bar-red { height: 66px; }
          .sc-role { font-size: 1.8rem; }
          .sc-label { font-size: 1.5rem; letter-spacing: 3px; }
          .sc-main-top { padding-right: 40px !important; }
          .sc-char { left: 70px; max-width: 90px; }
          .sc-right-nav { top: 8px; right: 12px; }
          .sc-right-nav .sc-nav-btn { font-size: 40px; }
          .sc-right-nav .sc-nav-label { font-size: 16px; }
          .sc-info-bar-wrap {
            top: calc(26vh + var(--i, 0) * 58px) !important;
            left: 54%;
            right: 2vw;
            height: 50px;
          }
          .sc-info-bar-text { font-size: 1.1rem; }
          .sc-info-bar-count { font-size: 1.3rem; margin-right: 12px; }
          .sc-back-button { padding: 6px 12px; font-size: 16px; }
        }
      `}</style>

      <div className="sc-root" role="navigation">
        {ITEMS.map((item, i) => (
          <div
            key={item.id}
            className={`sc-bar-outer${active === i ? " active" : ""}${mounted ? " mounted" : ""}`}
            onClick={() => {
              if (active === i) window.open(item.href, "_blank");
              else setActive(i);
            }}
            onMouseEnter={() => setActive(i)}
          >
            <div className="sc-bar-red" />
            <div className="sc-bar">
              <img className="sc-char" src={CHARS[i]} alt="" />
              <div className="sc-bar-fill" />
              <div className="sc-bar-shade" />
              <div className="sc-bar-content">
                <div className="sc-role">{ROLES[i].text}</div>
                <div className="sc-main">
                  <div className="sc-main-top" style={{ paddingRight: '90px' }}>
                    <div className="sc-icon" aria-hidden="true"><item.icon /></div>
                    <div className="sc-label">{item.label}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mounted && (
        <div className="sc-right-nav" key={active}>
          <span className="sc-nav-arrow left">◄</span>
          <span className="sc-nav-btn">LB</span>
          <span className="sc-nav-label">{ITEMS[active].label}</span>
          <span className="sc-nav-btn">RB</span>
          <span className="sc-nav-arrow right">►</span>
        </div>
      )}

      {mounted && ITEMS[active].details.map((detail, i) => (
        <div
          className={`sc-info-bar-wrap${activeInfoBar === i ? " selected" : ""}`}
          key={`bar-${active}-${i}`}
          style={{ top: `${118 + i * 66}px`, animationDelay: `${i * 50}ms`, "--i": i }}
          onClick={() => setActiveInfoBar(i)}
          onMouseEnter={() => setActiveInfoBar(i)}
        >
          <div className="sc-info-bar">
            {detail.icon && <span style={{ fontSize: '24px', marginLeft: '14px', marginRight: '8px' }}>{detail.icon}</span>}
            <span className="sc-info-bar-text" style={{ flex: '0 0 80px' }}>{detail.label}</span>
            <span className="sc-info-bar-count" style={{
              flex: 1,
              textAlign: 'right',
              marginRight: '20px',
              fontSize: detail.value.length > 18 ? '20px' : '26px'
            }}>
              {detail.value}
            </span>
          </div>
        </div>
      ))}

      {mounted && (
        <div className="sc-edit-wrap">
          <EditButton onClick={() => setEditing(true)} label="EDIT DETAILS" />
        </div>
      )}

      <EditModal
        open={editing}
        onClose={() => setEditing(false)}
        title={ITEMS[active].label}
        fields={[
          { key: "user", label: "Username", type: "text", maxLength: 40, placeholder: "@handle" },
          { key: "status", label: "Status", type: "text", maxLength: 24, placeholder: "Active" },
          { key: "url", label: "Profile link", type: "url", placeholder: "https://…" },
        ]}
        values={{ user: ITEMS[active].details[0].value, status: ITEMS[active].details[1].value, url: ITEMS[active].href }}
        onSave={saveSocial}
      />

      <button
        type="button"
        className={`sc-back-button${mounted ? " mounted" : ""}`}
        onClick={() => navigate('/')}
        aria-label="Back to main menu"
      >
        ← BACK TO MENU
      </button>

      <div className={`sc-footer${mounted ? " mounted" : ""}`}>
        <div className="sc-footer-row"><span className="sc-footer-key">↑↓</span><span>SELECT</span></div>
        <div className="sc-footer-row"><span className="sc-footer-key">↵</span><span>OPEN</span></div>
        <div className="sc-footer-row"><span className="sc-footer-key">ESC</span><span>BACK</span></div>
      </div>
    </div>
  );
}
