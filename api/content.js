import { EDIT_PASSWORD, hasBlob, readContent, writeContent } from './_store.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!hasBlob()) return res.status(503).json({ ok: false, error: 'no storage configured' });

  if (req.method === 'GET') {
    try {
      return res.status(200).json({ ok: true, content: await readContent() });
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }

  if (req.method === 'PUT') {
    if (req.headers['x-edit-password'] !== EDIT_PASSWORD) {
      return res.status(401).json({ ok: false, error: 'wrong password' });
    }
    const content = req.body?.content;
    if (!content || typeof content !== 'object') {
      return res.status(400).json({ ok: false, error: 'missing content' });
    }
    try {
      await writeContent(content);
      return res.status(200).json({ ok: true, content });
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ ok: false, error: 'method not allowed' });
}
