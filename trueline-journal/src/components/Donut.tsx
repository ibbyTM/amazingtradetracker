interface DonutProps {
  /** 0..max */
  value: number
  max?: number
  size?: number
  color?: string
  children?: React.ReactNode
}

/** Animated SVG donut — progress eases in via a CSS stroke transition. */
export default function Donut({
  value,
  max = 100,
  size = 72,
  color = 'var(--accent-green)',
  children,
}: DonutProps) {
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const stroke = 6
  const r = size / 2 - stroke
  const c = 2 * Math.PI * r

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          style={{
            transition: 'stroke-dashoffset 0.9s ease',
            filter: `drop-shadow(0 0 5px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
