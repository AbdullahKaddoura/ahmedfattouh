// Editable site content: defaults here, edits stored through the server API
// (data/content.json) or, when no server is available, in this browser.

export const EDIT_PASSWORD = "1509";
const LOCAL_KEY = "persona3-content-v1";

export const DEFAULT_CONTENT = {
  future: {
    nodes: [
      { id: "education", label: "EDUCATION", jp: "教育", body: "" },
      { id: "skills", label: "SKILLS", jp: "スキル", body: "" },
      { id: "experience", label: "EXPERIENCE", jp: "経験", body: "" },
      { id: "ambitions", label: "AMBITIONS", jp: "野望", body: "" },
      { id: "timeline", label: "TIMELINE", jp: "年表", body: "" },
    ],
  },
  socials: {
    instagram: { user: "@ahmd.ftt", status: "Active", url: "https://www.instagram.com/ahmd.ftt?stkn=NnUxZGhrdWl2MmJ2" },
    tiktok: { user: "@d4n0b", status: "Active", url: "https://www.tiktok.com/@d4n0b?_r=1&_t=ZS-99hROEMBQn6" },
    discord: { user: "@d1n0B", status: "Active", url: "https://discord.com/users/718015166717100073" },
  },
  about: {
    bio: [
      "I am Ahmed Fattouh, aka Dino. I am a calm and collected, stylish workaholic with a strong enthusiasm for visual novels, gaming, and anime.",
      "I love all of my friends and family and am strongly motivated and passionate about my work and everything I enjoy and do.",
      "I am also passionate about building a strong and successful future.",
    ],
    focus: "Focus: Lawyer",
  },
};

export function mergeContent(defaults, stored) {
  if (!stored || typeof stored !== "object") return defaults;
  const out = { ...defaults };
  if (stored.future?.nodes) {
    const byId = Object.fromEntries(stored.future.nodes.map((n) => [n.id, n]));
    out.future = { nodes: defaults.future.nodes.map((n) => ({ ...n, ...(byId[n.id] || {}) })) };
  }
  if (stored.socials) {
    out.socials = Object.fromEntries(
      Object.entries(defaults.socials).map(([k, v]) => [k, { ...v, ...(stored.socials[k] || {}) }])
    );
  }
  if (stored.about) {
    out.about = {
      ...defaults.about,
      ...stored.about,
      bio: Array.isArray(stored.about.bio) && stored.about.bio.length ? stored.about.bio : defaults.about.bio,
    };
  }
  return out;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; }
}
function writeLocal(content) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(content)); } catch { /* storage unavailable */ }
}

async function apiGet() {
  const r = await fetch("/api/content", { headers: { Accept: "application/json" } });
  if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error("no api");
  const d = await r.json();
  if (!d.ok) throw new Error("no api");
  return d.content;
}

// Returns { content, source } where source is "api" | "local" | "default".
export async function loadContent() {
  try {
    const stored = await apiGet();
    return { content: mergeContent(DEFAULT_CONTENT, stored), source: "api" };
  } catch {
    const local = readLocal();
    return { content: mergeContent(DEFAULT_CONTENT, local), source: local ? "local" : "default" };
  }
}

// Saves the full content. Tries the server first (password checked there too);
// falls back to this browser when there is no server.
export async function saveContent(content, password) {
  try {
    const r = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-edit-password": password },
      body: JSON.stringify({ content }),
    });
    if (r.status === 401) return { ok: false, error: "wrong password" };
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error("no api");
    const d = await r.json();
    if (!d.ok) throw new Error("no api");
    return { ok: true, source: "api" };
  } catch {
    if (password !== EDIT_PASSWORD) return { ok: false, error: "wrong password" };
    writeLocal(content);
    return { ok: true, source: "local" };
  }
}
