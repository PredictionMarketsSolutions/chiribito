"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Image from "next/image"

const links = [
  { label: "Simulador", href: "#simulador" },
  { label: "Ranking", href: "#ranking" },
  { label: "Historia", href: "#historia" },
  { label: "Mecánica", href: "#mecanica" },
  { label: "Torneos", href: "#torneos" },
  { label: "Contacto", href: "/contacto" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)

      // Detect active section
      const sections = links
        .filter((l) => l.href.startsWith("#"))
        .map((l) => l.href.slice(1))

      let current = ""
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom > 150) {
            current = sectionId
            break
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-11 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-lg shadow-background/50"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group flex-shrink-0">
          <Image
            src="/logo-chiribito-horizontal.png"
            alt="Chiribito"
            width={100}
            height={100}
            priority
            loading="eager"
            className="h-12 w-12 group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = link.href.startsWith("#") && activeSection === link.href.slice(1)
            const isExternal = !link.href.startsWith("#")
            return isExternal ? (
              <a
                key={link.href}
                href={link.href}
                className="relative text-sm transition-colors duration-300 tracking-wide text-muted-foreground hover:text-primary"
              >
                {link.label}
              </a>
            ) : (
              <button
                key={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.getElementById(link.href.slice(1))
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className={`relative text-sm transition-colors duration-300 tracking-wide ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
          <a
            href="https://play.chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:brightness-110 transition-all duration-300"
          >
            Jugar ahora
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-foreground p-2.5 -mr-2.5"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background/98 backdrop-blur-md border-b border-border overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 gap-4">
              <div className="flex justify-center py-4">
                <Image
                  src="/logo-chiribito-horizontal.png"
                  alt="Chiribito"
                  width={100}
                  height={100}
                  className="drop-shadow-lg h-20 w-20"
                />
              </div>
              {links.map((link) => {
                const isActive = link.href.startsWith("#") && activeSection === link.href.slice(1)
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-sm transition-colors duration-300 tracking-wide py-1 ${isActive
                        ? "text-primary border-l-2 border-primary pl-3"
                        : "text-muted-foreground hover:text-primary"
                      }`}
                  >
                    {link.label}
                  </a>
                )
              })}
              <a
                href="https://play.chiribito.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:brightness-110 transition-all duration-300 mt-2 text-center"
              >
                Jugar ahora
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
