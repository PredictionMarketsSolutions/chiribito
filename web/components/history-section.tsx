"use client"

import { motion } from "framer-motion"
import { Landmark, Crown, MapPin, Shield } from "lucide-react"
import Image from "next/image"

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7 },
}

export function HistorySection() {

  return (
    <section id="historia" className="py-16 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div {...fadeInUp} className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Orígenes
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Una historia de humo, cartas y leyenda
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
        </motion.div>

        {/* Intro paragraph with image */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
              El Chiribito, conocido también como póker sintético, es una
              variante de póker clásico popular en España, especialmente durante
              la época de partidas clandestinas en bares o clubes privados antes
              de la llegada del Texas Hold{"'"}em. Fue la modalidad reina en
              España durante años.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground mt-6 text-pretty">
              Los participantes solían utilizar pesetas y billetes grandes antes
              de la introducción del euro. Las partidas clandestinas se
              convirtieron en rituales secretos, desde sótanos de la Gran Vía
              hasta las trastiendas de los cafés castizos.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border"
          >
            <Image
              src="/images/madrid-casino.jpg"
              alt="Interior de un club social madrileño de los años 60"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/20" />
          </motion.div>
        </div>

        {/* Iconic venues */}
        <motion.div {...fadeInUp} className="mb-24">
          <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-10 text-center">
            Los templos del Chiribito
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Landmark,
                name: "Círculo de Bellas Artes",
                label: "La Casa Madre",
                description:
                  "El epicentro del Chiribito madrileño. Aquí se forjaron las reglas no escritas y las rivalidades legendarias que definieron el juego.",
              },
              {
                icon: Crown,
                name: "Jockey Club",
                label: "La Élite",
                description:
                  "Entre aristócratas y empresarios, las partidas del Jockey elevaron el Chiribito a un arte de la alta sociedad madrileña.",
              },
              {
                icon: MapPin,
                name: "Tiro de Pichón de Somontes",
                label: "El Refugio",
                description:
                  "A las afueras de Madrid, este exclusivo recinto ofrecía la discreción perfecta para las partidas más importantes.",
              },
            ].map((venue, index) => (
              <motion.div
                key={venue.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="bg-card border border-border rounded-lg p-8 group hover:border-primary/50 transition-colors duration-300"
              >
                <venue.icon className="w-8 h-8 text-primary mb-4" />
                <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">
                  {venue.label}
                </p>
                <h4 className="font-serif text-xl text-foreground mb-3">
                  {venue.name}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {venue.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Legend - El Cabezon */}
        <motion.div
          {...fadeInUp}
          className="relative bg-card border border-primary/30 rounded-lg p-10 md:p-14"
        >
          <div className="absolute top-6 right-8">
            <Shield className="w-10 h-10 text-primary/20" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            La leyenda
          </span>
          <h3 className="font-serif text-3xl md:text-4xl text-foreground mt-3 mb-6">
            {'José Roldán "El Cabezón de Elche"'}
          </h3>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl text-pretty">
            Ningún nombre resuena con más fuerza en la historia del Chiribito que
            el de José Roldán. Apodado {'\"El Cabezón de Elche\"'}, fue el eterno
            rey del juego, un maestro de la lectura de rivales y la gestión del
            riesgo. Su dominio en las mesas del Círculo de Bellas Artes fue tan
            absoluto que su nombre se convirtió en sinónimo del Chiribito mismo.
            Decían que podía leer las cartas de un rival con solo mirarle a los
            ojos.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
