"use client"

import { motion } from "framer-motion"
import { Mail, Headset, CalendarDays, ChevronRight } from "lucide-react"
import { OrosSuit } from "@/components/spanish-suits"
import Link from "next/link"

const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/chiribito293/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61585284057550",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/chiribito-com/?viewAsMember=true",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@Chiribito293",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="oklch(0.18 0.01 160)" />
      </svg>
    ),
  },
]

export default function ContactoPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group min-h-[44px]">
            <OrosSuit className="w-5 h-5 text-primary" />
            <span className="font-serif text-lg text-foreground tracking-wide">
              Chiribito
            </span>
          </Link>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="inline-flex items-center min-h-[44px] px-1 text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            <span className="text-primary font-medium">Contacto</span>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-28">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Contacto
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Hablemos
          </h1>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="text-muted-foreground mt-6 max-w-lg mx-auto leading-relaxed text-pretty">
            {"¿Tienes alguna pregunta, propuesta o quieres organizar un evento? Estamos a tu disposición."}
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-colors duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Headset className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-foreground">
                  {"Atención y Soporte"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Dudas, ayuda y asistencia general
                </p>
              </div>
            </div>
            <a
              href="mailto:support@chiribito.com"
              className="inline-flex items-center gap-2 text-primary hover:brightness-110 transition-all duration-300 font-medium"
            >
              <Mail className="w-4 h-4" />
              support@chiribito.com
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-colors duration-300"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-foreground">
                  {"Eventos y Gestión"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Torneos, colaboraciones y prensa
                </p>
              </div>
            </div>
            <a
              href="mailto:management@chiribito.com"
              className="inline-flex items-center gap-2 text-primary hover:brightness-110 transition-all duration-300 font-medium"
            >
              <Mail className="w-4 h-4" />
              management@chiribito.com
            </a>
          </motion.div>
        </div>

        {/* Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <h3 className="font-serif text-2xl text-foreground mb-2">
            {"Síguenos"}
          </h3>
          <p className="text-sm text-muted-foreground mb-8">
            {"Encuéntranos en redes sociales"}
          </p>

          <div className="flex items-center justify-center gap-4">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">
            {"Un homenaje a la tradición del póker español"}
          </p>
        </div>
      </footer>
    </div>
  )
}
