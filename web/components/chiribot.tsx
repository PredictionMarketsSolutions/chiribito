"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Send, X } from "lucide-react"
import { FAQS, GREETING, FALLBACK, faqById, matchFaq, type FaqEntry } from "@/lib/chiribot-faq"

type Msg = { id: number; role: "bot" | "user"; text: string }

const BASE_IDS = FAQS.map((f) => f.id)
const PLAY_URL = "https://play.chiribito.com"
const STORAGE_KEY = "chiribot-open"

// The monogram avatar — the house mark, no invented mascot (identity guardrail).
function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center rounded-full bg-card border border-primary/60 font-serif text-primary leading-none select-none ${className}`}
    >
      C
    </span>
  )
}

export function Chiribot() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ id: 0, role: "bot", text: GREETING }])
  const [suggestions, setSuggestions] = useState<string[]>(BASE_IDS)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState("")

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduce = useReducedMotion()

  // Restore open/closed within the session (no aggressive auto-open — anti-casino).
  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0")
    }
  }, [open, mounted])

  // Esc to close + click outside to close, only while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open])

  // Manage focus: panel on open, trigger on close.
  useEffect(() => {
    if (!mounted) return
    if (open) panelRef.current?.focus()
    else triggerRef.current?.focus()
  }, [open, mounted])

  // Autoscroll to the latest message / typing indicator.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" })
  }, [messages, typing, reduce])

  // Clean up a pending "typing" timer if unmounted.
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const pushMsg = (role: Msg["role"], text: string) => {
    setMessages((prev) => [...prev, { id: idRef.current++, role, text }])
  }

  const answer = (faq: FaqEntry | null) => {
    setSuggestions([])
    setTyping(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setTyping(false)
      pushMsg("bot", faq ? faq.respuesta : FALLBACK)
      setSuggestions(faq?.relacionadas?.length ? faq.relacionadas : BASE_IDS)
    }, reduce ? 200 : 700)
  }

  const ask = (faq: FaqEntry) => {
    pushMsg("user", faq.pregunta)
    answer(faq)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || typing) return
    pushMsg("user", text)
    setInput("")
    answer(matchFaq(text, FAQS))
  }

  if (!mounted) return null

  return (
    <>
      {/* Closed trigger — circular, gold-on-dark, with a micro-label (anti-casino, sober). */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <AnimatePresence>
          {!open && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="hidden sm:block glass-card rounded-full px-3 py-1.5 text-xs text-foreground/90"
            >
              ¿Dudas? Pregunta al Chiribot
            </motion.span>
          )}
        </AnimatePresence>
        <button
          ref={triggerRef}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar el Chiribot" : "Abrir el Chiribot — preguntas del juego"}
          aria-expanded={open}
          title="Chiribot"
          className="grid h-14 w-14 place-items-center rounded-full bg-card border border-primary/60 shadow-gold-lg hover:brightness-110 hover:border-primary transition-all duration-300 focus-visible:outline-none"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
                <X className="h-6 w-6 text-primary" />
              </motion.span>
            ) : (
              <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} className="font-serif text-2xl text-primary leading-none">
                C
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Chiribot — preguntas frecuentes del Chiribito"
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
            style={{ transformOrigin: "bottom right" }}
            className="glass-card fixed z-40 flex flex-col overflow-hidden rounded-2xl bottom-24 right-6 w-[min(380px,calc(100vw-3rem))] max-h-[70vh] max-sm:inset-x-4 max-sm:right-4 max-sm:bottom-24 max-sm:w-auto focus-visible:outline-none"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Monogram className="h-9 w-9 text-base" />
              <div className="min-w-0">
                <p className="font-serif text-lg text-foreground leading-tight">Chiribot</p>
                <p className="text-xs text-muted-foreground leading-tight">El alma del juego, a tu mano</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="ml-auto grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3 }}
                  className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2"}
                >
                  {m.role === "bot" && <Monogram className="mt-0.5 h-7 w-7 shrink-0 text-xs" />}
                  <p
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground leading-relaxed"
                        : "max-w-[85%] rounded-2xl rounded-tl-sm bg-card/80 border border-border px-3.5 py-2 text-sm text-foreground leading-relaxed"
                    }
                  >
                    {m.text}
                  </p>
                </motion.div>
              ))}

              {typing && (
                <div className="flex items-center gap-2" aria-label="Chiribot está escribiendo">
                  <Monogram className="h-7 w-7 shrink-0 text-xs" />
                  <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-card/80 border border-border px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-primary/70"
                        animate={reduce ? {} : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                </div>
              )}

              {/* Suggested question chips */}
              {!typing && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((id) => {
                    const faq = faqById(id)
                    if (!faq) return null
                    return (
                      <button
                        key={id}
                        onClick={() => ask(faq)}
                        className="min-h-[40px] rounded-full border border-primary/30 px-3.5 py-1.5 text-left text-sm text-primary hover:bg-primary/10 hover:border-primary/60 transition-colors"
                      >
                        {faq.pregunta}
                      </button>
                    )
                  })}
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Composer + CTA */}
            <div className="border-t border-border/60 p-3 space-y-2">
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta…"
                  aria-label="Escribe tu pregunta al Chiribot"
                  className="min-h-[44px] flex-1 rounded-lg bg-background/60 border border-input px-3 text-sm text-foreground placeholder:text-muted-foreground/70"
                />
                <button
                  type="submit"
                  aria-label="Enviar pregunta"
                  disabled={!input.trim() || typing}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              <a
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-secondary/40 border border-border px-3 py-2 text-center text-sm font-medium text-primary hover:bg-secondary/60 transition-colors"
              >
                Sentarse a la mesa ↗
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
