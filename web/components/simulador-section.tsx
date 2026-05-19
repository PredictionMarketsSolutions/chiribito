"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"

// --- Types ---
type Palo = "oros" | "copas" | "espadas" | "bastos"
type Valor = 1 | 5 | 6 | 7 | 10 | 11 | 12 // 1=As, 10=Sota, 11=Caballo, 12=Rey

interface Carta {
  valor: Valor
  palo: Palo
}

// --- Constants ---
const PALOS: Palo[] = ["oros", "copas", "espadas", "bastos"]
const VALORES: Valor[] = [1, 5, 6, 7, 10, 11, 12]

const NOMBRE_VALOR: Record<Valor, string> = {
  1: "A",
  5: "5",
  6: "6",
  7: "7",
  10: "S",
  11: "C",
  12: "R",
}

const NOMBRE_VALOR_LARGO: Record<Valor, string> = {
  1: "As",
  5: "Cinco",
  6: "Seis",
  7: "Siete",
  10: "Sota",
  11: "Caballo",
  12: "Rey",
}

// RANK_ORDER mirror of src/rooms/game/glossary.ts canonical strength order.
// Lower index = lower value. As is always high — no wrap-around.
// Used by esEscalera (mirror of CardEvaluator.isStraight).
const RANK_ORDER_INDEX: Record<Valor, number> = {
  5: 0,
  6: 1,
  7: 2,
  10: 3, // Sota
  11: 4, // Caballo
  12: 5, // Rey
  1: 6,  // As
}

const NOMBRE_PALO: Record<Palo, string> = {
  oros: "Oros",
  copas: "Copas",
  espadas: "Espadas",
  bastos: "Bastos",
}

const PALO_COLOR: Record<Palo, string> = {
  oros: "text-yellow-400",
  copas: "text-red-400",
  espadas: "text-blue-300",
  bastos: "text-green-400",
}

// --- SVG Suit Icons ---
function PaloIcon({ palo, className = "w-5 h-5" }: { palo: Palo; className?: string }) {
  switch (palo) {
    case "oros":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="18" fill="currentColor" />
          <circle cx="32" cy="32" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        </svg>
      )
    case "copas":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M18 14h28v4c0 12-8 20-14 24-6-4-14-12-14-24v-4z" fill="currentColor" />
          <rect x="28" y="42" width="8" height="8" rx="1" fill="currentColor" />
          <rect x="22" y="50" width="20" height="4" rx="2" fill="currentColor" />
        </svg>
      )
    case "espadas":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect x="30" y="6" width="4" height="40" rx="1" fill="currentColor" />
          <polygon points="32,6 22,20 42,20" fill="currentColor" />
          <rect x="20" y="42" width="24" height="4" rx="2" fill="currentColor" />
          <rect x="28" y="46" width="8" height="6" rx="1" fill="currentColor" />
        </svg>
      )
    case "bastos":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect x="29" y="10" width="6" height="44" rx="3" fill="currentColor" />
          <circle cx="32" cy="12" r="6" fill="currentColor" />
          <ellipse cx="22" cy="22" rx="5" ry="4" fill="currentColor" transform="rotate(-30 22 22)" />
          <ellipse cx="42" cy="22" rx="5" ry="4" fill="currentColor" transform="rotate(30 42 22)" />
        </svg>
      )
  }
}

// --- Deck ---
function crearBaraja(): Carta[] {
  const baraja: Carta[] = []
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      baraja.push({ valor, palo })
    }
  }
  return baraja
}

function barajar(baraja: Carta[]): Carta[] {
  const copia = [...baraja]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// --- Hand Evaluation (Chiribito: Color > Full, Perla > Escalera de color) ---
// Hand names mirror src/rooms/game/utils/CardEvaluator.ts getHandName() exactly
// (sentence case, castizo accents). Do not reword without updating canon.
type ManoTipo =
  | "Perla"
  | "Escalera de color"
  | "Póker"
  | "Color"
  | "Full"
  | "Escalera"
  | "Trío"
  | "Doble pareja"
  | "Pareja"
  | "Carta alta"

const MANO_RANKING: Record<ManoTipo, number> = {
  "Perla": 10,           // Sota + 7 same suit in hole — above everything
  "Escalera de color": 9,
  "Póker": 8,
  "Color": 7,            // Color beats Full in Chiribito
  "Full": 6,
  "Escalera": 5,
  "Trío": 4,
  "Doble pareja": 3,
  "Pareja": 2,
  "Carta alta": 1,
}

// Mirror of CardEvaluator.isStraight: dedupe rank-order indices, sort, require
// exactly 5 entries that are arithmetically consecutive in RANK_ORDER_INDEX
// (not in numeric Valor — 7 and Sota are adjacent in Chiribito).
function esEscalera(valores: Valor[]): boolean {
  const indices = Array.from(new Set(valores.map((v) => RANK_ORDER_INDEX[v]))).sort((a, b) => a - b)
  if (indices.length !== 5) return false
  return indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1)
}

