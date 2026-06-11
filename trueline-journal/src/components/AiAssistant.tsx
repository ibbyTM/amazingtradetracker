import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useChatStore } from '../store/useChatStore'
import { AI_MODEL, SUGGESTED_PROMPTS, askTrueline } from '../lib/ai'
import { fmtClock } from '../lib/format'

export default function AiAssistant() {
  const { isOpen, setOpen, isLoading, setLoading, messages, addMessage } = useChatStore()
  const [input, setInput] = useState('')
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const page = location.pathname.replace('/', '') || 'dashboard'
  const chips = SUGGESTED_PROMPTS[page] ?? SUGGESTED_PROMPTS.dashboard

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setInput('')
    const history = useChatStore.getState().messages
    addMessage('user', trimmed)
    setLoading(true)
    try {
      const reply = await askTrueline(history, trimmed, page)
      addMessage('assistant', reply)
    } catch (err) {
      addMessage(
        'assistant',
        `⚠️ Couldn't reach Trueline AI: ${err instanceof Error ? err.message : String(err)}\n\n` +
          'Check that VITE_ANTHROPIC_API_KEY is set in `.env.local` and restart the dev server.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(!isOpen)}
        aria-label="Open Trueline AI"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full
          bg-accent-purple text-white shadow-card transition-transform hover:scale-105"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Slide-in panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-[420px] flex-col border-l
          border-border bg-bg-card shadow-card transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-accent-purple" />
          <span className="font-bold">Trueline AI</span>
          <span className="badge bg-accent-purple/15 text-accent-purple">{AI_MODEL}</span>
          <button
            className="ml-auto text-text-muted hover:text-text-primary"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
          >
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div>
              <p className="mb-3 text-sm text-text-muted">
                Ask me anything about your trading — I can see your live stats, trades, accounts
                and journal.
              </p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="rounded-full border border-accent-purple/40 bg-accent-purple/10 px-3
                      py-1.5 text-xs font-medium text-accent-purple transition-colors
                      hover:bg-accent-purple/20"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-3 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-hover text-text-primary'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="prose-trueline">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
              <span className="mt-1 text-[10px] text-text-muted">{fmtClock(m.ts)}</span>
            </div>
          ))}

          {isLoading && (
            <div className="mb-3 flex items-start">
              <div className="rounded-xl bg-bg-hover px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
        >
          <input
            className="field"
            placeholder="Ask Trueline AI…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </>
  )
}
