import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBackwardStep, FaForwardStep, FaPlay, FaPause, FaShuffle, FaRepeat, FaVolumeHigh, FaVolumeXmark, FaArrowLeft } from "react-icons/fa6";
import { useSoundtrack } from "./SoundtrackContext.js";

const BG_VIDEO = new URL("../music/music-bg.mp4", import.meta.url).href;
// The background shows one random 60-second slice from the middle half of the
// video and loops that same slice.
const CLIP_SECONDS = 60;
const pickClipStart = (duration) => {
  if (!Number.isFinite(duration) || duration <= CLIP_SECONDS) return 0;
  const lo = duration * 0.25;
  const hi = Math.max(lo, duration * 0.75 - CLIP_SECONDS);
  return lo + Math.random() * (hi - lo);
};
const ALBUM = "PERSONA 3 RELOAD · ORIGINAL SOUNDTRACK";

const pad2 = (n) => String(n).padStart(2, "0");
const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return "--:--";
  const m = Math.floor(s / 60);
  return `${m}:${pad2(Math.floor(s % 60))}`;
};

function Visualizer({ getAnalyser, isPlaying }) {
  const canvasRef = useRef(null);
  const [live, setLive] = useState(false);

  // Only build the audio graph after a real gesture on this page, so the
  // AudioContext is allowed to run. Until then the CSS fallback bars animate.
  useEffect(() => {
    const arm = () => { if (getAnalyser()) setLive(true); };
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, [getAnalyser]);

  useEffect(() => {
    if (!live) return undefined;
    const analyser = getAnalyser();
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const BARS = 28;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const gap = 4, bw = (w - gap * (BARS - 1)) / BARS;
      const usable = Math.floor(data.length * 0.75);
      for (let i = 0; i < BARS; i++) {
        const start = Math.floor((i / BARS) * usable);
        const end = Math.max(start + 1, Math.floor(((i + 1) / BARS) * usable));
        let sum = 0;
        for (let j = start; j < end; j++) sum += data[j];
        const v = sum / (end - start) / 255;
        const bh = Math.max(3, v * h);
        const x = i * (bw + gap);
        const skew = 6;
        ctx.beginPath();
        ctx.moveTo(x + skew, h - bh);
        ctx.lineTo(x + bw + skew, h - bh);
        ctx.lineTo(x + bw, h);
        ctx.lineTo(x, h);
        ctx.closePath();
        ctx.fillStyle = v > 0.7 ? "#ffffff" : i % 2 ? "#8df6ff" : "#5fd9ea";
        ctx.fill();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [live, getAnalyser]);

  if (live) return <canvas ref={canvasRef} className="mu-viz" aria-hidden="true" />;
  return (
    <div className={`mu-viz mu-viz-fallback${isPlaying ? " playing" : ""}`} aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${(i * 137) % 900}ms`, animationDuration: `${700 + (i * 53) % 500}ms` }} />
      ))}
    </div>
  );
}

export default function MusicPage() {
  const navigate = useNavigate();
  const player = useSoundtrack();
  const { tracks, current, isPlaying, currentTime, duration, volume, shuffle, repeat } = player;
  const [mounted, setMounted] = useState(false);
  // The highlighted row follows the playing track unless the listener moved it
  // (hover / arrow keys); a manual position is tagged with the track it was set
  // under so it expires by itself when the track changes.
  const [manualCursor, setManualCursor] = useState(null);
  const [durations, setDurations] = useState({});
  const [lastVolume, setLastVolume] = useState(1);
  const progressRef = useRef(null);
  const videoRef = useRef(null);
  const currentRowRef = useRef(null);
  const clipStartRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Background video: jump to a random point in the middle, then keep replaying
  // the same 60 seconds from there.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const onMeta = () => {
      if (clipStartRef.current === null) clipStartRef.current = pickClipStart(v.duration);
      v.currentTime = clipStartRef.current;
      v.play().catch(() => { });
    };
    const onTime = () => {
      const start = clipStartRef.current;
      if (start === null) return;
      if (v.currentTime >= start + CLIP_SECONDS || v.currentTime < start - 1) v.currentTime = start;
    };
    const onEnded = () => { v.currentTime = clipStartRef.current ?? 0; v.play().catch(() => { }); };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    if (v.readyState >= 1) onMeta();
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  // Track lengths for the list: read metadata for each file once.
  useEffect(() => {
    const probes = tracks.map((track) => {
      const a = new Audio();
      a.preload = "metadata";
      const onMeta = () => setDurations((d) => ({ ...d, [track.id]: a.duration }));
      a.addEventListener("loadedmetadata", onMeta);
      a.src = track.src;
      return () => { a.removeEventListener("loadedmetadata", onMeta); a.src = ""; };
    });
    return () => probes.forEach((off) => off());
  }, [tracks]);

  const currentIdx = current ? tracks.findIndex((t) => t.id === current.id) : -1;
  const cursor = manualCursor && manualCursor.forId === current?.id ? manualCursor.idx : Math.max(0, currentIdx);
  const setCursor = (idx) => setManualCursor({ forId: current?.id, idx });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " ") { e.preventDefault(); player.toggle(); return; }
      if (e.key === "Enter" && e.target?.closest?.("button, input")) return;
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((cursor - 1 + tracks.length) % tracks.length); }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((cursor + 1) % tracks.length); }
      if (e.key === "Enter") player.selectTrack(tracks[cursor]);
      if (e.key === "ArrowRight") player.seekBy(5);
      if (e.key === "ArrowLeft") player.seekBy(-5);
      if (e.key === "Escape" || e.key === "Backspace") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Keep the playing track visible in the scrollable list.
  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);

  const onProgressClick = (e) => {
    const el = progressRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    player.seek(ratio * duration);
  };

  const toggleMute = () => {
    if (volume > 0) { setLastVolume(volume); player.setVolume(0); }
    else player.setVolume(lastVolume || 1);
  };

  const progress = duration ? Math.min(1, currentTime / duration) : 0;

  return (
    <div id="menu-screen" className="mu-screen">
      <video ref={videoRef} src={BG_VIDEO} autoPlay muted playsInline preload="auto" />
      <div className="mu-dim" aria-hidden="true" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&display=swap');

        .mu-dim {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(3, 8, 40, 0.55) 0%, rgba(3, 8, 40, 0.15) 45%, rgba(3, 8, 40, 0.4) 100%);
        }

        /* ── Header ── */
        .mu-head {
          position: absolute;
          top: 5vh;
          left: 4vw;
          z-index: 12;
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.4s ease 0.1s, transform 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s;
        }
        .mu-head.mounted { opacity: 1; transform: translateX(0); }
        .mu-head-eyebrow {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 4px;
          color: var(--p3-blue-light);
        }
        .mu-head-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(56px, 7vw, 104px);
          line-height: 0.9;
          letter-spacing: 4px;
          color: #fff;
          transform: skewX(-8deg);
          text-shadow: 4px 4px 0 var(--p3-red-accent), 8px 8px 0 rgba(0,0,0,0.5);
        }

        /* ── Track list (left) ── */
        .mu-list {
          position: absolute;
          left: 0;
          top: 19vh;
          max-height: 66vh;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(141,246,255,0.6) transparent;
          padding: 10px 14px 10px 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 6px;
          list-style: none;
          width: min(46vw, 640px);
          mask-image: linear-gradient(180deg, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%);
          -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%);
        }
        .mu-list::-webkit-scrollbar { width: 6px; }
        .mu-list::-webkit-scrollbar-thumb { background: rgba(141,246,255,0.6); }
        .mu-track {
          position: relative;
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 0.4s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mu-track.mounted { opacity: 1; transform: translateX(0); }
        .mu-track { flex-shrink: 0; }
        .mu-track-red {
          position: absolute;
          top: -7px; left: 0;
          width: 100%;
          height: 100%;
          background: var(--p3-red-accent);
          clip-path: polygon(50% 0, 100% 0, 100% 100%, calc(50% - 10px) 100%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .mu-track.current .mu-track-red { opacity: 1; }
        .mu-track-btn {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 18px;
          height: 56px;
          padding: 0 34px 0 28px;
          background: #111;
          color: rgba(255,255,255,0.85);
          border: 0;
          cursor: pointer;
          text-align: left;
          clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
          box-shadow: 0 6px 24px rgba(0,0,0,0.65);
          transition: height 0.25s cubic-bezier(0.22,1,0.36,1), transform 0.2s ease, color 0.2s ease;
          overflow: hidden;
        }
        .mu-track-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: var(--p3-blue-light);
          clip-path: polygon(100% 0, 100% 0, calc(100% - 32px) 100%, calc(100% - 32px) 100%);
          transition: clip-path 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mu-track.cursor .mu-track-btn { transform: translateX(6px); }
        .mu-track.cursor .mu-track-btn::before,
        .mu-track.current .mu-track-btn::before {
          clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
        }
        .mu-track.current .mu-track-btn { height: 72px; color: #000; }
        .mu-track.cursor .mu-track-btn { color: #000; }
        .mu-track-btn > * { position: relative; }
        .mu-track-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 30px;
          letter-spacing: 1px;
          min-width: 34px;
          opacity: 0.6;
        }
        .mu-track-title {
          flex: 1;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(20px, 1.8vw, 28px);
          letter-spacing: 2.5px;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mu-track-len {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 18px;
          letter-spacing: 1px;
          opacity: 0.75;
        }
        .mu-track-eq {
          display: inline-flex;
          align-items: flex-end;
          gap: 2px;
          width: 18px;
          height: 16px;
          margin-right: 4px;
        }
        .mu-track-eq span {
          flex: 1;
          background: currentColor;
          height: 30%;
        }
        .mu-track.current.playing .mu-track-eq span { animation: mu-eq 0.7s ease-in-out infinite alternate; }
        .mu-track.current.playing .mu-track-eq span:nth-child(2) { animation-duration: 0.5s; }
        .mu-track.current.playing .mu-track-eq span:nth-child(3) { animation-duration: 0.9s; }
        @keyframes mu-eq { from { height: 20%; } to { height: 100%; } }

        /* ── Now playing (right) ── */
        @keyframes mu-panel-in {
          0%   { opacity: 0; transform: translateX(80px) skewX(-8deg); }
          60%  { opacity: 1; transform: translateX(-6px) skewX(-2deg); }
          100% { opacity: 1; transform: translateX(0) skewX(0); }
        }
        @keyframes mu-spin { to { transform: rotate(360deg); } }
        @keyframes mu-fallback { 0% { height: 12%; } 100% { height: 90%; } }

        .mu-stage {
          position: absolute;
          right: 4vw;
          top: 50%;
          transform: translateY(-50%);
          width: min(44vw, 660px);
          z-index: 11;
        }
        .mu-backplate, .mu-panel {
          clip-path: polygon(0 0, 100% 0, calc(100% - 48px) 100%, 0 100%);
        }
        .mu-backplate {
          position: absolute;
          inset: 0;
          background: var(--p3-red-accent);
          transform: translate(14px, 14px);
          opacity: 0;
          transition: opacity 0.3s ease 0.3s;
        }
        .mu-stage.mounted .mu-backplate { opacity: 1; }
        .mu-panel {
          position: relative;
          background: var(--p3-bg-panel);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 26px 78px 26px 30px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          opacity: 0;
        }
        .mu-stage.mounted .mu-panel { animation: mu-panel-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
        .mu-panel::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(90deg, var(--p3-red-accent) 0%, #ff4b5c 70%, transparent 100%);
        }
        .mu-panel::after {
          content: "";
          position: absolute;
          top: 6px; bottom: 0; left: 0;
          width: 4px;
          background: linear-gradient(180deg, var(--p3-blue-light) 0%, rgba(141,246,255,0.1) 100%);
        }

        .mu-now {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .mu-disc {
          position: relative;
          width: 128px;
          height: 128px;
          flex-shrink: 0;
          border-radius: 50%;
          background:
            radial-gradient(circle, #8df6ff 0 17%, #0a1240 17% 20%, #050814 20%),
            repeating-radial-gradient(circle, #101425 0 2px, #05070f 2px 4px);
          background-blend-mode: normal, normal;
          box-shadow: 0 0 0 3px #05070f, 0 0 0 5px rgba(141,246,255,0.35), 8px 8px 0 rgba(0,0,0,0.5);
          animation: mu-spin 3.2s linear infinite;
          animation-play-state: paused;
        }
        .mu-disc.playing { animation-play-state: running; }
        .mu-disc::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.22) 40deg, rgba(255,255,255,0) 80deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.14) 220deg, rgba(255,255,255,0) 260deg);
        }
        .mu-disc-num {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #000;
          letter-spacing: 1px;
          z-index: 1;
        }
        .mu-now-text { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
        .mu-now-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 4px;
          color: var(--p3-blue-light);
        }
        .mu-now-eyebrow::before {
          content: "";
          width: 8px; height: 8px;
          background: var(--p3-red-accent);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--p3-red-accent);
        }
        .mu-now-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(34px, 3.4vw, 52px);
          line-height: 0.95;
          letter-spacing: 2px;
          color: #fff;
          transform: skewX(-6deg);
          text-shadow: 3px 3px 0 rgba(0,0,0,0.55);
        }
        .mu-now-album {
          font-family: 'NewRodin Pro', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.6);
        }

        .mu-viz {
          width: 100%;
          height: 74px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          background: rgba(0,0,0,0.5);
          padding: 8px 12px 0;
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        canvas.mu-viz { display: block; }
        .mu-viz-fallback span {
          flex: 1;
          height: 12%;
          background: var(--p3-blue-light);
          opacity: 0.85;
          transform: skewX(-8deg);
        }
        .mu-viz-fallback.playing span { animation: mu-fallback ease-in-out infinite alternate; }

        .mu-progress {
          position: relative;
          height: 14px;
          background: rgba(0,0,0,0.6);
          cursor: pointer;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        }
        .mu-progress-fill {
          position: absolute;
          inset: 0;
          transform-origin: left center;
          background: linear-gradient(90deg, var(--p3-blue-light) 0%, #fff 100%);
        }
        .mu-progress-head {
          position: absolute;
          top: -4px;
          width: 6px;
          height: 22px;
          background: #fff;
          transform: translateX(-3px) skewX(-8deg);
          box-shadow: 0 0 10px rgba(141,246,255,0.8);
        }
        .mu-times {
          display: flex;
          justify-content: space-between;
          margin-top: -8px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.75);
        }

        .mu-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mu-btn {
          display: inline-grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border: 1px solid rgba(141,246,255,0.35);
          background: rgba(0,0,0,0.6);
          color: #fff;
          font-size: 17px;
          cursor: pointer;
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
        }
        .mu-btn:hover { background: rgba(141,246,255,0.18); transform: translateY(-2px); }
        .mu-btn:active { transform: translateY(1px); }
        .mu-btn.primary {
          width: 64px;
          height: 56px;
          font-size: 22px;
          background: var(--p3-blue-light);
          color: #000;
          border-color: var(--p3-blue-light);
          box-shadow: 4px 4px 0 rgba(0,0,0,0.55);
        }
        .mu-btn.primary:hover { background: #fff; }
        .mu-btn.on { background: var(--p3-blue-light); color: #000; border-color: var(--p3-blue-light); }
        .mu-btn .mu-badge {
          position: absolute;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 11px;
          right: 6px; bottom: 3px;
        }
        .mu-btn:focus-visible, .mu-track-btn:focus-visible { outline: 3px solid #fff; outline-offset: -4px; }
        .mu-spacer { flex: 1; }
        .mu-volume {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mu-volume input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 110px;
          height: 6px;
          background: linear-gradient(90deg, var(--p3-blue-light) var(--vol, 100%), rgba(255,255,255,0.18) var(--vol, 100%));
          outline: none;
          cursor: pointer;
          transform: skewX(-8deg);
        }
        .mu-volume input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 18px;
          background: #fff;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.6);
        }
        .mu-volume input[type="range"]::-moz-range-thumb {
          width: 12px; height: 18px; border: 0; border-radius: 0; background: #fff;
        }

        /* ── Back + hints ── */
        .mu-back {
          position: fixed; left: 24px; bottom: 22px; z-index: 70;
          display: flex; align-items: center; gap: 10px; min-height: 44px;
          padding: 8px 18px; background: #111; color: #8df6ff;
          border: 1px solid #8df6ff; cursor: pointer;
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          font: 22px 'Bebas Neue', sans-serif; letter-spacing: 2px;
        }
        .mu-back:hover { background: #8df6ff; color: #111; }
        .mu-footer {
          position: fixed;
          bottom: 20px; right: 28px;
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 5px;
          font-family: 'Bebas Neue', sans-serif;
          z-index: 14;
          opacity: 0;
          transition: opacity 0.4s ease 0.6s;
        }
        .mu-footer.mounted { opacity: 1; }
        .mu-footer-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; letter-spacing: 2px;
          color: rgba(255,255,255,0.45);
        }
        .mu-footer-key {
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 3px;
          padding: 1px 6px; font-size: 11px;
        }

        @media (max-width: 1100px) {
          .mu-list { width: 50vw; }
          .mu-stage { width: 46vw; right: 2vw; }
          .mu-disc { width: 96px; height: 96px; }
          .mu-panel { padding-right: 60px; }
        }
        /* Phones: a simple column — title, scrolling track list, compact player. */
        @media (max-width: 720px) {
          .mu-screen {
            display: flex;
            flex-direction: column;
            padding: calc(10px + env(safe-area-inset-top, 0px)) 3vw calc(66px + env(safe-area-inset-bottom, 0px));
            box-sizing: border-box;
          }
          .mu-head { position: static; transform: none; margin: 0 0 8px 2px; gap: 0; }
          .mu-head-eyebrow { font-size: 11px; }
          .mu-head-title { font-size: 38px; letter-spacing: 3px; }
          .mu-list {
            position: static;
            flex: 1 1 auto;
            min-height: 0;
            max-height: none;
            width: 100%;
            transform: none;
            padding: 6px 8px 6px 0;
            gap: 4px;
          }
          .mu-track-btn { height: 46px; min-height: 46px; padding: 0 18px 0 12px; gap: 10px; }
          .mu-track.current .mu-track-btn { height: 54px; }
          .mu-track-num { font-size: 22px; min-width: 28px; }
          .mu-track-title { font-size: 19px; letter-spacing: 2px; }
          .mu-track-len { font-size: 14px; }
          .mu-stage { position: relative; top: auto; right: auto; transform: none; width: 100%; margin-top: 10px; flex: 0 0 auto; }
          .mu-backplate { transform: translate(8px, 8px); }
          .mu-panel { padding: 10px 34px 10px 12px; gap: 8px; }
          .mu-now { gap: 12px; }
          .mu-disc { display: none; }
          .mu-now-text { gap: 2px; }
          .mu-now-eyebrow { font-size: 11px; letter-spacing: 3px; }
          .mu-now-title { font-size: 22px; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .mu-now-album { display: none; }
          .mu-viz { height: 28px; padding: 4px 8px 0; }
          .mu-progress { height: 10px; }
          .mu-progress-head { height: 16px; top: -3px; }
          .mu-times { font-size: 12px; margin-top: -4px; }
          .mu-controls { gap: 8px; }
          .mu-btn { width: 38px; height: 38px; font-size: 14px; }
          .mu-btn.primary { width: 50px; height: 42px; font-size: 17px; }
          .mu-volume { display: none; }
          .mu-footer { display: none; }
        }
        /* Phones sideways: list left, compact player right. */
        @media (max-height: 520px) and (min-width: 721px) {
          .mu-head { top: 2vh; left: 3vw; }
          .mu-head-eyebrow { display: none; }
          .mu-head-title { font-size: 40px; }
          .mu-list { top: 17vh; max-height: 66vh; width: 46vw; gap: 4px; }
          .mu-track-btn { height: 44px; padding: 0 22px 0 16px; gap: 10px; }
          .mu-track.current .mu-track-btn { height: 52px; }
          .mu-track-num { font-size: 20px; min-width: 26px; }
          .mu-track-title { font-size: 18px; letter-spacing: 2px; }
          .mu-track-len { font-size: 14px; }
          .mu-stage { width: 48vw; right: 2vw; }
          .mu-panel { padding: 12px 44px 12px 16px; gap: 10px; }
          .mu-disc { display: none; }
          .mu-now-title { font-size: 26px; }
          .mu-now-album { display: none; }
          .mu-viz { height: 40px; }
          .mu-btn { width: 40px; height: 40px; font-size: 15px; }
          .mu-btn.primary { width: 52px; height: 46px; font-size: 18px; }
          .mu-volume input[type="range"] { width: 70px; }
          .mu-footer { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mu-stage.mounted .mu-panel, .mu-disc, .mu-viz-fallback span, .mu-track-eq span { animation: none !important; }
          .mu-stage.mounted .mu-panel { opacity: 1; }
          .mu-track, .mu-track-btn, .mu-head, .mu-backplate { transition: none; }
        }
      `}</style>

      <header className={`mu-head${mounted ? " mounted" : ""}`}>
        <span className="mu-head-eyebrow">SOUNDTRACK</span>
        <h1 className="mu-head-title">MUSIC</h1>
      </header>

      <ol className="mu-list" aria-label="Tracks">
        {tracks.map((track, i) => {
          const isCurrent = current?.id === track.id;
          return (
            <li
              key={track.id}
              ref={isCurrent ? currentRowRef : undefined}
              className={`mu-track${mounted ? " mounted" : ""}${isCurrent ? " current" : ""}${cursor === i ? " cursor" : ""}${isCurrent && isPlaying ? " playing" : ""}`}
              style={{ transitionDelay: mounted ? `${60 + i * 55}ms` : "0ms" }}
            >
              <div className="mu-track-red" aria-hidden="true" />
              <button
                type="button"
                className="mu-track-btn"
                onMouseEnter={() => setCursor(i)}
                onFocus={() => setCursor(i)}
                onClick={() => (isCurrent ? player.toggle() : player.selectTrack(track))}
                aria-current={isCurrent ? "true" : undefined}
                aria-label={`${isCurrent ? (isPlaying ? "Pause" : "Play") : "Play"} ${track.title}`}
              >
                <span className="mu-track-num">{pad2(i + 1)}</span>
                <span className="mu-track-title">{track.title}</span>
                {isCurrent && (
                  <span className="mu-track-eq" aria-hidden="true"><span /><span /><span /></span>
                )}
                <span className="mu-track-len">{fmt(durations[track.id])}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`mu-stage${mounted ? " mounted" : ""}`}>
        <div className="mu-backplate" aria-hidden="true" />
        <section className="mu-panel" aria-label="Now playing">
          <div className="mu-now">
            <div className={`mu-disc${isPlaying ? " playing" : ""}`} aria-hidden="true">
              <span className="mu-disc-num">{currentIdx >= 0 ? pad2(currentIdx + 1) : "--"}</span>
            </div>
            <div className="mu-now-text">
              <span className="mu-now-eyebrow">{isPlaying ? "NOW PLAYING" : "PAUSED"}</span>
              <h2 className="mu-now-title" key={current?.id}>{current?.title ?? "—"}</h2>
              <span className="mu-now-album">{ALBUM}</span>
            </div>
          </div>

          <Visualizer getAnalyser={player.getAnalyser} isPlaying={isPlaying} />

          <div
            className="mu-progress"
            ref={progressRef}
            onClick={onProgressClick}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuenow={Math.round(currentTime)}
            tabIndex={0}
          >
            <div className="mu-progress-fill" style={{ transform: `scaleX(${progress})` }} />
            <div className="mu-progress-head" style={{ left: `${progress * 100}%` }} />
          </div>
          <div className="mu-times">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>

          <div className="mu-controls">
            <button type="button" className={`mu-btn${shuffle ? " on" : ""}`} onClick={() => player.setShuffle(!shuffle)} aria-pressed={shuffle} aria-label="Shuffle">
              <FaShuffle />
            </button>
            <button type="button" className="mu-btn" onClick={player.playPrevTrack} aria-label="Previous track"><FaBackwardStep /></button>
            <button type="button" className="mu-btn primary" onClick={player.toggle} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button type="button" className="mu-btn" onClick={player.playNextTrack} aria-label="Next track"><FaForwardStep /></button>
            <button
              type="button"
              className={`mu-btn${repeat === "one" ? " on" : ""}`}
              style={{ position: "relative" }}
              onClick={() => player.setRepeat(repeat === "one" ? "all" : "one")}
              aria-label={repeat === "one" ? "Repeat one, switch to repeat all" : "Repeat all, switch to repeat one"}
            >
              <FaRepeat />
              <span className="mu-badge" aria-hidden="true">{repeat === "one" ? "1" : "ALL"}</span>
            </button>
            <span className="mu-spacer" />
            <div className="mu-volume">
              <button type="button" className="mu-btn" onClick={toggleMute} aria-label={volume > 0 ? "Mute" : "Unmute"}>
                {volume > 0 ? <FaVolumeHigh /> : <FaVolumeXmark />}
              </button>
              <input
                type="range"
                min="0" max="1" step="0.02"
                value={volume}
                style={{ "--vol": `${volume * 100}%` }}
                onChange={(e) => player.setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
          </div>
        </section>
      </div>

      <button type="button" className="mu-back" onClick={() => navigate("/")}>
        <FaArrowLeft aria-hidden="true" /> MAIN MENU
      </button>
      <div className={`mu-footer${mounted ? " mounted" : ""}`}>
        <div className="mu-footer-row"><span className="mu-footer-key">↑↓</span><span>SELECT</span></div>
        <div className="mu-footer-row"><span className="mu-footer-key">↵</span><span>PLAY</span></div>
        <div className="mu-footer-row"><span className="mu-footer-key">SPACE</span><span>PAUSE</span></div>
        <div className="mu-footer-row"><span className="mu-footer-key">◄ ►</span><span>SEEK</span></div>
        <div className="mu-footer-row"><span className="mu-footer-key">ESC</span><span>BACK</span></div>
      </div>
    </div>
  );
}
