import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('does not include GitHub Link as a main menu option', async () => {
  const menuSource = await readFile(new URL('../src/P3Menu.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(menuSource, /GITHUB LINK/)
})
