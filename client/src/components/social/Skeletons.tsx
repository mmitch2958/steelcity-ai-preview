// P2-B009: Content-matching loading skeletons for all social media components
// Each skeleton matches the actual content layout to prevent layout shift

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/* ── Post Card Skeleton ──────────────────────────────────────────── */

export function PostCardSkeleton() {
  return (
    <Card role="status" aria-label="Loading post...">
      <CardContent className="p-4 space-y-3">
        {/* Header: checkbox + platforms + status + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm" /> {/* checkbox */}
            <Skeleton className="h-5 w-20 rounded-full" /> {/* platform badge */}
            <Skeleton className="h-5 w-16 rounded-full" /> {/* status badge */}
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        {/* Schedule line */}
        <Skeleton className="h-3 w-32" />
        {/* Content preview */}
        <div className="space-y-2 p-3 rounded-md border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" /> {/* avatar */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-32 w-full rounded-md" /> {/* media placeholder */}
        </div>
        {/* Engagement row */}
        <div className="flex gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Post List Skeleton ──────────────────────────────────────────── */

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading posts...</span>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Calendar Grid Skeleton ──────────────────────────────────────── */

export function CalendarGridSkeleton() {
  return (
    <Card role="status" aria-live="polite" aria-busy="true" aria-label="Loading calendar...">
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-5 w-8 mx-auto" />
          ))}
          {/* Calendar cells (5 rows × 7 cols) */}
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={`c-${i}`}
              className="min-h-[80px] p-2 rounded-md border space-y-1"
            >
              <Skeleton className="h-3 w-4 ml-auto" /> {/* day number */}
              {i % 5 === 0 && <Skeleton className="h-2 w-full" />}
              {i % 7 === 2 && (
                <>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Analytics Cards Skeleton ────────────────────────────────────── */

export function AnalyticsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Analytics Full Skeleton ─────────────────────────────────────── */

export function AnalyticsFullSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading analytics...</span>
      <AnalyticsCardsSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform breakdown */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-20 flex-1" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Best posts */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Create Post Form Skeleton ───────────────────────────────────── */

export function CreatePostFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      {/* Form card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platforms */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
          {/* Content textarea */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-[120px] w-full rounded-md" />
          </div>
          {/* Hashtags */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          {/* Media */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          {/* Schedule */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          {/* Submit */}
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Template Picker Skeleton ────────────────────────────────────── */

export function TemplatePickerSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-14 rounded-md" />
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-2/3" />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-3" />
                </div>
                <Skeleton className="h-5 w-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard Tab Skeleton ──────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading dashboard...</span>
      <AnalyticsCardsSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b pb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b pb-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Campaign Card Skeleton ───────────────────────────────────────── */

export function CampaignCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Account Card Skeleton ───────────────────────────────────────── */

export function AccountCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Brand Voice Card Skeleton ───────────────────────────────────── */

export function BrandVoiceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
    </Card>
  );
}

export function BrandVoiceListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BrandVoiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default {
  PostCardSkeleton,
  PostListSkeleton,
  CalendarGridSkeleton,
  AnalyticsCardsSkeleton,
  AnalyticsFullSkeleton,
  CreatePostFormSkeleton,
  TemplatePickerSkeleton,
  DashboardSkeleton,
  CampaignCardSkeleton,
  CampaignListSkeleton,
  AccountCardSkeleton,
  AccountListSkeleton,
  BrandVoiceCardSkeleton,
  BrandVoiceListSkeleton,
};
