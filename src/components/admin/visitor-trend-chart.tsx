"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type VisitorTrendPoint = {
  label: string
  visitors: number
  pageViews: number
}

export function VisitorTrendChart({ data }: { data: VisitorTrendPoint[] }) {
  if (!data.length || data.every((point) => point.visitors === 0 && point.pageViews === 0)) {
    return <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">No visitor activity in this period.</div>
  }

  return <div className="h-72 w-full" role="img" aria-label="Unique visitors and page views over time">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={42} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="visitors" name="Unique visitors" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="pageViews" name="Page views" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
}
