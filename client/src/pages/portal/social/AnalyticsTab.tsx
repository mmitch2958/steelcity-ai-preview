import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useCallback } from 'react';
import {
  Eye,
  Heart,
  MessageSquare,
  Share2,
  CalendarDays,
  X,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import type { SocialPost } from '@shared/schema';

import { useSocialCampaigns } from '@/hooks/social/use-social-campaigns';
import { useSocialPosts } from '@/hooks/social/use-social-posts';
import { PLATFORMS } from '@/components/social/constants';
import { safeStr } from '@/components/social/utils';
import { cn } from '@/lib/utils';
import { HashtagDashboard } from '@/components/social/HashtagDashboard';
import { Separator } from '@/components/ui/separator';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { AnalyticsFullSkeleton } from '@/components/social/Skeletons';

/* ── Types ────────────────────────────────────────────────────────── */

interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  reach: number;
}

interface PlatformMetrics extends EngagementMetrics {
  count: number;
}

interface AnalyticsSummary extends EngagementMetrics {
  totalPosts: number;
  publishedCount: number;
  platformMap: Record<string, PlatformMetrics>;
}

type PostWithNormalizedFields = SocialPost & {
  status: string;
  content: string;
  platforms: string[];
  engagement: EngagementMetrics;
};

interface DateRange {
  from: Date;
  to: Date;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseEngagement(value: unknown): EngagementMetrics {
  if (!isRecord(value))
    return { likes: 0, shares: 0, comments: 0, reach: 0 };

  return {
    likes: asNumber(value.likes),
    shares: asNumber(value.shares),
    comments: asNumber(value.comments),
    reach: asNumber(value.reach),
  };
}

function toPostWithNormalizedFields(
  post: SocialPost,
): PostWithNormalizedFields {
  return {
    ...post,
    status: post.status ?? 'draft',
    content: safeStr(post.content),
    platforms: Array.isArray(post.platforms) ? post.platforms : [],
    engagement: parseEngagement(post.engagement),
  };
}

function getPostDate(post: SocialPost): Date | null {
  const raw = post.publishedAt ?? post.scheduledAt ?? post.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ── Preset Ranges ────────────────────────────────────────────────── */

const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  {
    label: 'Last 7 days',
    range: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: 'Last 30 days',
    range: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: 'Last 90 days',
    range: () => ({ from: subDays(new Date(), 90), to: new Date() }),
  },
  {
    label: 'This year',
    range: () => ({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    }),
  },
];

/* ── Date Range Picker Component ──────────────────────────────────── */

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
      // Start new selection
      setSelecting({ from: date });
    } else {
      // Complete selection
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

      <Helmet>
      <title>Analytics | Steel City AI</title>
      <meta name="description" content="Track performance insights and engagement metrics" />
    </Helmet>

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'min-w-[240px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="border-r p-3 space-y-1 min-w-[140px]">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Quick select
              </p>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const r = preset.range();
                    onChange(r);
                    setSelecting({});
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            {/* Calendar */}
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-2">
                {selecting.from && !selecting.to
                  ? 'Select end date'
                  : 'Select start date'}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label="Clear date filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export function AnalyticsTab() {
  const { posts, isLoading } = useSocialPosts('portal');
  const { campaigns } = useSocialCampaigns('portal');

  // Date range filter — persist in URL search params
  const [dateRange, setDateRange] = useState<DateRange | null>(
    () => {
      if (typeof window === 'undefined') return null;
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      const to = params.get('to');
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
          return { from: fromDate, to: toDate };
        }
      }
      return null;
    },
  );

  const updateUrl = useCallback((range: DateRange | null) => {
    const url = new URL(window.location.href);
    if (range) {
      url.searchParams.set('from', format(range.from, 'yyyy-MM-dd'));
      url.searchParams.set('to', format(range.to, 'yyyy-MM-dd'));
    } else {
      url.searchParams.delete('from');
      url.searchParams.delete('to');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleDateChange = useCallback(
    (range: DateRange) => {
      setDateRange(range);
      updateUrl(range);
    },
    [updateUrl],
  );

  const handleDateClear = useCallback(() => {
    setDateRange(null);
    updateUrl(null);
  }, [updateUrl]);

  // Normalize and filter posts
  const normalizedPosts = useMemo(
    () => posts.map(toPostWithNormalizedFields),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    if (!dateRange) return normalizedPosts;

    return normalizedPosts.filter((post) => {
      const date = getPostDate(post);
      if (!date) return false;
      return isWithinInterval(date, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      });
    });
  }, [normalizedPosts, dateRange]);

  const metrics = useMemo<AnalyticsSummary>(() => {
    const summary: AnalyticsSummary = {
      likes: 0,
      shares: 0,
      comments: 0,
      reach: 0,
      publishedCount: 0,
      totalPosts: filteredPosts.length,
      platformMap: {},
    };

    filteredPosts.forEach((post) => {
      summary.likes += post.engagement.likes;
      summary.shares += post.engagement.shares;
      summary.comments += post.engagement.comments;
      summary.reach += post.engagement.reach;

      if (post.status === 'published') {
        summary.publishedCount += 1;
      }

      post.platforms.forEach((platformId) => {
        if (!summary.platformMap[platformId]) {
          summary.platformMap[platformId] = {
            likes: 0,
            shares: 0,
            comments: 0,
            reach: 0,
            count: 0,
          };
        }

        summary.platformMap[platformId].likes += post.engagement.likes;
        summary.platformMap[platformId].shares += post.engagement.shares;
        summary.platformMap[platformId].comments += post.engagement.comments;
        summary.platformMap[platformId].reach += post.engagement.reach;
        summary.platformMap[platformId].count += 1;
      });
    });

    return summary;
  }, [filteredPosts]);

  const bestPosts = useMemo(() => {
    return [...filteredPosts]
      .filter(
        (post) =>
          post.engagement.likes > 0 ||
          post.engagement.shares > 0 ||
          post.engagement.comments > 0,
      )
      .sort((a, b) => {
        const scoreA =
          a.engagement.likes + a.engagement.shares * 2 + a.engagement.comments;
        const scoreB =
          b.engagement.likes + b.engagement.shares * 2 + b.engagement.comments;
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [filteredPosts]);

  if (isLoading) {
        <Helmet>
      <title>Analytics | Steel City AI</title>
      <meta name="description" content="Track performance insights and engagement metrics" />
    </Helmet>
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Analytics</h2>
            <p className="text-muted-foreground text-sm">
              Performance overview of your social media posts
            </p>
          </div>
        </div>
        <AnalyticsFullSkeleton />
      </div>
    );
  }

      <Helmet>
      <title>Analytics | Steel City AI</title>
      <meta name="description" content="Track performance insights and engagement metrics" />
    </Helmet>

  return (
    <div className="space-y-6">
      {/* Header with date range picker */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Performance overview of your social media posts
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateChange}
          onClear={handleDateClear}
        />
      </div>

      {/* Active filter badge */}
      {dateRange && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Showing {filteredPosts.length} of {normalizedPosts.length} posts
          </span>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Heart className="h-4 w-4" aria-hidden="true" /> Total Likes
            </div>
            <p className="text-3xl font-bold mt-1" aria-label={`Total likes: ${metrics.likes.toLocaleString()}`}>
              {metrics.likes.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Share2 className="h-4 w-4" aria-hidden="true" /> Total Shares
            </div>
            <p className="text-3xl font-bold mt-1" aria-label={`Total shares: ${metrics.shares.toLocaleString()}`}>
              {metrics.shares.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MessageSquare className="h-4 w-4" aria-hidden="true" /> Comments
            </div>
            <p className="text-3xl font-bold mt-1" aria-label={`Total comments: ${metrics.comments.toLocaleString()}`}>
              {metrics.comments.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Eye className="h-4 w-4" aria-hidden="true" /> Total Reach
            </div>
            <p className="text-3xl font-bold mt-1" aria-label={`Total reach: ${metrics.reach.toLocaleString()}`}>
              {metrics.reach.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform breakdown & best posts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.platformMap).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No platform data yet. Once your posts are published, engagement
                metrics will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.platformMap).map(
                  ([platformId, data]) => {
                    const platform = PLATFORMS.find(
                      (pl) => pl.id === platformId,
                    );
                    const Icon = platform?.icon;

                        <Helmet>
      <title>Analytics | Steel City AI</title>
      <meta name="description" content="Track performance insights and engagement metrics" />
    </Helmet>

                    return (
                      <div
                        key={platformId}
                        className="flex items-center gap-3 border-b pb-2 last:border-0"
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className="font-medium flex-1">
                          {platform?.label ?? platformId}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.count} posts
                        </span>
                        <span className="text-sm flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {data.likes}
                        </span>
                        <span className="text-sm flex items-center gap-1">
                          <Share2 className="h-3 w-3" /> {data.shares}
                        </span>
                        <span className="text-sm flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {data.comments}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {bestPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No engagement data yet. Posts with likes, shares, and comments
                will appear here once published.
              </p>
            ) : (
              <div className="space-y-3">
                {bestPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border rounded-md p-3 space-y-2"
                    role="article"
                    aria-label={`Post: ${post.content}`}
                  >
                    <p className="text-sm line-clamp-2" aria-hidden="true">{post.content}</p>
                    <span className="sr-only">{post.content}</span>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post.engagement.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" /> {post.engagement.shares}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />{' '}
                        {post.engagement.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {post.engagement.reach}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Post Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{metrics.totalPosts}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{campaigns.length}</p>
              <p className="text-sm text-muted-foreground">Campaigns</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hashtag Analytics Section (P3-B006) */}
      <Separator className="my-6" />
      <HashtagDashboard mode="portal" />
    </div>
  );
}

export default AnalyticsTab;
