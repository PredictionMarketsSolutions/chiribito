# Chiribito Web — Wave 0 Handoff (Defensive)

> **Status: SHIPPED + LIVE — 2026-05-20.** Subtractive defensive wave per the
> unified product vision spec. Casino-DNA stripped, fake-economy removed,
> CTAs wired to live game, accents corrected, generator metadata cleaned.
> All web/ surfaces now lean castizo. Game stack untouched.

---

## Final state

### Live URLs (all green)

| URL | Status |
|---|---|
| `https://chiribito.com/` | 200 — Wave 0 deploy, no fake artifacts |
| `https://www.chiribito.com/` | 308 → `https://chiribito.com/` |
| `https://chiribito.com/contacto` | 200 — orphan page still loads (Wave 1 will integrate with shell) |
| `https://play.chiribito.com/` | 200 — untouched |
| `https://backend.chiribito.com/health` | `{"status":"ok"}` |
| `https://realtime.chiribito.com/health` | `{"status":"ok"}` |

### Git state

| Item | Value |
|---|---|
| **HEAD origin/main** | `4144d5b` |
| **Branch** | `main` |
| **Commits ahead before push** | 17 (3 docs + 14 code) |
| **Commits ahead after push** | 0 |
| **Pre-Wave-0 HEAD** | `7443b4f` (canon alignment wave close) |
| **Wave 0 range** | `7443b4f..4144d5b` |

### Vercel state

| Item | Value |
|---|---|
| Team | `chiribito293-7173s-projects` (Chiribito-isolated, no PMS/PT contamination) |
| Project | `chiribito-web` |
| Production deploy | `dpl_ADRxj8DqfE42jfjrW7k6uTvfnKeT` |
| Deploy URL | `https://chiribito-97779uuy7-chiribito293-7173s-projects.vercel.app` |
| Aliased domains | `chiribito.com` (canonical) + `www.chiribito.com` (308 → apex) |
| Deploy time | 25s (Next.js Turbopack static build) |
| Build status | READY |

### Live smoke (production)

| Check | Result |
|---|---|
| Title tag tilde | `Chiribito - El Alma del Póker Español` ✓ |
| Hero kicker tilde | `El póker que se jugaba en Madrid` ✓ |
| Hero CTA wired | `JUGAR PARTIDA` → `play.chiribito.com`, no "Próximamente" ✓ |
| Navbar Bonos link | Gone ✓ |
| `Bono` / `Bonos` substring | Zero matches in served HTML ✓ |
| `Próximamente` substring | Zero matches ✓ |
| `Trustpilot` substring | Zero matches ✓ |
| `Mantente informado` substring | Zero matches ✓ |
| `v0.app` substring | Zero matches ✓ |
| Newsletter castizo placeholder | `La parroquia` / `Pronto podrás unirte al círculo` ✓ |
| `/contacto` H1 | `Hablemos` ✓ |
| `/contacto` emails | `support@chiribito.com` + `management@chiribito.com` ✓ |

---

## What Wave 0 actually did

### Spec + plan artifacts (3 commits)

| Commit | Subject |
|---|---|
| `b774865` | `docs(spec): chiribito web product vision + 5-wave roadmap` |
| `5e60698` | `docs(plan): Wave 0 defensive — 11 atomic commits subtractivos` |
| `c0953ab` | `docs(plan): tighten Wave 0 Task 2 — keep CTA animation params identical` |

### Code commits (14 atomic)

| # | Commit | Subject |
|---|---|---|
| 1 | `e90b716` | `chore(web): strip v0.app generator from metadata` |
| 2 | `ffb3d56` | `feat(web): wire hero + navbar CTAs to play.chiribito.com` |
| 3 | `18573b7` | `chore(web): castizo alt text for hero imagery` |
| 4a | `f87e8a3` | `refactor(web): drop Bonos link from navbar — prep for BonosSection removal` |
| 4b | `624718f` | `refactor(web): remove HomeCards — pull-forward Wave 1 verdict REMOVE` |
| 4c | `eff715a` | `refactor(web): remove BonosSection — Chiribito has no fake economy` |
| 5 | `6cbc4d4` | `refactor(web): remove ReviewsSection — no fake trust theater` |
| 6 | `7f1bf9d` | `refactor(web): remove fake StatsGrid + delete unused ChipCounter` |
| 7 | `7ebc641` | `refactor(web): defang NewsletterSection — honest castizo placeholder` |
| 8 | `96b06bb` | `chore(web): remove Trustpilot icon from SocialBar` |
| 9 | `8049aa2` | `chore(web): remove dead ScrollToTop import from layout` |
| 10 | `10d08d9` | `fix(web): correct accent marks across user-facing copy` |
| 11 | `f52652c` | `chore(web): drop orphan 1-de-espada.png asset` |
| hotfix | `4144d5b` | `fix(web): add missing tilde on hero kicker "El póker"` |

### Plan deviations (transparency)

