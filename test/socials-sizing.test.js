import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('socials bars and labels use the enlarged responsive scale', async () => {
  const socialsSource = await readFile(new URL('../src/Socials.jsx', import.meta.url), 'utf8')

  assert.match(socialsSource, /width: min\(62vw, 900px\)/)
  assert.match(socialsSource, /height: 82px/)
  assert.match(socialsSource, /font-size: clamp\(2rem, 3\.2vw, 3\.1rem\)/)
  assert.match(socialsSource, /font-size: clamp\(1\.4rem, 2\.2vw, 2\.2rem\)/)
})
