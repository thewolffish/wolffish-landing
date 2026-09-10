'use client'

/** ECharts loads the first time a chart card is on screen, not with the app. */
import dynamic from 'next/dynamic'

export type { ChartSpecPlotProps } from './ChartSpecPlotImpl'

export const ChartSpecPlot = dynamic(() => import('./ChartSpecPlotImpl').then((m) => m.ChartSpecPlot), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />
})
