import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { chooseNextTrack, TRACKS } from './soundtrack.js'
import { SoundtrackContext } from './SoundtrackContext.js'

const INITIAL_TRACK_ID = 'changing-seasons'

export function SoundtrackProvider({ children }) {
  const { pathname } = useLocation()
  const audioRef = useRef(null)
  const currentTrackRef = useRef(null)
  const userPickedRef = useRef(false)
  const audioGraphRef = useRef(null)

  const [current, setCurrent] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [shuffle, setShuffle] = useState(true)
  const [repeat, setRepeat] = useState('one') // 'one' | 'all'
  const shuffleRef = useRef(shuffle)
  const repeatRef = useRef(repeat)
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { repeatRef.current = repeat }, [repeat])

  const playTrack = useCallback((track) => {
    if (!track || !audioRef.current) return
    currentTrackRef.current = track
    audioRef.current.src = track.src
    audioRef.current.play().catch(() => {})
  }, [])

  const stepTrack = useCallback((direction) => {
    const currentId = currentTrackRef.current?.id
    if (shuffleRef.current) {
      playTrack(chooseNextTrack(TRACKS, currentId))
      return
    }
    const idx = TRACKS.findIndex((track) => track.id === currentId)
    const nextIdx = (idx + direction + TRACKS.length) % TRACKS.length
    playTrack(TRACKS[nextIdx])
  }, [playTrack])

  const playNextTrack = useCallback(() => stepTrack(1), [stepTrack])
  const playPrevTrack = useCallback(() => {
    // Like a CD player: early in the song, go back a track; otherwise restart it.
    if (audioRef.current && audioRef.current.currentTime > 4) {
      audioRef.current.currentTime = 0
      return
    }
    stepTrack(-1)
  }, [stepTrack])

  const selectTrack = useCallback((trackOrId) => {
    const track = typeof trackOrId === 'string' ? TRACKS.find((t) => t.id === trackOrId) : trackOrId
    userPickedRef.current = true
    playTrack(track)
  }, [playTrack])

  const play = useCallback(() => audioRef.current?.play().catch(() => {}), [])
  const pause = useCallback(() => audioRef.current?.pause(), [])
  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [])
  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(time)) return
    const max = Number.isFinite(audio.duration) ? audio.duration : Infinity
    audio.currentTime = Math.min(Math.max(0, time), max)
    setCurrentTime(audio.currentTime)
  }, [])
  const seekBy = useCallback((delta) => {
    if (audioRef.current) seek(audioRef.current.currentTime + delta)
  }, [seek])
  const setVolume = useCallback((value) => {
    const v = Math.min(1, Math.max(0, value))
    if (audioRef.current) audioRef.current.volume = v
    setVolumeState(v)
  }, [])

  // Web Audio analyser for the visualizer. Created lazily inside a user gesture so
  // the context is allowed to run; if anything fails we simply return null.
  const getAnalyser = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return null
    try {
      if (!audioGraphRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return null
        const ctx = new Ctx()
        const source = ctx.createMediaElementSource(audio)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.82
        source.connect(analyser)
        analyser.connect(ctx.destination)
        audioGraphRef.current = { ctx, analyser }
      }
      if (audioGraphRef.current.ctx.state !== 'running') {
        audioGraphRef.current.ctx.resume().catch(() => {})
      }
      return audioGraphRef.current.analyser
    } catch {
      return null
    }
  }, [])

  // Route changes pick a fresh random track, unless the listener chose one themselves
  // or is on the music page (where they expect what they picked to keep playing).
  useEffect(() => {
    if (!currentTrackRef.current) {
      playTrack(TRACKS.find((track) => track.id === INITIAL_TRACK_ID))
      return
    }
    if (pathname === '/music' || userPickedRef.current) return
    playTrack(chooseNextTrack(TRACKS, currentTrackRef.current?.id))
  }, [pathname, playTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    const onLoadStart = () => {
      setCurrent(currentTrackRef.current)
      setCurrentTime(0)
      setDuration(0)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onEnded = () => {
      if (repeatRef.current === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        stepTrack(1)
      }
    }
    audio.addEventListener('loadstart', onLoadStart)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('loadstart', onLoadStart)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended', onEnded)
    }
  }, [stepTrack])

  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current
      if (audio && audio.paused && currentTrackRef.current) audio.play().catch(() => {})
      if (audioGraphRef.current?.ctx.state !== 'running') audioGraphRef.current?.ctx.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  useEffect(() => () => {
    audioRef.current?.pause()
    audioGraphRef.current?.ctx.close().catch(() => {})
  }, [])

  const value = useMemo(() => ({
    tracks: TRACKS,
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    play,
    pause,
    toggle,
    seek,
    seekBy,
    setVolume,
    setShuffle,
    setRepeat,
    selectTrack,
    playNextTrack,
    playPrevTrack,
    getAnalyser,
  }), [current, isPlaying, currentTime, duration, volume, shuffle, repeat, play, pause, toggle, seek, seekBy, setVolume, selectTrack, playNextTrack, playPrevTrack, getAnalyser])

  return (
    <SoundtrackContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="auto" />
    </SoundtrackContext.Provider>
  )
}
