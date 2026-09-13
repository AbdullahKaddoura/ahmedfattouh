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
    games: [
      { id: "rdr2", title: "Red Dead Redemption 2", meta: "2018 · Rockstar Games", poster: "/about/posters/rdr2.jpg", showImage: true },
      { id: "fallout", title: "Fallout", meta: "1997 · Interplay", poster: "/about/posters/fallout.jpg", showImage: true },
      { id: "persona", title: "Persona series", meta: "Atlus · since 1996", poster: "/about/posters/persona.jpg", showImage: true },
      { id: "ace-attorney", title: "Ace Attorney", meta: "2001 · Capcom", poster: "/about/posters/ace-attorney.jpg", showImage: true },
      { id: "gta5", title: "Grand Theft Auto 5", meta: "2013 · Rockstar Games", poster: "/about/posters/gta5.jpg", showImage: true },
      { id: "danganronpa", title: "Danganronpa", meta: "2010 · Spike", poster: "/about/posters/danganronpa.jpg", showImage: true },
      { id: "umineko", title: "Umineko When They Cry", meta: "2007 · 07th Expansion", poster: "/about/posters/umineko.jpg", showImage: true },
    ],
    anime: [
      { id: "dbz", title: "Dragon Ball Z", meta: "1989 · Toei Animation", poster: "/about/posters/dbz.jpg", showImage: true },
      { id: "evangelion", title: "Neon Genesis Evangelion", meta: "1995 · Gainax", poster: "/about/posters/evangelion.jpg", showImage: true },
      { id: "chainsaw-man", title: "Chainsaw Man", meta: "2022 · MAPPA", poster: "/about/posters/chainsaw-man.jpg", showImage: true },
      { id: "lain", title: "Serial Experiments Lain", meta: "1998 · Triangle Staff", poster: "/about/posters/lain.jpg", showImage: true },
      { id: "steven-universe", title: "Steven Universe", meta: "2013 · Cartoon Network", poster: "/about/posters/steven-universe.jpg", showImage: true },
    ],
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
    const list = (arr, fallback) => (Array.isArray(arr) ? arr.filter((e) => e && typeof e.title === "string") : fallback);
    out.about = {
      ...defaults.about,
      ...stored.about,
      bio: Array.isArray(stored.about.bio) && stored.about.bio.length ? stored.about.bio : defaults.about.bio,
      games: list(stored.about.games, defaults.about.games),
      anime: list(stored.about.anime, defaults.about.anime),
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

// Shrinks an image file in the browser and returns a JPEG data URL.
export function fileToDataUrl(file, maxEdge = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image.")); };
    img.src = url;
  });
}

// Uploads an image to the server; without a server the data URL itself is used.
export async function uploadImage(dataUrl) {
  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-edit-password": EDIT_PASSWORD },
      body: JSON.stringify({ dataUrl }),
    });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error("no api");
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "upload failed");
    return { ok: true, url: d.url, source: "api" };
  } catch {
    return { ok: true, url: dataUrl, source: "local" };
  }
}
