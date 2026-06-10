"use client"

import { motion } from "framer-motion"

const events = [
  {
    year: "1950",
    title: "El nacimiento",
    description:
      "Los militares americanos de la base de Torrejón traen sus juegos de cartas a Madrid. El póker comienza a fusionarse con la tradición local.",
  },
  {
    year: "1955",
    title: "La clandestinidad",
    description:
      "Bajo la Ley de Vagos y Maleantes, las partidas se esconden en sótanos y trastiendas. El juego se perfecciona en secreto.",
  },
  {
    year: "1965",
    title: "Los círculos selectos",
    description:
      "El Chiribito llega al Círculo de Bellas Artes, el Jockey Club y otros centros de la élite madrileña. Se consolidan las reglas.",
  },
  {
    year: "1975",
    title: "La transición",
    description:
      "Con la democracia llega una apertura. Las partidas salen de la clandestinidad, aunque mantienen su carácter exclusivo y reservado.",
  },
  {
    year: "1985",
    title: "La edad de oro",
    description:
      "El Chiribito vive su apogeo. Grandes fortunas se ganan y se pierden en las noches interminables de los mejores clubes de Madrid.",
  },
  {
    year: "1995",
    title: "La nueva generación",
    description:
      "Una nueva hornada de jugadores toma el relevo, aportando nuevas estrategias pero respetando la esencia y la tradición del juego.",
  },
  {
    year: "2005",
    title: "Legado vivo",
    description:
      "El Chiribito pervive como un tesoro cultural, un juego que conecta generaciones y mantiene viva la tradición del póker español.",
  },
  {
    year: "2026",
    title: "El renacer",
    description:
      "Eclipsado durante años por el Texas Hold'em, el Chiribito parecía condenado al olvido. En 2026 renace como un proyecto vivo y abierto: la mesa que vivía en los sótanos cabe ahora en una pantalla, al alcance de cualquiera. Lo que se jugaba a escondidas vuelve a repartirse, con la misma alma castiza de siempre.",
  },
]

export function TimelineSection() {
  return (
    <section id="cronologia" className="py-16 md:py-32 bg-card relative">
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
            Cronología
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            De 1950 a hoy
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

          <div className="flex flex-col gap-12 md:gap-16">
            {events.map((event, index) => (
              <motion.div
                key={event.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div
                  className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                    index % 2 === 0
                      ? "md:pr-12 md:text-right"
                      : "md:pl-12 md:text-left"
                  }`}
                >
                  <span className="font-serif text-4xl md:text-5xl font-bold text-primary">
                    {event.year}
                  </span>
                  <h3 className="font-serif text-xl text-foreground mt-2 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1.5 mt-2 md:mt-0 border-2 border-background" />

                {/* Spacer for the other side */}
                <div className="hidden md:block md:w-[calc(50%-2rem)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/20" />
    </section>
  )
}
