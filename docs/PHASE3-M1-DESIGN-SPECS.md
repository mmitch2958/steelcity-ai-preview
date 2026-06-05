# Phase 3 — Milestone 1 Design Specifications

**Tasks:** P3-D001 (Approval Workflow UI), P3-D002 (Hashtag Analytics Dashboard)  
**Project:** SMP-2026-Q1 — Social Media Integration  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** COMPLETE  
**Related User Stories:** US-011 (Content Approval), US-012 (Hashtag Analytics)

---

## Table of Contents

1. [P3-D001: Approval Workflow UI](#p3-d001-approval-workflow-ui)
   - 1.1 [ApprovalStatusBadge Design](#11-approvalstatusbadge-design)
   - 1.2 [ApprovalActionButtons Placement](#12-approvalactionbuttons-placement)
   - 1.3 [Comment Dialog for Reject / Request-Changes](#13-comment-dialog-for-reject--request-changes)
   - 1.4 [ApprovalHistoryTimeline](#14-approvalhistorytimeline)
2. [P3-D002: Hashtag Analytics Dashboard](#p3-d002-hashtag-analytics-dashboard)
   - 2.1 [Hashtag Performance Cards](#21-hashtag-performance-cards)
   - 2.2 [Trend Charts (Line Graph Over Time)](#22-trend-charts-line-graph-over-time)
   - 2.3 [Top Performing Hashtags Ranking](#23-top-performing-hashtags-ranking)
   - 2.4 [Date Range Filter](#24-date-range-filter)
3. [Shared Design Tokens](#shared-design-tokens)
4. [Implementation Notes](#implementation-notes)

---

## P3-D001: Approval Workflow UI

### 1.1 ApprovalStatusBadge Design

The `ApprovalStatusBadge` is the primary visual indicator of a post's approval state. It must be instantly scannable in both list and card views.

#### Status Color Map

| Status | Color | Hex | HSL Variable | Icon |
|--------|-------|-----|--------------|------|
| **Pending** | Amber | `#F59E0B` | `--approval-pending: 38 92% 50%` | `Clock` (lucide-react) |
| **Approved** | Green | `#22C55E` | `--approval-approved: 142 71% 45%` | `CheckCircle2` |
| **Rejected** | Red | `#EF4444` | `--approval-rejected: 0 84% 60%` | `XCircle` |
| **Changes Requested** | Blue | `#3B82F6` | `--approval-changes: 217 91% 60%` | `MessageSquareWarning` |

#### Badge Visual Specification

```
Compact (post list / card):
┌────────────────────────────────────────────────┐
│ [Thumb]  Post Title          [⏳ Pending]      │
│          Preview text...     [✓ Approved]      │
│          [IG] [FB]  Mar 10   [✗ Rejected]      │
│                              [💬 Changes]      │
└────────────────────────────────────────────────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| **Layout** | Inline-flex, icon + label | Icon at leading edge, text follows |
| **Icon size** | `14×14px` (`h-3.5 w-3.5`) | Compact for badge context |
| **Font** | `text-xs font-medium` (12px, 500 weight) | Readable at small size |
| **Padding** | `px-2.5 py-0.5` | Pill shape |
| **Border radius** | `rounded-full` | Fully rounded pill |
| **Gap (icon ↔ label)** | `gap-1` (4px) | Tight pairing |
| **Touch target** | `min-h-[28px]` | Non-interactive; display only — no 44px needed |
| **Transition** | `background-color 200ms ease, color 200ms ease` | Smooth when status changes |

#### Status-Specific Styling

| Status | Background | Text / Icon | Border |
|--------|-----------|-------------|--------|
| **Pending** | `bg-amber-100 dark:bg-amber-950/40` | `text-amber-700 dark:text-amber-400` | `border border-amber-200 dark:border-amber-800` |
| **Approved** | `bg-green-100 dark:bg-green-950/40` | `text-green-700 dark:text-green-400` | `border border-green-200 dark:border-green-800` |
| **Rejected** | `bg-red-100 dark:bg-red-950/40` | `text-red-700 dark:text-red-400` | `border border-red-200 dark:border-red-800` |
| **Changes Requested** | `bg-blue-100 dark:bg-blue-950/40` | `text-blue-700 dark:text-blue-400` | `border border-blue-200 dark:border-blue-800` |

#### Tailwind Implementation

```tsx
const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: cn(
      'bg-amber-100 text-amber-700 border-amber-200',
      'dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    ),
  },
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    className: cn(
      'bg-green-100 text-green-700 border-green-200',
      'dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
    ),
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: cn(
      'bg-red-100 text-red-700 border-red-200',
      'dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
    ),
  },
  changes_requested: {
    icon: MessageSquareWarning,
    label: 'Changes Requested',
    className: cn(
      'bg-blue-100 text-blue-700 border-blue-200',
      'dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    ),
  },
} as const;

type ApprovalStatus = keyof typeof statusConfig;

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'rounded-full border px-2.5 py-0.5',
        'text-xs font-medium',
        'transition-colors duration-200',
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
```

#### Badge Placement Context

| View | Position | Notes |
|------|----------|-------|
| **Post list row** | Trailing edge, vertically centered | After platform badges and date |
| **Post card (grid)** | Below the title, left-aligned | On its own line above platform chips |
| **Post detail view** | Header section, right of post title | Larger variant possible (see below) |
| **Calendar card** | Not shown (too compact) | Status shown via card left-border color strip instead |

**Calendar card border-strip fallback:**

```tsx
// Vertical left-border strip indicating approval status on calendar cards
<div className={cn(
  "border-l-[3px] rounded-l",
  status === 'pending' && 'border-l-amber-400',
  status === 'approved' && 'border-l-green-500',
  status === 'rejected' && 'border-l-red-500',
  status === 'changes_requested' && 'border-l-blue-500',
)} />
```

---

### 1.2 ApprovalActionButtons Placement

Action buttons allow reviewers to approve, reject, or request changes on posts. Placement differs between post card context and the detail view.

#### Post Card Placement

```
Post card (list view) — compact actions in overflow menu:
┌────────────────────────────────────────────────────────┐
│ [Thumb]  Post Title           [⏳ Pending]    [⋯]     │
│          Preview text...                               │
│          [IG] [FB]  •  Mar 10                          │
└────────────────────────────────────────────────────────┘
                                                  ↑
                                         Overflow menu expands ↓
                                     ┌─────────────────────────┐
                                     │ ✓  Approve              │
                                     │ ✗  Reject...            │
                                     │ 💬 Request Changes...   │
                                     │ ─────────────────────── │
                                     │ ✏️  Edit                │
                                     │ 🗑  Delete              │
                                     └─────────────────────────┘

Post card (grid view) — hover-reveal action row:
┌──────────────────────────────┐
│ [Thumbnail]                  │
│                              │
│ ┌──────────────────────────┐ │  ← Hover overlay at bottom
│ │ [✓] [✗] [💬]       [⋯]  │ │     of thumbnail area
│ └──────────────────────────┘ │
│ Post Title                   │
│ [⏳ Pending]                 │
└──────────────────────────────┘
```

#### Post Card Action Buttons Spec

| Property | Value | Notes |
|----------|-------|-------|
| **Visibility** | Always visible in list overflow; hover-reveal in grid | Grid: `opacity-0 group-hover:opacity-100` |
| **Touch target** | `44×44px` | Each button in the grid overlay row |
| **Button variant** | `ghost` (list menu items), `secondary` (grid overlay) | Unobtrusive |
| **Icon size** | `16×16px` (`h-4 w-4`) | Standard action icon size |
| **Spacing** | `gap-1` (4px) between action buttons in grid overlay | Tight but touchable |
| **Overlay background** | `bg-gradient-to-t from-black/60 to-transparent` | Ensures icon contrast on any thumbnail |
| **Overlay padding** | `px-2 py-1.5` | Compact row at bottom |
| **Transition** | `opacity 150ms ease` | Smooth hover reveal |

#### Detail View Placement

```
Post Detail View — prominent action buttons in header:
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Posts                                             │
│                                                              │
│  Post Title Goes Here                                        │
│  [Instagram] [Facebook]  •  Scheduled Mar 10, 2:00 PM       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Status: [⏳ Pending]                                   │  │
│  │                                                        │  │
│  │ [✓ Approve]   [✗ Reject]   [💬 Request Changes]       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Content                                                     │
│  ─────────────────────────────────────────                   │
│  Post body text goes here...                                 │
│                                                              │
│  [Media Attachments]                                         │
│                                                              │
│  Approval History                                            │
│  ─────────────────────────────────────────                   │
│  (timeline — see section 1.4)                                │
└──────────────────────────────────────────────────────────────┘
```

#### Detail View Action Buttons Spec

| Property | Value | Notes |
|----------|-------|-------|
| **Container** | `bg-muted/50 rounded-lg p-4 border border-border` | Distinct section card |
| **Layout** | Status badge on first line; buttons on second line | Clear hierarchy |
| **Button variant** | See table below | Each action has specific styling |
| **Button size** | `size="default"` | Standard height (36px) with label |
| **Gap** | `gap-3` (12px) between buttons | Comfortable spacing |
| **Min width** | `min-w-[120px]` per button | Consistent visual weight |

#### Button-Specific Styling

| Action | Icon | Label | Variant | Extra |
|--------|------|-------|---------|-------|
| **Approve** | `CheckCircle2` | "Approve" | `default` with green: `bg-green-600 hover:bg-green-700 text-white` | Single-click action |
| **Reject** | `XCircle` | "Reject" | `destructive` | Opens comment dialog (§1.3) |
| **Request Changes** | `MessageSquareWarning` | "Request Changes" | `outline` with blue: `text-blue-600 border-blue-300 hover:bg-blue-50` | Opens comment dialog (§1.3) |

#### State Transitions

| Current Status | Available Actions | Disabled Actions |
|----------------|-------------------|------------------|
| **Pending** | Approve, Reject, Request Changes | None |
| **Approved** | Reject, Request Changes | Approve (already done — shown as disabled with checkmark) |
| **Rejected** | Approve, Request Changes | Reject (already done) |
| **Changes Requested** | Approve, Reject | Request Changes (already done) |

Already-completed actions show as disabled with muted styling:

```tsx
<Button
  variant="outline"
  disabled
  className="opacity-50 cursor-not-allowed"
>
  <CheckCircle2 className="h-4 w-4 mr-2" />
  Approved ✓
</Button>
```

#### Mobile Detail View

On `< 640px`, action buttons stack vertically and span full width:

```
┌──────────────────────────────┐
│ Status: [⏳ Pending]         │
│                              │
│ [    ✓  Approve        ]     │
│ [    ✗  Reject         ]     │
│ [    💬 Request Changes ]     │
└──────────────────────────────┘
```

```tsx
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
  <Button className="w-full sm:w-auto sm:min-w-[120px] bg-green-600 hover:bg-green-700 text-white">
    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
  </Button>
  <Button variant="destructive" className="w-full sm:w-auto sm:min-w-[120px]">
    <XCircle className="h-4 w-4 mr-2" /> Reject
  </Button>
  <Button variant="outline" className="w-full sm:w-auto sm:min-w-[120px] text-blue-600 border-blue-300 hover:bg-blue-50">
    <MessageSquareWarning className="h-4 w-4 mr-2" /> Request Changes
  </Button>
</div>
```

---

### 1.3 Comment Dialog for Reject / Request-Changes

When a reviewer rejects a post or requests changes, they **must** provide a comment explaining their reasoning. Uses the existing Shadcn `Dialog` component.

#### Dialog Layout

```
╔═══════════════════════════════════════════════════════╗
║  ✗ Reject Post                                        ║
║  ─── or ───                                           ║
║  💬 Request Changes                                   ║
║                                                       ║
║  Post: "Spring campaign launch announcement"          ║
║                                                       ║
║  Comment *                                            ║
║  ┌─────────────────────────────────────────────────┐  ║
║  │ Explain why this post needs changes or is       │  ║
║  │ being rejected...                               │  ║
║  │                                                 │  ║
║  │                                                 │  ║
║  │                                                 │  ║
║  └─────────────────────────────────────────────────┘  ║
║                                          120 / 1000   ║
║                                                       ║
║                          [Cancel]    [Submit Review]   ║
╚═══════════════════════════════════════════════════════╝
```

#### Dialog Specifications

| Property | Reject | Request Changes |
|----------|--------|-----------------|
| **Title icon** | `XCircle` (red) | `MessageSquareWarning` (blue) |
| **Title text** | "Reject Post" | "Request Changes" |
| **Title icon color** | `text-red-500` | `text-blue-500` |
| **Post reference** | Post title shown below title (truncated to 60 chars) | Same |
| **Textarea label** | "Comment *" (required) | "Comment *" (required) |
| **Placeholder** | "Explain why this post is being rejected..." | "Describe the changes needed..." |
| **Textarea rows** | `4` (min), auto-expands up to `8` | Same |
| **Character limit** | `1000` characters | Same |
| **Counter** | `{current} / 1000` — turns red at `≥ 900` | Same |
| **Cancel button** | `variant="outline"` | Same |
| **Submit button variant** | `variant="destructive"` — "Reject Post" | `variant="default"` blue — "Request Changes" |
| **Submit disabled when** | Comment is empty or whitespace-only | Same |
| **Width** | `max-w-lg` (512px) | Same |
| **Loading state** | Button shows spinner + "Rejecting..." | "Submitting..." |

#### Textarea Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Font** | `text-sm` (14px) | Standard body text |
| **Border** | `border border-input` | Shadcn default |
| **Focus** | `ring-2 ring-ring ring-offset-2` | Shadcn default focus |
| **Background** | `bg-background` | Clean, matches theme |
| **Padding** | `p-3` | Comfortable writing area |
| **Resize** | `resize-none` | Height managed by auto-expand logic |
| **Border radius** | `rounded-md` | Standard |
| **Min height** | `96px` (4 rows × ~24px line-height) | Always shows enough space |
| **Max height** | `192px` (8 rows) | Scrolls beyond this |

#### Character Counter Implementation

```tsx
const maxChars = 1000;
const charCount = comment.length;
const isNearLimit = charCount >= 900;
const isAtLimit = charCount >= maxChars;

<div className="flex justify-end mt-1">
  <span className={cn(
    "text-xs",
    isAtLimit ? "text-red-500 font-semibold" :
    isNearLimit ? "text-red-500" :
    "text-muted-foreground",
  )}>
    {charCount} / {maxChars}
  </span>
</div>
```

#### Validation & Submission

| Condition | Behavior |
|-----------|----------|
| Empty comment | Submit button disabled (`opacity-50 cursor-not-allowed`) |
| Whitespace-only comment | Treated as empty — submit disabled |
| Valid comment | Submit enabled; on click → loading spinner → API call |
| API success | Dialog closes, toast "Post rejected" / "Changes requested", status badge updates |
| API failure | Dialog stays open, error toast "Failed to submit review. Try again." |
| Escape key | Closes dialog without submitting (same as Cancel) |

#### Post-Submission Feedback

| Action | Toast message | Toast variant |
|--------|---------------|---------------|
| **Reject success** | "✗ Post rejected. The author has been notified." | `destructive` (red tint) |
| **Changes requested success** | "💬 Changes requested. The author has been notified." | `default` (blue tint) |
| **Approve success** (no dialog needed) | "✓ Post approved and ready to publish." | `default` (green tint) |
| **Any failure** | "Failed to submit review. Please try again." | `destructive` |

---

### 1.4 ApprovalHistoryTimeline

The `ApprovalHistoryTimeline` shows a chronological history of all approval actions on a post. It appears in the post detail view below the content section.

#### Visual Layout

```
Approval History
─────────────────────────────────────────

  ●─── Mar 5, 2026 · 9:15 AM
  │    📝 Post created
  │    Sarah Chen
  │
  ●─── Mar 5, 2026 · 10:30 AM
  │    💬 Changes requested
  │    Mike Johnson
  │    "The CTA needs to be stronger. Consider A/B
  │     testing two versions of the headline."
  │
  ●─── Mar 5, 2026 · 2:45 PM
  │    📝 Post updated
  │    Sarah Chen
  │
  ●─── Mar 5, 2026 · 3:00 PM             ← Most recent at bottom
       ✓ Approved
       Mike Johnson
```

#### Timeline Structure

Each timeline entry consists of:

```
┌──────────────────────────────────────────────────────┐
│  [●]──── [Timestamp]                                 │
│  [│]     [Icon + Action Label]                       │
│  [│]     [Avatar + Author Name]                      │
│  [│]     [Comment text — if present]                 │
│  [│]                                                 │
└──────────────────────────────────────────────────────┘
```

#### Timeline Entry Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Dot size** | `12×12px` (`h-3 w-3`) | Small, proportional to line |
| **Dot color** | Matches action status color (see below) | Provides instant scanning |
| **Dot border** | `border-2 border-background` | Creates ring effect over the line |
| **Connecting line** | `w-0.5` (2px), `bg-border` | Standard muted border color |
| **Line position** | Left of content, centered on dots | `ml-[5px]` (centered on 12px dot) |
| **Entry spacing** | `pb-6` between entries, `pb-0` for last | Comfortable reading |
| **Timestamp font** | `text-xs text-muted-foreground` | Subtle, secondary info |
| **Action label font** | `text-sm font-medium` | Primary readable text |
| **Author font** | `text-sm text-muted-foreground` | Secondary to action |
| **Comment font** | `text-sm` inside `bg-muted rounded-md p-3 mt-1.5` | Quoted block style |
| **Comment max width** | `max-w-prose` (~65ch) | Readable line length |

#### Action-Specific Dot Colors & Icons

| Action | Dot Color | Icon | Label |
|--------|-----------|------|-------|
| **Post created** | `bg-muted-foreground` (gray) | `FileEdit` | "Post created" |
| **Post updated** | `bg-muted-foreground` (gray) | `FileEdit` | "Post updated" |
| **Submitted for review** | `bg-amber-500` | `Clock` | "Submitted for review" |
| **Approved** | `bg-green-500` | `CheckCircle2` | "Approved" |
| **Rejected** | `bg-red-500` | `XCircle` | "Rejected" |
| **Changes requested** | `bg-blue-500` | `MessageSquareWarning` | "Changes requested" |
| **Published** | `bg-primary` | `Send` | "Published" |

#### Avatar Specification

| Property | Value | Notes |
|----------|-------|-------|
| **Size** | `24×24px` (`h-6 w-6`) | Compact inline avatar |
| **Shape** | `rounded-full` | Standard circular avatar |
| **Fallback** | Initials on `bg-muted` | First letter of first & last name |
| **Position** | Inline with author name, `gap-1.5` | `[🟢] Sarah Chen` |
| **Border** | `ring-1 ring-border` | Subtle outline for contrast |

#### Tailwind Implementation

```tsx
interface TimelineEntry {
  id: string;
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'published';
  timestamp: Date;
  author: {
    name: string;
    avatarUrl?: string;
    initials: string;
  };
  comment?: string;
}

const actionConfig = {
  created:           { icon: FileEdit, label: 'Post created', dotColor: 'bg-muted-foreground' },
  updated:           { icon: FileEdit, label: 'Post updated', dotColor: 'bg-muted-foreground' },
  submitted:         { icon: Clock, label: 'Submitted for review', dotColor: 'bg-amber-500' },
  approved:          { icon: CheckCircle2, label: 'Approved', dotColor: 'bg-green-500' },
  rejected:          { icon: XCircle, label: 'Rejected', dotColor: 'bg-red-500' },
  changes_requested: { icon: MessageSquareWarning, label: 'Changes requested', dotColor: 'bg-blue-500' },
  published:         { icon: Send, label: 'Published', dotColor: 'bg-primary' },
} as const;

function ApprovalHistoryTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="space-y-0">
      <h3 className="text-sm font-semibold mb-4">Approval History</h3>
      <div className="relative">
        {entries.map((entry, index) => {
          const config = actionConfig[entry.action];
          const Icon = config.icon;
          const isLast = index === entries.length - 1;

          return (
            <div key={entry.id} className={cn("relative flex gap-3", !isLast && "pb-6")}>
              {/* Connecting line */}
              {!isLast && (
                <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-border" />
              )}

              {/* Dot */}
              <div className={cn(
                "relative z-10 mt-0.5 h-3 w-3 rounded-full border-2 border-background flex-shrink-0",
                config.dotColor,
              )} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Timestamp */}
                <time className="text-xs text-muted-foreground">
                  {formatTimestamp(entry.timestamp)}
                </time>

                {/* Action */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Avatar className="h-6 w-6 ring-1 ring-border">
                    {entry.author.avatarUrl ? (
                      <AvatarImage src={entry.author.avatarUrl} alt={entry.author.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {entry.author.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{entry.author.name}</span>
                </div>

                {/* Comment (if present) */}
                {entry.comment && (
                  <div className="mt-1.5 bg-muted rounded-md p-3 max-w-prose">
                    <p className="text-sm whitespace-pre-wrap">{entry.comment}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### Empty State

When no approval history exists (new draft post):

```
┌──────────────────────────────────────────────────────┐
│  Approval History                                    │
│                                                      │
│       📋                                             │
│       No approval history yet.                       │
│       Submit this post for review to start            │
│       the approval workflow.                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

```tsx
<div className="flex flex-col items-center justify-center py-8 text-center">
  <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-2" />
  <p className="text-sm text-muted-foreground">No approval history yet.</p>
  <p className="text-xs text-muted-foreground/70 mt-0.5">
    Submit this post for review to start the approval workflow.
  </p>
</div>
```

#### Mobile Adjustments

On `< 640px`:

- Comment blocks span full width (remove `max-w-prose` constraint)
- Timestamp and action label can wrap to separate lines
- Avatar size stays `24×24px` (already compact)
- Entry spacing reduces to `pb-4`

---

## P3-D002: Hashtag Analytics Dashboard

### 2.1 Hashtag Performance Cards

Performance cards provide at-a-glance metrics for individual hashtags. They form the primary entry point of the analytics dashboard.

#### Card Grid Layout

```
Desktop (≥ 1024px):
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ #marketing  │ │ #ai         │ │ #pittsburgh │ │ #smb        │
│             │ │             │ │             │ │             │
│ 12.4K reach │ │  8.2K reach │ │  5.1K reach │ │  3.8K reach │
│ ▲ 12%       │ │ ▲ 24%       │ │ ▼ 3%        │ │ ▲ 8%        │
│             │ │             │ │             │ │             │
│ 342 eng.    │ │ 215 eng.    │ │ 189 eng.    │ │ 97 eng.     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Tablet (768px–1023px): 2 columns
Mobile (< 768px): 1 column, full-width cards
```

#### Single Card Layout

```
┌─────────────────────────────────────────┐
│  #marketing                     📋     │  ← Hashtag + copy button
│                                         │
│  Total Reach          Total Engagement  │
│  12,438               342              │
│  ▲ 12.3% vs prev      ▲ 5.8% vs prev  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ╱╲    ╱╲                       │    │  ← Sparkline (mini trend)
│  │ ╱  ╲╱╱  ╲─╱╲                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Posts: 24   •   Avg. Eng. Rate: 2.8%  │
└─────────────────────────────────────────┘
```

#### Card Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Background** | `bg-card` | Standard card background |
| **Border** | `border border-border` | Standard card border |
| **Border radius** | `rounded-lg` | Consistent with existing cards |
| **Shadow** | `shadow-sm` | Subtle elevation |
| **Padding** | `p-5` (20px) | Spacious content area |
| **Hover** | `hover:shadow-md hover:border-primary/30 transition-shadow duration-200` | Interactive feedback |
| **Cursor** | `cursor-pointer` | Cards are clickable → opens detail |
| **Min height** | `180px` | Prevents layout shift |
| **Grid** | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` | Responsive columns |

#### Metrics Display

| Metric | Font | Color | Notes |
|--------|------|-------|-------|
| **Hashtag name** | `text-base font-semibold` | `text-foreground` | Leading `#` included |
| **Metric label** | `text-xs text-muted-foreground uppercase tracking-wider` | Muted | "TOTAL REACH" |
| **Metric value** | `text-2xl font-bold tabular-nums` | `text-foreground` | Number formatted (e.g., `12,438`) |
| **Trend — positive** | `text-xs font-medium` | `text-green-600 dark:text-green-400` | `▲ 12.3%` with `TrendingUp` icon |
| **Trend — negative** | `text-xs font-medium` | `text-red-600 dark:text-red-400` | `▼ 3.2%` with `TrendingDown` icon |
| **Trend — neutral** | `text-xs font-medium` | `text-muted-foreground` | `→ 0.0%` with `Minus` icon |
| **Trend context** | `text-xs text-muted-foreground` | Muted | "vs previous period" |
| **Sub-metrics** | `text-xs text-muted-foreground` | Muted | "Posts: 24 · Avg. Eng. Rate: 2.8%" |

#### Sparkline Specification

| Property | Value | Notes |
|----------|-------|-------|
| **Height** | `40px` | Compact, decorative |
| **Width** | Full card width minus padding | Responsive |
| **Stroke color** | `hsl(var(--primary))` | Brand color |
| **Stroke width** | `1.5px` | Thin, clean |
| **Fill** | `hsl(var(--primary) / 0.08)` gradient to transparent | Subtle area fill |
| **Data points** | Last 14 days, one point per day | Enough to show trend |
| **Animation** | `stroke-dasharray` reveal, `500ms ease-out` on mount | Draws the line |
| **Library** | Native SVG or lightweight `recharts` `<Line>` | No heavy chart lib for sparklines |
| **Interaction** | None (display only) | Full chart in detail view (§2.2) |

#### Copy Button

A small copy button lets users copy the hashtag text:

```tsx
<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(hashtag)}>
  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
</Button>
```

Shows `Check` icon for 2 seconds after successful copy.

---

### 2.2 Trend Charts (Line Graph Over Time)

The trend chart provides detailed engagement visualization for one or more hashtags over a selected time period.

#### Chart Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Hashtag Performance Over Time                                   │
│                                                                  │
│  [#marketing ●] [#ai ●] [#pittsburgh ●]     ← Interactive legend│
│                                                                  │
│  1200 ─┤                                                         │
│         │         ╱╲                                             │
│  1000 ─┤        ╱  ╲         ╱╲                                  │
│         │      ╱    ╲       ╱  ╲                                 │
│   800 ─┤    ╱╱      ╲─────╱    ╲───╲                            │
│         │  ╱                        ╲                            │
│   600 ─┤╱                           ╲──                          │
│         │                                                        │
│   400 ─┤   ·····╱·····╲·····╱·····╲·····╱·····╲····             │
│         │  ·                                                     │
│   200 ─┤·                                                        │
│         │                                                        │
│     0 ─┤─────┬─────┬─────┬─────┬─────┬─────┬────                │
│        Mar 1  Mar 5  Mar 9  Mar 13 Mar 17 Mar 21                │
│                                                                  │
│  Metric:  [Reach ▾]         ← Metric selector dropdown          │
└──────────────────────────────────────────────────────────────────┘
```

#### Chart Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Library** | `recharts` (already in project) | Consistent with existing charts |
| **Component** | `<ResponsiveContainer>` + `<LineChart>` | Auto-resizes |
| **Height** | `320px` (desktop), `240px` (mobile) | Adequate data visibility |
| **Background** | `bg-card rounded-lg border border-border p-6` | Card container |
| **Margins** | `{ top: 10, right: 30, left: 10, bottom: 10 }` | Chart padding inside card |
| **Grid lines** | `<CartesianGrid strokeDasharray="3 3" className="stroke-border" />` | Subtle grid |
| **X-axis font** | `text-xs text-muted-foreground` | Date labels |
| **Y-axis font** | `text-xs text-muted-foreground` | Metric values |
| **Animation** | `animationDuration={800}` `animationEasing="ease-out"` | Smooth draw |

#### Line Styling

Each hashtag gets a distinct color from a pre-defined palette:

| Line # | Color | HSL | Tailwind |
|--------|-------|-----|----------|
| 1 | Blue | `217 91% 60%` | `text-blue-500` / `stroke-blue-500` |
| 2 | Emerald | `160 84% 39%` | `text-emerald-600` / `stroke-emerald-600` |
| 3 | Violet | `263 70% 50%` | `text-violet-500` / `stroke-violet-500` |
| 4 | Orange | `25 95% 53%` | `text-orange-500` / `stroke-orange-500` |
| 5 | Pink | `330 81% 60%` | `text-pink-500` / `stroke-pink-500` |

| Line Property | Value |
|---------------|-------|
| **Stroke width** | `2px` |
| **Dot radius** | `4px` (default), `6px` (active/hover) |
| **Dot fill** | Same as line color with white center: `fill="white" stroke={color}` |
| **Active dot** | `r={6} strokeWidth={2}` + `shadow-sm` filter |
| **Curve** | `type="monotone"` | Smooth interpolation |
| **Fill area** | Optional: `<Area>` under line with `fill={color} fillOpacity={0.05}` |

#### Tooltip Specification

```
┌─────────────────────────┐
│  Mar 12, 2026           │
│                         │
│  ● #marketing    1,245  │
│  ● #ai             832  │
│  ● #pittsburgh     421  │
└─────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Background** | `bg-popover border border-border shadow-lg rounded-lg` |
| **Padding** | `px-3 py-2` |
| **Date font** | `text-xs font-medium text-foreground` |
| **Metric font** | `text-sm tabular-nums text-foreground` |
| **Dot** | `8×8px` circle matching line color |
| **Max width** | `200px` |
| **Animation** | `fade-in duration-100` |

#### Custom Tooltip Implementation

```tsx
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border border-border shadow-lg rounded-lg px-3 py-2">
      <p className="text-xs font-medium text-foreground mb-1.5">
        {formatDate(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

#### Interactive Legend

Clicking a legend item toggles that line's visibility:

| State | Visual |
|-------|--------|
| **Active** | Colored dot + bold label |
| **Inactive (toggled off)** | Gray dot + `line-through text-muted-foreground opacity-50` label |

```tsx
<div className="flex flex-wrap gap-3 mb-4">
  {hashtags.map((tag, i) => (
    <button
      key={tag}
      onClick={() => toggleSeries(tag)}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-md",
        "hover:bg-accent transition-colors",
        !activeSeries.includes(tag) && "opacity-50 line-through",
      )}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: activeSeries.includes(tag) ? lineColors[i] : 'hsl(var(--muted-foreground))' }}
      />
      {tag}
    </button>
  ))}
</div>
```

#### Metric Selector Dropdown

Users can switch between different metrics on the Y-axis:

| Metric Option | Description |
|---------------|-------------|
| **Reach** | Total unique accounts reached |
| **Engagement** | Total likes + comments + shares |
| **Engagement Rate** | (Engagement / Reach) × 100 as percentage |
| **Posts** | Number of posts using this hashtag |
| **Impressions** | Total times content was displayed |

```tsx
<Select value={metric} onValueChange={setMetric}>
  <SelectTrigger className="w-[160px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="reach">Reach</SelectItem>
    <SelectItem value="engagement">Engagement</SelectItem>
    <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
    <SelectItem value="posts">Posts</SelectItem>
    <SelectItem value="impressions">Impressions</SelectItem>
  </SelectContent>
</Select>
```

---

### 2.3 Top Performing Hashtags Ranking

A ranked list of hashtags sorted by a selected metric, providing quick competitive insight.

#### Ranking Table Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Top Performing Hashtags                           Sort by: [Reach ▾]│
│                                                                      │
│  ┌───┬────────────────┬──────────┬────────────┬──────────┬─────────┐ │
│  │ # │ Hashtag        │ Reach    │ Engagement │ Eng Rate │ Posts   │ │
│  ├───┼────────────────┼──────────┼────────────┼──────────┼─────────┤ │
│  │ 🥇│ #marketing     │ 12,438   │ 342        │ 2.75%    │ 24      │ │
│  │ 🥈│ #ai            │  8,215   │ 215        │ 2.62%    │ 18      │ │
│  │ 🥉│ #pittsburgh    │  5,102   │ 189        │ 3.70%    │ 12      │ │
│  │ 4 │ #smallbusiness │  3,844   │  97        │ 2.52%    │  8      │ │
│  │ 5 │ #automation    │  2,916   │  84        │ 2.88%    │  7      │ │
│  │ 6 │ #steelcity     │  2,103   │  62        │ 2.95%    │  5      │ │
│  │ 7 │ #tech          │  1,890   │  51        │ 2.70%    │  4      │ │
│  │ 8 │ #growth        │  1,455   │  43        │ 2.96%    │  3      │ │
│  │ 9 │ #content       │    987   │  28        │ 2.84%    │  3      │ │
│  │10 │ #socialmedia   │    742   │  19        │ 2.56%    │  2      │ │
│  └───┴────────────────┴──────────┴────────────┴──────────┴─────────┘ │
│                                                                      │
│  Showing 10 of 34 hashtags              [Show More]                  │
└──────────────────────────────────────────────────────────────────────┘
```

#### Table Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Container** | `bg-card rounded-lg border border-border` | Card wrapper |
| **Header padding** | `px-5 py-4` | Title + sort row |
| **Title** | `text-base font-semibold` | "Top Performing Hashtags" |
| **Table** | Shadcn `<Table>` component | Consistent styling |
| **Header row** | `text-xs text-muted-foreground uppercase tracking-wider` | Column labels |
| **Body font** | `text-sm` | Standard body |
| **Number alignment** | `text-right tabular-nums` | Aligned decimal/digit columns |
| **Hashtag column** | `text-left font-medium` | Primary identifier |
| **Row hover** | `hover:bg-muted/50` | Standard table hover |
| **Row click** | Navigates to hashtag detail / filters trend chart | Interactive |
| **Alternating rows** | Not used (hover is sufficient) | Clean design |

#### Rank Medals

| Rank | Display | Style |
|------|---------|-------|
| 1 | 🥇 | `text-lg` emoji, or `bg-amber-100 text-amber-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold` |
| 2 | 🥈 | Same pattern, `bg-gray-100 text-gray-600` |
| 3 | 🥉 | Same pattern, `bg-orange-100 text-orange-700` |
| 4+ | Number | `text-sm text-muted-foreground w-7 h-7 flex items-center justify-center` |

#### Sortable Columns

Clicking a column header sorts the table by that metric:

| Column | Default Sort | Direction |
|--------|-------------|-----------|
| Reach | ✓ (primary default) | Descending |
| Engagement | — | Descending |
| Engagement Rate | — | Descending |
| Posts | — | Descending |

Sort indicator: `ChevronDown` icon next to active column header, rotates to `ChevronUp` for ascending.

```tsx
<TableHead
  className="cursor-pointer hover:text-foreground select-none"
  onClick={() => handleSort('reach')}
>
  <div className="flex items-center gap-1">
    Reach
    {sortColumn === 'reach' && (
      <ChevronDown className={cn(
        "h-3.5 w-3.5 transition-transform",
        sortDirection === 'asc' && "rotate-180",
      )} />
    )}
  </div>
</TableHead>
```

#### Pagination / Show More

| Property | Value | Notes |
|----------|-------|-------|
| **Initial display** | 10 items | Quick overview |
| **"Show More" button** | `variant="ghost"` centered below table | Loads next 10 |
| **Summary text** | `text-xs text-muted-foreground` | "Showing 10 of 34 hashtags" |
| **Load behavior** | Append (no page navigation) | Smooth expansion |

#### Mobile Adaptation (< 768px)

On mobile, the table converts to a ranked card list:

```
┌──────────────────────────────────────┐
│ 🥇 #marketing                       │
│    Reach: 12,438  •  Eng: 342       │
│    Eng Rate: 2.75%  •  Posts: 24    │
├──────────────────────────────────────┤
│ 🥈 #ai                              │
│    Reach: 8,215  •  Eng: 215        │
│    Eng Rate: 2.62%  •  Posts: 18    │
├──────────────────────────────────────┤
│ 🥉 #pittsburgh                      │
│    Reach: 5,102  •  Eng: 189        │
│    Eng Rate: 3.70%  •  Posts: 12    │
└──────────────────────────────────────┘
```

```tsx
{/* Mobile card list */}
<div className="md:hidden space-y-2">
  {sortedHashtags.map((tag, index) => (
    <div
      key={tag.name}
      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50"
    >
      <RankBadge rank={index + 1} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tag.name}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-muted-foreground">
            Reach: <span className="font-medium text-foreground">{formatNumber(tag.reach)}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Eng: <span className="font-medium text-foreground">{formatNumber(tag.engagement)}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Rate: <span className="font-medium text-foreground">{tag.engagementRate}%</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Posts: <span className="font-medium text-foreground">{tag.posts}</span>
          </span>
        </div>
      </div>
    </div>
  ))}
</div>
```

---

### 2.4 Date Range Filter

The date range filter controls the time window for all analytics views (performance cards, trend chart, and ranking table).

#### Filter Bar Layout

```
Desktop:
┌───────────────────────────────────────────────────────────────────────┐
│  Hashtag Analytics                                                    │
│                                                                       │
│  [7D] [14D] [30D] [90D] [Custom ▾]       🔄 Last updated 2 min ago  │
└───────────────────────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────────────┐
│  Hashtag Analytics               │
│                                  │
│  [7D] [14D] [30D] [90D] [📅]    │
│  🔄 Updated 2 min ago           │
└──────────────────────────────────┘
```

#### Quick Range Presets

| Preset | Label (Desktop) | Label (Mobile) | Duration |
|--------|-----------------|----------------|----------|
| 7 days | "7D" | "7D" | Last 7 calendar days |
| 14 days | "14D" | "14D" | Last 14 calendar days |
| 30 days | "30D" | "30D" | Last 30 calendar days (default) |
| 90 days | "90D" | "90D" | Last 90 calendar days |
| Custom | "Custom ▾" | 📅 icon button | Opens date range picker |

#### Preset Button Styling

| Property | Value | Notes |
|----------|-------|-------|
| **Container** | `inline-flex rounded-lg border border-border p-0.5 bg-muted/50` | Toggle group wrapper |
| **Button size** | `px-3 py-1.5` (desktop), `px-2.5 py-1.5` (mobile) | Compact |
| **Font** | `text-xs font-medium` | Small label |
| **Inactive** | `text-muted-foreground hover:text-foreground hover:bg-background` | Muted, clickable |
| **Active** | `bg-background text-foreground shadow-sm` | Elevated, selected |
| **Border radius** | `rounded-md` | Inside the container's rounded-lg |
| **Transition** | `background-color 150ms ease, color 150ms ease` | Smooth toggle |
| **Touch target** | `min-h-[36px]` | Comfortable tap area |

#### Toggle Group Implementation

```tsx
<div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/50">
  {presets.map((preset) => (
    <button
      key={preset.value}
      onClick={() => setDateRange(preset.value)}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
        activeRange === preset.value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50",
      )}
    >
      {preset.label}
    </button>
  ))}
  <Popover>
    <PopoverTrigger asChild>
      <button
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
          activeRange === 'custom'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
        )}
      >
        <span className="hidden sm:inline">Custom ▾</span>
        <CalendarIcon className="h-3.5 w-3.5 sm:hidden" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="end">
      <Calendar
        mode="range"
        selected={customRange}
        onSelect={setCustomRange}
        numberOfMonths={2}
        className="rounded-md border"
      />
    </PopoverContent>
  </Popover>
</div>
```

#### Custom Date Range Picker

Uses Shadcn `Calendar` component in `range` mode inside a `Popover`:

| Property | Value | Notes |
|----------|-------|-------|
| **Calendar months** | `2` side-by-side (desktop), `1` (mobile) | Responsive via `numberOfMonths` |
| **Max range** | 365 days | Prevent absurdly wide queries |
| **Min date** | Account creation date or 1 year ago | Sensible boundary |
| **Max date** | Today | No future dates |
| **Selected range display** | `"Mar 1, 2026 — Mar 15, 2026"` shown below presets | Clear feedback |
| **Apply behavior** | Auto-apply on second date selection | No extra button needed |

#### Refresh Indicator

| Property | Value | Notes |
|----------|-------|-------|
| **Icon** | `RefreshCw` (lucide-react) | Standard refresh |
| **Text** | `"Last updated {n} min ago"` | Relative time |
| **Font** | `text-xs text-muted-foreground` | Subtle |
| **Click action** | Manual refresh of all analytics data | Spins icon during fetch |
| **Spin animation** | `animate-spin` while loading, `duration-700` | Standard spinner |
| **Position** | Right-aligned, same row as presets | Desktop only — below presets on mobile |

```tsx
<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
>
  <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
  {isRefreshing ? "Refreshing..." : `Last updated ${timeAgo}`}
</button>
```

#### Data Loading States

| State | Behavior |
|-------|----------|
| **Initial load** | Skeleton cards (`bg-muted animate-pulse rounded-lg h-[180px]`) × 4, skeleton chart, skeleton table |
| **Range change** | Existing data fades (`opacity-50 pointer-events-none`), new data fades in |
| **Refresh** | Refresh icon spins, data remains visible but slightly muted |
| **Error** | Error card: `"Failed to load analytics. [Retry]"` with `AlertCircle` icon |
| **Empty (no data)** | Empty state: `"No hashtag data for this period. Try a wider date range."` |

#### Skeleton Specifications

```tsx
// Performance card skeleton
<div className="bg-card rounded-lg border border-border p-5 space-y-3">
  <div className="h-5 w-24 bg-muted animate-pulse rounded" />        {/* Hashtag name */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-1.5">
      <div className="h-3 w-16 bg-muted animate-pulse rounded" />    {/* Label */}
      <div className="h-7 w-20 bg-muted animate-pulse rounded" />    {/* Value */}
    </div>
    <div className="space-y-1.5">
      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
      <div className="h-7 w-20 bg-muted animate-pulse rounded" />
    </div>
  </div>
  <div className="h-10 w-full bg-muted animate-pulse rounded" />     {/* Sparkline */}
  <div className="h-3 w-32 bg-muted animate-pulse rounded" />        {/* Sub-metrics */}
</div>

// Chart skeleton
<div className="bg-card rounded-lg border border-border p-6">
  <div className="h-5 w-48 bg-muted animate-pulse rounded mb-4" />   {/* Title */}
  <div className="h-[320px] bg-muted animate-pulse rounded" />        {/* Chart area */}
</div>

// Table skeleton
<div className="bg-card rounded-lg border border-border">
  <div className="px-5 py-4">
    <div className="h-5 w-40 bg-muted animate-pulse rounded" />       {/* Title */}
  </div>
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-border">
      <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      <div className="h-4 w-12 bg-muted animate-pulse rounded" />
    </div>
  ))}
</div>
```

---

## Shared Design Tokens

These tokens are referenced across both P3-D001 and P3-D002 and should be added as CSS custom properties or Tailwind config entries:

### Approval Status Tokens

```css
:root {
  /* Approval Status Colors */
  --approval-pending: 38 92% 50%;        /* Amber */
  --approval-approved: 142 71% 45%;      /* Green */
  --approval-rejected: 0 84% 60%;        /* Red */
  --approval-changes: 217 91% 60%;       /* Blue */

  /* Analytics Chart Colors */
  --chart-line-1: 217 91% 60%;           /* Blue */
  --chart-line-2: 160 84% 39%;           /* Emerald */
  --chart-line-3: 263 70% 50%;           /* Violet */
  --chart-line-4: 25 95% 53%;            /* Orange */
  --chart-line-5: 330 81% 60%;           /* Pink */

  /* Animation Tokens */
  --approval-badge-transition: 200ms;
  --chart-draw-duration: 800ms;
  --sparkline-draw-duration: 500ms;
  --skeleton-pulse-duration: 1.5s;

  /* Z-index Layers */
  --z-chart-tooltip: 30;
  --z-date-picker: 40;
}
```

### Tailwind Config Additions

```ts
// Add to tailwind.config.ts → theme.extend
keyframes: {
  'sparkline-draw': {
    '0%': { strokeDashoffset: '100%' },
    '100%': { strokeDashoffset: '0%' },
  },
  'badge-pulse': {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.7' },
  },
  'rank-enter': {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'sparkline-draw': 'sparkline-draw 500ms ease-out forwards',
  'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
  'rank-enter': 'rank-enter 300ms ease-out forwards',
},
```

### Number Formatting Utility

```ts
function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatTrend(current: number, previous: number): { value: string; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { value: '—', direction: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${Math.abs(change).toFixed(1)}%`,
    direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral',
  };
}
```

---

## Implementation Notes

### Library Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `recharts` | existing | Line charts & sparklines — already in project |
| `@radix-ui/react-dialog` | existing | Comment dialog (Shadcn Dialog) — already in project |
| `@radix-ui/react-popover` | existing | Date range picker popover — already in project |
| `@radix-ui/react-select` | existing | Metric selector dropdown — already in project |
| `@radix-ui/react-avatar` | existing | Timeline avatars (Shadcn Avatar) — already in project |
| `date-fns` | existing | Date formatting & range calculations — already in project |

No new dependencies required for Phase 3 Milestone 1 design implementation.

### Component File Map

| Component | File Path | Task |
|-----------|-----------|------|
| `ApprovalStatusBadge` | `client/src/components/social/ApprovalStatusBadge.tsx` | P3-B001 (new) |
| `ApprovalActionButtons` | `client/src/components/social/ApprovalActionButtons.tsx` | P3-B001 (new) |
| `ApprovalCommentDialog` | `client/src/components/social/ApprovalCommentDialog.tsx` | P3-B001 (new) |
| `ApprovalHistoryTimeline` | `client/src/components/social/ApprovalHistoryTimeline.tsx` | P3-B001 (new) |
| `HashtagPerformanceCard` | `client/src/components/analytics/HashtagPerformanceCard.tsx` | P3-B002 (new) |
| `HashtagTrendChart` | `client/src/components/analytics/HashtagTrendChart.tsx` | P3-B002 (new) |
| `HashtagRankingTable` | `client/src/components/analytics/HashtagRankingTable.tsx` | P3-B002 (new) |
| `DateRangeFilter` | `client/src/components/analytics/DateRangeFilter.tsx` | P3-B002 (new) |
| `HashtagAnalyticsDashboard` | `client/src/components/analytics/HashtagAnalyticsDashboard.tsx` | P3-B002 (new, page container) |
| `Sparkline` | `client/src/components/ui/sparkline.tsx` | P3-B002 (new, reusable) |

### Existing Code Alignment

The approval workflow integrates with existing post management components:

1. **PostCard**: Add `ApprovalStatusBadge` to card layout (after platform badges)
2. **PostCard overflow menu**: Add approval action items (Approve, Reject, Request Changes)
3. **PostDetailView**: Add approval section with action buttons + timeline
4. **API routes**: New endpoints needed: `POST /api/posts/:id/approve`, `POST /api/posts/:id/reject`, `POST /api/posts/:id/request-changes`, `GET /api/posts/:id/approval-history`
5. **Database**: New `approval_events` table with columns: `id`, `post_id`, `action`, `author_id`, `comment`, `created_at`

The hashtag analytics dashboard is a new page:

1. **Navigation**: Add "Analytics" tab/link in the social management navigation
2. **API routes**: `GET /api/analytics/hashtags?range=30d`, `GET /api/analytics/hashtags/:tag/trend`
3. **Database**: Hashtag performance data may come from platform APIs or aggregated from post metrics

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Badge render | `< 5ms` | React Profiler — simple stateless component |
| Timeline render (20 entries) | `< 50ms` | React Profiler |
| Chart render (5 series, 90 days) | `< 100ms` | React Profiler |
| Sparkline SVG render | `< 10ms` | Simple SVG path |
| Date range switch | `< 200ms` perceived | Skeleton → data transition |
| Table sort | `< 50ms` | Client-side re-sort |

### Accessibility Checklist

- [ ] `ApprovalStatusBadge` uses icon + text (not color alone) to convey status
- [ ] Action buttons have clear labels and tooltips describing the action
- [ ] Comment dialog traps focus correctly (Radix handles this)
- [ ] Timeline entries have `<time>` elements with `datetime` attributes
- [ ] Chart provides `aria-label` with summary ("Engagement trend for #marketing: up 12% over 30 days")
- [ ] Table has proper `<th>` scope attributes and sort state announced via `aria-sort`
- [ ] Rank medals use `aria-label="Rank 1"` etc. (not relying on emoji alone)
- [ ] Date range presets communicate active state via `aria-pressed`
- [ ] Skeleton loaders have `aria-busy="true"` and `aria-label="Loading analytics"`
- [ ] `prefers-reduced-motion` disables sparkline draw animation and chart entrance animation
- [ ] All interactive elements meet 44×44px touch target minimum (or 36px with adequate spacing)
- [ ] Color contrast ratios meet WCAG AA for all text on badge backgrounds

---

*End of Phase 3 Milestone 1 Design Specifications*
