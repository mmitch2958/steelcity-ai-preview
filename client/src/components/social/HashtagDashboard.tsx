/**
 * HashtagDashboard — Full hashtag analytics section
 * 
 * Integrates:
 * - HashtagPerformanceCards grid
 * - HashtagTrendChart (Recharts LineChart)
 * - HashtagRankingTable with sorting and pagination
 * - DateRangeFilter integration (reuses existing AnalyticsTab pattern)
 * 
 * Used as a sub-section within AnalyticsTab.
 * 
 * P3-B006
 */

import { useState, useCallback, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { CalendarDays, Hash, X } from 'lucide-react';

import { useTopHashtags, useHashtagTimeSeries } from '@/hooks/social/use-hashtag-analytics';
import { HashtagPerformanceCards } from './HashtagPerformanceCards';
import { HashtagTrendChart } from './HashtagTrendChart';
import { HashtagRankingTable } from './HashtagRankingTable';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────

type ApiMode = 'portal' | 'admin';

interface DateRange {
  from: Date;
  to: Date;
}

interface HashtagDashboardProps {
  mode: ApiMode;
}

// ─── Date Range Presets ─────────────────────────────────────────────

const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  { label: 'Last 7 days', range: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', range: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Last 90 days', range: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: 'This year', range: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
];

// ─── Date Range Picker (mirrors AnalyticsTab pattern) ───────────────

function DateRangePicker({
  value,
  onChange,
  onClear,
}: {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<{ from?: Date; to?: Date }>({});

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!selecting.from || selecting.to) {
      setSelecting({ from: date });
    } else {
      const from = date < selecting.from ? date : selecting.from;
      const to = date < selecting.from ? selecting.from : date;
      setSelecting({});
      onChange({ from: startOfDay(from), to: endOfDay(to) });
      setOpen(false);
    }
  };

  const displayText = value
    ? `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'min-w-[220px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-3 space-y-1 min-w-[140px]">
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick select</p>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    onChange(preset.range());
                    setSelecting({});
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-2">
                {selecting.from && !selecting.to ? 'Select end date' : 'Select start date'}
              </p>
              <Calendar
                mode="single"
                selected={selecting.from}
                onSelect={handleSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                className="rounded-md"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear date filter">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────

export function HashtagDashboard({ mode }: HashtagDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  // Format filters for API
  const filters = useMemo(() => ({
    startDate: dateRange ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    limit: 50,
  }), [dateRange]);

  // Fetch top hashtags
  const { hashtags, isLoading: hashtagsLoading } = useTopHashtags(mode, filters);

  // Fetch time-series data for selected hashtags (up to 4)
  const ts1 = useHashtagTimeSeries(selectedHashtags[0] || null, mode, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const ts2 = useHashtagTimeSeries(selectedHashtags[1] || null, mode, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const ts3 = useHashtagTimeSeries(selectedHashtags[2] || null, mode, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const ts4 = useHashtagTimeSeries(selectedHashtags[3] || null, mode, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Build chart data
  const chartData = useMemo(() => {
    const result: { hashtag: string; metrics: any[] }[] = [];
    if (selectedHashtags[0] && ts1.metrics.length) result.push({ hashtag: selectedHashtags[0], metrics: ts1.metrics });
    if (selectedHashtags[1] && ts2.metrics.length) result.push({ hashtag: selectedHashtags[1], metrics: ts2.metrics });
    if (selectedHashtags[2] && ts3.metrics.length) result.push({ hashtag: selectedHashtags[2], metrics: ts3.metrics });
    if (selectedHashtags[3] && ts4.metrics.length) result.push({ hashtag: selectedHashtags[3], metrics: ts4.metrics });
    return result;
  }, [selectedHashtags, ts1.metrics, ts2.metrics, ts3.metrics, ts4.metrics]);

  const handleToggleHashtag = useCallback((hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      }
      if (prev.length >= 4) {
        // Replace oldest selection
        return [...prev.slice(1), hashtag];
      }
      return [...prev, hashtag];
    });
  }, []);

  const handleCardSelect = useCallback((hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      }
      // For card select, toggle single
      if (prev.length >= 4) {
        return [...prev.slice(1), hashtag];
      }
      return [...prev, hashtag];
    });
  }, []);

  const chartLoading = ts1.isLoading || ts2.isLoading || ts3.isLoading || ts4.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Analytics
          </h3>
          <p className="text-muted-foreground text-sm">
            Track performance and trends for your hashtags
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          onClear={() => setDateRange(null)}
        />
      </div>

      {/* Date filter badge */}
      {dateRange && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
          </Badge>
        </div>
      )}

      {/* Selection info */}
      {selectedHashtags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Selected hashtags for comparison">
          <span className="text-sm text-muted-foreground">Comparing:</span>
          {selectedHashtags.map(h => (
            <Badge
              key={h}
              variant="default"
              className="gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              onClick={() => handleToggleHashtag(h)}
              role="button"
              tabIndex={0}
              aria-label={`Remove #${h} from comparison`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggleHashtag(h)}
            >
              #{h}
              <X className="h-3 w-3" aria-hidden="true" />
            </Badge>
          ))}
          {selectedHashtags.length < 4 && (
            <span className="text-xs text-muted-foreground">
              (click rows to add, max 4)
            </span>
          )}
        </div>
      )}

      {/* Performance Cards Grid */}
      <HashtagPerformanceCards
        hashtags={hashtags}
        isLoading={hashtagsLoading}
        selectedHashtag={selectedHashtags[0] || null}
        onSelect={handleCardSelect}
      />

      {/* Trend Chart */}
      <HashtagTrendChart data={chartData} isLoading={chartLoading} />

      {/* Ranking Table */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Hashtag Leaderboard</h4>
        <HashtagRankingTable
          hashtags={hashtags}
          isLoading={hashtagsLoading}
          selectedHashtags={selectedHashtags}
          onToggleSelect={handleToggleHashtag}
        />
      </div>
    </div>
  );
}

export default HashtagDashboard;
