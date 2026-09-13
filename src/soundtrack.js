export const TRACKS = [
  {
    id: 'changing-seasons',
    title: 'Changing Seasons',
    src: new URL('../music/Changing Seasons -Reload-.mp3', import.meta.url).href,
  },
  {
    id: 'full-moon-full-life',
    title: 'Full Moon Full Life',
    src: new URL('../music/Full Moon Full Life.mp3', import.meta.url).href,
  },
  {
    id: 'going-down-now',
    title: "It's Going Down Now",
    src: new URL("../music/Persona 3 Reload - It's Going Down Now (with Lyrics).mp3", import.meta.url).href,
  },
  {
    id: 'color-your-night',
    title: 'Color Your Night',
    src: new URL('../music/Color Your Night.mp3', import.meta.url).href,
  },
  {
    id: 'moon-reaching-out-stars',
    title: "When The Moon's Reaching Out Stars",
    src: new URL("../music/When The Moon's Reaching Out Stars -Reload-.mp3", import.meta.url).href,
  },
  {
    id: 'iwatodai-dorm',
    title: 'Iwatodai Dorm',
    src: new URL('../music/巌戸台分寮.mp3', import.meta.url).href,
  },
  {
    id: 'paulownia-mall',
    title: 'Paulownia Mall',
    src: new URL('../music/ポロニアンモール.mp3', import.meta.url).href,
  },
  {
    id: 'memories-of-you',
    title: 'Memories of You',
    src: new URL('../music/キミの記憶 -Reload-.mp3', import.meta.url).href,
  },
  {
    id: 'burn-my-dread',
    title: 'Burn My Dread',
    src: new URL('../music/Burn My Dread -Reload-.mp3', import.meta.url).href,
  },
  {
    id: 'dont',
    title: "Don't",
    src: new URL("../music/Don't.mp3", import.meta.url).href,
  },
  {
    id: 'wiping-all-out',
    title: 'Wiping All Out',
    src: new URL('../music/Wiping All Out.mp3', import.meta.url).href,
  },
  {
    id: 'want-to-be-close',
    title: 'Want To Be Close',
    src: new URL('../music/Want To Be Close -Reload-.mp3', import.meta.url).href,
  },
]

export function chooseNextTrack(tracks, currentId, random = Math.random) {
  const candidates = tracks.filter((track) => track.id !== currentId)
  if (candidates.length === 0) return tracks[0]
  return candidates[Math.floor(random() * candidates.length)]
}
