"use client"

import { motion } from "framer-motion"
import { Gift, Sparkles, Star, Zap } from "lucide-react"

const bonos = [
  {
    icon: Sparkles,
    title: "Bono de Bienvenida",
    description:
      "Multiplicamos tu primer deposito al 100% para que empieces a jugar con ventaja desde el primer momento.",
    highlight: true,
  },
  {
    icon: Zap,
    title: "Recompensas Diarias",
    description:
      "Solo por iniciar sesion y jugar tus primeras manos del dia, recibiras tiradas gratis, tickets para torneos o saldo extra.",
    highlight: false,
  },
  {
    icon: Star,
    title: "Club VIP / Fidelidad",
    description:
      "Cuanto mas juegues, mas subes de nivel. Desbloquea bonos exclusivos, devoluciones (cashback) y atencion personalizada.",
    highlight: false,
  },
]

export function BonosSection() {
  return (
    <section id="bonos" className="py-24 md:py-32 relative bg-secondary/20 felt-texture">
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
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Promociones
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Bonos Exclusivos
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-pretty">
            Queremos que empieces con buen pie y recompensar tu lealtad en cada
            partida. Multiplica tus opciones de ganar.
          </p>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
        </motion.div>

        {/* Bonos grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {bonos.map((bono, index) => (
            <motion.div
              key={bono.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`relative rounded-lg p-8 group transition-all duration-300 ${
                bono.highlight
                  ? "glass-card gradient-border shadow-gold-lg"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              {bono.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                    bono.highlight ? "bg-primary/20" : "bg-secondary"
                  }`}
                >
                  <bono.icon
                    className={`w-6 h-6 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}
                  />
                </div>
                <h3
                  className={`font-serif text-lg ${
                    bono.highlight ? "text-primary" : "text-foreground"
                  }`}
                >
                  {bono.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bono.description}
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
            Reclamar mi bono
          </a>
        </motion.div>
      </div>
    </section>
  )
}
