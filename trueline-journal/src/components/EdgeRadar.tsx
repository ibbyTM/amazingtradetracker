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
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
        Edge Breakdown
      </h3>
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <div className="h-64 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="var(--accent-purple)"
                fill="var(--accent-purple)"
                fillOpacity={0.35}
                animationDuration={700}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-center px-4">
          <div className="num text-5xl font-bold text-accent-purple">{score}</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Edge Score
          </div>
          <div className="mt-1 rounded-md bg-accent-purple/15 px-2 py-0.5 text-xs font-semibold text-accent-purple">
            {edgeLabel(score)}
          </div>
        </div>
      </div>
    </div>
  )
}
