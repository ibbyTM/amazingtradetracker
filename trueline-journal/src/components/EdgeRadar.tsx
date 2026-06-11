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

/** Right-panel edge radar: chart fills the width, score reads big below it. */
export default function EdgeRadar({ breakdown, score }: EdgeRadarProps) {
  const data = [
    { axis: 'Win %', value: breakdown.winRate },
    { axis: 'Profit Factor', value: breakdown.profitFactor },
    { axis: 'Avg R', value: breakdown.avgR },
    { axis: 'Consistency', value: breakdown.consistency },
    { axis: 'Risk Mgmt', value: breakdown.riskMgmt },
    { axis: 'Discipline', value: breakdown.discipline },
  ]

  return (
    <div className="card card-purple animate-fade-up p-5">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-muted">
        Edge Breakdown
      </h3>
      <div className="radar-glow h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="var(--accent-purple)"
              strokeWidth={2}
              fill="var(--accent-purple)"
              fillOpacity={0.35}
              animationDuration={700}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-col items-center">
        <div
          className="num text-6xl font-extrabold text-accent-purple"
          style={{ textShadow: '0 0 22px rgba(168, 85, 247, 0.45)' }}
        >
          {score}
        </div>
        <div className="mt-1 text-[11px] font-bold tracking-[0.3em] text-text-muted">
          EDGE SCORE
        </div>
        <div className="mt-1.5 rounded-md bg-accent-purple/15 px-2.5 py-0.5 text-xs font-semibold text-accent-purple">
          {edgeLabel(score)}
        </div>
      </div>
    </div>
  )
}
