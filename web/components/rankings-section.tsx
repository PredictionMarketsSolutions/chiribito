"use client"

import { motion } from "framer-motion"

type Palo = "oros" | "copas" | "espadas" | "bastos"

interface CardData {
  valor: string
  palo: Palo
  imageName: string
}

function getCartaImagePath(imageName: string): string {
  return `/cartas/${imageName}.webp`
}

function MiniCard({ imageName }: CardData) {
  return (
    <img
      src={getCartaImagePath(imageName)}
      alt={imageName}
      className="w-16 h-20 md:w-24 md:h-32 lg:w-32 lg:h-44 rounded-lg border-2 border-primary/50 shadow-lg object-cover"
    />
  )
}

interface HandRank {
  rank: number
  name: string
  nameEn: string
  cards: CardData[]
  note?: string
}

// Hand showcase aligned with the Chiribito canon:
//   - 28-card Spanish deck (5, 6, 7, Sota, Caballo, Rey, As across 4 suits)
//   - 10 hand categories incl. La Perla as top (mirrors CardEvaluator.getHandName
//     and the canonical rank order in src/rooms/game/glossary.ts)
//   - Hand names use sentence case to match CardEvaluator output exactly
//   - Each showcase hand is a legal Chiribito hand under the canonical
//     rank-order straight rule (5 < 6 < 7 < Sota < Caballo < Rey < As)
const handRankings: HandRank[] = [
  {
    rank: 1,
    name: "Perla",
    nameEn: "The Pearl",
    cards: [
      { valor: "S", palo: "copas", imageName: "10_copas" },
      { valor: "7", palo: "copas", imageName: "7_copas" },
    ],
    note: "Sota + 7 del mismo palo en la mano.\nÚnico combo que completa todas las escaleras",
  },
  {
    rank: 2,
    name: "Escalera de color",
    nameEn: "Straight Flush",
    cards: [
      { valor: "7", palo: "copas", imageName: "7_copas" },
      { valor: "S", palo: "copas", imageName: "10_copas" },
      { valor: "C", palo: "copas", imageName: "11_copas" },
      { valor: "R", palo: "copas", imageName: "12_copas" },
      { valor: "A", palo: "copas", imageName: "1_copas" },
    ],
    note: "5 cartas consecutivas del mismo palo",
  },
  {
    rank: 3,
    name: "Póker",
    nameEn: "Four of a Kind",
    cards: [
      { valor: "A", palo: "oros", imageName: "1_oro" },
      { valor: "A", palo: "copas", imageName: "1_copas" },
      { valor: "A", palo: "espadas", imageName: "1_espada" },
      { valor: "A", palo: "bastos", imageName: "1_bastos" },
      { valor: "R", palo: "oros", imageName: "12_oro" },
    ],
    note: "4 cartas del mismo valor",
  },
  {
    rank: 4,
    name: "Color",
    nameEn: "Flush",
    cards: [
      { valor: "A", palo: "oros", imageName: "1_oro" },
      { valor: "R", palo: "oros", imageName: "12_oro" },
      { valor: "C", palo: "oros", imageName: "11_oro" },
      { valor: "7", palo: "oros", imageName: "7_oro" },
      { valor: "5", palo: "oros", imageName: "5_oro" },
    ],
    note: "5 cartas del mismo palo.\nGana al Full",
  },
  {
    rank: 5,
    name: "Full",
    nameEn: "Full House",
    cards: [
      { valor: "R", palo: "espadas", imageName: "12_espada" },
      { valor: "R", palo: "copas", imageName: "12_copas" },
      { valor: "R", palo: "oros", imageName: "12_oro" },
      { valor: "S", palo: "bastos", imageName: "10_bastos" },
      { valor: "S", palo: "espadas", imageName: "10_espada" },
    ],
    note: "3 iguales + 2 iguales.\nPierde contra Color",
  },
  {
    rank: 6,
    name: "Escalera",
    nameEn: "Straight",
    cards: [
      { valor: "5", palo: "bastos", imageName: "5_bastos" },
      { valor: "6", palo: "oros", imageName: "6_oro" },
      { valor: "7", palo: "copas", imageName: "7_copas" },
      { valor: "S", palo: "espadas", imageName: "10_espada" },
      { valor: "C", palo: "bastos", imageName: "11_bastos" },
    ],
    note: "5 cartas consecutivas de distintos palos",
  },
  {
    rank: 7,
    name: "Trío",
    nameEn: "Three of a Kind",
    cards: [
      { valor: "S", palo: "oros", imageName: "10_oro" },
      { valor: "S", palo: "copas", imageName: "10_copas" },
      { valor: "S", palo: "espadas", imageName: "10_espada" },
      { valor: "A", palo: "bastos", imageName: "1_bastos" },
      { valor: "5", palo: "oros", imageName: "5_oro" },
    ],
    note: "3 cartas del mismo valor",
  },
  {
    rank: 8,
    name: "Doble pareja",
    nameEn: "Two Pair",
    cards: [
      { valor: "R", palo: "copas", imageName: "12_copas" },
      { valor: "R", palo: "espadas", imageName: "12_espada" },
      { valor: "6", palo: "oros", imageName: "6_oro" },
      { valor: "6", palo: "bastos", imageName: "6_bastos" },
      { valor: "A", palo: "espadas", imageName: "1_espada" },
    ],
    note: "Pierde mucho valor en Chiribito",
  },
  {
    rank: 9,
    name: "Pareja",
    nameEn: "One Pair",
    cards: [
      { valor: "A", palo: "oros", imageName: "1_oro" },
      { valor: "A", palo: "espadas", imageName: "1_espada" },
      { valor: "R", palo: "copas", imageName: "12_copas" },
      { valor: "S", palo: "bastos", imageName: "10_bastos" },
      { valor: "5", palo: "copas", imageName: "5_copas" },
    ],
    note: "2 cartas del mismo valor",
  },
  {
    rank: 10,
    name: "Carta alta",
    nameEn: "High Card",
    cards: [
      { valor: "A", palo: "copas", imageName: "1_copas" },
      { valor: "R", palo: "espadas", imageName: "12_espada" },
      { valor: "S", palo: "oros", imageName: "10_oro" },
      { valor: "7", palo: "bastos", imageName: "7_bastos" },
      { valor: "6", palo: "copas", imageName: "6_copas" },
    ],
    note: "Sin combinación. Gana la carta más alta",
  },
]

