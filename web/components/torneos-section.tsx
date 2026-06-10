"use client"

import { motion } from "framer-motion"
import { Trophy, Calendar, Crown, Users } from "lucide-react"

const torneos = [
  {
    icon: Users,
    title: "Mesas de la parroquia",
    description:
      "Siéntate con la peña y echa unas manos de Chiribito. Aquí no se juega por dinero real: se juega por el gusto de jugar y por la gloria de cantar la Perla.",
    highlight: false,
  },
  {
    icon: Calendar,
    title: "Torneos · próximamente",
    description:
      "Estamos preparando los primeros torneos de la parroquia. Aún no hay calendario: cuando abran, lo contaremos aquí y en Instagram.",
    highlight: false,
  },
  {
    icon: Crown,
    title: "El Gran Torneo",
    description:
      "La cita que perseguimos: juntar a la mejor peña a por la gloria absoluta. Todavía no existe, pero hacia ahí vamos, mano a mano.",
    highlight: true,
  },
]

export function TorneosSection() {
  return (
    <section id="torneos" className="py-16 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Competición
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Torneos
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-pretty">
            La competición del Chiribito, a fuego lento. Esto es lo que se cuece
            en la mesa — y lo que está por llegar.
          </p>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
        </motion.div>

        {/* Torneos grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {torneos.map((torneo, index) => (
            <motion.div
              key={torneo.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`relative rounded-lg p-8 group transition-all duration-300 ${
                torneo.highlight
                  ? "glass-card gradient-border shadow-gold-lg"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              {torneo.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                    Destacado
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                    torneo.highlight ? "bg-primary/20" : "bg-secondary"
                  }`}
                >
                  <torneo.icon
                    className={`w-6 h-6 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}
                  />
                </div>
                <h3
                  className={`font-serif text-lg ${
                    torneo.highlight ? "text-primary" : "text-foreground"
                  }`}
                >
                  {torneo.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {torneo.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <a
            href="https://play.chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:brightness-110 transition-all duration-300"
          >
            Jugar ahora
          </a>
        </motion.div>
      </div>
    </section>
  )
}
