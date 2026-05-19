"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import { OrosSuit, CopasSuit, EspadasSuit, BastosSuit } from "@/components/spanish-suits"

// Generate particle positions deterministically
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 17) % 100}%`,
  delay: (i * 0.5) % 8,
  duration: 8 + (i % 4) * 2,
  size: 2 + (i % 3),
}))

export function HeroSection() {
  const { scrollYProgress } = useScroll()
  const bgY = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.8, 0.95])
  const contentY = useTransform(scrollYProgress, [0, 0.5], ["0%", "12%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with parallax */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image
          src="/images/hero-casino.jpg"
          alt="Salón de cartas madrileño, años 50"
          fill
          className="object-cover scale-110"
          priority
        />
      </motion.div>
      {/* Dark overlay that intensifies on scroll */}
      <motion.div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.12_0.01_160)_100%)]" />

      {/* Floating golden particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full bg-primary/60"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Smoke/fog effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent"
          style={{ animation: 'smoke-drift 12s ease-in-out infinite' }}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"
          style={{ animation: 'smoke-drift 15s ease-in-out 3s infinite reverse' }}
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
              { src: "/ace-oros.png", alt: "As de Oros" },
              { src: "/ace-copas.png", alt: "As de Copas" },
              { src: "/ace-espada.png", alt: "As de Espadas" },
              { src: "/ace-bastos.png", alt: "As de Bastos" },
            ].map((ace) => (
              <div key={ace.alt} style={{ position: "relative", display: "inline-block", width: 28, height: 42 }}>
                <Image
                  src={ace.src}
                  alt={ace.alt}
                  fill
                  className="object-contain"
                />
              </div>
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

        {/* Open Source mention */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-4 text-xs md:text-sm text-muted-foreground/60 max-w-xl mx-auto"
        >
          Este es un proyecto{" "}
          <a
            href="https://github.com/PredictionMarketsSolutions/chiribito"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/80 hover:text-primary underline transition-colors"
          >
            open source
          </a>
        </motion.p>

        {/* CTA Button with pulse animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-10"
        >
          <motion.a
            href="https://play.chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 20px 0px rgba(212, 175, 55, 0.3), 0 10px 30px -5px rgba(212, 175, 55, 0.3)",
                "0 0 40px 8px rgba(212, 175, 55, 0.5), 0 20px 50px -5px rgba(212, 175, 55, 0.5)",
                "0 0 20px 0px rgba(212, 175, 55, 0.3), 0 10px 30px -5px rgba(212, 175, 55, 0.3)",
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
            className="relative inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-lg px-10 py-4 rounded-lg transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">JUGAR PARTIDA</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </motion.a>
        </motion.div>

        {/* Scroll indicator with smooth scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-16"
        >
          <motion.button
            onClick={() => {
              document.getElementById("historia")?.scrollIntoView({ behavior: "smooth" })
            }}
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2 cursor-pointer hover:text-primary transition-colors duration-300"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
              Descubre la historia
            </span>
            <div className="w-px h-8 bg-primary/40" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}
