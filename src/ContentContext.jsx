import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentContext } from "./useContent.js";
import { DEFAULT_CONTENT, EDIT_PASSWORD, loadContent, saveContent } from "./content.js";

const UNLOCK_KEY = "persona3-editor-unlocked";

export function ContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [source, setSource] = useState("default");
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(UNLOCK_KEY) === EDIT_PASSWORD; } catch { return false; }
  });

  useEffect(() => {
    let alive = true;
    loadContent().then(({ content: c, source: s }) => {
      if (!alive) return;
      setContent(c);
      setSource(s);
    });
    return () => { alive = false; };
  }, []);

  const unlock = useCallback((password) => {
    if (password !== EDIT_PASSWORD) return false;
    try { sessionStorage.setItem(UNLOCK_KEY, password); } catch { /* ignore */ }
    setUnlocked(true);
    return true;
  }, []);

  const lock = useCallback(() => {
    try { sessionStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
    setUnlocked(false);
  }, []);

  // update(fn) receives the current content and returns the next one.
  const update = useCallback(async (fn) => {
    const next = fn(content);
    const result = await saveContent(next, EDIT_PASSWORD);
    if (result.ok) {
      setContent(next);
      setSource(result.source);
    }
    return result;
  }, [content]);

  const value = useMemo(() => ({ content, source, unlocked, unlock, lock, update }), [content, source, unlocked, unlock, lock, update]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
