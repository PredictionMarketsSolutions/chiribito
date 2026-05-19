"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const comparisons = [
  {
    aspect: "Baraja",
    chiribito: "Baraja española de 28 cartas: 5, 6, 7, Sota, Caballo, Rey y As",
    holdem: "52 cartas completa",
  },
  {
    aspect: "Cartas en mano",
    chiribito: "2 (obligatorio usar ambas)",
    holdem: "2 (puedes usar 0, 1 o 2)",
  },
  {
    aspect: "Cartas comunitarias",
    chiribito: "5 (reveladas una a una)",
    holdem: "5 (3+1+1)",
  },
  {
    aspect: "Rondas de apuestas",
    chiribito: "6 rondas",
    holdem: "4 rondas",
  },
  {
    aspect: "Ciegas obligatorias",
    chiribito: false,
    holdem: true,
  },
  {
    aspect: "Sentido del reparto",
    chiribito: "Antihorario",
    holdem: "Horario",
  },
  {
    aspect: "Color vs Full",
    chiribito: "Color GANA al Full",
    holdem: "Full gana al Color",
    highlight: true,
  },
  {
    aspect: "Frecuencia de escaleras",
    chiribito: "Muy alta",
    holdem: "Normal",
  },
  {
    aspect: "Mejor mano inicial",
    chiribito: "S/7s (La Perla)",
    holdem: "A/A",
  },
]

export function ComparativaSection() {
  return (
    <section id="comparativa" className="py-24 md:py-32 relative">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Las Diferencias
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Chiribito vs Texas Hold{"'"}em
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed text-pretty">
            Aunque comparten raíces, el Chiribito tiene reglas únicas que cambian completamente la estrategia del juego.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-secondary/50 border-b border-border">
            <div className="p-4 md:p-6 text-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Aspecto
              </span>
            </div>
            <div className="p-4 md:p-6 text-center border-x border-border">
              <span className="font-serif text-lg md:text-xl text-primary">
                Chiribito
              </span>
            </div>
            <div className="p-4 md:p-6 text-center">
              <span className="font-serif text-lg md:text-xl text-muted-foreground">
                Texas Hold{"'"}em
              </span>
            </div>
          </div>

          {/* Table Rows */}
          {comparisons.map((row, index) => (
            <motion.div
              key={row.aspect}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`grid grid-cols-3 border-b border-border last:border-b-0 ${
                row.highlight ? "bg-primary/5" : ""
              }`}
            >
              <div className="p-4 md:p-5 flex items-center">
                <span className={`text-sm ${row.highlight ? "text-primary font-semibold" : "text-foreground"}`}>
                  {row.aspect}
                </span>
              </div>
              <div className="p-4 md:p-5 flex items-center justify-center border-x border-border">
                {typeof row.chiribito === "boolean" ? (
                  row.chiribito ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground" />
                  )
                ) : (
                  <span className={`text-sm text-center ${row.highlight ? "text-primary font-bold" : "text-foreground"}`}>
                    {row.chiribito}
                  </span>
                )}
              </div>
              <div className="p-4 md:p-5 flex items-center justify-center">
                {typeof row.holdem === "boolean" ? (
                  row.holdem ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground" />
                  )
                ) : (
                  <span className={`text-sm text-center ${row.highlight ? "text-muted-foreground" : "text-muted-foreground"}`}>
                    {row.holdem}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground italic">
            {"La diferencia clave: en Chiribito el Color gana al Full, y debes usar tus dos cartas obligatoriamente."}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
