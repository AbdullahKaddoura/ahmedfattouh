import { EDIT_PASSWORD } from './_store.js';

export default function handler(req, res) {
  res.status(200).json({ ok: req.body?.password === EDIT_PASSWORD });
}
