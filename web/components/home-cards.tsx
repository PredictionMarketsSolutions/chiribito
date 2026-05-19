"use client"

import { motion } from "framer-motion"
import { Trophy, Gift } from "lucide-react"

export function HomeCards() {
  return (
    <section className="py-16 relative overflow-visible">
      <div className="max-w-6xl mx-auto px-6 overflow-visible">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Torneos Card */}
          <motion.a
            href="#torneos"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById("torneos")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="group relative glass-card gradient-border rounded-xl p-8 overflow-visible cursor-pointer transition-all duration-300 shadow-gold"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/15 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/30 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300">
                  <Trophy className="w-7 h-7 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors duration-300">
                    Torneos
                  </h3>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Compite y gana
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Enfrentate a jugadores de todo el mundo en torneos diarios, 
                semanales y eventos especiales con grandes premios.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all duration-300">
                Ver torneos
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </motion.a>

          {/* Bonos Card */}
          <motion.a
            href="#bonos"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById("bonos")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="group relative glass-card gradient-border rounded-xl p-8 overflow-visible cursor-pointer transition-all duration-300 shadow-gold"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/15 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/30 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300">
                  <Gift className="w-7 h-7 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors duration-300">
                    Bonos
                  </h3>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Promociones exclusivas
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Multiplica tus opciones con bonos de bienvenida, recompensas 
                diarias y beneficios del Club VIP.
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all duration-300">
                Ver bonos
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </motion.a>
        </div>
      </div>
    </section>
  )
}
