// Shared helpers for the Vercel serverless API. Content and uploads live in
// Vercel Blob; without a Blob store (no BLOB_READ_WRITE_TOKEN) the API reports
// 503 and the site falls back to per-browser storage.
import { list, put } from '@vercel/blob';

export const EDIT_PASSWORD = process.env.EDIT_PASSWORD || '1509';

// Vercel names the token BLOB_READ_WRITE_TOKEN, or <PREFIX>_BLOB_READ_WRITE_TOKEN
// when a custom prefix was chosen while connecting the store. Accept either.
function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => k.endsWith('BLOB_READ_WRITE_TOKEN') && process.env[k]);
  return key ? process.env[key] : undefined;
}
export const hasBlob = () => !!blobToken();

export async function readContent() {
  const { blobs } = await list({ prefix: 'content/', limit: 100, token: blobToken() });
  if (!blobs.length) return {};
  const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  const r = await fetch(newest.url, { cache: 'no-store' });
  return r.ok ? r.json() : {};
}

export async function writeContent(content) {
  // A fresh name per save so the CDN never serves a stale copy.
  await put(`content/content-${Date.now()}.json`, JSON.stringify(content), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: true,
    token: blobToken(),
  });
}

export async function saveImage(buffer, ext, contentType) {
  const name = `uploads/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(name, buffer, { access: 'public', contentType, addRandomSuffix: false, token: blobToken() });
  return blob.url;
}
