/**
 * HashtagTrendChart — Recharts LineChart for hashtag time-series data
 * 
 * Shows engagement trends over time for one or more selected hashtags.
 * Supports multi-hashtag comparison with distinct line colors.
 * 
 * P3-B006
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import type { SocialHashtagMetric } from '@shared/schema';

// ─── Types ──────────────────────────────────────────────────────────

interface HashtagTimeSeriesData {
  hashtag: string;
  metrics: SocialHashtagMetric[];
}

interface HashtagTrendChartProps {
  data: HashtagTimeSeriesData[];
  isLoading?: boolean;
}

// ─── Color palette for multi-hashtag comparison ─────────────────────

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

// ─── Component ──────────────────────────────────────────────────────

export function HashtagTrendChart({ data, isLoading }: HashtagTrendChartProps) {
  // Merge all hashtag metrics into a single dataset keyed by date
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Collect all unique dates
    const dateMap = new Map<string, Record<string, string | number>>();

    for (const { hashtag, metrics } of data) {
      for (const m of metrics) {
        const dateKey = format(new Date(m.measuredAt), 'MMM dd');
        const existing: Record<string, string | number> = dateMap.get(dateKey) || { date: dateKey };
        const engKey = `${hashtag}_engagements`;
        const impKey = `${hashtag}_impressions`;
        existing[engKey] = (Number(existing[engKey]) || 0) + (m.engagements ?? 0);
        existing[impKey] = (Number(existing[impKey]) || 0) + (m.impressions ?? 0);
        dateMap.set(dateKey, existing);
      }
    }

    return Array.from(dateMap.values()).sort((a, b) => {
      return String(a.date).localeCompare(String(b.date));
    });
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hashtag Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hashtag Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Select a hashtag to view its performance over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Hashtag Trends
          <span className="text-sm font-normal text-muted-foreground">
            ({data.map(d => `#${d.hashtag}`).join(', ')})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Legend />
            {data.map(({ hashtag }, idx) => (
              <Line
                key={hashtag}
                type="monotone"
                dataKey={`${hashtag}_engagements`}
                name={`#${hashtag} engagements`}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default HashtagTrendChart;