// Mirror of CardEvaluator.isPerla — Sota + 7 of the same suit in the hole.
function esPerla(mano: [Carta, Carta]): boolean {
  if (mano[0].palo !== mano[1].palo) return false
  const valores = new Set<Valor>([mano[0].valor, mano[1].valor])
  return valores.has(10) && valores.has(7)
}

function evaluarMano5(cartas: Carta[]): { tipo: ManoTipo; rank: number } {
  const valores = cartas.map((c) => c.valor)
  const palos = cartas.map((c) => c.palo)

  const conteoValores = new Map<Valor, number>()
  for (const v of valores) {
    conteoValores.set(v, (conteoValores.get(v) || 0) + 1)
  }
  const conteos = [...conteoValores.values()].sort((a, b) => b - a)

  const todosIgualPalo = palos.every((p) => p === palos[0])
  const escalera = esEscalera(valores)

  if (todosIgualPalo && escalera) return { tipo: "Escalera de color", rank: 9 }
  if (conteos[0] === 4) return { tipo: "Póker", rank: 8 }
  if (todosIgualPalo) return { tipo: "Color", rank: 7 }
  if (conteos[0] === 3 && conteos[1] === 2) return { tipo: "Full", rank: 6 }
  if (escalera) return { tipo: "Escalera", rank: 5 }
  if (conteos[0] === 3) return { tipo: "Trío", rank: 4 }
  if (conteos[0] === 2 && conteos[1] === 2) return { tipo: "Doble pareja", rank: 3 }
  if (conteos[0] === 2) return { tipo: "Pareja", rank: 2 }
  return { tipo: "Carta alta", rank: 1 }
}

// Must use both hole cards + pick best 3 from 5 community.
// Perla (Sota + 7 same suit in hole) overrides any 5-card eval — canonical
// top category. Otherwise pick best 5-card hand across C(5,3) = 10 combos.
function evaluarMejorMano(
  mano: [Carta, Carta],
  comunitarias: Carta[]
): { tipo: ManoTipo; rank: number } {
  if (esPerla(mano)) {
    return { tipo: "Perla", rank: 10 }
  }

  let mejor: { tipo: ManoTipo; rank: number } = { tipo: "Carta alta", rank: 1 }

  for (let i = 0; i < comunitarias.length; i++) {
    for (let j = i + 1; j < comunitarias.length; j++) {
      for (let k = j + 1; k < comunitarias.length; k++) {
        const cincoCartas = [mano[0], mano[1], comunitarias[i], comunitarias[j], comunitarias[k]]
        const resultado = evaluarMano5(cincoCartas)
        if (resultado.rank > mejor.rank) {
          mejor = resultado
        }
      }
    }
  }
  return mejor
}

// --- Map cartas to real images ---
function getCartaImagePath(carta: Carta): string {
  const valorMap: Record<Valor, string> = {
    1: "1",
    5: "5",
    6: "6",
    7: "7",
    10: "10",
    11: "11",
    12: "12",
  }
  // Map plural palo names to singular file names
  const paloMap: Record<Palo, string> = {
    oros: "oro",
    copas: "copas",
    espadas: "espada",
    bastos: "bastos",
  }
  const numeroValor = valorMap[carta.valor]
  const paloFile = paloMap[carta.palo]
  return `/cartas/${numeroValor}_${paloFile}.webp`
}

// --- Card Component with Real Images ---
function CartaVisual({
  carta,
  boca_abajo = false,
  delay = 0,
}: {
  carta?: Carta
  boca_abajo?: boolean
  delay?: number
}) {
  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="perspective-[800px]"
    >
      {boca_abajo ? (
        <div className="w-20 h-32 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-40 lg:h-56 rounded-lg border-2 bg-secondary border-primary/40 flex items-center justify-center">
          <div className="w-10 h-14 sm:w-14 sm:h-20 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
            <span className="font-serif text-primary/50 text-xs">C</span>
          </div>
        </div>
      ) : carta ? (
        <img
          src={getCartaImagePath(carta)}
          alt={`${NOMBRE_VALOR_LARGO[carta.valor]} de ${NOMBRE_PALO[carta.palo]}`}
          className="w-20 h-32 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-40 lg:h-56 rounded-lg border-2 border-primary/50 shadow-lg object-cover"
        />
      ) : null}
    </motion.div>
  )
}

// --- Placeholder for unrevealed card ---
function CartaPlaceholder() {
  return (
    <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg border-2 border-border/30 bg-muted/30 flex items-center justify-center">
      <span className="text-muted-foreground/30 text-2xl">?</span>
    </div>
  )
}

