# Spellfall

Battle royale word game. 20 players. 7 letters. One round at a time. Last one standing wins.

Built with Next.js 16, TypeScript, Tailwind CSS 4, and PartyKit for real-time multiplayer.

---

## Game overview

Each round every player receives the same 7-letter rack. Submit words formed from those letters to deal damage to the three nearest rivals on the leaderboard. Submit nothing and the zone deals chip damage to you. At 3 players remaining, sudden death begins (shorter rounds, no healing). The last player with HP wins.

**Abilities** — each player picks one before the match:

| Ability | Effect |
|---|---|
| Letter Snipe | Gain a private 8th letter next round |
| Venom Word | Your next word poisons targets (5 dmg/round × 3 rounds) |
| Word Shield | Block all incoming word damage this round |
| Lifeleech | Your next word heals you for 50% of the damage it deals |
| Scramble | Immediately reroll the shared rack |
| Blind | Target's rack is hidden for the first 5 s of next round |

---

## Local development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Setup

```bash
git clone <repo>
cd spellfall
npm install
```

### Run both servers

```bash
npm run dev
```

This starts:
- **Next.js** dev server → `http://localhost:3000`
- **PartyKit** dev server → `http://localhost:1999`

The wordlist is generated automatically before each start (`scripts/prepare-wordlist.mjs` → `party/wordlist-data.ts`).

### Run servers separately

```bash
npm run dev:next   # Next.js only (no real multiplayer)
npm run dev:party  # PartyKit only
```

### Practice mode (offline, no PartyKit needed)

Visit `http://localhost:3000/practice` — full engine runs in-browser against 19 bots.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_PARTYKIT_HOST` | No | `localhost:1999` | PartyKit host (no protocol prefix) |

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_PARTYKIT_HOST=spellfall.yourname.partykit.dev
```

---

## Deploy

### 1 — Deploy the PartyKit game server

Log in once:

```bash
npx partykit login
```

Then deploy:

```bash
npm run deploy:party
```

Your server is at `https://spellfall.<username>.partykit.dev`.

### 2 — Deploy the Next.js frontend (Vercel)

1. Push to GitHub.
2. Import into [vercel.com](https://vercel.com).
3. Add environment variable:
   ```
   NEXT_PUBLIC_PARTYKIT_HOST = spellfall.<username>.partykit.dev
   ```
4. Deploy.

### Production build check

```bash
npm run build
```

---

## Project structure

```
spellfall/
├── src/
│   ├── app/                   Next.js App Router pages
│   │   ├── page.tsx           Home (name entry + mode select)
│   │   ├── play/page.tsx      Quick play matchmaking
│   │   ├── play/[code]/       Join a private room by code
│   │   ├── practice/page.tsx  Offline vs bots
│   │   └── api/lobby/         Server-side proxy to PartyKit registry
│   ├── components/            All React UI components
│   ├── contexts/              SettingsContext (volume, motion, colorblind)
│   ├── engine/                Pure game engine (no I/O)
│   │   ├── engine.ts          SpellfallEngine — processEvent + tick
│   │   ├── types.ts           GameState, Player, StatusEffect, …
│   │   ├── events.ts          All GameEvent types
│   │   ├── abilities.ts       Ability registry + bot pools by tier
│   │   ├── balance.ts         Tunable constants (energy, damage, timing)
│   │   ├── bots.ts            Bot AI — word selection + ability use
│   │   ├── dictionary.ts      canMakeWord, loadDictionary
│   │   └── scoring.ts         Word score calculation
│   ├── hooks/
│   │   ├── useGameEngine.ts   Practice mode (engine in browser)
│   │   └── usePartyEngine.ts  Multiplayer (engine on PartyKit)
│   ├── lib/
│   │   ├── audio.ts           Web Audio API synthesis (no file assets)
│   │   └── stats.ts           Local-first stats (localStorage + UUID)
│   └── party/
│       └── protocol.ts        Client↔server message types
├── party/
│   ├── index.ts               PartyKit room (authoritative engine)
│   ├── registry.ts            Lobby registry for matchmaking
│   └── wordlist-data.ts       172 K word set (auto-generated, gitignored)
└── scripts/
    └── prepare-wordlist.mjs   Wordlist builder (runs before dev/build)
```

### Key design decisions

**Engine is pure.** `SpellfallEngine.processEvent(event)` returns a new `GameState` with no side effects. Both practice mode (browser) and multiplayer (PartyKit) run the same engine code.

**Per-player snapshots.** The server sends each player a personalised view of state: opponents' submitted words are hidden until round resolution, and blind status causes the server to send an empty rack to the affected player.

**Dictionary lives in the party.** The 172 K word set is bundled into `party/wordlist-data.ts` so it's available inside the PartyKit Durable Object without any external fetch at runtime.

**Audio is synthesised.** All sounds are generated with the Web Audio API in `src/lib/audio.ts`. No audio files to host or serve.

**Stats are local-first.** Player stats persist in `localStorage` under a stable UUID. The schema is designed so a backend sync layer can be layered on later without breaking existing data.

---

## Audio

All sounds synthesised with the Web Audio API. No external assets. No attribution required.

---

## Word scoring

Letter rarity weights (uncommon letters score more) plus:

- **Length bonus** — longer words deal proportionally more damage
- **Pangram bonus** — using all 7 rack letters: +25 pts + 10 HP heal
- **Decay** — each additional word in the same round deals 25% less base damage than the previous one

---

## Contributing

1. `npx tsc --noEmit` — must be error-free
2. `npm run build` — must complete cleanly
