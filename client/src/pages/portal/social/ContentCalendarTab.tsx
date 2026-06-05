import { Helmet } from 'react-helmet-async';
import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import type { SocialPost } from '@shared/schema';

import { useSocialPosts, useSchedulePost } from '@/hooks/social/use-social-posts';
import { PLATFORMS, STATUS_VARIANTS } from '@/components/social/constants';
import { getStatusLabel } from '@/components/social/utils';
import { UndoSnackbar } from '@/components/social/UndoSnackbar';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarGridSkeleton } from '@/components/social/Skeletons';
import { cn } from '@/lib/utils';

/* ── Types ────────────────────────────────────────────────────────── */

type CalendarPost = SocialPost & {
  status: string;
  platforms: string[];
  content: string;
};

function toCalendarPost(post: SocialPost): CalendarPost {
  return {
    ...post,
    status: post.status ?? 'draft',
    platforms: Array.isArray(post.platforms) ? post.platforms : [],
    content: post.content ?? '',
  };
}

/* ── Draggable Post Chip ──────────────────────────────────────────── */

function DraggablePostChip({
  post,
  dayKey,
}: {
  post: CalendarPost;
  dayKey: string;
}) {
  const draggableId = `post-${post.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: { post, sourceDayKey: dayKey },
  });

  const statusColor =
    post.status === 'published'
      ? 'bg-green-500'
      : post.status === 'scheduled'
        ? 'bg-blue-500'
        : post.status === 'failed'
          ? 'bg-red-500'
          : 'bg-muted-foreground';

      <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] leading-tight',
        'cursor-grab active:cursor-grabbing touch-none',
        'border bg-card hover:bg-accent/50 transition-colors',
        'max-w-full truncate',
        isDragging && 'opacity-30',
      )}
      title={post.content}
      aria-label={`Post: ${post.content.slice(0, 60)}${post.content.length > 60 ? '...' : ''}. Status: ${post.status}. Press Space or Enter to drag.`}
      aria-grabbed={isDragging}
      role="button"
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusColor)} aria-hidden="true" />
      <span className="truncate">{post.content.slice(0, 30)}</span>
    </div>
  );
}

/* ── Droppable Calendar Cell ──────────────────────────────────────── */

function DroppableCalendarCell({
  day,
  year,
  month,
  isToday,
  isPast,
  posts,
  isOverCurrent,
  onClick,
}: {
  day: number;
  year: number;
  month: number;
  isToday: boolean;
  isPast: boolean;
  posts: CalendarPost[];
  isOverCurrent: boolean;
  onClick: () => void;
}) {
  const droppableId = `day-${year}-${month}-${day}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { day, year, month },
  });

  const hovered = isOver || isOverCurrent;

  const dateLabel = new Date(year, month, day).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
  const postCountLabel = posts.length === 0 ? 'No posts' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`;

      <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] p-1 rounded-md border transition-all duration-150',
        isToday && 'bg-primary/5 border-primary/30',
        hovered && !isPast && 'bg-primary/10 border-2 border-primary',
        hovered && isPast && 'bg-amber-50 border-2 border-amber-400',
        !hovered && 'hover-elevate cursor-pointer',
      )}
      onClick={onClick}
      role="gridcell"
      aria-label={`${dateLabel}. ${postCountLabel}. ${isToday ? 'Today. ' : ''}${hovered ? (isPast ? 'Past date — reschedule with caution.' : 'Drop here to reschedule.') : 'Click to view posts.'}`}
    >
      <div className="flex items-center justify-between px-1">
        <span
          className={cn(
            'text-right text-xs font-medium p-1 flex-1',
            hovered && !isPast && 'text-primary font-bold',
          )}
        >
          {day}
        </span>
        {hovered && isPast && (
          <AlertTriangle className="h-3 w-3 text-amber-500" />
        )}
      </div>
      {posts.length > 0 && (
        <div className="flex flex-col gap-0.5 px-0.5">
          {posts.slice(0, 2).map((post) => (
            <DraggablePostChip
              key={post.id}
              post={post}
              dayKey={day.toString()}
            />
          ))}
          {posts.length > 2 && (
            <span className="text-[10px] text-muted-foreground pl-1">
              +{posts.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Drag Overlay Card ────────────────────────────────────────────── */

function DragOverlayCard({ post }: { post: CalendarPost }) {
      <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-md border-2 border-primary shadow-xl',
        'bg-card scale-[1.02] rotate-[2deg]',
        'pointer-events-none max-w-[200px]',
      )}
    >
      <p className="text-xs truncate font-medium">{post.content.slice(0, 40)}</p>
      <div className="flex gap-1 mt-1">
        {post.platforms.slice(0, 2).map((pid) => {
          const p = PLATFORMS.find((pl) => pl.id === pid);
          if (!p) return null;
          const Icon = p.icon;
          return <Icon key={pid} className="h-3 w-3 text-muted-foreground" />;
        })}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export function ContentCalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activePost, setActivePost] = useState<CalendarPost | null>(null);
  const [overDayId, setOverDayId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Undo state
  const [undoState, setUndoState] = useState<{
    postId: string;
    previousDate: string;
    newDate: string;
    message: string;
  } | null>(null);

  const { posts, isLoading } = useSocialPosts('portal');
  const scheduleMutation = useSchedulePost('portal');
  const normalizedPosts = useMemo(() => posts.map(toCalendarPost), [posts]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {};

    normalizedPosts.forEach((post) => {
      const dateStr = post.scheduledAt ?? post.publishedAt ?? post.createdAt;
      if (!dateStr) return;

      const date = new Date(dateStr);
      if (date.getMonth() !== month || date.getFullYear() !== year) return;

      const key = date.getDate().toString();
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });

    return map;
  }, [normalizedPosts, month, year]);

  const selectedDayPosts = selectedDay
    ? (postsByDate[selectedDay.getDate().toString()] ?? [])
    : [];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarCells: Array<number | null> = [];
  for (let i = 0; i < startDayOfWeek; i += 1) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) calendarCells.push(day);

  /* ── DnD Sensors ──────────────────────────────────────────────── */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { post } = event.active.data.current ?? {};
    if (post) {
      setActivePost(post);
      setAnnouncement(
        `Picked up post: ${(post as CalendarPost).content.slice(0, 50)}. Drop on a date to reschedule.`,
      );
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    setOverDayId(overId);
    if (event.over?.data.current) {
      const { day: d, month: m, year: y } = event.over.data.current as {
        day: number;
        month: number;
        year: number;
      };
      const targetDate = new Date(y, m, d);
      setAnnouncement(
        `Over ${targetDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}`,
      );
    }
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActivePost(null);
      setOverDayId(null);

      const { active, over } = event;
      if (!over || !active.data.current) {
        setAnnouncement('Drag cancelled. Post returned to original position.');
        return;
      }

      const { post } = active.data.current as { post: CalendarPost };
      const { day: targetDay, year: tY, month: tM } = over.data.current as {
        day: number;
        year: number;
        month: number;
      };

      // Get original date for undo
      const originalDateStr =
        post.scheduledAt ?? post.publishedAt ?? post.createdAt;
      if (!originalDateStr) return;

      const originalDate = new Date(originalDateStr);
      const originalDay = originalDate.getDate();

      // Same day — no-op
      if (
        originalDay === targetDay &&
        originalDate.getMonth() === tM &&
        originalDate.getFullYear() === tY
      ) {
        setAnnouncement('Post dropped on same date. No changes made.');
        return;
      }

      // Build new date keeping original time
      const newDate = new Date(tY, tM, targetDay);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      const newDateISO = newDate.toISOString();

      // Optimistic reschedule
      scheduleMutation.mutate({
        id: String(post.id),
        scheduledAt: newDateISO,
      });

      // Show undo snackbar
      const formattedDate = newDate.toLocaleDateString('default', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      setUndoState({
        postId: String(post.id),
        previousDate: originalDate.toISOString(),
        newDate: newDateISO,
        message: `Post moved to ${formattedDate}`,
      });
      setAnnouncement(`Post rescheduled to ${formattedDate}. Press Ctrl+Z or use Undo button to revert.`);
    },
    [scheduleMutation],
  );

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    scheduleMutation.mutate({
      id: undoState.postId,
      scheduledAt: undoState.previousDate,
    });
    setUndoState(null);
  }, [undoState, scheduleMutation]);

  /* ── Render ───────────────────────────────────────────────────── */

  const now = new Date();

      <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Content Calendar</h2>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={prevMonth} aria-label="Go to previous month">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="font-medium min-w-[160px] text-center" aria-live="polite" aria-atomic="true">
            {monthName}
          </span>
          <Button size="icon" variant="ghost" onClick={nextMonth} aria-label="Go to next month">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <CalendarGridSkeleton />
      ) : (
        <>
        <p className="sr-only">
          Drag posts between dates to reschedule them. Use arrow keys to navigate while dragging, Enter or Space to pick up or drop, Escape to cancel.
        </p>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}

                {calendarCells.map((day, index) => {
                  if (day === null) {
                        <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>
                    return (
                      <div key={`empty-${index}`} className="min-h-[80px]" />
                    );
                  }

                  const dayPosts = postsByDate[day.toString()] ?? [];
                  const cellDate = new Date(year, month, day);
                  const isToday =
                    day === now.getDate() &&
                    month === now.getMonth() &&
                    year === now.getFullYear();
                  const isPast =
                    cellDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

                      <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>

                  return (
                    <DroppableCalendarCell
                      key={day}
                      day={day}
                      year={year}
                      month={month}
                      isToday={isToday}
                      isPast={isPast}
                      posts={dayPosts}
                      isOverCurrent={
                        overDayId === `day-${year}-${month}-${day}`
                      }
                      onClick={() =>
                        setSelectedDay(new Date(year, month, day))
                      }
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activePost && <DragOverlayCard post={activePost} />}
          </DragOverlay>
        </DndContext>
        </>
      )}

      {/* Day detail dialog */}
      <Dialog
        open={Boolean(selectedDay)}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {selectedDay?.toLocaleDateString('default', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayPosts.length}{' '}
              {selectedDayPosts.length === 1 ? 'post' : 'posts'} on this day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDayPosts.length > 0 ? (
              selectedDayPosts.map((post) => (
                <div key={post.id} className="p-3 rounded-md border space-y-2">
                  <p className="text-sm whitespace-pre-wrap">
                    {post.content || 'No content'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.platforms.map((platformId) => {
                      const platform = PLATFORMS.find(
                        (pl) => pl.id === platformId,
                      );
                      if (!platform) return null;
                      const Icon = platform.icon;

                          <Helmet>
      <title>Calendar | Steel City AI</title>
      <meta name="description" content="Plan and visualize your content schedule" />
    </Helmet>

                      return (
                        <Badge
                          key={`${post.id}-${platformId}`}
                          variant="outline"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {platform.label}
                        </Badge>
                      );
                    })}
                    <Badge
                      variant={STATUS_VARIANTS[post.status] ?? 'outline'}
                    >
                      {getStatusLabel(post.status)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No posts on this day.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo snackbar */}
      {undoState && (
        <UndoSnackbar
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

export default ContentCalendarTab;