export function RankingsSection() {
  return (
    <section id="ranking" className="py-16 md:py-32 bg-card relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/20" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Jerarquía
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Ranking de Manos
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-pretty">
            En el Chiribito, el Color vence al Full. Esta es la diferencia
            fundamental respecto al póker estándar. De mayor a menor valor:
          </p>
        </motion.div>

        {/* Hand rankings */}
        <div className="flex flex-col gap-6">
          {handRankings.map((hand, index) => (
            <motion.div
              key={hand.name}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className={`flex flex-col md:flex-row items-center gap-6 md:gap-8 lg:gap-10 rounded-lg p-6 md:p-8 border transition-colors duration-300 ${
                hand.rank <= 3
                  ? "bg-secondary border-primary/40"
                  : "bg-background border-border hover:border-primary/30"
              }`}
            >
              {/* Rank number */}
              <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shrink-0 ${
                hand.rank <= 3 ? "bg-primary/20" : "bg-muted"
              }`}>
                <span className={`text-xl md:text-2xl lg:text-3xl font-bold ${
                  hand.rank <= 3 ? "text-primary" : "text-muted-foreground"
                }`}>
                  {hand.rank}
                </span>
              </div>

              {/* Name */}
              <div className="text-center md:text-left md:w-48 lg:w-56 shrink-0">
                <h3 className={`font-serif text-lg md:text-xl lg:text-2xl ${
                  hand.rank <= 3 ? "text-primary" : "text-foreground"
                }`}>
                  {hand.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {hand.nameEn}
                </p>
              </div>

              {/* Cards */}
              <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0">
                {hand.cards.map((card, i) => (
                  <MiniCard key={`${card.valor}-${card.palo}-${i}`} {...card} />
                ))}
              </div>

              {/* Note */}
              <div className="flex-1 md:text-left text-center min-w-0 overflow-hidden">
                {hand.note && (
                  <p className={`text-xs md:text-sm leading-relaxed break-words ${
                    hand.note.includes("Gana al Full") || hand.note.includes("Pierde contra")
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}>
                    {hand.note}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/20" />
    </section>
  )
}
