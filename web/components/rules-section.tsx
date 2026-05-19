"use client"

import { motion } from "framer-motion"
import {
  Layers,
  Users,
  Coins,
  Hand,
  Zap,
  ArrowRight,
  CircleDot,
} from "lucide-react"

const mechanics = [
  {
    icon: Layers,
    title: "La Baraja",
    description:
      "Baraja española de 28 cartas: 4 palos (Oros, Copas, Espadas, Bastos) y 7 rangos por palo: 5, 6, 7, Sota (10), Caballo (11), Rey (12) y As. En la baraja francesa equivalente serían 8, 9, 10, J, Q, K y A.",
  },
  {
    icon: Zap,
    title: "El Estilo",
    description:
      'Es una mezcla entre póker tapado y abierto, jugado con estructura "No-Limit".',
  },
  {
    icon: Users,
    title: "El Reparto",
    description:
      "Cada jugador recibe 2 cartas cerradas, repartidas en sentido contrario a las agujas del reloj (al revés que en el Texas Hold'em), y se utilizan 5 cartas comunitarias que se revelan una a una.",
  },
  {
    icon: Hand,
    title: "Regla de Oro",
    description:
      "Es absolutamente obligatorio jugar utilizando las dos cartas que tienes en tu mano.",
  },
]

const bettingRounds = [
  {
    step: "1",
    title: "Inicio",
    description:
      "No hay apuesta ciega. Todos los jugadores apuestan por orden hasta el repartidor, pudiendo envidarse (ir all-in) en cualquier momento.",
  },
  {
    step: "2",
    title: "Primera Carta",
    description:
      "Se levanta la primera comunitaria. El primero en hablar es el jugador que re-subió la jugada anterior.",
  },
  {
    step: "3",
    title: "Cartas Siguientes",
    description:
      "Al levantar la siguiente carta, habla el jugador que apostó en primer lugar o que re-subió en la ronda de la primera carta.",
  },
  {
    step: "4",
    title: "Hasta el Final",
    description:
      "Esta mecánica de apuestas se repite sucesivamente hasta llegar a la última carta (river).",
  },
]

export function RulesSection() {
  return (
    <section id="mecanica" className="py-24 md:py-32 relative felt-texture">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            El Juego
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Mecánica del Juego
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
        </motion.div>

        {/* Mechanics grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {mechanics.map((rule, index) => (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card border border-border rounded-lg p-8 group hover:border-primary/50 transition-colors duration-300"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <rule.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl text-foreground">
                  {rule.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {rule.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Betting Rounds */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <Coins className="w-6 h-6 text-primary" />
            <h3 className="font-serif text-2xl md:text-3xl text-foreground text-center">
              Rondas de Apuestas
            </h3>
          </div>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Como las 5 cartas comunitarias se muestran de una en una (generando
            un total de 6 rondas de apuestas), se necesita un stack importante
            para aguantar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bettingRounds.map((round, index) => (
            <motion.div
              key={round.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="relative bg-card border border-border rounded-lg p-6 group hover:border-primary/50 transition-colors duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">
                    {round.step}
                  </span>
                </div>
                <h4 className="font-serif text-lg text-foreground">
                  {round.title}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {round.description}
              </p>
              {index < bettingRounds.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-primary/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
