"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"

// Fewer, calmer particles so the table and title lead (B3)
const particles = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  delay: (i * 0.7) % 8,
  duration: 9 + (i % 4) * 2,
  size: 2 + (i % 2),
}))

export function HeroSection() {
  const { scrollYProgress } = useScroll()
  const bgY = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.74, 0.90])
  const contentY = useTransform(scrollYProgress, [0, 0.5], ["0%", "12%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background: the Chiribito table in close-up (B2) */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image
          src="/images/chiribito-table.jpg"
          alt="Mesa de Chiribito con cartas españolas y fichas"
          fill
          className="object-cover scale-110"
          priority
        />
      </motion.div>
      {/* Green felt tint to align the warm photo with the Chiribito identity */}
      <div className="absolute inset-0 bg-[oklch(0.24_0.08_155)]/45" />
      {/* Warm cenital light over the table (B5) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_36%,oklch(0.58_0.10_85/0.30)_0%,transparent_72%)]" />
      {/* Dark overlay that intensifies on scroll (lighter than before so the table shows) */}
      <motion.div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.12_0.01_160)_100%)]" />

      {/* A few calm golden particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full bg-primary/50"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Soft smoke at the bottom (single subtle layer) */}
      <div className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none">
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/50 via-background/10 to-transparent"
          style={{ animation: 'smoke-drift 14s ease-in-out infinite' }}
        />
      </div>

      <motion.div className="relative z-10 flex flex-col items-center text-center px-6 pt-24" style={{ y: contentY, opacity: contentOpacity }}>
        {/* Kicker */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary/70 mb-6"
        >
          El póker que se jugaba en Madrid
        </motion.span>

        {/* Title with shimmer effect */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-balance leading-[0.9] text-shimmer"
        >
          CHIRIBITO
        </motion.h1>

        {/* Gold divider with suit icons */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex items-center gap-4 my-6"
        >
          <div className="w-16 md:w-24 h-px bg-primary/40" />
          <div className="flex items-center gap-2">
            {[
              { src: "/ace-oros.png", alt: "As de Oros", w: 1200, h: 1859 },
              { src: "/ace-copas.png", alt: "As de Copas", w: 1200, h: 1820 },
              { src: "/ace-espada.png", alt: "As de Espadas", w: 1200, h: 1784 },
              { src: "/ace-bastos.png", alt: "As de Bastos", w: 1200, h: 1881 },
            ].map((ace) => (
              <Image
                key={ace.alt}
                src={ace.src}
                alt={ace.alt}
                width={ace.w}
                height={ace.h}
                className="object-contain shrink-0 w-7 h-auto"
              />
            ))}
          </div>
          <div className="w-16 md:w-24 h-px bg-primary/40" />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="font-serif text-lg md:text-2xl text-primary italic"
        >
          El Alma del Póker Español
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-8 text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty"
        >
          Nacido en la clandestinidad madrileña de los años 50, el Chiribito es
          mucho más que un juego de cartas. Es una tradición, una hermandad y el
          secreto mejor guardado de los círculos selectos de España.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-10"
        >
          <a
            href="https://play.chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-lg px-10 py-4 rounded-lg shadow-gold hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300"
          >
            Jugar ahora
          </a>
        </motion.div>

      </motion.div>

    </section>
  )
}
