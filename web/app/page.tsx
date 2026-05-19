import dynamic from "next/dynamic"
import { SocialBar } from "@/components/social-bar"
import { AudioPlayer } from "@/components/audio-player"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HistorySection } from "@/components/history-section"
import { TimelineSection } from "@/components/timeline-section"
import { RulesSection } from "@/components/rules-section"
import { ComparativaSection } from "@/components/comparativa-section"
import { TorneosSection } from "@/components/torneos-section"
import { TipsSection } from "@/components/tips-section"
import { NewsletterSection } from "@/components/newsletter-section"
import { ReviewsSection } from "@/components/reviews-section"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"
import { ScrollToTop } from "@/components/scroll-to-top"
import { SectionSeparator } from "@/components/section-separator"
import { StatsGrid } from "@/components/chip-counter"

// Lazy load heavy interactive components
const SimuladorSection = dynamic(
  () => import("@/components/simulador-section").then((mod) => ({ default: mod.SimuladorSection })),
  { loading: () => <div className="py-24 text-center text-muted-foreground">Cargando simulador...</div> }
)

const RankingsSection = dynamic(
  () => import("@/components/rankings-section").then((mod) => ({ default: mod.RankingsSection })),
  { loading: () => <div className="py-24 text-center text-muted-foreground">Cargando rankings...</div> }
)

export default function Home() {
  return (
    <main className="relative">
      <ScrollToTop />
      <AudioPlayer />
      <SocialBar />
      <Navbar />
      <HeroSection />
      <SectionSeparator />
      <SimuladorSection />
      <SectionSeparator />
      <RankingsSection />
      <SectionSeparator />
      <HistorySection />
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
      <TimelineSection />
      <SectionSeparator />
      <RulesSection />
      <ComparativaSection />
      <SectionSeparator />
      <TorneosSection />
      <SectionSeparator />
      <TipsSection />
      <NewsletterSection />
      <SectionSeparator />
      <ReviewsSection />
      <Footer />
      <BackToTop />
    </main>
  )
}