// --- Main Simulator ---
export function SimuladorSection() {
  const [mano, setMano] = useState<[Carta, Carta] | null>(null)
  const [comunitarias, setComunitarias] = useState<Carta[]>([])
  const [comunitariasReveladas, setComunitariasReveladas] = useState(0)
  const [resultado, setResultado] = useState<{ tipo: ManoTipo; rank: number } | null>(null)
  const [fase, setFase] = useState<"inicio" | "repartido" | "revelando" | "finalizado">("inicio")

  const repartir = useCallback(() => {
    const baraja = barajar(crearBaraja())
    const nuevaMano: [Carta, Carta] = [baraja[0], baraja[1]]
    const nuevasComunitarias = baraja.slice(2, 7)

    setMano(nuevaMano)
    setComunitarias(nuevasComunitarias)
    setComunitariasReveladas(0)
    setResultado(null)
    setFase("repartido")
  }, [])

  const revelarSiguiente = useCallback(() => {
    if (!mano || comunitariasReveladas >= 5) return

    const nuevasReveladas = comunitariasReveladas + 1
    setComunitariasReveladas(nuevasReveladas)
    setFase("revelando")

    if (nuevasReveladas === 5) {
      // All cards revealed - evaluate
      setTimeout(() => {
        const res = evaluarMejorMano(mano, comunitarias)
        setResultado(res)
        setFase("finalizado")
      }, 600)
    }
  }, [mano, comunitarias, comunitariasReveladas])

  const resetear = useCallback(() => {
    setMano(null)
    setComunitarias([])
    setComunitariasReveladas(0)
    setResultado(null)
    setFase("inicio")
  }, [])

  return (
    <section id="simulador" className="py-24 md:py-32 bg-card relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/20" />

      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Interactivo
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 text-balance">
            Simulador de Manos
          </h2>
          <div className="w-24 h-px bg-primary mx-auto mt-6" />
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-pretty">
            Reparte una mano de Chiribito con baraja española de 28 cartas.
            Recuerda: es obligatorio usar las dos cartas de tu mano, y el Color
            vence al Full.
          </p>
        </motion.div>

        {/* Simulator area */}
        <div className="bg-background border border-border rounded-xl p-6 md:p-10">
          {/* Player hand */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4 text-center">
              Tu Mano
            </p>
            <div className="flex justify-center gap-3 md:gap-4">
              {fase === "inicio" ? (
                <>
                  <CartaPlaceholder />
                  <CartaPlaceholder />
                </>
              ) : mano ? (
                <>
                  <CartaVisual carta={mano[0]} delay={0} />
                  <CartaVisual carta={mano[1]} delay={0.15} />
                </>
              ) : null}
            </div>
          </div>

          {/* Community cards */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4 text-center">
              Cartas Comunitarias
            </p>
            <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i}>
                  {i < comunitariasReveladas ? (
                    <CartaVisual carta={comunitarias[i]} delay={0} />
                  ) : (
                    <CartaPlaceholder />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {resultado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-3 bg-secondary border border-primary/50 rounded-lg px-6 py-4">
                  <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    Mejor mano:
                  </span>
                  <span className="font-serif text-xl md:text-2xl text-primary font-bold">
                    {resultado.tipo}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {fase === "inicio" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={repartir}
                className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm uppercase tracking-wide"
              >
                Repartir Mano
              </motion.button>
            )}

            {(fase === "repartido" || fase === "revelando") && comunitariasReveladas < 5 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={revelarSiguiente}
                className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm uppercase tracking-wide"
              >
                {comunitariasReveladas === 0
                  ? "Levantar 1.ª Carta"
                  : comunitariasReveladas === 4
                    ? "Levantar River"
                    : `Levantar ${comunitariasReveladas + 1}.ª Carta`}
              </motion.button>
            )}

            {fase !== "inicio" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={fase === "finalizado" ? repartir : resetear}
                className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors duration-200 text-sm uppercase tracking-wide ${
                  fase === "finalizado"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {fase === "finalizado" ? "Nueva Mano" : "Reiniciar"}
              </motion.button>
            )}
          </div>

          {/* Card name legend */}
          {mano && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-border"
            >
              <p className="text-xs text-muted-foreground text-center mb-2 uppercase tracking-wide">
                Tu mano
              </p>
              <p className="text-sm text-foreground text-center">
                {NOMBRE_VALOR_LARGO[mano[0].valor]} de {NOMBRE_PALO[mano[0].palo]}{" "}
                y {NOMBRE_VALOR_LARGO[mano[1].valor]} de {NOMBRE_PALO[mano[1].palo]}
              </p>
              {comunitariasReveladas > 0 && (
                <>
                  <p className="text-xs text-muted-foreground text-center mt-3 mb-2 uppercase tracking-wide">
                    Mesa ({comunitariasReveladas}/5)
                  </p>
                  <p className="text-sm text-foreground text-center">
                    {comunitarias
                      .slice(0, comunitariasReveladas)
                      .map(
                        (c) =>
                          `${NOMBRE_VALOR_LARGO[c.valor]} de ${NOMBRE_PALO[c.palo]}`
                      )
                      .join(", ")}
                  </p>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Hand ranking reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Ranking de Manos (de mayor a menor)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Perla",
              "Escalera de color",
              "Póker",
              "Color",
              "Full",
              "Escalera",
              "Trío",
              "Doble pareja",
              "Pareja",
              "Carta alta",
            ].map((nombre, i) => (
              <span
                key={nombre}
                className={`text-xs px-3 py-1.5 rounded border ${
                  nombre === "Color" || nombre === "Perla"
                    ? "border-primary/60 text-primary bg-primary/10"
                    : "border-border text-muted-foreground"
                }`}
              >
                {i + 1}. {nombre}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/20" />
    </section>
  )
}
