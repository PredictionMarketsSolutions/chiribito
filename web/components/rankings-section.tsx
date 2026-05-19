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

const handRankings: HandRank[] = [
  {
    rank: 1,
    name: "Escalera de Color",
    nameEn: "Straight Flush",
    cards: [
      { valor: "7", palo: "copas", imageName: "7_copas" },
      { valor: "8", palo: "copas", imageName: "8_copas" },
      { valor: "9", palo: "copas", imageName: "9_copas" },
      { valor: "10", palo: "copas", imageName: "10_copas" },
      { valor: "11", palo: "copas", imageName: "11_copas" },
    ],
    note: "5 cartas consecutivas del mismo palo",
  },
  {
    rank: 2,
    name: "Poker",
    nameEn: "Four of a Kind",
    cards: [
      { valor: "A", palo: "oros", imageName: "1_oro" },
      { valor: "A", palo: "copas", imageName: "1_copas" },
      { valor: "A", palo: "espadas", imageName: "1_espada" },
      { valor: "A", palo: "bastos", imageName: "1_bastos" },
      { valor: "C", palo: "oros", imageName: "12_oro" },
    ],
    note: "4 cartas del mismo valor",
  },
  {
    rank: 3,
    name: "Color",
    nameEn: "Flush",
    cards: [
      { valor: "A", palo: "oros", imageName: "1_oro" },
      { valor: "C", palo: "oros", imageName: "12_oro" },
      { valor: "9", palo: "oros", imageName: "9_oro" },
      { valor: "7", palo: "oros", imageName: "7_oro" },
      { valor: "S", palo: "oros", imageName: "11_oro" },
    ],
    note: "5 cartas del mismo palo.\nGana al Full",
  },
  {
    rank: 4,
    name: "Full",
    nameEn: "Full House",
    cards: [
      { valor: "C", palo: "espadas", imageName: "12_espada" },
      { valor: "C", palo: "copas", imageName: "12_copas" },
      { valor: "C", palo: "oros", imageName: "12_oro" },
      { valor: "10", palo: "bastos", imageName: "10_bastos" },
      { valor: "10", palo: "espadas", imageName: "10_espada" },
    ],
    note: "3 iguales + 2 iguales.\nPierde contra Color",
  },
  {
    rank: 5,
    name: "Escalera",
    nameEn: "Straight",
    cards: [
      { valor: "7", palo: "bastos", imageName: "7_bastos" },
      { valor: "8", palo: "oros", imageName: "8_oro" },
      { valor: "9", palo: "copas", imageName: "9_copas" },
      { valor: "10", palo: "espadas", imageName: "10_espada" },
      { valor: "S", palo: "bastos", imageName: "11_bastos" },
    ],
    note: "5 cartas consecutivas de distintos palos",
  },
  {
    rank: 6,
    name: "Trío",
    nameEn: "Three of a Kind",
    cards: [
      { valor: "S", palo: "oros", imageName: "11_oro" },
      { valor: "S", palo: "copas", imageName: "11_copas" },
      { valor: "S", palo: "espadas", imageName: "11_espada" },
      { valor: "A", palo: "bastos", imageName: "1_bastos" },
      { valor: "8", palo: "oros", imageName: "8_oro" },
    ],
    note: "3 cartas del mismo valor",
  },
  {
    rank: 7,
    name: "Doble Pareja",
    nameEn: "Two Pair",
    cards: [
      { valor: "C", palo: "copas", imageName: "12_copas" },
      { valor: "C", palo: "espadas", imageName: "12_espada" },
      { valor: "9", palo: "oros", imageName: "9_oro" },
      { valor: "9", palo: "bastos", imageName: "9_bastos" },
      { valor: "A", palo: "espadas", imageName: "1_espada" },
    ],
    note: "Pierde mucho valor en Chiribito",
  },
  {
    rank: 8,
    name: "Pareja",
    nameEn: "One Pair",
    cards: [
      { valor: "A", palo: "oros", imageName: "1_oro" },
      { valor: "A", palo: "espadas", imageName: "1_espada" },
      { valor: "C", palo: "copas", imageName: "12_copas" },
      { valor: "10", palo: "bastos", imageName: "10_bastos" },
      { valor: "8", palo: "oros", imageName: "8_oro" },
    ],
    note: "2 cartas del mismo valor",
  },
  {
    rank: 9,
    name: "Carta Alta",
    nameEn: "High Card",
    cards: [
      { valor: "A", palo: "copas", imageName: "1_copas" },
      { valor: "C", palo: "espadas", imageName: "12_espada" },
      { valor: "10", palo: "oros", imageName: "10_oro" },
      { valor: "8", palo: "bastos", imageName: "8_bastos" },
      { valor: "7", palo: "copas", imageName: "7_copas" },
    ],
    note: "Sin combinación. Gana la carta más alta",
  },
]

export function RankingsSection() {
  return (
    <section id="ranking" className="py-24 md:py-32 bg-card relative">
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
