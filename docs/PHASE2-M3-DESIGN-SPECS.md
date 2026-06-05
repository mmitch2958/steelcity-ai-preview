# Phase 2 — Milestone 3 Design Specifications

**Tasks:** P2-D003 (Real-Time Preview Layout), P2-D004 (Templates UI), P2-D005 (Loading Skeletons)  
**Project:** SMP-2026-Q1 — Social Media Integration  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** COMPLETE  
**Related User Stories:** US-011 (Platform Preview), US-012 (Templates), US-013 (Loading States)

---

## Table of Contents

1. [P2-D003: Real-Time Preview Layout](#p2-d003-real-time-preview-layout)
2. [P2-D004: Templates UI](#p2-d004-templates-ui)
3. [P2-D005: Loading Skeletons](#p2-d005-loading-skeletons)
4. [Shared Design Tokens](#shared-design-tokens)
5. [Implementation Notes](#implementation-notes)

---

## P2-D003: Real-Time Preview Layout

### 1.1 Split-Pane / Toggle View

**Desktop (≥ 1024px):** Side-by-side split pane — editor left (55%), preview right (45%). A `1px` vertical divider (`border-r border-border`) separates the panes. Both panes scroll independently.

**Tablet / Mobile (< 1024px):** Toggle view with a segmented control at the top: **Edit** | **Preview**. Active segment uses `bg-primary text-primary-foreground`; inactive uses `bg-muted text-muted-foreground`. Transition between views: `fade-in duration-150`.

```
Desktop:
┌──────────────── Editor ──────────────│──── Preview ─────────┐
│  [Title field]                       │  ┌─ Instagram ─────┐ │
│  [Content textarea]                  │  │  @handle · 1m    │ │
│  [Media grid]                        │  │  [Image]         │ │
│  [Platform toggles]                  │  │  Caption text... │ │
│  [Schedule picker]                   │  │  ♡ 💬 ✈ 🔖      │ │
│                                      │  └─────────────────┘ │
└──────────────────────────────────────┴──────────────────────┘

Mobile:
┌──────────────────────────────────┐
│  [ Edit | ★Preview ]             │  ← Segmented control
│  ┌─ Instagram ─────────────────┐ │
│  │  @handle · 1m               │ │
│  │  Caption text here...       │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

### 1.2 Platform Tabs

Tabs render inside the preview pane using Shadcn `Tabs` with `variant="default"`. Each tab shows the platform icon (16px, lucide or custom SVG) plus label.

| Tab | Icon | Character Limit |
|-----|------|-----------------|
| **Instagram** | Instagram glyph | 2,200 |
| **Facebook** | Facebook glyph | 63,206 |
| **Twitter/X** | X glyph | 280 |
| **LinkedIn** | LinkedIn glyph | 3,000 |

Tab bar: `border-b border-border` at the top of the preview pane. Active tab: `border-b-2 border-primary text-foreground font-medium`. Inactive: `text-muted-foreground`. Only platforms enabled for the current post are shown; disabled platforms appear with `opacity-40 pointer-events-none`.

Each tab renders a **platform-styled mock frame**: rounded card (`rounded-xl border border-border bg-card shadow-sm p-4`) mimicking that platform's post layout (avatar, handle, content, action icons). Content updates live as the user types (debounced 150ms).

### 1.3 Character Count Warnings

A character counter sits bottom-right of the preview card: `text-xs tabular-nums`.

| State | Condition | Style |
|-------|-----------|-------|
| **Normal** | `< 80%` of limit | `text-muted-foreground` |
| **Warning** | `80–99%` of limit | `text-amber-500 font-medium` |
| **Over limit** | `≥ 100%` of limit | `text-destructive font-semibold` + `ring-2 ring-destructive/30` on the content textarea |

Format: `{current} / {limit}`. When over limit, excess characters in the preview are highlighted with `bg-destructive/15 text-destructive` inline span. Counter animates color change with `transition-colors duration-150`.

---

## P2-D004: Templates UI

### 2.1 Card-Based Picker

Templates display in a responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`. Each card:

```
┌────────────────────────────────┐
│  [Preview thumbnail / excerpt] │  ← 160px height, bg-muted, overflow-hidden
│                                │
│  Template Name                 │  ← text-sm font-semibold truncate
│  Short description...          │  ← text-xs text-muted-foreground line-clamp-2
│  [Instagram] [Twitter]         │  ← Platform badges, gap-1
│                                │
│         [ Use Template ]       │  ← Button variant="default" size="sm"
└────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Card** | `rounded-lg border border-border bg-card hover:shadow-md transition-shadow duration-150` |
| **Thumbnail area** | `h-40 bg-muted rounded-t-lg` with centered preview text in `text-muted-foreground text-sm italic` |
| **Padding (body)** | `p-4` |
| **Platform badges** | `inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium` |
| **Hover** | `hover:border-primary/50` border accent |
| **Selected/active** | `ring-2 ring-primary` |

### 2.2 Category Filter

Horizontal scrollable chip bar above the grid: `flex gap-2 overflow-x-auto pb-2 scrollbar-hide`.

Chips: `rounded-full px-3 py-1 text-sm cursor-pointer transition-colors duration-150`. Active chip: `bg-primary text-primary-foreground`. Inactive: `bg-muted text-muted-foreground hover:bg-muted/80`.

Categories: **All**, **Promotional**, **Educational**, **Engagement**, **Seasonal**, **Announcement**. "All" selected by default. Selecting a category filters the grid with a `fade-in duration-150` re-render.

### 2.3 "Use Template" Action

Clicking **Use Template** populates the editor fields (title, content, platforms, media placeholders) and closes the template picker with `slide-out-to-bottom duration-200`. A toast confirms: `"✓ Template applied"` — auto-dismiss 3s. If the editor has unsaved content, show an `AlertDialog`: *"Replace current content with this template?"* — **Cancel** / **Apply Template**.

---

## P2-D005: Loading Skeletons

### 3.1 Shimmer Animation Specs

Single shared keyframe for all skeleton elements:

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

| Property | Value |
|----------|-------|
| **Background** | `linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.08) 50%, hsl(var(--muted)) 75%)` |
| **Background size** | `200% 100%` |
| **Animation** | `shimmer 1.5s ease-in-out infinite` |
| **Border radius** | Match the element being replaced (`rounded-md` for text, `rounded-lg` for cards, `rounded-full` for avatars) |

Reduced motion: replace animation with static `bg-muted` (no shimmer).

### 3.2 Layout Matching Content

Each skeleton mirrors the real component's dimensions to prevent layout shift (CLS ≈ 0).

**Post Card Skeleton:**

```
┌──────────────────────────────────────────┐
│ ░░░░░░  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 20px circle + 60% width bar (h-4)
│         ░░░░░░░░░░░░░░░░░░░░            │  ← 40% width bar (h-3)
│         ░░░░ ░░░░  •  ░░░░░░            │  ← Two small pills (h-3 w-16) + date bar
└──────────────────────────────────────────┘
```

**Preview Pane Skeleton:**

```
┌──────────────────────┐
│ ░░ ░░░░░░░░  · ░░░   │  ← Avatar circle (32px) + handle bar + time bar
│ ░░░░░░░░░░░░░░░░░░░░ │  ← Image placeholder (h-48 w-full rounded-md)
│ ░░░░░░░░░░░░░░░░░░   │  ← Caption bar 80% (h-3)
│ ░░░░░░░░░░░░          │  ← Caption bar 50% (h-3)
│ ░░  ░░  ░░  ░░        │  ← Action icon placeholders (h-5 w-5 × 4)
└──────────────────────┘
```

**Template Card Skeleton:**

```
┌────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Thumbnail block (h-40 w-full)
│ ░░░░░░░░░░░░░░░               │  ← Title bar 60% (h-4)
│ ░░░░░░░░░░░░░░░░░░░░          │  ← Desc bar 80% (h-3)
│ ░░░░ ░░░░                      │  ← Badge pills × 2 (h-5 w-14)
│         [ ░░░░░░░░░░ ]         │  ← Button placeholder (h-9 w-28)
└────────────────────────────────┘
```

Skeleton component: `<Skeleton className="h-{n} w-{n} rounded-{r}" />` using Shadcn's existing skeleton primitive, extended with the shimmer gradient above.

---

## Shared Design Tokens

```css
:root {
  /* Preview */
  --preview-split-ratio: 55% 45%;
  --preview-debounce: 150ms;

  /* Skeleton */
  --shimmer-duration: 1.5s;

  /* Template Picker */
  --template-card-thumb-height: 160px;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --shimmer-duration: 0ms;
  }
}
```

---

## Implementation Notes

### Component File Map

| Component | File Path | Task |
|-----------|-----------|------|
| `PlatformPreview` | `client/src/components/social/PlatformPreview.tsx` | P2-B005 (new) |
| `PlatformPreviewFrame` | `client/src/components/social/PlatformPreviewFrame.tsx` | P2-B005 (new, per-platform mock) |
| `CharacterCounter` | `client/src/components/social/CharacterCounter.tsx` | P2-B005 (new) |
| `TemplatePicker` | `client/src/components/social/TemplatePicker.tsx` | P2-B006 (new) |
| `TemplateCard` | `client/src/components/social/TemplateCard.tsx` | P2-B006 (new) |
| `CategoryFilter` | `client/src/components/social/CategoryFilter.tsx` | P2-B006 (new) |
| `PostCardSkeleton` | `client/src/components/social/PostCardSkeleton.tsx` | P2-B007 (new) |
| `PreviewSkeleton` | `client/src/components/social/PreviewSkeleton.tsx` | P2-B007 (new) |
| `TemplateCardSkeleton` | `client/src/components/social/TemplateCardSkeleton.tsx` | P2-B007 (new) |

### Accessibility Checklist

- [ ] Platform tabs keyboard-navigable (arrow keys within `Tabs`)
- [ ] Character count announced to screen readers via `aria-live="polite"` when crossing warning/over thresholds
- [ ] Template cards focusable; "Use Template" reachable via `Tab`
- [ ] Skeleton elements have `aria-hidden="true"` and sibling `sr-only` loading text
- [ ] `prefers-reduced-motion` disables shimmer animation

---

*End of Phase 2 Milestone 3 Design Specifications*
