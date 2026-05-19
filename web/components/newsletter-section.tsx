"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { OrosSuit } from "@/components/spanish-suits"
import { Mail, CheckCircle, Loader2 } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    // Simulate sending - replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setStatus("success")
    setEmail("")
  }

  return (
    <section id="contacto" className="py-24 md:py-32 relative overflow-hidden">
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
            Mantente informado
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4 text-balance">
            No te pierdas nada
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="mt-6 text-muted-foreground max-w-lg mx-auto text-pretty leading-relaxed">
            Recibe noticias sobre eventos, torneos y contenido exclusivo del
            mundo del Chiribito directamente en tu correo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12"
        >
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 bg-secondary border border-primary/40 rounded-lg p-10"
            >
              <CheckCircle className="w-12 h-12 text-primary" />
              <p className="font-serif text-2xl text-foreground">
                {"Bienvenido al club"}
              </p>
              <p className="text-sm text-muted-foreground text-center text-pretty">
                Te hemos añadido a nuestra lista. Pronto recibirás noticias
                del mundo del Chiribito.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  required
                  className="w-full h-14 pl-12 pr-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-14 px-8 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Suscribirme"
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-muted-foreground/60 text-center mt-4">
            Sin spam. Solo contenido de valor. Puedes darte de baja cuando quieras.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
