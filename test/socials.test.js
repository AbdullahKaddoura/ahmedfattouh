import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('social buttons use Instagram, TikTok, and Discord profiles', async () => {
  const socialsSource = await readFile(new URL('../src/Socials.jsx', import.meta.url), 'utf8')

  assert.match(socialsSource, /label: "INSTAGRAM".*ahmd\.ftt/s)
  assert.match(socialsSource, /label: "TIKTOK".*d4n0b/s)
  assert.match(socialsSource, /label: "DISCORD".*718015166717100073/s)
  assert.match(socialsSource, /FaInstagram/)
  assert.match(socialsSource, /FaTiktok/)
  assert.match(socialsSource, /FaDiscord/)
})
