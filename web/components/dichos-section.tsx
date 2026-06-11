"use client"

import { motion } from "framer-motion"

// Castizo table sayings — atmosphere of the parroquia, no fake metrics, no people.
// Uses the locked vocabulary (envidarse, bote, la Perla, Color manda, pasar, tirar...).
// A saying may carry an optional `nota` that explains its jargon.
const dichos: { texto: string; nota?: string }[] = [
  { texto: "Quien no se envida, no gana bote." },
  { texto: "La Perla se canta una vez; no la dejes pasar." },
  { texto: "Color manda — y que no te lo discuta nadie." },
  { texto: "Más vale un buen farol que una mala pareja." },
  { texto: "Pasar no es de cobardes; tirar a destiempo, sí." },
  {
    texto: "La eterna lucha: la escalera contra la trucha.",
    nota: "La trucha es la tercia —tres cartas iguales, como 7-7-7—: muerde porque va invisible. La escalera, en cambio, se ve venir. El duelo de siempre en la mesa.",
  },
  { texto: "El que mira las cartas del vecino, paga la ronda." },
  { texto: "El Chiribito no se juega con prisa ni con sed." },
  { texto: "Quien reparte, comparte… menos las cartas." },
]

export function DichosSection() {
  return (
    <section id="parroquia" className="py-16 md:py-32 relative">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            La parroquia
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Lo que se dice en la mesa
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto text-pretty leading-relaxed">
            Refranes y verdades de tantas noches de Chiribito. Sabiduría de
            parroquia, servida sin prisa.
          </p>
        </motion.div>

        {/* Sayings wall */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {dichos.map((dicho, index) => (
            <motion.blockquote
              key={dicho.texto}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
              className="bg-card border border-border rounded-lg p-6 group hover:border-primary/50 transition-colors duration-300"
            >
              <span className="block font-serif text-4xl text-primary/40 leading-none mb-1" aria-hidden="true">
                {"“"}
              </span>
              <p className="font-serif text-lg text-foreground italic leading-relaxed">
                {dicho.texto}
              </p>
              {dicho.nota && (
                <p className="mt-3 pt-3 border-t border-border/60 font-sans not-italic text-sm text-muted-foreground leading-relaxed">
                  {dicho.nota}
                </p>
              )}
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
