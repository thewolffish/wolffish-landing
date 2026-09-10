'use client'

/** The usage heatmap shares ECharts' lazy chunk with the chart cards. */
import dynamic from 'next/dynamic'

export type { ActivityHeatmapEntry, ActivityHeatmapProps } from './ActivityHeatmapImpl'

export const ActivityHeatmap = dynamic(
  () => import('./ActivityHeatmapImpl').then((m) => m.ActivityHeatmap),
  { ssr: false, loading: () => <div className="h-full w-full" aria-hidden /> }
)
