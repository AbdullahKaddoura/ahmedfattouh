import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseNextTrack } from '../src/soundtrack.js'

test('chooses a track that is different from the currently playing track', () => {
  const tracks = [
    { id: 'full-moon' },
    { id: 'want-to-be-close' },
    { id: 'going-down-now' },
  ]

  for (let i = 0; i < 20; i += 1) {
    assert.notEqual(chooseNextTrack(tracks, 'full-moon').id, 'full-moon')
  }
})
