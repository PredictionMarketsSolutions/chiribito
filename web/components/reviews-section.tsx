"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

export function ReviewsSection() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">Lo que dicen nuestros jugadores</h2>
            <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            La confianza se gana en la mesa. Descubre por qué miles de jugadores nos eligen cada día para disfrutar de la mejor experiencia de juego.
          </p>
        </div>

        {/* Logo and CTA */}
        <div className="flex flex-col items-center gap-12">
          {/* Trustpilot Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Trustpilot Stars */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 fill-green-500 text-green-500" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Basado en reseñas verificadas</p>
          </motion.div>

          {/* CTA Button */}
          <motion.a
            href="https://es.trustpilot.com/review/chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:brightness-110 transition-all duration-300 group"
          >
            Ver opiniones en Trustpilot
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </motion.a>
        </div>
      </div>
    </section>
  )
}
