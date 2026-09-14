import { createElement, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContent } from "./useContent.js";
import EditModal, { EditButton } from "./EditModal.jsx";
import ListEditor from "./ListEditor.jsx";
import { FaScaleBalanced, FaGamepad, FaFilm, FaArrowLeft } from "react-icons/fa6";
import char1 from "./assets/char1.png";
import char2 from "./assets/char2.png";
import char3 from "./assets/char3.png";
import bgVideo from "./assets/main1.mp4";
import mainm from "./assets/mainm.jpeg";
import mainm2 from "./assets/mainm2.jpeg";
import mainf from "./assets/mainf.jpeg";

const CHARS = [char1, char2, char3];
const poster = (name) => `/about/posters/${name}.jpg`;
const pad2 = (n) => String(n + 1).padStart(2, "0");
const MAIN_IMAGES = [mainm, mainm2, mainf];

const REVEAL_CONTENT = [
  {
    eyebrow: "Profile",
    upper: [
      "I am Ahmed Fattouh, aka Dino. I am a calm and collected, stylish workaholic with a strong enthusiasm for visual novels, gaming, and anime.",
      "I love all of my friends and family and am strongly motivated and passionate about my work and everything I enjoy and do.",
      "I am also passionate about building a strong and successful future.",
    ],
    lower: "Focus: Lawyer",
    icon: FaScaleBalanced,
  },
  {
    eyebrow: "Top picks",
    upper: [
      { title: "Red Dead Redemption 2", meta: "2018 · Rockstar Games", poster: poster("rdr2"), alt: "Red Dead Redemption 2 cover art" },
      { title: "Fallout", meta: "1997 · Interplay", poster: poster("fallout"), alt: "Fallout cover art" },
      { title: "Persona Series", meta: "Atlus · since 1996", poster: poster("persona"), alt: "Persona 3 Reload box art" },
      { title: "Ace Attorney", meta: "2001 · Capcom", poster: poster("ace-attorney"), alt: "Phoenix Wright: Ace Attorney cover art" },
      { title: "Grand Theft Auto 5", meta: "2013 · Rockstar Games", poster: poster("gta5"), alt: "Grand Theft Auto V cover art" },
      { title: "Danganronpa", meta: "2010 · Spike", poster: poster("danganronpa"), alt: "Danganronpa: Trigger Happy Havoc cover art" },
      { title: "Umineko When They Cry", meta: "2007 · 07th Expansion", poster: poster("umineko"), alt: "Umineko When They Cry cover art" },
    ],
    lower: "FAVORITE GAMES",
    icon: FaGamepad,
  },
  {
    eyebrow: "Top picks",
    upper: [
      { title: "Dragon Ball Z", meta: "1989 · Toei Animation", poster: poster("dbz"), alt: "Dragon Ball Z season one cover" },
      { title: "Neon Genesis Evangelion", meta: "1995 · Gainax", poster: poster("evangelion"), alt: "Neon Genesis Evangelion poster" },
      { title: "Chainsaw Man", meta: "2022 · MAPPA", poster: poster("chainsaw-man"), alt: "Chainsaw Man cover art" },
      { title: "Serial Experiments Lain", meta: "1998 · Triangle Staff", poster: poster("lain"), alt: "Serial Experiments Lain DVD cover" },
      { title: "Steven Universe", meta: "2013 · Cartoon Network", poster: poster("steven-universe"), alt: "Steven Universe: The Movie poster" },
    ],
    lower: "FAVORITE ANIME / SERIES",
    icon: FaFilm,
  },
];

const ROLES = [{ text: "LEADER" }, { text: "PARTY" }, { text: "PARTY" }];
const ITEMS = [
  { id: "about", label: "ABOUT ME" },
  { id: "games", label: "FAVORITE GAMES" },
  { id: "anime", label: "ANIME / SERIES" },
];

