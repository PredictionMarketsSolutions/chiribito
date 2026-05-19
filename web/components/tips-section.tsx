"use client"

import { motion } from "framer-motion"
import { AlertTriangle, Trophy, TrendingDown, Gem } from "lucide-react"

const tips = [
  {
    icon: Gem,
    title: "La Perla",
    description:
      "S/7s (Sota y 7 del mismo palo) es la mejor mano inicial pre-flop. Al jugar del 5 al As, es la única mano central que completa todas las escaleras posibles. Esta combinación es conocida como 'La Perla'. Su equivalente jugando con baraja francesa es J/Ts.",
    highlight: true,
  },
  {
    icon: Trophy,
    title: "El Color gana al Full",
    description:
      "A diferencia del póker estándar, en el Chiribito el Color (Flush) vence al Full House. Esta es la regla más importante que todo jugador debe recordar.",
    highlight: true,
  },
  {
    icon: AlertTriangle,
    title: "Escaleras y Fulls son frecuentes",
    description:
      "Con una baraja reducida de 28 cartas, las escaleras y los fulls aparecen con mucha más frecuencia que en el póker convencional. Ajusta tu valoración.",
    highlight: false,
  },
  {
    icon: TrendingDown,
    title: "Doble pareja pierde valor",
    description:
      "Las dobles parejas, una mano fuerte en el póker clásico, pierden su valor en el Chiribito. No te confíes si tienes dos parejas, el rival probablemente lleve algo mejor.",
    highlight: false,
  },
]

export function TipsSection() {
  return (
    <section id="estrategia" className="py-24 md:py-32 bg-card relative">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/20" />

      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Estrategia
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            {'¿Sabías que...?'}
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-pretty">
            El Chiribito tiene sutilezas que lo distinguen de cualquier otro
            póker. Conocer estas diferencias puede ser la línea entre la
            victoria y la derrota.
          </p>
        </motion.div>

        {/* Tips */}
        <div className="flex flex-col gap-8">
          {tips.map((tip, index) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative rounded-lg p-8 md:p-10 border transition-colors duration-300 ${
                tip.highlight
                  ? "bg-secondary border-primary/50"
                  : "bg-background border-border hover:border-primary/30"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
                    tip.highlight ? "bg-primary/20" : "bg-secondary"
                  }`}
                >
                  <tip.icon
                    className={`w-7 h-7 ${
                      tip.highlight ? "text-primary" : "text-primary"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-serif text-2xl mb-3 ${
                      tip.highlight ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {tip.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-pretty">
                    {tip.description}
                  </p>
                </div>
              </div>
              {tip.highlight && (
                <div className="absolute top-4 right-4 text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                  Clave
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/20" />
    </section>
  )
}
