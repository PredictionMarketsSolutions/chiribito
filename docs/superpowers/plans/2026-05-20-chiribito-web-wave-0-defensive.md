# Chiribito Web — Wave 0 (Defensive) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the site from lying, wire the broken main CTAs to the live game, and strip the most obvious v0.dev signatures — all via atomic, reversible commits. Subtractive and defensive only. No new features. No new visual identity. Zero gameplay/runtime mutations.

**Architecture:** 11 atomic commits ordered so deletions happen before the ortografía sweep (avoiding wasted tilde fixes on files that get deleted). Each commit independently reverts. Verification is RDD-style (verify current bad state → apply change → verify resolved) since `web/` has no test runner. Visual sanity uses `preview_*` tools optionally.

**Tech Stack:** Next.js 16.1.6 (App Router) · React 19 · Tailwind 4 · shadcn/Radix · Framer Motion · pnpm. Editor target: `chiri-app/web/`. Git ops from `chiri-app/`.

**Spec source of truth:** `docs/superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md` §6 Wave 0.

**Out of scope (carry-forward to later waves):**
- Section reorder of `page.tsx` per spec §8.3 → Wave 1
- Torneos section rewrite/collapse → Wave 1
- `/contacto` cohesion → Wave 1
- Tone shift on surviving copy → Wave 1
- Capitalization audit → Wave 1
- Funnel CTA hierarchy (secondary CTAs, post-Simulador bridge, footer CTA) → Wave 2
- next/font wiring, mobile pacing, `ignoreBuildErrors` flip → Wave 4

---

## Pre-flight (no changes)

### Task 0: Pre-flight context check

**Files:** read-only

- [ ] **Step 1: Confirm working directory**

```bash
pwd
```
Expected: ends with `chiri-app` (the repo root).

- [ ] **Step 2: Confirm clean baseline state**

```bash
git status --short
git log --oneline -3
```
Expected status (untracked is fine; tracked changes are NOT — fix before proceeding):
```
?? .superpowers/
?? _screenshots/
?? docs/superpowers/plans/2026-05-19-chiribito-gameplay-readability-diagnostic.md
?? docs/superpowers/specs/2026-05-19-chiribito-perceptual-framing-pass-design.md
```
Expected log top:
```
b774865 docs(spec): chiribito web product vision + 5-wave roadmap
7443b4f fix(web): expand Baraja comparativa row to spell out the canonical rank list
e57eb31 fix(web): correct Perla tip with canonical Sota+7 same-suit definition
```
If anything else is staged or modified, stop and check with the user.

- [ ] **Step 3: Skim spec §6 Wave 0**

Read: `docs/superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md` lines covering Wave 0 (search for "Wave 0 — Defensivo"). Confirm the 14 in-scope items match the 11 tasks in this plan.

- [ ] **Step 4 (optional): Start dev server for visual checks**

If visual sanity will be used (recommended for Tasks 5, 6, 7, 8, 9):
```bash
cd web && pnpm install
cd web && pnpm dev
```
Expect "Ready in X ms" + http://localhost:3000.

Leave running in background for the rest of the wave. Reload after each commit via `preview_eval` if needed.

If skipping visual checks, every task's "Step: Visual sanity" becomes a no-op — proceed without dev server.

---

## Task 1: Strip `v0.app` generator from metadata

**Files:**
- Modify: `web/app/layout.tsx:13`

**Why:** §3.3 A1 — production HTML signs itself "made by v0".

- [ ] **Step 1: Confirm the generator field exists**

```bash
grep -n "v0.app" web/app/layout.tsx
```
Expected:
```
13:  generator: 'v0.app',
```

- [ ] **Step 2: Remove the line**

Edit `web/app/layout.tsx`. Remove the entire line `  generator: 'v0.app',` (line 13), keeping surrounding lines intact.

Before:
```ts
  description: 'Descubre la historia del Chiribito, el póker sintético nacido en la clandestinidad madrileña. Reglas, historia y leyendas del juego de cartas más exclusivo de España.',
  generator: 'v0.app',
  icons: {
```

After:
```ts
  description: 'Descubre la historia del Chiribito, el póker sintético nacido en la clandestinidad madrileña. Reglas, historia y leyendas del juego de cartas más exclusivo de España.',
  icons: {
```

- [ ] **Step 3: Verify it's gone**

```bash
grep -n "v0.app" web/app/layout.tsx
```
Expected: (no output)

