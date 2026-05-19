"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, SkipForward } from "lucide-react"
import { motion } from "framer-motion"

const RADIO_STATIONS = [
  {
    name: "Flamenco Radio",
    description: "Guitarra flamenca en directo",
    url: "https://stream.zeno.fm/yn65m7h9p7zuv",
  },
  {
    name: "Radio Clásica Española",
    description: "Guitarra española clásica",
    url: "https://stream.zeno.fm/0r0xa792kwzuv",
  },
  {
    name: "España Flamenco",
    description: "Flamenco y guitarra española",
    url: "https://stream.zeno.fm/tsgetwygmg0uv",
  },
]

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [currentStation, setCurrentStation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setIsLoading(true)
      audioRef.current.load()
      audioRef.current.play()
        .then(() => { setIsPlaying(true); setIsLoading(false) })
        .catch(() => { setIsLoading(false) })
    }
  }

  const nextStation = () => {
    const next = (currentStation + 1) % RADIO_STATIONS.length
    setCurrentStation(next)
    if (audioRef.current) {
      setIsLoading(true)
      audioRef.current.pause()
      audioRef.current.src = RADIO_STATIONS[next].url
      audioRef.current.load()
      audioRef.current.play()
        .then(() => { setIsPlaying(true); setIsLoading(false) })
        .catch(() => { setIsLoading(false) })
    }
  }

  if (!isMounted) return null

  const station = RADIO_STATIONS[currentStation]

  return (
    <>
      <audio
        ref={audioRef}
        src={station.url}
        preload="none"
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed top-24 right-6 z-40 flex items-center gap-1 group"
      >
        {/* Skip station button - visible on hover */}
        {isPlaying && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={nextStation}
            className="flex items-center justify-center w-8 h-8 bg-background/80 border border-primary/30 text-muted-foreground rounded-full hover:text-primary transition-all duration-300 opacity-0 group-hover:opacity-100"
            title="Siguiente emisora"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* Main toggle button */}
        <button
          onClick={toggleAudio}
          className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:brightness-110 transition-all duration-300"
          title={isPlaying ? `Silenciar · ${station.name}` : "Reproducir guitarra española"}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
            />
          ) : isPlaying ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <Volume2 className="w-5 h-5" />
            </motion.div>
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>

        {/* Tooltip */}
        <div className="absolute right-14 px-3 py-2 bg-background border border-primary/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="font-semibold text-foreground">{station.name}</div>
          <div className="text-xs text-muted-foreground">{station.description}</div>
        </div>
      </motion.div>
    </>
  )
}
