"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface SectionSeparatorProps {
  variant?: "full" | "minimal"
}

export function SectionSeparator({ variant = "minimal" }: SectionSeparatorProps) {
  const aces = [
    { src: "/ace-oros.png", alt: "Ace of Coins" },
    { src: "/ace-copas.png", alt: "Ace of Cups" },
    { src: "/ace-espada.png", alt: "Ace of Swords" },
    { src: "/ace-bastos.png", alt: "Ace of Clubs" },
  ]

  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="w-12 h-px bg-primary/30" />
        <div className="flex items-center gap-1 mx-2">
          {aces.map((ace) => (
            <div key={ace.alt} style={{ position: "relative", display: "inline-block", width: 90, height: 120 }}>
              <Image
                src={ace.src}
                alt={ace.alt}
                fill
                className="opacity-60 hover:opacity-100 transition-opacity object-contain"
              />
            </div>
          ))}
        </div>
        <div className="w-12 h-px bg-primary/30" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center py-3"
    >
      <div className="w-3 md:w-5 h-px bg-gradient-to-r from-transparent to-primary/30" />
      <div className="flex items-center gap-1 mx-1">
        {aces.map((ace) => (
          <motion.div
            key={ace.alt}
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ position: "relative", display: "inline-block", width: 120, height: 180 }}
          >
            <Image
              src={ace.src}
              alt={ace.alt}
              fill
              className="drop-shadow-lg object-contain"
            />
          </motion.div>
        ))}
      </div>
      <div className="w-3 md:w-5 h-px bg-gradient-to-l from-transparent to-primary/30" />
    </motion.div>
  )
}
