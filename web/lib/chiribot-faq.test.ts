// Run with:  node --test lib/chiribot-faq.test.ts   (Node 24 strips types natively, zero deps)
import { test } from "node:test"
import assert from "node:assert/strict"
import { matchFaq, normalizeText, FAQS, faqById, type FaqEntry } from "./chiribot-faq.ts"

const fixtures: FaqEntry[] = [
  {
    id: "reglas",
    pregunta: "¿Cómo se juega al Chiribito?",
    respuesta: "...",
    keywords: ["como se juega", "jugar", "reglas", "empezar"],
  },
  {
    id: "perla",
    pregunta: "¿Qué es la Perla?",
    respuesta: "...",
    keywords: ["perla", "mejor mano", "sota 7"],
  },
  {
    id: "historia",
    pregunta: "¿De dónde viene el Chiribito?",
    respuesta: "...",
    keywords: ["historia", "origen", "madrid", "de donde viene"],
  },
]

test("normalizeText strips accents, lowercases, and removes punctuation", () => {
  assert.equal(normalizeText("¿Cómo Estás, Señor?"), "como estas senor")
})

test("matchFaq matches by single keyword ignoring case", () => {
  assert.equal(matchFaq("la PERLA", fixtures)?.id, "perla")
})

test("matchFaq normalizes accents on the input", () => {
  assert.equal(matchFaq("cuál es la história del juego", fixtures)?.id, "historia")
})

test("matchFaq matches multi-word keyword phrases", () => {
  assert.equal(matchFaq("¿cómo se juega a esto?", fixtures)?.id, "reglas")
})

test("matchFaq returns null when nothing matches", () => {
  assert.equal(matchFaq("pizza con piña", fixtures), null)
})

test("matchFaq picks the highest-scoring entry on overlap", () => {
  // hits historia twice (origen, madrid) vs reglas once (juego→no keyword; 'jugar' not present)
  assert.equal(matchFaq("el origen en madrid de este juego", fixtures)?.id, "historia")
})

test("single-word keyword matches whole tokens, not substrings", () => {
  // "perlado" must NOT match the single-word keyword "perla"
  assert.equal(matchFaq("un boton perlado bonito", fixtures), null)
})

test("matchFaq returns null on empty input", () => {
  assert.equal(matchFaq("   ", fixtures), null)
})

// --- Integration: the real shipped content must answer typical user phrasings ---
const realCases: [string, string][] = [
  ["¿cómo se juega?", "reglas"],
  ["¿qué es el Chiribito?", "reglas"],
  ["explícame las reglas", "reglas"],
  ["qué es la perla", "perla"],
  ["la sota y 7", "perla"],
  ["qué baraja se usa", "baraja"],
  ["cuántas cartas tiene", "baraja"],
  ["ranking de manos", "ranking"],
  ["¿el color gana al full?", "ranking"],
  ["de dónde viene el chiribito", "historia"],
  ["el origen en madrid", "historia"],
  ["dónde juego", "jugar"],
  ["¿es gratis?", "jugar"],
  ["cuántos jugadores", "jugar"],
]

for (const [input, expected] of realCases) {
  test(`real FAQ: "${input}" → ${expected}`, () => {
    assert.equal(matchFaq(input, FAQS)?.id, expected)
  })
}

test("faqById resolves a real entry", () => {
  assert.equal(faqById("perla")?.pregunta, "¿Qué es la Perla?")
})

test("every related id resolves to a real FAQ", () => {
  for (const faq of FAQS) {
    for (const rel of faq.relacionadas ?? []) {
      assert.ok(faqById(rel), `related id "${rel}" in "${faq.id}" must resolve`)
    }
  }
})
