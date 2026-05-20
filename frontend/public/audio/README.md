# Chiribito game music — drop your loops here

The in-game music layer (`frontend/src/music.ts`) looks for these files:

```
lobby.mp3    — 1 lobby loop (choosing a table / threshold)
mesa-1.mp3   — mesa loop A (in-game)
mesa-2.mp3   — mesa loop B (alternates with A for variety)
```

**Missing files are skipped silently** — the game stays quiet until they exist.
Drop the MP3s here and reload; no code change needed. To add/remove a loop or
rename a file, edit the `TRACKS` map in `frontend/src/music.ts`.

## What to look for

Royalty-free / Creative Commons, **commercial-use OK** (avoid CC-BY-NC).
Sources: Pixabay Music (no attribution), Uppbeat (free with credit), Free Music Archive.

**Direction:** a clandestine late-night Madrid card room — warm Spanish guitar,
dark/chill latin jazz, soft flamenco lounge. Instrumental, loopable, low energy,
non-invasive, not too melodic. **NOT** casino / EDM / synthwave / corporate / epic.

**Search terms:** `spanish guitar lounge`, `flamenco chill`, `nylon guitar instrumental`,
`latin jazz lounge`, `jazz noir`, `gypsy jazz` (slow ones), `tapas bar`, `late night jazz guitar`.

| Param  | `lobby.mp3`        | `mesa-*.mp3`        |
|--------|--------------------|---------------------|
| BPM    | 75–90              | 60–78               |
| Energy | low-medium         | low, sparse         |
| Melody | a bit more present | minimal, near-texture |
| Length | 2–3 min, loopable  | 2–3 min, loopable   |

Avoid: vocals, drops/builds/climaxes, strong hooks, BPM > 100, intense palmas.

Full brief & design: `docs/superpowers/specs/2026-05-20-chiribito-game-music-layer-design.md`
