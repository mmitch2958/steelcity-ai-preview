/**
 * HashtagRankingTable — Sortable table with pagination for hashtag leaderboard
 * 
 * Features:
 * - Sortable columns (impressions, engagements, clicks, post count)
 * - Pagination (10 per page)
 * - Row selection for chart comparison
 * - Engagement rate calculation
 * 
 * P3-B006
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────

interface TopHashtag {
  hashtag: string;
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
  postCount: number;
}

type SortField = 'hashtag' | 'totalImpressions' | 'totalEngagements' | 'totalClicks' | 'postCount' | 'engagementRate';
type SortDir = 'asc' | 'desc';

interface HashtagRankingTableProps {
  hashtags: TopHashtag[];
  isLoading?: boolean;
  selectedHashtags?: string[];
  onToggleSelect?: (hashtag: string) => void;
  pageSize?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function engRate(h: TopHashtag): number {
  return h.totalImpressions > 0 ? (h.totalEngagements / h.totalImpressions) * 100 : 0;
}

// ─── Sort Header ────────────────────────────────────────────────────

function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;
  const sortDescription = isActive
    ? `Sorted ${currentDir === 'asc' ? 'ascending' : 'descending'}. Click to sort ${currentDir === 'asc' ? 'descending' : 'ascending'}.`
    : 'Click to sort ascending.';

  return (
    <TableHead
      className={cn('cursor-pointer select-none', className)}
      onClick={() => onSort(field)}
      role="columnheader"
      aria-sort={isActive ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort(field)}
      title={sortDescription}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
        )}
      </div>
    </TableHead>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export function HashtagRankingTable({
  hashtags,
  isLoading,
  selectedHashtags = [],
  onToggleSelect,
  pageSize = 10,
}: HashtagRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalEngagements');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  }, [sortField]);

  const sorted = useMemo(() => {
    const copy = [...hashtags];
    copy.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'hashtag':
          aVal = a.hashtag.toLowerCase();
          bVal = b.hashtag.toLowerCase();
          break;
        case 'engagementRate':
          aVal = engRate(a);
          bVal = engRate(b);
          break;
        default:
          aVal = a[sortField];
          bVal = b[sortField];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return copy;
  }, [hashtags, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Hash className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No hashtag data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <SortableHeader label="Hashtag" field="hashtag" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Impressions" field="totalImpressions" currentField={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHeader label="Engagements" field="totalEngagements" currentField={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHeader label="Clicks" field="totalClicks" currentField={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHeader label="Posts" field="postCount" currentField={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHeader label="Eng. Rate" field="engagementRate" currentField={sortField} currentDir={sortDir} onSort={handleSort} className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((h, idx) => {
              const isSelected = selectedHashtags.includes(h.hashtag);
              const rate = engRate(h);

              return (
                <TableRow
                  key={h.hashtag}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-primary/5',
                  )}
                  onClick={() => onToggleSelect?.(h.hashtag)}
                  role="row"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggleSelect?.(h.hashtag)}
                  aria-label={`${h.hashtag}: ${h.totalImpressions.toLocaleString()} impressions, ${h.totalEngagements.toLocaleString()} engagements, ${h.postCount} posts. ${isSelected ? 'Selected. Press Enter to deselect.' : 'Press Enter to select for chart comparison.'}`}
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {page * pageSize + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{h.hashtag}</span>
                      {isSelected && (
                        <Badge variant="outline" className="text-xs ml-1">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(h.totalImpressions)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(h.totalEngagements)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(h.totalClicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {h.postCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={rate > 3 ? 'default' : rate > 1 ? 'secondary' : 'outline'}
                      className={cn(
                        'text-xs font-mono',
                        rate > 3 && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      )}
                    >
                      {rate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="px-2" aria-live="polite" aria-atomic="true">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HashtagRankingTable;
