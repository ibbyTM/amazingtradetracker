/** "+$1,234.50" / "-$567" — positive always gets the + prefix. */
export function fmtMoney(v: number, digits = 2): string {
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  const abs = Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
  return `${sign}$${abs}`
}

export function moneyClass(v: number): string {
  return v > 0 ? 'text-accent-green' : v < 0 ? 'text-accent-red' : 'text-text-muted'
}

export function fmtR(r: number): string {
  return `${r > 0 ? '+' : ''}${r.toFixed(2)}R`
}

export function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

/** Local date as YYYY-MM-DD (en-CA locale formats exactly that). */
export function todayStr(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA').format(d)
}

/** Local time as HH:MM. */
export function nowTime(d = new Date()): string {
  return d.toTimeString().slice(0, 5)
}

export function fmtLongDate(d = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/** Minutes between two HH:MM strings, formatted like "1h 25m". */
export function durationBetween(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return ''
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60)
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`
}
