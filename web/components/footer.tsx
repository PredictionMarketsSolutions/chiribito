"use client"

import Link from "next/link"
import Image from "next/image"

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

export function Footer() {
  return (
    <footer className="py-16 border-t border-primary/20 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[oklch(0.12_0.01_160)]" />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <Image
            src="/logo-chiribito-circular.png"
            alt="Chiribito"
            width={180}
            height={180}
            className="drop-shadow-lg"
          />
          <p className="text-sm text-muted-foreground max-w-md text-pretty">
            El Póker Sintético. Nacido en Madrid, jugado en la penumbra,
            inmortalizado en la memoria de quienes tuvieron el privilegio de
            sentarse a la mesa.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="w-11 h-11 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
              >
                {social.icon}
              </a>
            ))}
          </div>

          <div className="w-16 h-px bg-primary/30" />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/contacto" className="inline-flex items-center min-h-[44px] px-2 hover:text-primary transition-colors duration-300">
              Contacto
            </Link>
            <span className="px-2">{"support@chiribito.com"}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