- [ ] **Step 4: Commit**

```bash
git add web/app/layout.tsx
git commit -m "chore(web): strip v0.app generator from metadata"
```

---

## Task 2: Wire hero + navbar CTAs to play.chiribito.com

**Files:**
- Modify: `web/components/hero-section.tsx:164-189` (Hero CTA `JUGAR PARTIDA`)
- Modify: `web/components/navbar.tsx:111-117` (Desktop nav `Juega Ya`)
- Modify: `web/components/navbar.tsx:165-170` (Mobile menu `Juega Ya`)

**Why:** §3.2 F1/F2 — both primary CTAs are `disabled` ("Próximamente") while `play.chiribito.com` is LIVE. Self-sabotage.

- [ ] **Step 1: Confirm current `disabled` state**

```bash
grep -n "disabled" web/components/hero-section.tsx
grep -n "disabled" web/components/navbar.tsx
grep -n "Próximamente" web/components/hero-section.tsx
```
Expected: each command returns at least one match. Hero shows `disabled` on the `motion.button` and `Próximamente` next to `JUGAR PARTIDA`. Navbar shows `disabled` on both desktop and mobile `Juega Ya` buttons.

- [ ] **Step 2: Convert Hero `JUGAR PARTIDA` button to a working anchor**

Edit `web/components/hero-section.tsx`. Replace lines 158–189 (the entire CTA Button block) with:

```tsx
        {/* CTA Button — wired to live game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-10"
        >
          <motion.a
            href="https://play.chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 20px 0px rgba(212, 175, 55, 0.3), 0 10px 30px -5px rgba(212, 175, 55, 0.3)",
                "0 0 40px 8px rgba(212, 175, 55, 0.5), 0 20px 50px -5px rgba(212, 175, 55, 0.5)",
                "0 0 20px 0px rgba(212, 175, 55, 0.3), 0 10px 30px -5px rgba(212, 175, 55, 0.3)",
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: "easeInOut",
            }}
            className="relative inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-lg px-10 py-4 rounded-lg transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">JUGAR PARTIDA</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
            />
          </motion.a>
        </motion.div>
```

