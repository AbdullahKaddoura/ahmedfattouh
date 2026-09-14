import { useState } from "react";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaImage } from "react-icons/fa6";
import { fileToDataUrl, uploadImage } from "./content.js";

const newId = () => `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// Form body for the games / anime lists: add, remove, reorder, and give each
// entry an optional image.
export default function ListEditor({ draft, setDraft, placeholderIcon }) {
  const items = draft.items || [];
  const [busy, setBusy] = useState(null); // id of the entry whose image is uploading
  const [note, setNote] = useState("");

  const setItems = (next) => setDraft((d) => ({ ...d, items: next }));
  const patch = (id, changes) => setItems(items.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
  };
  const add = () => setItems([...items, { id: newId(), title: "", meta: "", poster: "", showImage: false }]);

  const pick = async (id, file) => {
    if (!file) return;
    setBusy(id);
    setNote("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const r = await uploadImage(dataUrl);
      patch(id, { poster: r.url, showImage: true });
      if (r.source === "local") setNote("Shared storage isn't set up yet, so this image is saved on this device only.");
    } catch (err) {
      setNote(err.message || "Could not use that image.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="le-root">
      {items.length === 0 && <p className="le-empty">No entries yet. Add one below.</p>}
      <ul className="le-list">
        {items.map((it, idx) => (
          <li key={it.id} className="le-row">
            <div className="le-thumb-wrap">
              {it.showImage && it.poster
                ? <img className="le-thumb" src={it.poster} alt="" />
                : <span className="le-thumb le-thumb-empty" aria-hidden="true">{placeholderIcon}</span>}
              <span className="le-num">{String(idx + 1).padStart(2, "0")}</span>
            </div>
            <div className="le-fields">
              <input
                className="pm-input"
                type="text"
                value={it.title}
                maxLength={60}
                placeholder="Title"
                onChange={(e) => patch(it.id, { title: e.target.value })}
              />
              <input
                className="pm-input le-meta"
                type="text"
                value={it.meta || ""}
                maxLength={60}
                placeholder="Small line (year, studio…)"
                onChange={(e) => patch(it.id, { meta: e.target.value })}
              />
              <div className="le-img-row">
                <label className="le-check">
                  <input
                    type="checkbox"
                    checked={!!it.showImage}
                    onChange={(e) => patch(it.id, { showImage: e.target.checked })}
                  />
                  <span>Show image</span>
                </label>
                <label className={`le-upload${busy === it.id ? " busy" : ""}`}>
                  <FaImage aria-hidden="true" /> {busy === it.id ? "UPLOADING…" : it.poster ? "REPLACE IMAGE" : "UPLOAD IMAGE"}
                  <input type="file" accept="image/*" disabled={busy !== null} onChange={(e) => { pick(it.id, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              </div>
            </div>
            <div className="le-actions">
              <button type="button" className="le-icon-btn" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up"><FaArrowUp /></button>
              <button type="button" className="le-icon-btn" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Move down"><FaArrowDown /></button>
              <button type="button" className="le-icon-btn danger" onClick={() => remove(it.id)} aria-label="Remove entry"><FaTrash /></button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="le-add" onClick={add}><FaPlus aria-hidden="true" /> ADD ENTRY</button>
      {note && <span className="pm-note">{note}</span>}

      <style>{`
        .le-root { display: flex; flex-direction: column; gap: 12px; }
        .le-empty { margin: 0; color: rgba(255,255,255,0.6); font-style: italic; }
        .le-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .le-row {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
          padding: 10px 10px 10px 8px;
          background: rgba(0,0,0,0.35);
          border-left: 3px solid rgba(141,246,255,0.5);
          clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        }
        .le-thumb-wrap { position: relative; }
        .le-thumb {
          display: flex; align-items: center; justify-content: center;
          width: 54px; height: 72px; object-fit: cover;
          background: rgba(141,246,255,0.1); color: var(--p3-blue-light); font-size: 22px;
          clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
        }
        .le-num {
          position: absolute; left: 0; top: 0;
          padding: 1px 6px; font-family: 'Bebas Neue', sans-serif; font-size: 13px; letter-spacing: 1px;
          background: var(--p3-blue-light); color: #000;
        }
        .le-fields { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .le-fields .pm-input { padding: 8px 10px; font-size: 15px; }
        .le-meta { font-size: 13px !important; }
        .le-img-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .le-check { display: inline-flex; align-items: center; gap: 8px; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 15px; letter-spacing: 1px; cursor: pointer; }
        .le-check input { width: 18px; height: 18px; accent-color: #8df6ff; }
        .le-upload {
          position: relative; display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 12px; min-height: 34px;
          font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px;
          color: #fff; background: rgba(0,0,0,0.6); border: 1px solid rgba(141,246,255,0.4);
          clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
          cursor: pointer;
        }
        .le-upload:hover { background: rgba(141,246,255,0.18); }
        .le-upload.busy { opacity: 0.6; }
        .le-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .le-actions { display: flex; flex-direction: column; gap: 6px; }
        .le-icon-btn {
          width: 34px; height: 34px; display: grid; place-items: center;
          background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(141,246,255,0.35);
          clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%); cursor: pointer; font-size: 13px;
        }
        .le-icon-btn:hover:not(:disabled) { background: rgba(141,246,255,0.2); }
        .le-icon-btn:disabled { opacity: 0.3; cursor: default; }
        .le-icon-btn.danger:hover:not(:disabled) { background: var(--p3-red-accent); }
        .le-add {
          align-self: flex-start;
          display: inline-flex; align-items: center; gap: 8px;
          min-height: 40px; padding: 8px 16px;
          font-family: 'Bebas Neue', sans-serif; font-size: 19px; letter-spacing: 2px;
          color: #000; background: var(--p3-blue-light); border: 0;
          clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
          box-shadow: 4px 4px 0 rgba(0,0,0,0.55); cursor: pointer;
        }
        .le-add:hover { background: #fff; }
        @media (max-width: 720px) {
          .le-row { grid-template-columns: 48px minmax(0, 1fr); }
          .le-thumb { width: 44px; height: 60px; }
          .le-actions { grid-column: 1 / -1; flex-direction: row; }
        }
      `}</style>
    </div>
  );
}
