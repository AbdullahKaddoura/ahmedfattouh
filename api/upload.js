import { EDIT_PASSWORD, hasBlob, saveImage } from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }
  if (!hasBlob()) return res.status(503).json({ ok: false, error: 'no storage configured' });
  if (req.headers['x-edit-password'] !== EDIT_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'wrong password' });
  }
  const dataUrl = req.body?.dataUrl;
  const m = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return res.status(400).json({ ok: false, error: 'expected a png, jpeg or webp data URL' });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 4 * 1024 * 1024) return res.status(413).json({ ok: false, error: 'image too large' });
  try {
    const url = await saveImage(buf, m[1] === 'jpeg' ? 'jpg' : m[1], `image/${m[1]}`);
    return res.status(200).json({ ok: true, url });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}
