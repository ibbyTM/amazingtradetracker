import Anthropic from '@anthropic-ai/sdk'
import { useStore } from '../store/useStore'
import type { ChatMessage } from '../store/useChatStore'
import { getSummary, sortTrades } from './metrics'
import { accountStatus } from './guardrails'
import { fmtMoney, fmtR, todayStr } from './format'

export const AI_MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT =
  'You are Trueline AI, a professional trading coach and performance analyst embedded inside ' +
  'Trueline Journal. You are working with a futures trader called Chubs who primarily trades NQ ' +
  'and ES on prop firm accounts. You have full access to their real trade data which is provided ' +
  'in each message. Be direct, specific, and data-driven. Reference their actual numbers when ' +
  'answering. Never be vague or generic. Keep responses concise unless they ask for a deep dive. ' +
  'You can help with: trade analysis, identifying patterns, writing journal entries, pre-session ' +
  'game plans, risk management, prop guardrail warnings, and performance coaching.'

// The key is exposed to the browser by design — this is a local, single-user
// dev tool. Use .env.local for the real key; never deploy this pattern.
const client = new Anthropic({
  apiKey: (import.meta.env.VITE_ANTHROPIC_API_KEY as string) ?? '',
  dangerouslyAllowBrowser: true,
})

export const SUGGESTED_PROMPTS: Record<string, string[]> = {
  dashboard: [
    'Analyse my performance',
    "What's my biggest weakness?",
    'Write my session review',
    'Am I near any prop limits?',
  ],
  trades: ['Find my best setup', 'Where am I losing money?', 'Compare this week vs last week'],
  journal: [
    'Write my post-session notes',
    'What should I focus on tomorrow?',
    'Summarise my week',
  ],
  accounts: ['Which account is healthiest?', 'Am I close to any limits today?'],
  log: ['What R should I be targeting?', 'Is this a good setup for today?'],
}

/** Live snapshot of the trader's data, injected ahead of every user message. */
export function getPageContext(page: string): string {
  const { trades, accounts, journal } = useStore.getState()
  const s = getSummary(trades)
  const lines: string[] = ['[TRADER DATA SNAPSHOT — not visible to the user]']

  lines.push(
    `Overview: ${s.totalTrades} trades | net P&L ${fmtMoney(s.netPnl)} | win rate ` +
      `${s.winRate.toFixed(1)}% | profit factor ${s.profitFactor.toFixed(2)} | ` +
      `expectancy ${fmtMoney(s.expectancy)}/trade | edge score ${s.edgeScore}/100`,
  )
  lines.push(
    `Current streak: ${s.streaks.current} (longest win streak ${s.streaks.longestWin}, ` +
      `longest loss streak ${s.streaks.longestLoss})`,
  )

  const last10 = sortTrades(trades).slice(-10).reverse()
  if (last10.length > 0) {
    lines.push('Last 10 trades (newest first):')
    for (const t of last10) {
      lines.push(
        `  ${t.date} ${t.time} ${t.symbol} ${t.side} "${t.setup || 'no setup'}" ` +
          `${fmtR(t.rMultiple)} ${fmtMoney(t.pnl)}`,
      )
    }
  } else {
    lines.push('No trades logged yet.')
  }

  if (accounts.length > 0) {
    lines.push('Accounts & prop guardrails:')
    for (const a of accounts) {
      const st = accountStatus(a, trades)
      lines.push(
        `  ${a.name} (${a.platform}, $${a.accountSize.toLocaleString()}): balance ` +
          `$${st.balance.toLocaleString()} | today ${fmtMoney(st.todayPnl)} | daily loss used ` +
          `$${st.dailyUsed.toLocaleString()}/$${a.dailyLossLimit.toLocaleString()} ` +
          `(${st.dailyPct.toFixed(0)}%) | trailing DD used $${st.ddUsed.toLocaleString()}/` +
          `$${a.trailingDDLimit.toLocaleString()} (${st.ddPct.toFixed(0)}%)`,
      )
    }
  } else {
    lines.push('No accounts added yet.')
  }

  const entry = journal.find((j) => j.date === todayStr())
  if (entry) {
    lines.push(
      `Today's journal: bias ${entry.bias} | mental state ${entry.mentalState}/5 | ` +
        `key levels: ${entry.keyLevels || '-'} | game plan: ${entry.gamePlan || '-'} | ` +
        `went well: ${entry.whatWentWell || '-'} | mistakes: ${entry.mistakes || '-'} | ` +
        `lesson: ${entry.lesson || '-'}`,
    )
  } else {
    lines.push('No journal entry for today yet.')
  }

  lines.push(`User is currently on the "${page}" page.`)
  return lines.join('\n')
}

export async function askTrueline(
  history: ChatMessage[],
  userText: string,
  page: string,
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: `${getPageContext(page)}\n\n---\n\n${userText}` },
  ]

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  return text || '(no response)'
}
