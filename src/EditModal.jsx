import { useEffect, useRef, useState } from "react";
import { FaPen, FaLock, FaXmark, FaCheck } from "react-icons/fa6";
import { useContent } from "./useContent.js";

/*
  Persona-styled popup used by every editable part of the site.

  props:
    open, onClose
    title            — heading shown in view mode and as the modal title
    subtitle         — optional small line under the title (e.g. Japanese)
    view             — optional ReactNode shown to visitors (view mode). If omitted, the
                       modal opens straight into the password / edit flow.
    fields           — [{ key, label, type: "text" | "textarea" | "url", placeholder }]
    values           — { key: value } current values
    onSave(values)   — async; return { ok, error }
*/
export default function EditModal({ open, onClose, title, subtitle, view, fields, values, onSave, custom, wide }) {
  const { unlocked, unlock, source } = useContent();
  const [mode, setMode] = useState("view"); // view | password | edit
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [draft, setDraft] = useState(values || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const panelRef = useRef(null);
  const pinRef = useRef(null);

  // Reset when (re)opened.
  useEffect(() => {
    if (!open) return;
    setMode(view ? "view" : (unlocked ? "edit" : "password"));
    setPin("");
    setError("");
    setSavedNote("");
    setDraft(values || {});
    document.body.classList.add("p3-modal-open");
    const t = setTimeout(() => panelRef.current?.focus(), 30);
    return () => { clearTimeout(t); document.body.classList.remove("p3-modal-open"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (mode === "password") setTimeout(() => pinRef.current?.focus(), 30);
  }, [mode]);

  if (!open) return null;

  const startEdit = () => {
    setError("");
    setMode(unlocked ? "edit" : "password");
  };

  const submitPin = (e) => {
    e?.preventDefault();
    if (unlock(pin)) { setPin(""); setMode("edit"); return; }
    setShake(true);
    setTimeout(() => setShake(false), 450);
    setPin("");
    setError("Wrong password.");
  };

  const submitEdit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    const result = await onSave(draft);
    setSaving(false);
    if (!result?.ok) { setError(result?.error || "Could not save."); return; }
    setSavedNote(result.source === "local" ? "Saved on this device only (no server available)." : "Saved.");
    if (view) setMode("view"); else onClose();
  };

  const onKeyDown = (e) => {
    // Keep page-level shortcuts (Escape = back to menu, arrows, space) out of the modal.
    e.stopPropagation();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="pm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={onKeyDown}>
      <div className={`pm-frame${wide ? " wide" : ""}`}>
        <div className="pm-backplate" aria-hidden="true" />
        <section className={`pm-panel${shake ? " shake" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panelRef}>
          <header className="pm-head">
            <div className="pm-titles">
              <span className="pm-eyebrow">{mode === "view" ? "Details" : mode === "password" ? "Locked" : "Editing"}</span>
              <h2 className="pm-title">{mode === "edit" && draft.label !== undefined ? (draft.label || title) : title}</h2>
              {subtitle && <span className="pm-subtitle">{subtitle}</span>}
            </div>
            <button type="button" className="pm-x" onClick={onClose} aria-label="Close"><FaXmark /></button>
          </header>

          {mode === "view" && (
            <>
              <div className="pm-body">{view}</div>
              <footer className="pm-foot">
                {savedNote && <span className="pm-note">{savedNote}</span>}
                <span className="pm-spacer" />
                <button type="button" className="pm-btn" onClick={onClose}>CLOSE</button>
                <button type="button" className="pm-btn primary" onClick={startEdit}><FaPen aria-hidden="true" /> EDIT</button>
              </footer>
            </>
          )}

          {mode === "password" && (
            <form className="pm-body pm-lock" onSubmit={submitPin}>
              <FaLock className="pm-lock-icon" aria-hidden="true" />
              <p className="pm-lock-text">Enter the 4-digit password to edit.</p>
              <input
                ref={pinRef}
                className="pm-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-label="Password"
                placeholder="••••"
              />
              {error && <span className="pm-error" role="alert">{error}</span>}
              <footer className="pm-foot">
                <span className="pm-spacer" />
                <button type="button" className="pm-btn" onClick={view ? () => setMode("view") : onClose}>CANCEL</button>
                <button type="submit" className="pm-btn primary" disabled={pin.length < 4}>UNLOCK</button>
              </footer>
            </form>
          )}

          {mode === "edit" && (
            <form className="pm-body pm-form" onSubmit={submitEdit}>
              {custom ? custom(draft, setDraft) : fields.map((f) => (
                <label key={f.key} className="pm-field">
                  <span className="pm-label">{f.label}</span>
                  {f.type === "textarea" ? (
                    <textarea
                      className="pm-input pm-textarea"
                      rows={6}
                      value={draft[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="pm-input"
                      type={f.type === "url" ? "url" : "text"}
                      value={draft[f.key] ?? ""}
                      placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
              {error && <span className="pm-error" role="alert">{error}</span>}
              {source === "local" && <span className="pm-note">No server detected: changes will be kept on this device only.</span>}
              <footer className="pm-foot">
                <span className="pm-spacer" />
                <button type="button" className="pm-btn" onClick={view ? () => setMode("view") : onClose}>CANCEL</button>
                <button type="submit" className="pm-btn primary" disabled={saving}><FaCheck aria-hidden="true" /> {saving ? "SAVING…" : "SAVE"}</button>
              </footer>
            </form>
          )}
        </section>
      </div>

      <style>{`
        .pm-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(12px, env(safe-area-inset-top, 0px)) 12px max(12px, env(safe-area-inset-bottom, 0px));
          background: rgba(3, 8, 40, 0.72);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: pm-fade 0.2s ease-out;
        }
        @keyframes pm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pm-in {
          0%   { opacity: 0; transform: translateX(50px) skewX(-8deg); }
          60%  { opacity: 1; transform: translateX(-5px) skewX(-2deg); }
          100% { opacity: 1; transform: translateX(0) skewX(0); }
        }
        @keyframes pm-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); } 40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); } 80% { transform: translateX(6px); }
        }
        .pm-frame.wide { width: min(96vw, 860px); }
        .pm-frame {
          position: relative;
          width: min(92vw, 640px);
          max-height: min(88vh, 88dvh);
          display: flex;
        }
        .pm-backplate, .pm-panel {
          clip-path: polygon(0 0, 100% 0, calc(100% - 34px) 100%, 0 100%);
        }
        @keyframes pm-back-in {
          0%   { opacity: 0; transform: translate(60px, 12px) skewX(-8deg); }
          100% { opacity: 1; transform: translate(12px, 12px) skewX(0); }
        }
        .pm-backplate {
          position: absolute;
          inset: 0;
          background: var(--p3-red-accent);
          transform: translate(12px, 12px);
          animation: pm-back-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .pm-panel {
          position: relative;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: var(--p3-bg-panel);
          color: #fff;
          padding: 20px 56px 18px 22px;
          outline: none;
          animation: pm-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .pm-panel.shake { animation: pm-shake 0.45s ease; }
        .pm-panel::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 6px;
          background: linear-gradient(90deg, var(--p3-red-accent) 0%, #ff4b5c 70%, transparent 100%);
        }
        .pm-panel::after {
          content: ""; position: absolute; top: 6px; bottom: 0; left: 0; width: 4px;
          background: linear-gradient(180deg, var(--p3-blue-light) 0%, rgba(141,246,255,0.1) 100%);
        }
        .pm-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(141, 246, 255, 0.22);
        }
        .pm-titles { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .pm-eyebrow {
          font-family: 'Barlow Condensed', sans-serif; font-weight: 600;
          font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: var(--p3-blue-light);
        }
        .pm-title {
          margin: 0;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 0.95;
          letter-spacing: 2px;
          transform: skewX(-6deg);
          transform-origin: left bottom;
          text-shadow: 3px 3px 0 rgba(0,0,0,0.55);
          overflow-wrap: anywhere;
        }
        .pm-subtitle {
          font-family: 'Noto Sans JP', 'NewRodin Pro', sans-serif; font-weight: 700;
          font-size: 13px; letter-spacing: 3px; color: rgba(255,255,255,0.75);
        }
        .pm-x {
          flex-shrink: 0;
          width: 40px; height: 40px;
          display: grid; place-items: center;
          background: rgba(0,0,0,0.55); color: #fff;
          border: 1px solid rgba(141,246,255,0.35);
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          cursor: pointer; font-size: 18px;
        }
        .pm-x:hover { background: var(--p3-blue-light); color: #000; }

        .pm-body {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.55);
          clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
          padding: 16px 28px 16px 18px;
          font-family: 'NewRodin Pro', sans-serif;
          font-size: clamp(15px, 1.1vw, 18px);
          line-height: 1.6;
          scrollbar-width: thin;
          scrollbar-color: #8df6ff rgba(0,0,0,0.4);
        }
        .pm-body p { margin: 0 0 10px; white-space: pre-wrap; overflow-wrap: anywhere; }
        .pm-body p:last-child { margin-bottom: 0; }
        .pm-empty { color: rgba(255,255,255,0.55); font-style: italic; }

        .pm-lock { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
        .pm-lock-icon { font-size: 30px; color: var(--p3-blue-light); }
        .pm-lock-text { margin: 0; }
        .pm-pin {
          width: 170px;
          padding: 10px 0;
          text-align: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 40px;
          letter-spacing: 14px;
          text-indent: 14px;
          color: #fff;
          background: rgba(0,0,0,0.6);
          border: 2px solid rgba(141,246,255,0.45);
          clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
          outline: none;
        }
        .pm-pin:focus { border-color: var(--p3-blue-light); box-shadow: 0 0 0 3px rgba(141,246,255,0.25); }

        .pm-form { display: flex; flex-direction: column; gap: 12px; }
        .pm-field { display: flex; flex-direction: column; gap: 6px; }
        .pm-label {
          font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px; color: var(--p3-blue-light);
        }
        .pm-input {
          width: 100%;
          padding: 10px 12px;
          font-family: 'NewRodin Pro', sans-serif;
          font-size: 16px;
          color: #fff;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(141,246,255,0.35);
          border-left: 3px solid var(--p3-blue-light);
          outline: none;
          box-sizing: border-box;
        }
        .pm-input:focus { border-color: var(--p3-blue-light); box-shadow: 0 0 0 3px rgba(141,246,255,0.2); }
        .pm-textarea { resize: vertical; min-height: 120px; line-height: 1.5; }

        .pm-foot {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-top: 14px;
        }
        .pm-body .pm-foot { margin-top: 6px; }
        .pm-spacer { flex: 1; }
        .pm-note { font-family: 'NewRodin Pro', sans-serif; font-size: 12px; color: rgba(255,255,255,0.7); }
        .pm-error { font-family: 'NewRodin Pro', sans-serif; font-size: 13px; color: #ff6b7a; }
        .pm-btn {
          display: inline-flex; align-items: center; gap: 8px;
          min-height: 42px; padding: 8px 18px;
          font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px;
          color: #fff; background: rgba(0,0,0,0.65);
          border: 1px solid rgba(141,246,255,0.35);
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
        }
        .pm-btn:hover:not(:disabled) { background: rgba(141,246,255,0.18); transform: translateY(-2px); }
        .pm-btn.primary { background: var(--p3-blue-light); color: #000; border-color: var(--p3-blue-light); box-shadow: 4px 4px 0 rgba(0,0,0,0.55); }
        .pm-btn.primary:hover:not(:disabled) { background: #fff; }
        .pm-btn:disabled { opacity: 0.5; cursor: default; }
        .pm-btn:focus-visible, .pm-x:focus-visible { outline: 3px solid #fff; outline-offset: -4px; }

        @media (max-width: 720px) {
          .pm-frame { width: 96vw; }
          .pm-panel { padding: 14px 34px 14px 14px; }
          .pm-body { padding: 12px 20px 12px 12px; }
          .pm-title { font-size: 28px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-overlay, .pm-backplate, .pm-panel { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// Small themed "edit" trigger used on pages.
export function EditButton({ onClick, className = "", label = "EDIT" }) {
  return (
    <button type="button" className={`pm-edit-trigger ${className}`} onClick={onClick} aria-label={`${label}: password required`}>
      <FaPen aria-hidden="true" /> {label}
      <style>{`
        .pm-edit-trigger {
          display: inline-flex; align-items: center; gap: 8px;
          min-height: 36px; padding: 6px 14px;
          font-family: 'Bebas Neue', sans-serif; font-size: 17px; letter-spacing: 2px;
          color: var(--p3-blue-light); background: rgba(0,0,0,0.7);
          border: 1px solid rgba(141,246,255,0.45);
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          cursor: pointer; pointer-events: auto;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .pm-edit-trigger:hover { background: var(--p3-blue-light); color: #000; }
        .pm-edit-trigger:focus-visible { outline: 3px solid #fff; outline-offset: -4px; }
        .pm-edit-trigger svg { font-size: 13px; }
      `}</style>
    </button>
  );
}
