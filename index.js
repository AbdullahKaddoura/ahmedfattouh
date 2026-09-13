import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Editable site content lives in a JSON file next to the server.
// Edits are accepted only with the edit password (EDIT_PASSWORD env, default 1509).
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || '1509';

function readContent() {
  try {
    return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  } catch {
    return {};
  }
}

app.use(express.json({ limit: '8mb' }));

// Uploaded images (posters) live in data/uploads and are served at /uploads/<file>.
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/content', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, content: readContent() });
});

app.put('/api/content', (req, res) => {
  if (req.get('x-edit-password') !== EDIT_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'wrong password' });
  }
  const content = req.body?.content;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ ok: false, error: 'missing content' });
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
  res.json({ ok: true, content });
});

app.post('/api/upload', (req, res) => {
  if (req.get('x-edit-password') !== EDIT_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'wrong password' });
  }
  const dataUrl = req.body?.dataUrl;
  const m = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return res.status(400).json({ ok: false, error: 'expected a png, jpeg or webp data URL' });
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) return res.status(413).json({ ok: false, error: 'image too large' });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.json({ ok: true, url: `/uploads/${name}` });
});

app.post('/api/verify', (req, res) => {
  res.json({ ok: req.body?.password === EDIT_PASSWORD });
});

// Serve static files from the build output directory (Vite's 'dist')
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for any remaining requests (SPA fallback)
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
