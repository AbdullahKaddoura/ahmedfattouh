import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('social detail bars use an opaque high-contrast treatment', async () => {
  const socialsSource = await readFile(new URL('../src/Socials.jsx', import.meta.url), 'utf8')

  assert.match(socialsSource, /background: rgba\(17,17,17,0\.94\)/)
  assert.match(socialsSource, /color: #ffffff;/)
  assert.match(socialsSource, /font-size: clamp\(1\.1rem, 1\.6vw, 1\.5rem\)/)
})
