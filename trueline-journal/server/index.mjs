// Trueline Journal sync server.
// Serves the built SPA, persists the journal data as a single JSON document,
// and proxies AI calls so the Anthropic key stays server-side.
//
// Env:
//   PORT               - listen port (Railway injects this)
//   APP_PASSCODE       - required passcode for /api/* (UNSET = open; only for local testing)
//   DATA_DIR           - where trueline-data.json lives (mount a volume here, e.g. /data)
//   ANTHROPIC_API_KEY  - enables the /api/ai proxy for the Trueline AI coach
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const PORT = process.env.PORT || 3000
const DATA_DIR = process.env.DATA_DIR || path.resolve('./data')
const DATA_FILE = path.join(DATA_DIR, 'trueline-data.json')
const PASSCODE = process.env.APP_PASSCODE || ''
const DIST_DIR = path.resolve(import.meta.dirname, '../dist')
const AI_MODEL = 'claude-sonnet-4-6'

const app = express()
// generous limit: trade screenshots are stored as base64 data URLs
app.use(express.json({ limit: '25mb' }))

function requireAuth(req, res, next) {
  if (!PASSCODE) return next()
  if (req.get('x-trueline-pass') === PASSCODE) return next()
  res.status(401).json({ error: 'unauthorized' })
}

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    passcodeRequired: Boolean(PASSCODE),
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  }),
)

app.get('/api/data', requireAuth, async (_req, res) => {
  try {
    res.type('application/json').send(await fs.readFile(DATA_FILE, 'utf8'))
  } catch {
    res.json(null) // nothing stored yet
  }
})

app.put('/api/data', requireAuth, async (req, res) => {
  const data = req.body
  if (!data || !Array.isArray(data.trades) || !Array.isArray(data.accounts)) {
    return res.status(400).json({ error: 'not a Trueline data document' })
  }
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = `${DATA_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data))
  await fs.rename(tmp, DATA_FILE) // atomic swap — no torn files on crash
  res.json({ ok: true })
})

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

app.post('/api/ai', requireAuth, async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' })
  }
  const { system, messages } = req.body ?? {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' })
  }
  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: typeof system === 'string' ? system : undefined,
      messages,
    })
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
    res.json({ text, model: AI_MODEL })
  } catch (err) {
    res.status(502).json({ error: err?.message ?? String(err) })
  }
})

// static assets + SPA fallback for /dashboard, /trades, ...
app.use(express.static(DIST_DIR))
app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))

app.listen(PORT, () => {
  console.log(`[trueline] listening on :${PORT}`)
  console.log(`[trueline] data file: ${DATA_FILE}`)
  console.log(`[trueline] passcode: ${PASSCODE ? 'required' : 'NOT SET (open access!)'}`)
  console.log(`[trueline] AI proxy: ${anthropic ? 'enabled' : 'disabled (no ANTHROPIC_API_KEY)'}`)
})