export default function AboutMe() {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [focus, setFocus] = useState(0);
  const [editingBio, setEditingBio] = useState(false);
  const [editingList, setEditingList] = useState(false);
  const navigate = useNavigate();
  const { content, update } = useContent();
  const saveBio = async (values) => update((c) => ({
    ...c,
    about: {
      bio: values.bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      focus: values.focus.trim(),
    },
  }));

  const goTab = useCallback((idx) => { setActive(idx); setFocus(0); }, []);
  const prevTab = useCallback(() => { setActive(i => (i - 1 + ITEMS.length) % ITEMS.length); setFocus(0); }, []);
  const nextTab = useCallback(() => { setActive(i => (i + 1) % ITEMS.length); setFocus(0); }, []);
  const listLength = active === 1 ? content.about.games.length : active === 2 ? content.about.anime.length : 0;

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
      if (e.target.closest("button")) return;
      if (e.key === "ArrowUp") {
        if (revealed && listLength) setFocus(i => (i - 1 + listLength) % listLength);
        else if (!revealed) setActive(i => Math.max(0, i - 1));
      }
      if (e.key === "ArrowDown") {
        if (revealed && listLength) setFocus(i => (i + 1) % listLength);
        else if (!revealed) setActive(i => Math.min(ITEMS.length - 1, i + 1));
      }
      if (e.key === "Enter") setRevealed(true);
      if (e.key === "ArrowRight") {
        if (revealed) nextTab();
        else setRevealed(true);
      }
      if (e.key === "ArrowLeft") {
        if (revealed) prevTab();
        else navigate("/");
      }
      if (e.key === "Escape" || e.key === "Backspace") {
        if (revealed) setRevealed(false);
        else navigate("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, revealed, listLength, prevTab, nextTab]);

  const section = active === 0
    ? { ...REVEAL_CONTENT[0], upper: content.about.bio, lower: content.about.focus }
    : { ...REVEAL_CONTENT[active], upper: active === 1 ? content.about.games : content.about.anime };
  const listKey = active === 1 ? "games" : "anime";
  const saveList = async (values) => update((c) => ({
    ...c,
    about: {
      ...c.about,
      [listKey]: (values.items || [])
        .map((it) => ({ id: it.id, title: it.title.trim(), meta: (it.meta || "").trim(), poster: it.poster || "", showImage: !!it.showImage && !!it.poster }))
        .filter((it) => it.title),
    },
  }));
  const isBio = active === 0;
  const featured = isBio || section.upper.length === 0 ? null : section.upper[Math.min(focus, section.upper.length - 1)];
  const hasImage = (entry) => !!(entry && entry.showImage !== false && entry.poster);

  return (
    <div id="menu-screen">
      <video src={bgVideo} autoPlay loop muted playsInline />
      {revealed && <div className="am-dim" />}

      {revealed && (
        <div className={`am-reveal-stage${mounted ? " mounted" : ""}`}>
          <div className="am-reveal-frame">
          <div className="am-right-nav" aria-label="Switch section">
            <button type="button" className="am-nav-arrow left" onClick={prevTab} aria-label="Previous section">◄</button>
            <span className="am-nav-btn">LB</span>
            <span className="am-nav-dot" />
            <span className="am-nav-btn">RB</span>
            <button type="button" className="am-nav-arrow right" onClick={nextTab} aria-label="Next section">►</button>
          </div>
          <div className="am-reveal-backplate" aria-hidden="true" />
          <section className="am-reveal-panel" aria-label={section.lower}>
            <header className="am-reveal-head">
              <div className="am-reveal-title-block">
                <span className="am-reveal-eyebrow">{section.eyebrow}</span>
                <h2 className="am-reveal-title" key={`title-${active}`}>{ITEMS[active].label}</h2>
              </div>
              <div className="am-tab-navigation" role="tablist" aria-label="Sections">
                {ITEMS.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === active}
                    onClick={() => goTab(idx)}
                    className={`am-tab-button${idx === active ? ' active' : ''}`}
                  >
                    <span className="am-tab-index">{String(idx + 1).padStart(2, "0")}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </header>

            <div className={`am-reveal-upper-bar ${isBio ? "am-bio-content" : "am-favorites-content"}`} key={`body-${active}`}>
              {isBio
                ? section.upper.map((line) => (
                  <p className="am-reveal-upper-line" key={line}>{line}</p>
                ))
                : (
                  <div className="am-gallery">
                    <ol className="am-reveal-list" aria-label={section.lower}>
                      {section.upper.length === 0 && <li className="am-list-empty">Nothing here yet.</li>}
                      {section.upper.map((entry, idx) => (
                        <li key={entry.id || `${entry.title}-${idx}`}>
                          <button
                            type="button"
                            className={`am-reveal-upper-line${idx === focus ? " focused" : ""}`}
                            aria-pressed={idx === focus}
                            onMouseEnter={() => setFocus(idx)}
                            onFocus={() => setFocus(idx)}
                            onClick={() => setFocus(idx)}
                          >
                            <span className="am-reveal-num">{pad2(idx)}</span>
                            {hasImage(entry)
                              ? <img className="am-reveal-thumb" src={entry.poster} alt="" loading="lazy" />
                              : <span className="am-reveal-thumb am-noimg" aria-hidden="true">{createElement(section.icon)}</span>}
                            <span className="am-reveal-text">
                              <span className="am-reveal-title-line">{entry.title}</span>
                              <span className="am-reveal-meta">{entry.meta}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>

                    {featured && (
                      <figure className="am-spotlight" key={`spot-${active}-${focus}`}>
                        <div className="am-spotlight-backplate" aria-hidden="true" />
                        <div className="am-spotlight-frame">
                          {hasImage(featured) ? (
                            <>
                              <img className="am-spotlight-bg" src={featured.poster} alt="" aria-hidden="true" />
                              <img className="am-spotlight-img" src={featured.poster} alt={featured.alt || featured.title} />
                            </>
                          ) : (
                            <div className="am-spotlight-empty" aria-hidden="true">
                              {createElement(section.icon)}
                              <span>NO IMAGE</span>
                            </div>
                          )}
                          <span className="am-spotlight-badge">{pad2(Math.min(focus, section.upper.length - 1))}</span>
                        </div>
                        <figcaption className="am-spotlight-caption">
                          <span className="am-spotlight-title">{featured.title}</span>
                          <span className="am-spotlight-meta">{featured.meta}</span>
                        </figcaption>
                      </figure>
                    )}
                  </div>
                )}
            </div>

            <footer className="am-reveal-lower-bar" key={`foot-${active}`}>
              <span className="am-reveal-lower-icon" aria-hidden="true">
                {createElement(section.icon)}
              </span>
              <span className="am-reveal-lower-text">{section.lower}</span>
              {isBio && <EditButton onClick={() => setEditingBio(true)} />}
              {!isBio && <EditButton onClick={() => setEditingList(true)} label="EDIT LIST" />}
              {featured && (
                <span className="am-reveal-counter" aria-label={`Item ${focus + 1} of ${section.upper.length}`}>
                  <span className="am-reveal-counter-cur">{pad2(focus)}</span>
                  <span className="am-reveal-counter-sep">/</span>
                  <span>{pad2(section.upper.length - 1)}</span>
                </span>
              )}
            </footer>
          </section>
          </div>

          <div className={`am-main-portrait-shell${mounted ? " mounted" : ""}`}>
            <img className="am-main-portrait-bg" src={MAIN_IMAGES[active]} alt="" aria-hidden="true" />
            <span className="am-cutin-lines" aria-hidden="true" />
            <span className="am-cutin-red" aria-hidden="true" />
            <img
              key={active}
              className="am-main-portrait"
              src={MAIN_IMAGES[active]}
              alt=""
            />
            <div className="am-cutin-label" aria-hidden="true">
              <span className="am-cutin-num">{pad2(active)}</span>
              <span className="am-cutin-text">{ITEMS[active].label}</span>
            </div>
          </div>
        </div>
      )}

      <EditModal
        open={editingList}
        wide
        onClose={() => setEditingList(false)}
        title={section.lower}
        values={{ items: isBio ? [] : section.upper.map((it, i) => ({ id: it.id || `e-${i}`, title: it.title, meta: it.meta || "", poster: it.poster || "", showImage: it.showImage !== false && !!it.poster })) }}
        custom={(draft, setDraft) => <ListEditor draft={draft} setDraft={setDraft} placeholderIcon={createElement(section.icon)} />}
        onSave={saveList}
      />

      <EditModal
        open={editingBio}
        onClose={() => setEditingBio(false)}
        title="ABOUT ME"
        fields={[
          { key: "bio", label: "About text (blank line between paragraphs)", type: "textarea" },
          { key: "focus", label: "Bottom line", type: "text", maxLength: 40, placeholder: "Focus: Lawyer" },
        ]}
        values={{ bio: content.about.bio.join("\n\n"), focus: content.about.focus }}
        onSave={saveBio}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;1,700&display=swap');

        .am-root {
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 6px;
          padding-left: 0;
        }

        /* ── Dim layer behind the reveal ── */
        .am-dim {
          position: absolute;
          inset: 0;
          z-index: 12;
          background:
            radial-gradient(120% 90% at 20% 50%, rgba(6, 12, 46, 0.78) 0%, rgba(10, 18, 60, 0.55) 55%, rgba(20, 30, 70, 0.35) 100%);
          pointer-events: none;
          animation: am-dim-in 0.32s ease-out;
        }
        @keyframes am-dim-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Reveal stage: everything sits on a straight x-axis ── */
        .am-reveal-stage {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 20;
          pointer-events: none;
        }

        @keyframes am-reveal-bar-in {
          0%   { opacity: 0; transform: translateX(-90px) skewX(-8deg); }
          60%  { opacity: 1; transform: translateX(10px) skewX(-2deg); }
          100% { opacity: 1; transform: translateX(0) skewX(0); }
        }
        @keyframes am-backplate-in {
          0%   { opacity: 0; transform: translate(-70px, 14px) skewX(-8deg); }
          100% { opacity: 1; transform: translate(14px, 14px) skewX(0); }
        }
        @keyframes am-content-in {
          0%   { opacity: 0; transform: translateX(-14px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes am-title-in {
          0%   { opacity: 0; transform: translateX(-24px) skewX(-10deg); letter-spacing: 8px; }
          100% { opacity: 1; transform: translateX(0) skewX(-6deg); letter-spacing: 3px; }
        }

        .am-reveal-frame {
          position: absolute;
          top: 50%;
          left: 3vw;
          width: 60vw;
          max-height: 78vh;
          transform: translateY(-50%);
          display: flex;
        }
        .am-reveal-backplate,
        .am-reveal-panel {
          clip-path: polygon(0 0, 100% 0, calc(100% - 64px) 100%, 0 100%);
        }
        .am-reveal-backplate {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, var(--p3-red-accent) 0%, #8f0014 100%);
          transform: translate(14px, 14px);
          opacity: 0;
          z-index: 0;
        }
        .am-reveal-stage.mounted .am-reveal-backplate {
          animation: am-backplate-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.04s both;
        }

        .am-reveal-panel {
          position: relative;
          flex: 1;
          min-width: 0;
          min-height: 46vh;
          max-height: 78vh;
          z-index: 1;
          pointer-events: auto;
          background: var(--p3-bg-panel);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 22px 88px 22px 30px;
          opacity: 0;
        }
        .am-reveal-stage.mounted .am-reveal-panel {
          animation: am-reveal-bar-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        /* thin cyan rail on the left, red band on top: the P3 status-card language */
        .am-reveal-panel::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(90deg, var(--p3-red-accent) 0%, #ff4b5c 70%, rgba(255,75,92,0) 100%);
        }
        .am-reveal-panel::after {
          content: "";
          position: absolute;
          top: 6px; bottom: 0; left: 0;
          width: 4px;
          background: linear-gradient(180deg, var(--p3-blue-light) 0%, rgba(141,246,255,0.15) 100%);
        }

        /* ── Header: title + tabs ── */
        .am-reveal-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(141, 246, 255, 0.22);
        }
        .am-reveal-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .am-reveal-eyebrow {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--p3-blue-light);
        }
        .am-reveal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-weight: 400;
          font-size: clamp(38px, 4.4vw, 64px);
          line-height: 0.95;
          letter-spacing: 3px;
          color: #fff;
          transform: skewX(-6deg);
          transform-origin: left bottom;
          text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.55);
          white-space: nowrap;
          animation: am-title-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .am-tab-navigation {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .am-tab-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.55);
          color: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(141, 246, 255, 0.28);
          clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
          padding: 8px 18px;
          min-height: 38px;
        }
        .am-tab-index {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 1px;
          color: var(--p3-blue-light);
          opacity: 0.85;
        }
        .am-tab-button:hover {
          background: rgba(141, 246, 255, 0.16);
          color: #fff;
          transform: translateY(-2px);
        }
        .am-tab-button.active {
          background: var(--p3-blue-light);
          color: var(--p3-text-on-light);
          border-color: var(--p3-blue-light);
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
        }
        .am-tab-button.active .am-tab-index { color: var(--p3-text-on-light); }

        /* ── Body ── */
        .am-reveal-upper-bar {
          flex: 1 1 auto;
          min-height: 160px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #8df6ff rgba(0,0,0,0.4);
          background: rgba(0, 0, 0, 0.62);
          clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
          padding: 22px 42px 22px 26px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          color: #fff;
          animation: am-content-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .am-bio-content { justify-content: center; padding-top: 28px; padding-bottom: 28px; }
        .am-bio-content .am-reveal-upper-line {
          font-family: 'NewRodin Pro', sans-serif;
          font-weight: 400;
          font-size: clamp(16px, 1.2vw, 20px);
          line-height: 1.65;
          max-width: 60ch;
          color: rgba(255, 255, 255, 0.9);
        }
        .am-bio-content .am-reveal-upper-line:first-child {
          font-weight: 500;
          font-size: clamp(18px, 1.45vw, 24px);
          color: #fff;
        }

        /* ── Gallery: list on the left, spotlight poster on the right ── */
        .am-favorites-content { padding: 18px 34px 18px 22px; }
        .am-gallery {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 22px;
          align-items: stretch;
        }
        .am-reveal-list {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 18px;
          row-gap: 2px;
          align-content: start;
        }
        .am-favorites-content .am-reveal-upper-line {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px 6px 6px;
          background: transparent;
          border: 0;
          border-bottom: 1px solid rgba(141, 246, 255, 0.18);
          color: rgba(255, 255, 255, 0.86);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: clamp(16px, 1.3vw, 22px);
          letter-spacing: 0.4px;
          line-height: 1.15;
          text-align: left;
          cursor: pointer;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .am-favorites-content .am-reveal-upper-line:hover { color: #fff; background: rgba(141, 246, 255, 0.08); }
        .am-favorites-content .am-reveal-upper-line.focused {
          background: var(--p3-blue-light);
          color: var(--p3-text-on-light);
          border-bottom-color: var(--p3-blue-light);
          transform: translateX(4px);
        }
        .am-reveal-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.9em;
          letter-spacing: 1px;
          color: var(--p3-blue-light);
          min-width: 22px;
          flex-shrink: 0;
        }
        .am-reveal-upper-line.focused .am-reveal-num { color: var(--p3-text-on-light); }
        .am-reveal-thumb {
          width: 30px;
          height: 40px;
          object-fit: cover;
          flex-shrink: 0;
          clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.6);
          background: #000;
        }
        .am-noimg {
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(141, 246, 255, 0.12); color: var(--p3-blue-light); font-size: 14px;
        }
        .am-list-empty { padding: 10px 6px; color: rgba(255,255,255,0.6); font-style: italic; }
        .am-spotlight-empty {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
          color: rgba(141, 246, 255, 0.85);
          font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px;
          background: repeating-linear-gradient(-45deg, rgba(141,246,255,0.07) 0 8px, transparent 8px 16px);
        }
        .am-spotlight-empty svg { font-size: 34px; }
        .am-main-portrait-bg { display: none; }
        .am-cutin-label, .am-cutin-lines, .am-cutin-red { display: none; }
        .am-reveal-text { display: flex; flex-direction: column; min-width: 0; }
        .am-reveal-title-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .am-reveal-meta {
          font-family: 'NewRodin Pro', sans-serif;
          font-weight: 400;
          font-size: 11px;
          letter-spacing: 0.3px;
          opacity: 0.6;
        }

        @keyframes am-spot-in {
          0%   { opacity: 0; transform: translateX(22px) skewX(-8deg); }
          100% { opacity: 1; transform: translateX(0) skewX(0); }
        }
        .am-spotlight {
          position: relative;
          width: clamp(150px, 15vw, 210px);
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-self: start;
          animation: am-spot-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .am-spotlight-backplate {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          aspect-ratio: 2 / 3;
          background: var(--p3-red-accent);
          transform: translate(8px, 8px);
          clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
          z-index: 0;
        }
        .am-spotlight-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          overflow: hidden;
          background: #05081c;
          clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
          z-index: 1;
        }
        .am-spotlight-bg {
          position: absolute;
          inset: -12%;
          width: 124%;
          height: 124%;
          object-fit: cover;
          filter: blur(14px) saturate(1.4) brightness(0.55);
        }
        .am-spotlight-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.6));
        }
        /* P3 halftone scanline sheen over the poster */
        .am-spotlight-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(141,246,255,0.14) 0%, rgba(141,246,255,0) 26%),
            repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.12) 3px 4px);
          pointer-events: none;
          mix-blend-mode: multiply;
        }
        .am-spotlight-badge {
          position: absolute;
          top: 0; left: 0;
          padding: 3px 12px 2px 8px;
          background: var(--p3-blue-light);
          color: var(--p3-text-on-light);
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 1px;
          clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          z-index: 2;
        }
        .am-spotlight-caption {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 10px;
          border-left: 3px solid var(--p3-blue-light);
        }
        .am-spotlight-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(18px, 1.5vw, 24px);
          letter-spacing: 1.5px;
          line-height: 1;
          color: #fff;
        }
        .am-spotlight-meta {
          font-family: 'NewRodin Pro', sans-serif;
          font-size: 11px;
          letter-spacing: 0.4px;
          color: rgba(255, 255, 255, 0.65);
        }

        /* ── Footer strip ── */
        .am-reveal-lower-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          min-height: 68px;
          padding: 8px 20px 8px 20px;
          background: rgba(0, 0, 0, 0.78);
          clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
          border-left: 3px solid var(--p3-red-accent);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: clamp(20px, 1.7vw, 28px);
          letter-spacing: 1px;
          animation: am-content-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
        }
        .am-reveal-lower-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          color: #111;
          background: var(--p3-blue-light);
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .am-reveal-lower-icon > svg { width: 22px; height: 22px; }
        .am-reveal-lower-text { flex: 1; min-width: 0; }
        .am-reveal-counter {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.5);
        }
        .am-reveal-counter-cur { font-size: 30px; color: var(--p3-blue-light); }
        .am-reveal-counter-sep { color: var(--p3-red-accent); }

        /* ── LB / RB switcher (straight, top-left above the panel) ── */
        @keyframes am-right-nav-pop {
          0%   { opacity: 0; transform: scale(0.55) translateY(-10px); }
          65%  { opacity: 1; transform: scale(1.1) translateY(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes am-arrow-left {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(-5px); opacity: 0.4; }
        }
        @keyframes am-arrow-right {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(5px); opacity: 0.4; }
        }
        .am-right-nav {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: auto;
          z-index: 2;
          transform-origin: left bottom;
          animation: am-right-nav-pop 0.38s cubic-bezier(0.22,1,0.36,1) both;
        }
        .am-right-nav .am-nav-btn {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 56px;
          letter-spacing: 3px;
          line-height: 1;
          user-select: none;
          color: #fff;
          -webkit-text-stroke: 2px #000;
          paint-order: stroke fill;
          background: none;
          border: none;
          padding: 0 4px;
        }
        .am-right-nav .am-nav-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: var(--p3-blue-light);
          margin: 0 8px;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px #000;
        }
        .am-right-nav .am-nav-arrow {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #ff3b52;
          background: none;
          border: none;
          padding: 4px 6px;
          cursor: pointer;
          display: inline-block;
          user-select: none;
        }
        .am-right-nav .am-nav-arrow.left  { animation: am-arrow-left  0.8s ease-in-out infinite; }
        .am-right-nav .am-nav-arrow.right { animation: am-arrow-right 0.8s ease-in-out infinite; }
        .am-right-nav .am-nav-arrow:hover { color: #fff; }

        /* ── Portrait (kept as the skewed P3 cut-in) ── */
        @keyframes am-portrait-in {
          0%   { opacity: 0; transform: translateX(78px) skewX(-8deg) scale(0.94); filter: blur(8px); }
          55%  { opacity: 0.9; transform: translateX(-8px) skewX(-8deg) scale(1.015); filter: blur(0); }
          100% { opacity: 0.96; transform: translateX(0) skewX(-8deg) scale(1); filter: blur(0); }
        }
        .am-main-portrait-shell {
          position: absolute;
          top: 0;
          right: -10vw;
          z-index: 50;
          pointer-events: none;
          width: 42vw;
          height: 100vh;
          overflow: hidden;
          opacity: 0;
          transform: translateX(24px) skewX(-8deg) scale(0.98);
          transition: opacity 0.35s ease, transform 0.35s ease;
          box-shadow: -14px 0 0 var(--p3-red-accent), -22px 0 0 rgba(255,255,255,0.12);
        }
        .am-main-portrait-shell.mounted {
          opacity: 0.96;
          transform: translateX(0) skewX(-8deg) scale(1);
          animation: am-portrait-in 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .am-main-portrait {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top right;
          transform: skewX(8deg) scale(1.08) translateY(-40px);
          transform-origin: top right;
        }

        /* ── Menu bars (unchanged Persona party list) ── */
        .am-bar {
          position: relative;
          width: 45vw;
          height: 64px;
          transition: height 0.3s cubic-bezier(0.22,1,0.36,1);
          background: #111;
          cursor: pointer;
          pointer-events: all;
          clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
          box-shadow: 0 6px 24px rgba(0,0,0,0.65);
          z-index: 1;
        }
        .am-bar-outer {
          position: relative;
          flex-shrink: 0;
          transform: translateX(-100%);
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .am-bar-outer.active .am-bar     { height: 90px; }
        .am-bar-outer.active .am-bar-red { height: 90px; }
        .am-bar-outer.mounted { transform: translateX(0); }
        .am-root.tucked .am-bar-outer { transform: translateX(-100%); pointer-events: none; }
        .am-bar-outer:nth-child(1) { transition-delay: 0ms; }
        .am-bar-outer:nth-child(2) { transition-delay: 80ms; }
        .am-bar-outer:nth-child(3) { transition-delay: 160ms; }

        .am-bar-red {
          position: absolute;
          top: 0; left: 0;
          width: 45vw;
          height: 64px;
          background: #c4001a;
          clip-path: polygon(50% 0, 100% 0, 100% 100%, calc(50% - 10px) 100%);
          transform: translateY(-7px);
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 0;
          pointer-events: none;
        }
        .am-bar-outer.active .am-bar-red { opacity: 1; }

        .am-bar-fill {
          position: absolute;
          inset: 0;
          width: 100%;
          background: #ffffff;
          clip-path: polygon(100% 0, 100% 0, calc(100% - 32px) 100%, calc(100% - 32px) 100%);
          transition: clip-path 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 0;
        }
        .am-bar-outer.active .am-bar-fill {
          clip-path: polygon(22% 0, 100% 0, calc(100% - 14px) 100%, calc(22% + 138px) 100%);
        }

        .am-bar-shade {
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
        .am-bar-outer.active .am-bar-shade { opacity: 1; }

        .am-bar::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%);
          z-index: 10;
          pointer-events: none;
        }

        .am-bar-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px 0 20px;
        }
        .am-role {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          font-family: 'Anton', sans-serif;
          font-size: 50px;
          letter-spacing: -2px;
          color: #ffffff;
          transform: rotate(-30deg);
          user-select: none;
          line-height: 1;
          padding: 0 16px 0 8px;
        }
        .am-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding-left: 78px;
        }
        .am-main-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .am-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 4px;
          line-height: 1;
          color: rgba(255,255,255,0.85);
          transition: color 0.2s ease;
          user-select: none;
        }
        .am-bar-outer.active .am-label { color: #111111; }
        .am-interest-icon { color: #8df6ff; font-size: 24px; display: flex; }
        .am-bar-outer.active .am-interest-icon { color: #111; }

        .am-char {
          position: absolute;
          top: 0;
          left: 110px;
          height: 100%;
          width: auto;
          max-width: 160px;
          object-fit: cover;
          object-position: left top;
          pointer-events: none;
          z-index: 3;
          clip-path: polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%);
        }

        /* ── Footer hints + back control ── */
        .am-footer {
          position: fixed;
          bottom: 20px; right: 28px;
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 5px;
          font-family: 'Bebas Neue', sans-serif;
          z-index: 14;
          opacity: 0;
          transition: opacity 0.4s ease 0.6s;
        }
        .am-footer.mounted { opacity: 1; }
        .am-footer-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; letter-spacing: 2px;
          color: rgba(255,255,255,0.45);
        }
        .am-footer-key {
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 3px;
          padding: 1px 6px; font-size: 11px;
        }
        .am-back-control {
          position: fixed; left: 24px; bottom: 22px; z-index: 70;
          display: flex; align-items: center; gap: 10px; min-height: 44px;
          padding: 8px 18px; background: #111; color: #8df6ff;
          border: 1px solid #8df6ff; cursor: pointer;
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          font: 22px 'Bebas Neue', sans-serif;
          letter-spacing: 2px;
        }
        .am-back-control:hover { background: #8df6ff; color: #111; }
        .am-back-control:focus-visible,
        .am-tab-button:focus-visible,
        .am-reveal-upper-line:focus-visible,
        .am-nav-arrow:focus-visible { outline: 3px solid #fff; outline-offset: -4px; }

        @media (max-width: 1100px) {
          .am-reveal-frame { width: 66vw; }
          .am-reveal-head { flex-direction: column; align-items: flex-start; }
          .am-reveal-list { grid-template-columns: 1fr; }
          .am-spotlight { width: 150px; }
        }
        @media (max-width: 720px) {
          .am-bar, .am-bar-red { width: 94vw; }
          .am-main { padding-left: 24px; }
          .am-role { font-size: 32px; }
          .am-char { left: 72px; max-width: 105px; }
          .am-label { font-size: 22px; letter-spacing: 1px; }
          .am-reveal-frame { left: 2vw; width: 90vw; max-height: 80vh; }
          .am-reveal-panel { min-height: 40vh; max-height: 80vh; }
          .am-reveal-backplate, .am-reveal-panel {
            clip-path: polygon(0 0, 100% 0, calc(100% - 28px) 100%, 0 100%);
          }
          .am-reveal-panel { padding: 16px 40px 16px 16px; gap: 10px; }
          .am-tab-navigation { gap: 4px; flex-wrap: wrap; }
          .am-tab-button { font-size: 12px; padding: 6px 10px; min-height: 32px; }
          .am-reveal-upper-bar { padding: 14px 22px 14px 14px; }
          .am-reveal-lower-bar { gap: 10px; font-size: 18px; padding: 8px 12px; min-height: 56px; }
          .am-favorites-content { padding: 12px 20px 12px 12px; }
          .am-gallery { grid-template-columns: 1fr; gap: 14px; }
          .am-spotlight { width: 100%; flex-direction: row; align-items: flex-end; gap: 12px; }
          .am-spotlight-backplate, .am-spotlight-frame { width: 96px; aspect-ratio: 2 / 3; }
          .am-spotlight-caption { padding-bottom: 6px; }
          .am-favorites-content .am-reveal-upper-line { font-size: 16px; }
          .am-right-nav .am-nav-btn { font-size: 40px; }
        }
        /* Portrait phones: a simple top-to-bottom column — character banner, then the panel.
           Nothing is absolutely positioned here, so nothing can overlap. */
        @media (max-width: 720px) {
          .am-right-nav { display: none; }
          .am-reveal-stage {
            display: flex;
            flex-direction: column;
            /* leave room for the fixed BACK button so the panel never sits under it */
            padding-bottom: calc(78px + env(safe-area-inset-bottom, 0px));
          }
          /* P3R-style cut-in: the character's own colour splashed across the band,
             white + red slashes, the face in a slanted card, the tab name as a big label. */
          .am-main-portrait-shell,
          .am-main-portrait-shell.mounted {
            position: relative;
            order: 0;
            flex: 0 0 38%;
            overflow: hidden;
            background: transparent;
            width: 100%;
            height: auto;
            top: auto; right: auto; left: auto;
            opacity: 1;
            transform: none;
            animation: none;
            box-shadow: none;
            z-index: 1;
          }
          /* the live theme video shows through the band; no blurred copy */
          .am-main-portrait-bg { display: none; }
          #menu-screen > video { object-position: 75% 50%; }
          .am-dim { background: linear-gradient(180deg, rgba(3, 8, 40, 0.12) 0%, rgba(3, 8, 40, 0.3) 40%, rgba(3, 8, 40, 0.6) 100%); }
          .am-main-portrait-shell::before {
            content: ""; position: absolute; z-index: 1;
            left: -12%; right: -12%; top: 60%; height: 13%;
            background: #fff; transform: rotate(-11deg);
          }
          .am-main-portrait-shell::after {
            content: ""; position: absolute; z-index: 1;
            left: -12%; right: -12%; top: 76%; height: 4%;
            background: var(--p3-red-accent); transform: rotate(-11deg);
          }
          /* layered backing cards behind the face, like the game's cut-ins */
          .am-cutin-lines, .am-cutin-red {
            display: block; position: absolute;
            width: 60vw; height: 94%;
            clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
            animation: am-cutin-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .am-cutin-lines {
            z-index: 1; right: 2vw; top: 9%;
            background: repeating-linear-gradient(-32deg, var(--p3-red-accent) 0 5px, transparent 5px 16px);
            opacity: 0.9;
            animation-delay: 0.08s;
          }
          .am-cutin-red {
            z-index: 1; right: -1vw; top: 6%;
            background: var(--p3-red-accent);
            animation-delay: 0.04s;
          }
          .am-main-portrait {
            position: absolute; z-index: 2;
            right: -4vw; top: 3%;
            width: 60vw; height: 94%;
            object-fit: cover; object-position: center 18%;
            transform: none;
            clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
            filter: drop-shadow(-8px 8px 0 rgba(0, 0, 0, 0.75));
            animation: am-cutin-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes am-cutin-in {
            0%   { opacity: 0; transform: translateX(40px) skewX(-8deg); }
            100% { opacity: 1; transform: translateX(0) skewX(0); }
          }
          .am-cutin-label {
            display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
            position: absolute; z-index: 3; left: 4vw; bottom: 9%;
          }
          .am-cutin-num {
            font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 4px;
            color: #fff; background: #000; padding: 2px 10px 1px;
            clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          }
          .am-cutin-text {
            font-family: 'Bebas Neue', sans-serif; font-size: clamp(34px, 10vw, 44px);
            line-height: 0.95; letter-spacing: 2px; color: #fff;
            transform: skewX(-8deg); transform-origin: left bottom;
            text-shadow: 3px 3px 0 #000, 6px 6px 0 var(--p3-red-accent);
            max-width: 46vw;
          }
          /* the panel's own title is redundant under the cut-in */
          .am-reveal-eyebrow, .am-reveal-title { display: none; }
          .am-reveal-head { padding-bottom: 6px; }
          .am-reveal-frame {
            position: relative;
            order: 1;
            flex: 1 1 auto;
            min-height: 0;
            top: auto; left: auto; bottom: auto;
            transform: none;
            width: auto;
            max-height: none;
            margin: -10px 2vw 0;
            z-index: 2;
          }
          .am-reveal-panel { flex: 1 1 auto; min-height: 0; max-height: none; padding: 12px 30px 12px 14px; gap: 10px; }
          .am-reveal-head { flex-direction: column; align-items: flex-start; gap: 8px; padding-bottom: 8px; }
          .am-reveal-eyebrow { display: none; }
          .am-reveal-title { font-size: 30px; letter-spacing: 2px; }
          .am-tab-navigation { gap: 6px; }
          .am-tab-button { font-size: 12px; padding: 6px 10px; min-height: 40px; }
          .am-reveal-upper-bar { min-height: 0; }
          .am-bio-content { padding: 12px 14px; }
          .am-bio-content .am-reveal-upper-line { font-size: 15px; line-height: 1.5; }
          .am-bio-content .am-reveal-upper-line:first-child { font-size: 16px; }
          .am-favorites-content { padding: 12px 14px; }
          .am-gallery { grid-template-columns: 1fr; gap: 12px; }
          .am-spotlight { order: -1; width: 100%; flex-direction: row; align-items: flex-start; gap: 14px; }
          .am-spotlight-frame { flex: 0 0 40vw; width: 40vw; aspect-ratio: 2 / 3; }
          .am-spotlight-backplate { width: 40vw; height: auto; aspect-ratio: 2 / 3; }
          .am-spotlight-caption { padding-top: 6px; padding-bottom: 0; }
          .am-spotlight-title { font-size: 20px; }
          .am-reveal-list { grid-template-columns: 1fr; }
          .am-favorites-content .am-reveal-upper-line { font-size: 16px; padding: 6px 8px; min-height: 44px; }
          .am-reveal-thumb { width: 30px; height: 40px; }
          .am-reveal-lower-bar { min-height: 46px; font-size: 16px; }
          .am-reveal-lower-icon { width: 34px; height: 34px; }
          .am-reveal-lower-icon > svg { width: 18px; height: 18px; }
        }
        /* Phones held sideways: very little height, so compress the panel and let it scroll. */
        @media (max-height: 520px) {
          .am-right-nav { display: none; }
          .am-reveal-frame { top: 50%; left: 2vw; width: 64vw; max-height: 92vh; }
          .am-reveal-panel { min-height: 0; max-height: 92vh; padding: 10px 40px 10px 14px; gap: 8px; }
          .am-reveal-head { flex-direction: row; align-items: center; padding-bottom: 6px; gap: 10px; }
          .am-reveal-eyebrow { display: none; }
          .am-reveal-title { font-size: 26px; letter-spacing: 2px; }
          .am-tab-button { font-size: 11px; padding: 4px 8px; min-height: 30px; gap: 4px; }
          .am-reveal-upper-bar { min-height: 0; padding: 10px 16px; gap: 8px; }
          .am-bio-content { padding-top: 10px; padding-bottom: 10px; }
          .am-bio-content .am-reveal-upper-line { font-size: 13px; line-height: 1.4; }
          .am-bio-content .am-reveal-upper-line:first-child { font-size: 14px; }
          .am-favorites-content { padding: 8px 14px; }
          .am-gallery { grid-template-columns: minmax(0, 1fr) 96px; gap: 10px; }
          .am-reveal-list { grid-template-columns: 1fr; }
          .am-favorites-content .am-reveal-upper-line { font-size: 14px; padding: 4px 6px; gap: 6px; }
          .am-reveal-thumb { width: 22px; height: 30px; }
          .am-reveal-meta { display: none; }
          .am-spotlight { width: 96px; gap: 4px; }
          .am-spotlight-caption { display: none; }
          .am-reveal-lower-bar { min-height: 40px; font-size: 15px; padding: 4px 12px; }
          .am-reveal-lower-icon { width: 30px; height: 30px; }
          .am-reveal-lower-icon > svg { width: 16px; height: 16px; }
          .am-main-portrait-shell { right: -14vw; width: 44vw; }
          .am-bar { height: 48px; }
          .am-bar-outer.active .am-bar, .am-bar-outer.active .am-bar-red { height: 60px; }
          .am-root { gap: 4px; }
          .am-role { font-size: 28px; }
          .am-label { font-size: 20px; letter-spacing: 2px; }
          .am-char { max-width: 100px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .am-reveal-stage.mounted .am-reveal-panel,
          .am-reveal-stage.mounted .am-reveal-backplate,
          .am-main-portrait-shell.mounted,
          .am-dim, .am-right-nav, .am-nav-arrow,
          .am-reveal-title, .am-reveal-upper-bar, .am-reveal-lower-bar, .am-spotlight { animation: none !important; }
          .am-reveal-panel, .am-reveal-backplate { opacity: 1; }
          .am-bar-outer, .am-bar, .am-bar-fill, .am-tab-button, .am-reveal-upper-line { transition: none; }
        }
      `}</style>

      <div className={`am-root${revealed ? " tucked" : ""}`} role="navigation">
        {ITEMS.map((item, i) => (
          <div
            key={item.id}
            className={`am-bar-outer${active === i ? " active" : ""}${mounted ? " mounted" : ""}`}
          >
            <div className="am-bar-red" />
            <div
              className="am-bar"
              onClick={() => {
                setActive(i);
                setRevealed(true);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <img className="am-char" src={CHARS[i]} alt="" />
              <div className="am-bar-fill" />
              <div className="am-bar-shade" />
              <div className="am-bar-content">
                <div className="am-role">{ROLES[i].text}</div>
                <div className="am-main">
                  <div className="am-main-top">
                    <span className="am-interest-icon" aria-hidden="true">{createElement(REVEAL_CONTENT[i].icon)}</span>
                    <div className="am-label">{item.label}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="am-back-control" onClick={() => revealed ? setRevealed(false) : navigate("/")}>
        <FaArrowLeft aria-hidden="true" /> {revealed ? "BACK" : "MAIN MENU"}
      </button>
      <div className={`am-footer${mounted ? " mounted" : ""}`}>
        <div className="am-footer-row"><span className="am-footer-key">↑↓</span><span>SELECT</span></div>
        <div className="am-footer-row"><span className="am-footer-key">↵</span><span>REVEAL</span></div>
        <div className="am-footer-row"><span className="am-footer-key">◄ ►</span><span>{revealed ? "SWITCH" : "OPEN"}</span></div>
        <div className="am-footer-row"><span className="am-footer-key">ESC</span><span>BACK</span></div>
      </div>
    </div>
  );
}
