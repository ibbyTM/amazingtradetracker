# Trueline Journal

A professional trade tracking dashboard and journal for futures prop traders, with a built-in
AI coach (Trueline AI).

## Stack

| Layer        | Tech                                                              |
| ------------ | ----------------------------------------------------------------- |
| Computation  | **F# compiled to JS with Fable 5** (`src/fsharp/`)                 |
| UI           | React 18 + TypeScript                                              |
| Bundler      | Vite 5                                                             |
| Styling      | Tailwind CSS (dark theme, CSS variables)                           |
| State        | Zustand (persisted to localStorage)                                |
| Charts       | Recharts (equity curve, donuts, edge radar)                        |
| Routing      | React Router v6                                                    |
| AI           | Anthropic SDK (`@anthropic-ai/sdk`), model `claude-sonnet-4-6`     |

All trading math — win rate, profit factor, expectancy, Kelly fraction, streaks, consistency,
R multiples, P&L and the weighted Edge Score — lives in `src/fsharp/Metrics.fs` and is compiled
to ES modules that React imports through the `@fable` alias.

## Prerequisites

- **Node.js 18+**
- **.NET SDK 10+** (Fable 5.2 is a `net10.0` dotnet tool) — <https://dot.net>

## Getting started

```bash
npm install            # also runs `dotnet tool restore` to install Fable
npm run dev            # compiles F#, then runs Fable watch + Vite concurrently
```

The app is served at <http://localhost:5173>.

### AI coach

Put your Anthropic API key in `.env.local` (gitignored — don't edit `.env`):

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

The key is used directly from the browser (`dangerouslyAllowBrowser`) — fine for a local,
single-user tool; do not deploy this pattern publicly.

## Scripts

| Script              | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | One-shot Fable build, then Fable watch + Vite dev server |
| `npm run build`     | Fable build → `tsc` typecheck → Vite production build   |
| `npm run fable:build` | Compile F# to `src/fsharp/build/` once                 |
| `npm run preview`   | Preview the production build                            |

## Project structure

```
trueline-journal/
├── src/
│   ├── fsharp/            # F# computation layer (Fable)
│   │   ├── Metrics.fs     #   all trading metrics
│   │   ├── Main.fs        #   aggregate summary + smoke test
│   │   └── build/         #   compiled JS output (gitignored)
│   ├── components/        # Sidebar, charts, calendar, AI panel…
│   ├── pages/             # Dashboard, Log Trade, Trades, Journal, Accounts, Reports, Settings
│   ├── store/             # Zustand stores (persisted app data + session chat)
│   ├── lib/               # TS wrappers: metrics, guardrails, AI context, formatting
│   ├── types/fable.d.ts   # hand-written typings for the Fable output
│   └── main.tsx
├── TruelineJournal.fsproj
├── vite.config.ts         # '@fable' alias → compiled F#
└── tailwind.config.js
```

## Notes

- All data is stored in your browser's localStorage (`trueline-journal` key). Use
  Settings → Data management to export/import JSON backups or wipe everything.
- Tick values default to NQ $5/pt, ES $12.50/pt, MNQ $0.50, MES $1.25 (per contract) and are
  editable in Settings.
- Every page renders a friendly empty state until you log trades or add accounts.
