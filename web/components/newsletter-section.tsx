"use client"

import { motion } from "framer-motion"
import { Instagram } from "lucide-react"
import { OrosSuit } from "@/components/spanish-suits"

export function NewsletterSection() {
  return (
    <section id="contacto" className="py-16 md:py-32 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-10 left-10">
          <OrosSuit className="w-32 h-32 text-primary" />
        </div>
        <div className="absolute bottom-10 right-10">
          <OrosSuit className="w-48 h-48 text-primary" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <OrosSuit className="w-64 h-64 text-primary" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            La parroquia
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4 text-balance">
            Pronto podrás unirte al círculo
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="mt-6 text-muted-foreground max-w-lg mx-auto text-pretty leading-relaxed">
            La lista para parroquianos abrirá más adelante. De momento, si
            quieres seguir la mesa, lo más cerca está aquí:
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex justify-center"
        >
          <a
            href="https://www.instagram.com/chiribito293/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 h-14 px-8 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 transition-all duration-300"
          >
            <Instagram className="w-5 h-5" />
            Síguenos en Instagram
          </a>
        </motion.div>
      </div>
    </section>
  )
}
