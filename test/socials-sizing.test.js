import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('socials bars and labels use the compact desktop scale', async () => {
  const socialsSource = await readFile(new URL('../src/Socials.jsx', import.meta.url), 'utf8')

  assert.match(socialsSource, /width: min\(46vw, 680px\)/)
  assert.match(socialsSource, /height: 64px/)
  assert.match(socialsSource, /font-size: clamp\(1\.5rem, 2\.2vw, 2\.1rem\)/)
  assert.match(socialsSource, /font-size: clamp\(1\.1rem, 1\.6vw, 1\.5rem\)/)
})
