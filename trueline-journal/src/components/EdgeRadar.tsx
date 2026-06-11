import { Link } from 'react-router-dom'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { EdgeBreakdown } from '../lib/metrics'
import { edgeLabel } from '../lib/metrics'

interface EdgeRadarProps {
  breakdown: EdgeBreakdown
  score: number
}

/** Edge breakdown card: gradient-stroked radar with the score beside it. */
export default function EdgeRadar({ breakdown, score }: EdgeRadarProps) {
  const data = [
    { axis: 'Win %', value: breakdown.winRate },
    { axis: 'Profit factor', value: breakdown.profitFactor },
    { axis: 'Avg R', value: breakdown.avgR },
    { axis: 'Consistency', value: breakdown.consistency },
    { axis: 'Risk mgmt', value: breakdown.riskMgmt },
    { axis: 'Discipline', value: breakdown.discipline },
  ]

  return (
    <div className="card card-purple animate-fade-up p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="card-title">Edge breakdown</h3>
        <Link to="/reports" className="text-xs font-semibold text-accent-purple hover:underline">
          Details →
        </Link>
      </div>
      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-1">
        <div className="radar-glow h-[280px] w-full min-w-0 md:h-52 md:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <defs>
                <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00d4aa" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="url(#radarStroke)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: 'var(--accent-purple)', strokeWidth: 0 }}
                fill="var(--accent-purple)"
                fillOpacity={0.3}
                animationDuration={700}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex shrink-0 flex-col items-center pr-1">
          <div
            className="num text-5xl font-extrabold text-accent-purple"
            style={{ textShadow: '0 0 22px rgba(168, 85, 247, 0.45)' }}
          >
            {score}
          </div>
          <div className="mt-1.5 text-xs font-bold tracking-[0.3em] text-text-muted">
            EDGE SCORE
          </div>
          <div className="mt-1.5 rounded-md bg-accent-purple/15 px-2.5 py-0.5 text-xs font-semibold text-accent-purple">
            {edgeLabel(score)}
          </div>
        </div>
      </div>
    </div>
  )
}