Notes:
- `motion.button` → `motion.a` (anchor, since it's a navigation)
- `disabled` attribute removed
- `cursor-not-allowed opacity-75` classes removed
- `bg-primary/60` → `bg-primary` (full saturation, no faded look)
- `Próximamente` tag span removed
- Pulse `scale: [1, 1.08, 1]` softened to `[1, 1.04, 1]` and `duration: 2 → 2.4` — less aggressive since it's now an active link, not "look at me I'm coming"
- Glow shimmer animation preserved

- [ ] **Step 3: Wire Desktop navbar `Juega Ya`**

Edit `web/components/navbar.tsx`. Replace lines 111–117 (the desktop `<button disabled>`) with:

```tsx
          <a
            href="https://play.chiribito.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:brightness-110 transition-all duration-300"
          >
            Juega Ya
          </a>
```

- [ ] **Step 4: Wire Mobile navbar `Juega Ya`**

Edit `web/components/navbar.tsx`. Replace lines 165–170 (the mobile `<button disabled>`) with:

```tsx
              <a
                href="https://play.chiribito.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:brightness-110 transition-all duration-300 mt-2 text-center"
              >
                Juega Ya
              </a>
```

Note: `onClick={() => setMenuOpen(false)}` closes the mobile menu after tap so the user doesn't see the menu over the new tab opening.

- [ ] **Step 5: Verify no `disabled` attributes remain on user-facing CTAs**

```bash
grep -n "disabled" web/components/hero-section.tsx
grep -n "disabled" web/components/navbar.tsx
grep -n "Próximamente" web/components/hero-section.tsx
grep -n "cursor-not-allowed" web/components/hero-section.tsx web/components/navbar.tsx
```
Expected: all four return no output.

- [ ] **Step 6: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Confirm: Hero shows `JUGAR PARTIDA` as a live anchor (not greyed out, no "Próximamente"). Navbar shows `Juega Ya` as live. Hover state shows pointer cursor.

Open mobile menu:
```
preview_click button[aria-label="Abrir menú"]
preview_snapshot
```
Confirm: mobile menu `Juega Ya` is live.

- [ ] **Step 7: Commit**

```bash
git add web/components/hero-section.tsx web/components/navbar.tsx
git commit -m "feat(web): wire hero + navbar CTAs to play.chiribito.com"
```

---

## Task 3: Castizo alt text for hero imagery

**Files:**
- Modify: `web/components/hero-section.tsx:29` (background image alt)
- Modify: `web/components/hero-section.tsx:99-103` (ace icons alt array)

**Why:** §3.3 A2/A3 — "Mesa de casino" violates the castizo north star; "Ace of Coins/Cups/Swords/Clubs" English ALT in a Spanish-language castizo brand.

- [ ] **Step 1: Confirm current alt strings**

```bash
grep -n "Mesa de casino" web/components/hero-section.tsx
grep -n "Ace of" web/components/hero-section.tsx
```
Expected:
```
29:          alt="Mesa de casino vintage en Madrid"
99:              { src: "/ace-oros.png", alt: "Ace of Coins" },
100:              { src: "/ace-copas.png", alt: "Ace of Cups" },
101:              { src: "/ace-espada.png", alt: "Ace of Swords" },
102:              { src: "/ace-bastos.png", alt: "Ace of Clubs" },
```

- [ ] **Step 2: Replace background image alt**

Edit `web/components/hero-section.tsx:29`. Replace:
```tsx
          alt="Mesa de casino vintage en Madrid"
```
With:
```tsx
          alt="Salón de cartas madrileño, años 50"
```

- [ ] **Step 3: Replace ace icon alt array**

Edit `web/components/hero-section.tsx:99-103`. Replace:
```tsx
              { src: "/ace-oros.png", alt: "Ace of Coins" },
              { src: "/ace-copas.png", alt: "Ace of Cups" },
              { src: "/ace-espada.png", alt: "Ace of Swords" },
              { src: "/ace-bastos.png", alt: "Ace of Clubs" },
```
With:
```tsx
              { src: "/ace-oros.png", alt: "As de Oros" },
              { src: "/ace-copas.png", alt: "As de Copas" },
              { src: "/ace-espada.png", alt: "As de Espadas" },
              { src: "/ace-bastos.png", alt: "As de Bastos" },
```

- [ ] **Step 4: Verify**

```bash
grep -n "casino" web/components/hero-section.tsx
grep -n "Ace of" web/components/hero-section.tsx
grep -n "As de" web/components/hero-section.tsx
```
Expected: first two return no output; third returns 4 lines (the new As de Oros/Copas/Espadas/Bastos).

- [ ] **Step 5: Commit**

```bash
git add web/components/hero-section.tsx
git commit -m "chore(web): castizo alt text for hero imagery"
```

---

## Task 4: Remove BonosSection — no fake economy

**Files:**
- Modify: `web/app/page.tsx:12` (remove import)
- Modify: `web/app/page.tsx:66-68` (remove BonosSection render + surrounding separators if any)
- Delete: `web/components/bonos-section.tsx`

**Why:** §3.1 C4 + §5 verdict REMOVE — Chiribito has no deposits, no spins, no cashback, no VIP tiers. Every word of this section is fiction.

- [ ] **Step 1: Confirm current state**

```bash
grep -n "BonosSection\|bonos-section" web/app/page.tsx
ls web/components/bonos-section.tsx
```
Expected:
```
12:import { BonosSection } from "@/components/bonos-section"
67:      <BonosSection />
```
and file exists.

- [ ] **Step 2: Inspect surrounding context in page.tsx**

Read `web/app/page.tsx` lines 60–72 to see what separators bracket `<BonosSection />`. Per current file:
```tsx
      <TorneosSection />
      <BonosSection />
      <SectionSeparator />
      <TipsSection />
```
`<BonosSection />` sits between `<TorneosSection />` and `<SectionSeparator />` with no separator above it (Torneos and Bonos are adjacent). After removal we want Torneos → SectionSeparator → Tips, which is already the structure if we just delete the `<BonosSection />` line.

- [ ] **Step 3: Remove import**

Edit `web/app/page.tsx:12`. Remove the entire line:
```tsx
import { BonosSection } from "@/components/bonos-section"
```

- [ ] **Step 4: Remove render**

Edit `web/app/page.tsx`. Remove the line `<BonosSection />` (was line 67 before import removal; line shifts by 1 after Step 3 — re-find via grep if needed).

- [ ] **Step 5: Delete the component file**

```bash
git rm web/components/bonos-section.tsx
```

- [ ] **Step 6: Verify**

```bash
grep -rn "BonosSection\|bonos-section" web/
```
Expected: no output anywhere in `web/`.

- [ ] **Step 7: Build check (catches stray references)**

```bash
cd web && pnpm build
```
Expected: build succeeds. If it fails with "Cannot find module 'bonos-section'" or similar, find the stray import via the error and remove it.

- [ ] **Step 8: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Confirm: between Torneos and Tips sections there is no Bonos block. SectionSeparator is visible between them.

- [ ] **Step 9: Commit**

```bash
git add web/app/page.tsx web/components/bonos-section.tsx
git commit -m "refactor(web): remove BonosSection — Chiribito has no fake economy"
```

(Note: `git add` on a deleted file path stages the deletion. Both add operations belong in the same commit.)

---

## Task 5: Remove ReviewsSection — no fake trust theater

**Files:**
- Modify: `web/app/page.tsx:15` (remove import)
- Modify: `web/app/page.tsx:72` (remove ReviewsSection render)
- Delete: `web/components/reviews-section.tsx`

**Why:** §3.1 C1 + §5 verdict REMOVE — fake Trustpilot stars + claim "miles de jugadores nos eligen cada día" + CTA to empty Trustpilot. Anti-trust signal inside a "trust" section.

- [ ] **Step 1: Confirm current state**

```bash
grep -n "ReviewsSection\|reviews-section" web/app/page.tsx
ls web/components/reviews-section.tsx
```
Expected:
```
15:import { ReviewsSection } from "@/components/reviews-section"
72:      <ReviewsSection />
```

- [ ] **Step 2: Inspect surrounding context in page.tsx**

Per current file (with BonosSection already removed in Task 4):
```tsx
      <NewsletterSection />
      <SectionSeparator />
      <ReviewsSection />
      <Footer />
```
Removing `<ReviewsSection />` leaves the separator orphan (no closing section follows before the Footer). Decision: **also remove that SectionSeparator** to avoid an empty horizontal rule above Footer.

After removal target:
```tsx
      <NewsletterSection />
      <Footer />
```

- [ ] **Step 3: Remove import**

Edit `web/app/page.tsx:15`. Remove the entire line:
```tsx
import { ReviewsSection } from "@/components/reviews-section"
```

- [ ] **Step 4: Remove render + preceding separator**

Edit `web/app/page.tsx`. Remove these two lines (find by content):
```tsx
      <SectionSeparator />
      <ReviewsSection />
```

- [ ] **Step 5: Delete the component file**

```bash
git rm web/components/reviews-section.tsx
```

- [ ] **Step 6: Verify**

```bash
grep -rn "ReviewsSection\|reviews-section" web/
```
Expected: no output.

- [ ] **Step 7: Build check**

```bash
cd web && pnpm build
```
Expected: build succeeds.

- [ ] **Step 8: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Confirm: between Newsletter and Footer there is no Reviews block.

- [ ] **Step 9: Commit**

```bash
git add web/app/page.tsx web/components/reviews-section.tsx
git commit -m "refactor(web): remove ReviewsSection — no fake trust theater"
```

---

## Task 6: Remove fake StatsGrid + delete unused ChipCounter

**Files:**
- Modify: `web/app/page.tsx:20` (remove `StatsGrid` import)
- Modify: `web/app/page.tsx:48-60` (remove the StatsGrid block)
- Delete: `web/components/chip-counter.tsx`

**Why:** §3.1 C2 + §5 verdict REMOVE — `50+ años de historia`, `1000+ jugadores activos` are inventions; the file `chip-counter.tsx` exports both `ChipCounter` and `StatsGrid` and is consumed only here, so deleting both removes the lie surface entirely (decision 5.1 #5).

- [ ] **Step 1: Confirm current state**

```bash
grep -n "StatsGrid\|chip-counter" web/app/page.tsx
ls web/components/chip-counter.tsx
```
Expected:
```
20:import { StatsGrid } from "@/components/chip-counter"
51:            <StatsGrid
```

- [ ] **Step 2: Inspect block to remove in page.tsx**

The block is lines 48–60 (the wrapper `<div className="py-16 md:py-24">...</div>` containing `<StatsGrid>`). Current content:
```tsx
      {/* Stats with animated chip counters */}
      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <StatsGrid
            stats={[
              { value: 50, suffix: "+", label: "Años de historia" },
              { value: 1000, suffix: "+", label: "Jugadores activos" },
              { value: 28, label: "Cartas en juego" },
              { value: 6, label: "Rondas de apuestas" },
            ]}
          />
        </div>
      </div>
```

All 13 lines (including the comment) go.

- [ ] **Step 3: Remove import**

Edit `web/app/page.tsx:20`. Remove the entire line:
```tsx
import { StatsGrid } from "@/components/chip-counter"
```

- [ ] **Step 4: Remove the StatsGrid block**

Edit `web/app/page.tsx`. Delete the 13-line block identified in Step 2.

- [ ] **Step 5: Delete the component file**

```bash
git rm web/components/chip-counter.tsx
```

- [ ] **Step 6: Verify**

```bash
grep -rn "StatsGrid\|ChipCounter\|chip-counter" web/
```
Expected: no output.

- [ ] **Step 7: Build check**

```bash
cd web && pnpm build
```
Expected: build succeeds.

- [ ] **Step 8: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Confirm: between History and Timeline sections there are no animated stat counters. Page flows directly from History → Timeline (with separator).

- [ ] **Step 9: Commit**

```bash
git add web/app/page.tsx web/components/chip-counter.tsx
git commit -m "refactor(web): remove fake StatsGrid + delete unused ChipCounter"
```

---

## Task 7: Defang NewsletterSection — placeholder until real backend

**Files:**
- Modify: `web/components/newsletter-section.tsx` (replace form with castizo placeholder pointing to Instagram)

**Why:** §3.1 C3 + §5 verdict REWRITE (Wave 0 defang, Wave 4 real impl) — current form pretends to send emails it cannot. Decision 5.1 #4 = placeholder pointing to Instagram. Section keeps closing rhythm.

- [ ] **Step 1: Confirm current state**

```bash
grep -n "Simulate sending\|setStatus(\"success\")" web/components/newsletter-section.tsx
```
Expected:
```
18:    // Simulate sending - replace with real API call
20:    setStatus("success")
```

- [ ] **Step 2: Rewrite the component**

Open `web/components/newsletter-section.tsx`. Replace the entire file with:

```tsx
"use client"

import { motion } from "framer-motion"
import { Instagram } from "lucide-react"
import { OrosSuit } from "@/components/spanish-suits"

export function NewsletterSection() {
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
```

Notes:
- All form state, submit handler, and "success" lie removed
- No email is collected, none is promised
- Kicker `Mantente informado` → `La parroquia` (castizo, §2.4 vocabulary)
- Heading `No te pierdas nada` → `Pronto podrás unirte al círculo` (honest about deferred feature)
- Body explains the state truthfully + offers the real path (Instagram)
- One single CTA: outbound to existing live Instagram (`chiribito293`, same handle as SocialBar)
- Section keeps `id="contacto"` for now (resolves in Wave 1 to dedupe with `/contacto` route per §3.4 N3)
- No `useState`, no `useEffect`, no `Mail`/`CheckCircle`/`Loader2` icons needed

- [ ] **Step 3: Verify form artifacts are gone**

```bash
grep -n "Simulate sending\|setStatus\|handleSubmit\|input type=\"email\"" web/components/newsletter-section.tsx
```
Expected: no output.

- [ ] **Step 4: Verify Instagram CTA wired correctly**

```bash
grep -n "instagram.com/chiribito293" web/components/newsletter-section.tsx
```
Expected: 1 match.

- [ ] **Step 5: Build check**

```bash
cd web && pnpm build
```
Expected: succeeds. Unused imports (e.g., previously imported `useState`, `Mail`, `CheckCircle`, `Loader2`) should not appear in the new file — verify the file has only the imports declared above.

- [ ] **Step 6: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Confirm: section shows castizo kicker, new headline, body copy, and single Instagram button. No input field. No "Suscribirme" button.

- [ ] **Step 7: Commit**

```bash
git add web/components/newsletter-section.tsx
git commit -m "refactor(web): defang NewsletterSection — honest placeholder until real backend"
```

---

## Task 8: Remove Trustpilot icon from SocialBar

**Files:**
- Modify: `web/components/social-bar.tsx:45-54` (remove the Trustpilot entry from `socials` array)

**Why:** §3.1 C1 cascade + §5 verdict REFINE for SocialBar — Trustpilot link target is non-public-facing (returns 403 to scrapers, suggesting an unclaimed/empty profile). Even if a profile exists, Chiribito's castizo identity doesn't lean on third-party trust badges. Removal is reversible.

- [ ] **Step 1: Confirm current state**

```bash
grep -n "Trustpilot" web/components/social-bar.tsx
```
Expected:
```
46:    name: "Trustpilot",
47:    href: "https://www.trustpilot.com/review/chiribito.com",
```

- [ ] **Step 2: Remove the Trustpilot entry from the array**

Edit `web/components/social-bar.tsx`. Remove the entire object (lines 45–54):
```tsx
  {
    name: "Trustpilot",
    href: "https://www.trustpilot.com/review/chiribito.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
```

(This is the LAST entry in the `socials` array, so check the trailing comma on the entry before it — should remain present.)

- [ ] **Step 3: Verify**

```bash
grep -n "Trustpilot\|trustpilot" web/components/social-bar.tsx
```
Expected: no output.

- [ ] **Step 4: Build check**

```bash
cd web && pnpm build
```
Expected: succeeds.

- [ ] **Step 5: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Confirm: top social bar shows only Instagram / Facebook / LinkedIn / YouTube — no star icon.

- [ ] **Step 6: Commit**

```bash
git add web/components/social-bar.tsx
git commit -m "chore(web): remove Trustpilot icon from SocialBar"
```

---

## Task 9: Dedupe ScrollToTop render

**Files:**
- Modify: `web/app/page.tsx` (remove import + usage; keep layout.tsx as the single owner)

**Why:** §3.6 T1 — `<ScrollToTop />` is rendered twice (once in `layout.tsx:4` import + render, once in `page.tsx:18` import + line 36 render). Two effect handlers running.

- [ ] **Step 1: Confirm both renders exist**

```bash
grep -n "ScrollToTop" web/app/layout.tsx web/app/page.tsx
```
Expected:
```
web/app/layout.tsx:4:import { ScrollToTop } from '@/components/scroll-to-top'
web/app/page.tsx:18:import { ScrollToTop } from "@/components/scroll-to-top"
web/app/page.tsx:36:      <ScrollToTop />
```
Note: `layout.tsx` imports but per its current shape **doesn't render** `<ScrollToTop />` (it's only imported into the file but never placed in the JSX tree). So actually only `page.tsx` renders it.

- [ ] **Step 2: Re-check layout.tsx renders the component**

Read `web/app/layout.tsx` lines 27–40. Look for `<ScrollToTop />` inside the `<body>` block.

If layout.tsx does NOT render `<ScrollToTop />`, the right action is the inverse: **remove the unused import from layout.tsx**, keep the page.tsx render. (Confirm before editing.)

- [ ] **Step 3: Apply the correct dedup**

**Case A — layout.tsx renders it (true duplicate render):** remove import and `<ScrollToTop />` from `page.tsx`.

Edit `web/app/page.tsx`:
- Remove line 18: `import { ScrollToTop } from "@/components/scroll-to-top"`
- Remove line 36: `<ScrollToTop />`

**Case B — layout.tsx only imports (dead import):** remove the import from `layout.tsx`.

Edit `web/app/layout.tsx`:
- Remove line 4: `import { ScrollToTop } from '@/components/scroll-to-top'`

Choose based on Step 2 finding.

- [ ] **Step 4: Verify single ownership**

```bash
grep -rn "ScrollToTop" web/app/
```
Expected: exactly 2 lines (one import + one render, both in the same file).

- [ ] **Step 5: Build check**

```bash
cd web && pnpm build
```
Expected: succeeds.

- [ ] **Step 6: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_eval window.scrollTo({top: 1500, behavior: "smooth"})
preview_snapshot
```
Confirm: page scrolls smoothly; no console errors about duplicate effects.

```
preview_console_logs
```
Expected: no React duplicate-effect warnings.

- [ ] **Step 7: Commit**

```bash
git add web/app/page.tsx web/app/layout.tsx
git commit -m "chore(web): dedupe ScrollToTop render"
```

---

## Task 10: Correct accent marks across surviving user-facing copy

**Files:**
- Modify: `web/components/navbar.tsx:12`
- Modify: `web/app/layout.tsx:11`
- Modify: `web/components/hero-section.tsx:124`
- Modify: `web/components/footer.tsx:65`
- Modify: `web/components/torneos-section.tsx:18, 24, 46, 52, 53` (multiple)
- Modify: `web/components/comparativa-section.tsx:75`
- Modify: `web/components/home-cards.tsx:44`

**Why:** §3.5 — accent stripping from v0.dev export. All on files that survive Wave 0 (bonos already deleted in Task 4).

- [ ] **Step 1: Run a single grep for all known offenders to confirm pre-state**

```bash
grep -rn "El Alma del Poker\|El Poker Sintetico\|Mécanica\|Competicion\|Demuestra quien\|Enfrentate\|rapidas\|dinamicas\|llevate\|raices\|unicas" web/
```
Expected: ~10–14 hits across the listed files. Note exact file:line for each.

- [ ] **Step 2: Apply fixes (one file at a time to keep the diff readable)**

**`web/components/navbar.tsx:12`** — replace `"Mécanica"` with `"Mecánica"`:
```tsx
  { label: "Mecánica", href: "#mecanica" },
```

**`web/app/layout.tsx:11`** — replace `'El Alma del Poker Español'` with `'El Alma del Póker Español'`:
```tsx
  title: 'El Alma del Póker Español',
```

**`web/components/hero-section.tsx:124`** — replace `El Alma del Poker Español` with `El Alma del Póker Español`:
```tsx
          El Alma del Póker Español
```

**`web/components/footer.tsx:65`** — replace `El Poker Sintetico` with `El Póker Sintético`:
```tsx
            El Póker Sintético. Nacido en Madrid, jugado en la penumbra,
```

**`web/components/torneos-section.tsx`** — multiple fixes:
- Line 18: `"Competiciones rapidas y dinamicas con botes garantizados todos los dias. No te quedes fuera!"` → `"Competiciones rápidas y dinámicas con botes garantizados todos los días. No te quedes fuera."` (also drop the bang for tone)
- Line 24: `"Reserva tu asiento, prepara tu mejor estrategia y llevate el bote a casa."` → `"Reserva tu asiento, prepara tu mejor estrategia y llévate el bote a casa."`
- Line 46: `"Competicion"` → `"Competición"`
- Line 52: `"Demuestra quien manda en la mesa. Enfrentate a jugadores de todo el mundo en nuestros torneos diarios, semanales y eventos especiales."` → `"Demuestra quién manda en la mesa. Enfréntate a jugadores de todo el mundo en nuestros torneos diarios, semanales y eventos especiales."`

(Note: this section's full tone rewrite — removing the casino-clone register entirely — is Wave 1. Wave 0 only fixes accents.)

**`web/components/comparativa-section.tsx:75`** — replace `"Aunque comparten raices, el Chiribito tiene reglas unicas que cambian completamente la estrategia del juego."` with `"Aunque comparten raíces, el Chiribito tiene reglas únicas que cambian completamente la estrategia del juego."`

**`web/components/home-cards.tsx:44`** — replace `Enfrentate` with `Enfréntate`:
```tsx
                Enfréntate a jugadores de todo el mundo en torneos diarios,
```

- [ ] **Step 3: Verify all fixes**

```bash
grep -rn "El Alma del Poker\|El Poker Sintetico\|Mécanica\|Competicion\|Demuestra quien\|Enfrentate\|rapidas\|dinamicas\|llevate\|raices\|unicas" web/
```
Expected: no output.

Also positive-verify the new strings exist:
```bash
grep -rn "El Alma del Póker\|El Póker Sintético\|Mecánica\|Competición\|Demuestra quién\|Enfréntate\|rápidas\|dinámicas\|llévate\|raíces\|únicas" web/
```
Expected: matches present.

- [ ] **Step 4: Build check**

```bash
cd web && pnpm build
```
Expected: succeeds.

- [ ] **Step 5: Visual sanity (if dev server up)**

```
preview_eval window.location.reload()
preview_snapshot
```
Skim: Navbar shows `Mecánica`. Hero shows `El Alma del Póker Español`. Footer shows `El Póker Sintético`. Torneos shows fixed text.

- [ ] **Step 6: Commit**

```bash
git add web/components/navbar.tsx web/app/layout.tsx web/components/hero-section.tsx web/components/footer.tsx web/components/torneos-section.tsx web/components/comparativa-section.tsx web/components/home-cards.tsx
git commit -m "fix(web): correct accent marks across user-facing copy"
```

---

## Task 11: Drop orphan asset

**Files:**
- Delete: `web/public/1-de-espada.png`

**Why:** §3.6 T5 — orphan asset with inconsistent naming (`-de-` separator), confirmed zero references across `web/` during recon.

- [ ] **Step 1: Confirm zero references**

```bash
grep -rn "1-de-espada" web/
```
Expected: no output.

- [ ] **Step 2: Confirm file exists and is what we think (a leftover ace-of-swords PNG)**

```bash
ls -la web/public/1-de-espada.png
```
Expected: file exists. (Optional: open in image viewer to confirm it's the swords ace — already replaced by `web/public/ace-espada.png` which IS referenced from `hero-section.tsx`.)

- [ ] **Step 3: Delete**

```bash
git rm web/public/1-de-espada.png
```

- [ ] **Step 4: Verify**

```bash
ls web/public/1-de-espada.png 2>&1
```
Expected: error / not found.

```bash
git status --short
```
Expected: shows the deletion staged.

- [ ] **Step 5: Build check**

```bash
cd web && pnpm build
```
Expected: succeeds. (No reference → no broken link.)

- [ ] **Step 6: Commit**

```bash
git commit -m "chore(web): drop orphan 1-de-espada.png asset"
```

---

## Post-flight

### Task 12: Post-flight verification

**Files:** read-only verification.

- [ ] **Step 1: Final build clean**

```bash
cd web && pnpm build
```
Expected: succeeds with no warnings beyond the pre-existing `ignoreBuildErrors` permissiveness (which Wave 4 addresses).

- [ ] **Step 2: Review the commit chain**

```bash
git log --oneline -15
```
Expected: 11 atomic commits from this wave preceded by `b774865 docs(spec)` and earlier history.

Confirm each commit message reads cleanly and aligns with §6 Wave 0 of the spec.

- [ ] **Step 3: Lie scan — production-grade**

```bash
grep -rn "Bono de Bienvenida\|miles de jugadores\|reseñas verificadas\|Próximamente\|Simulate sending\|v0.app\|Trustpilot" web/
```
Expected: no output. (`Mantente informado` may still appear if NewsletterSection rewrite kept the wrong kicker — verify it now reads `La parroquia`.)

- [ ] **Step 4: CTA wires healthy**

```bash
grep -rn "play.chiribito.com" web/components/hero-section.tsx web/components/navbar.tsx
```
Expected: 3 matches (hero CTA + desktop nav + mobile nav).

- [ ] **Step 5: Visual full-page smoke (if dev server up)**

```
preview_eval window.location.reload()
preview_screenshot
preview_console_logs
```
Skim the full screenshot top-to-bottom. Confirm:
- Hero: live `JUGAR PARTIDA`, no "Próximamente", castizo alt (won't see but check via inspect if curious)
- HomeCards → Simulador → Rankings → History → (NO StatsGrid) → Timeline → Rules → Comparativa → Torneos → Tips → Newsletter (placeholder) → Footer
- No Bonos, no Reviews, no fake stars
- No console errors

Mobile sanity:
```
preview_resize 390 844
preview_eval window.location.reload()
preview_screenshot
preview_click button[aria-label="Abrir menú"]
preview_screenshot
```
Confirm: navbar `Juega Ya` live in mobile menu.

- [ ] **Step 6: Working tree state**

```bash
git status --short
```
Expected: clean except for the 4 pre-existing untracked items (`.superpowers/`, `_screenshots/`, the two Track A docs). No new untracked files.

- [ ] **Step 7: STOP — Wave 0 plan complete, deploy gated on user**

Do NOT push, do NOT deploy. Report to user:
- Commits added (11): `git log --oneline -11`
- Local HEAD
- Build clean
- Visual smoke results
- Ready for: `git push origin main` + `cd web && vercel --prod` when user gives explicit "deploy Wave 0".

---

## Decisions deferred during Task 9 (verify at execution time)

In Task 9 Step 2, the executor must read `layout.tsx` to determine whether `<ScrollToTop />` is actually rendered there or just imported dead. Both cases have explicit instructions. Don't skip the read.

## Decisions deferred during Task 7

The Wave 4 implementation of NewsletterSection (real Resend integration) will revisit the placeholder. Don't tune the placeholder copy too much during execution — it's intentionally simple.

## Anti-patterns to refuse if they surface mid-wave

- Scope creep: don't fix accents in a file you're about to delete (don't waste effort)
- "While I'm here" refactoring: stay on the per-task scope
- Combining commits: each commit ships independently; don't merge "remove BonosSection" with "remove ReviewsSection"
- Touching `frontend/`, `src/`, `api-server/`, or any `.ts(x)` outside `web/`: forbidden by spec §10.2
- Trying to push or deploy without explicit user "go": forbidden by Wave 0 discipline

---

**End of Wave 0 plan. 11 atomic commits + pre-flight + post-flight. ETA: 1–2 focused sessions. No deploy until user "go".**