1. **Task 4 split into 4a / 4b / 4c** — Mid-execution, STOP-ON-AMBIGUOUS detected
   cascade: removing `BonosSection` would silently break the navbar `Bonos`
   anchor + both `HomeCards` referrers. User authorized re-order: drop nav link
   first → remove `HomeCards` entirely (pulled forward from Wave 1 since the
   verdict was REMOVE anyway) → remove `BonosSection`. Each intermediate commit
   kept the site coherent (no broken anchors ever shipped).

2. **Hotfix commit `4144d5b`** — Post-flight visual smoke caught
   `El poker que se jugaba en Madrid` (hero kicker, rendered via
   Tailwind `uppercase` so it displayed as "EL POKER"). The Task 10 grep had
   only searched for capitalized `Poker`; this lowercase variant slipped.
   Fixed in 1 atomic commit, then proceeded with the post-flight.

### New file: `web/components/newsletter-section.tsx` (rewrite, not added)

The previous version captured emails into a `setTimeout(1200)` lie. Wave 0
defanged it: form removed, replaced with a single CTA to the live Instagram
(`@chiribito293`). Heading: "Pronto podrás unirte al círculo". Kicker: "La
parroquia". Body explains the lista isn't open yet. Wave 4 will implement the
real Resend integration when R9 domain verification is resolved.

### Sections removed from `app/page.tsx`

- `<HomeCards />` (and its file `components/home-cards.tsx`) — verdict REMOVE
- `<BonosSection />` (and its file `components/bonos-section.tsx`) — verdict REMOVE
- `<ReviewsSection />` (and its file `components/reviews-section.tsx`) — verdict REMOVE
- `<StatsGrid …>` block + the `chip-counter.tsx` file — verdict REMOVE
- Orphan `<SectionSeparator />` that sat above `ReviewsSection`

### Components touched (REFINE)

- `app/layout.tsx` — generator strip, ScrollToTop dead-import removed
- `app/page.tsx` — 5 imports + render removals
- `components/hero-section.tsx` — CTA wired, castizo alts, kicker tilde
- `components/navbar.tsx` — `Mécanica` → `Mecánica`, Bonos link dropped, Juega Ya wired (desktop + mobile)
- `components/footer.tsx` — `Poker Sintetico` → `Póker Sintético`
- `components/comparativa-section.tsx` — `raices`/`unicas` tildes
- `components/torneos-section.tsx` — multiple tilde fixes (sigue intacto en estructura, copy de tone es Wave 1)
- `components/newsletter-section.tsx` — full rewrite (defang)
- `components/social-bar.tsx` — Trustpilot icon removed

### Components untouched (KEEP)

- `components/audio-player.tsx` — Wave 0 left untouched. Tomorrow's session
  redesigns this as a proper ambient ritual layer (see
  [audio-ritual-layer-architecture-prep.md](superpowers/specs/2026-05-20-chiribito-audio-ritual-layer-architecture-prep.md)).
- `components/history-section.tsx`, `timeline-section.tsx`, `simulador-section.tsx`,
  `rankings-section.tsx`, `rules-section.tsx`, `tips-section.tsx`,
  `comparativa-section.tsx` (structure), `section-separator.tsx`, `back-to-top.tsx`,
  `scroll-to-top.tsx`, `spanish-suits.tsx`, `theme-provider.tsx`, `ui/*` — KEEP
- `app/contacto/page.tsx` — KEEP for now (Wave 1 integrates with global shell)

### Visual flow after Wave 0 (10 sections)

```
1. Hero (CHIRIBITO · JUGAR PARTIDA wired)
2. SectionSeparator
3. SimuladorSection
4. SectionSeparator
5. RankingsSection
6. SectionSeparator
7. HistorySection
8. TimelineSection
9. SectionSeparator
10. RulesSection
11. ComparativaSection
12. SectionSeparator
13. TorneosSection
14. SectionSeparator
15. TipsSection
16. NewsletterSection (castizo placeholder)
17. Footer
```

Matches the spec §8.4 ritual structure (threshold → first gesture → initiation →
choice → closing).

---

## Restrictions stabilized (carry-forward)

🔒 Strict separation Chiribito ↔ PMS ↔ PT preserved (Vercel teams, Render
workspaces, env vars, domains).

🔒 Game stack (`frontend/`, `src/`, `api-server/`, `render.yaml`,
`play.chiribito.com`, `backend.chiribito.com`, `realtime.chiribito.com`) NOT
touched.

🔒 Apex DNS records (A + CNAMEs) unchanged.

🔒 Vercel team gate (`vercel whoami` = `chiribito293-7173`) honored before
every vercel command.

🔒 Identity invariants from prior sprints (Compact Density Pass, Runtime Diag,
Move 1/1.5/2, Phase W, Canon Alignment Wave, Slice A1/A2.0) untouched.

🔒 Wave 0 master vision spec ([2026-05-20-chiribito-web-product-vision-and-roadmap.md](superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md))
is the source of truth for all future web/ waves.

