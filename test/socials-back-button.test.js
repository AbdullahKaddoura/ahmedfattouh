import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('socials page includes a button that navigates back to the menu', async () => {
  const socialsSource = await readFile(new URL('../src/Socials.jsx', import.meta.url), 'utf8')

  assert.match(socialsSource, /BACK TO MENU/)
  assert.match(socialsSource, /navigate\('\/'\)/)
})
