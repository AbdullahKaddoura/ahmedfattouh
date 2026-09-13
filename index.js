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

app.use(express.json({ limit: '200kb' }));

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