🔒 Auto-deploy policy IN EFFECT (memory: `feedback_chiribito_auto_deploy_policy.md`):
after each stable validated block in `web/`, default sequence is commit + push
+ deploy. Skip only if user explicitly says "no deploy" / "local only".

---

## Deuda NOT addressed in Wave 0 (deliberate)

These survive into later waves per spec §6:

| # | Item | Wave |
|---|---|---|
| 1 | `web/next.config.mjs: typescript.ignoreBuildErrors: true` | 4 |
| 2 | `web/next.config.mjs: images.unoptimized: true` | 4 |
| 3 | Fonts `Inter` + `Playfair_Display` imported but not preloaded properly | 4 |
| 4 | TorneosSection copy is still casino-clone register | 1 |
| 5 | Tips section title `¿Sabías que...?` (quiz-show register) | 1 |
| 6 | Cabezón de Elche provenance (real vs project-authored mythology) | 1 |
| 7 | Bilingual subtitles in Rankings (`nameEn: "The Pearl"`) — keep/drop decision | 1 |
| 8 | `/contacto` page orphan (no Navbar/Audio/SocialBar/Footer shell) | 1 |
| 9 | Newsletter real Resend integration (gated on R9 domain verification) | 4 |
| 10 | Timeline bridge 2005 → 2026 | 3 |
| 11 | Hero secondary CTA + Footer CTA + post-Simulador bridge | 2 |
| 12 | AudioPlayer ambient ritual layer redesign | **tomorrow** — own brainstorm (see architecture prep) |
| 13 | next-env.d.ts may drift between dev/prod paths (cosmetic) | none — auto-managed |

---

## Tomorrow's resume protocol

### Primary track: Ambient Ritual Layer

The next session is a fresh brainstorming session to redesign
`components/audio-player.tsx` as an ambient ritual layer (not a media player).
Cold-start protocol:

1. Read [audio-ritual-layer-architecture-prep.md](superpowers/specs/2026-05-20-chiribito-audio-ritual-layer-architecture-prep.md)
   end-to-end (it's the cold context that lets tomorrow skip re-audit)
2. Read [master vision spec §5 verdict for AudioPlayer](superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md)
   and §10.2 NO TOCAR rules
3. User re-frames intent (mood, time available, scope)
4. Brainstorming skill resumes, asks user the 11 open questions from
   architecture-prep §8 in order (or skips to the user's chosen subset)
5. Produces design spec `docs/superpowers/specs/2026-05-21-chiribito-audio-ritual-layer-design.md`
6. writing-plans produces `docs/superpowers/plans/2026-05-21-chiribito-audio-ritual-layer.md`
7. executing-plans ships (per auto-deploy policy)

### Possible diversions

If the user wants to pivot tomorrow:

- **Wave 1 (identity & cohesion)** — TorneosSection rewrite, /contacto shell
  integration, capitalization audit
- **Wave 2 (funnel & onboarding)** — hero secondary CTA, post-Simulador bridge,
  footer CTA
- **Wave 3 (narrative bridge 2005→2026)** — Timeline extension
- **Wave 4 (polish + tech debt)** — next/font wiring, ignoreBuildErrors flip,
  mobile pacing pass

None of these are required next. Auto-deploy policy makes any of them
shippable in the same day.

---

## Rollback (if needed)

### Undo Wave 0 entirely

```bash
git reset --hard 7443b4f
git push --force origin main
cd web && vercel --prod
```

(NOT recommended unless verified necessity — Wave 0 fixes real credibility
issues.)

### Undo a single commit from Wave 0

Each commit reverts independently:

```bash
git revert <commit-sha>
git push origin main
cd web && vercel --prod
```

(Per Wave 0 atomicity design — every commit was scoped to one concern.)

### Restore AudioPlayer if tomorrow's brainstorm decides not to redesign

The current `audio-player.tsx` survived Wave 0 untouched. Nothing to restore —
it still works as before.

---

## Cross-references

| Doc | Path |
|---|---|
| Master vision spec | [`docs/superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md`](superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md) |
| Wave 0 plan | [`docs/superpowers/plans/2026-05-20-chiribito-web-wave-0-defensive.md`](superpowers/plans/2026-05-20-chiribito-web-wave-0-defensive.md) |
| Audio architecture prep (tomorrow) | [`docs/superpowers/specs/2026-05-20-chiribito-audio-ritual-layer-architecture-prep.md`](superpowers/specs/2026-05-20-chiribito-audio-ritual-layer-architecture-prep.md) |
| Phase W handoff (prior wave) | [`docs/HANDOFF_PHASE_W.md`](HANDOFF_PHASE_W.md) |
| GitHub | https://github.com/PredictionMarketsSolutions/chiribito |
| Vercel project | https://vercel.com/chiribito293-7173s-projects/chiribito-web |
| Production deploy | `dpl_ADRxj8DqfE42jfjrW7k6uTvfnKeT` |

---

**End of Wave 0 handoff. Web layer cleaned. Casino-DNA exorcised.
Tomorrow: ambient ritual layer.**
