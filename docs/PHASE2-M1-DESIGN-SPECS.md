# Phase 2 — Milestone 1 Design Specifications

**Tasks:** P2-D001 (Drag-and-Drop Interaction Patterns), P2-D002 (Bulk Actions UI)  
**Project:** SMP-2026-Q1 — Social Media Integration  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** COMPLETE  
**Related User Stories:** US-007 (Media DnD), US-009 (Bulk Actions), US-010 (Calendar DnD)

---

## Table of Contents

1. [P2-D001: Drag-and-Drop Interaction Patterns](#p2-d001-drag-and-drop-interaction-patterns)
   - 1.1 [Grip Handle Visual Design](#11-grip-handle-visual-design)
   - 1.2 [Drop Zone Indicators](#12-drop-zone-indicators)
   - 1.3 [Reorder Animation Specs](#13-reorder-animation-specs)
   - 1.4 [Touch Target Sizing](#14-touch-target-sizing)
   - 1.5 [Keyboard & Accessibility](#15-keyboard--accessibility)
   - 1.6 [Calendar-Specific DnD Patterns](#16-calendar-specific-dnd-patterns)
2. [P2-D002: Bulk Actions UI](#p2-d002-bulk-actions-ui)
   - 2.1 [Checkbox Placement Specifications](#21-checkbox-placement-specifications)
   - 2.2 [Floating Action Bar](#22-floating-action-bar)
   - 2.3 [Confirmation Dialogs for Destructive Actions](#23-confirmation-dialogs-for-destructive-actions)
   - 2.4 [Selection States & Feedback](#24-selection-states--feedback)
3. [Shared Design Tokens](#shared-design-tokens)
4. [Implementation Notes](#implementation-notes)

---

## P2-D001: Drag-and-Drop Interaction Patterns

### 1.1 Grip Handle Visual Design

The grip handle is the primary affordance telling users "this item is draggable." It must be instantly recognizable and accessible.

#### Visual Specification

```
┌──────────────────────────────────────────────┐
│ ⠿  Post title or media thumbnail             │  ← Grip handle at leading edge
│    Post description preview text...           │
│    [Instagram] [Facebook]  •  Scheduled 3/10  │
└──────────────────────────────────────────────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| **Icon** | `GripVertical` (lucide-react) | 6-dot pattern, universally recognized |
| **Size** | `16×16px` icon inside `44×44px` touch target | Icon is compact; target meets WCAG 2.5.5 |
| **Color — Default** | `hsl(var(--muted-foreground) / 0.5)` | Subtle, not distracting |
| **Color — Hover** | `hsl(var(--muted-foreground) / 0.9)` | Increased contrast on hover |
| **Color — Active/Dragging** | `hsl(var(--primary))` | Brand color signals active interaction |
| **Cursor — Default** | `cursor-grab` | Communicates draggability |
| **Cursor — Active** | `cursor-grabbing` | Confirms drag is in progress |
| **Position** | Left edge of item, vertically centered | Consistent across all draggable contexts |
| **Padding** | `12px` left padding from container edge | Enough space to avoid accidental grabs |
| **Transition** | `color 150ms ease, opacity 150ms ease` | Smooth state transitions |

#### Grip Handle States

| State | Visual Treatment |
|-------|-----------------|
| **Rest** | `opacity-50`, `muted-foreground` color |
| **Hover** | `opacity-90`, slight scale `scale(1.05)`, `muted-foreground` full |
| **Focus (keyboard)** | `ring-2 ring-ring ring-offset-2`, `opacity-100` |
| **Active (dragging)** | `opacity-100`, `primary` color, `cursor-grabbing` |
| **Disabled** | `opacity-25`, `cursor-not-allowed`, no hover effect |

#### Context-Specific Variations

**Media Grid (CreatePostTab — SortableMediaGrid):**
- Handle overlays top-left corner of thumbnail
- Background: `bg-black/50` pill (`rounded px-1 py-0.5`)
- Icon color: white (`text-white`)
- Appears on hover (`opacity-0 group-hover:opacity-100`) on desktop
- Always visible on touch devices (detected via `@media (pointer: coarse)`)

**Post List (PostsTab — future bulk reorder):**
- Handle is inline at the leading edge of the card
- No background overlay — uses standard muted-foreground color
- Always visible (lists are inherently reorderable)

**Calendar Cards (ContentCalendarTab):**
- Entire card is the drag handle (no separate grip icon)
- Cursor changes to `cursor-grab` on card hover
- Card title area has `touch-none` on non-handle areas to prevent scroll conflicts

#### Tailwind Implementation

```tsx
// Media grid grip handle (overlay style)
<button
  {...listeners}
  {...attributes}
  className={cn(
    "absolute top-1.5 left-1.5 z-10",
    "flex items-center justify-center",
    "w-11 h-11",                          // 44px touch target
    "rounded-md bg-black/50",
    "text-white opacity-0 group-hover:opacity-100",
    "cursor-grab active:cursor-grabbing",
    "transition-all duration-150 ease-in-out",
    "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "touch:opacity-100",                   // Always visible on touch
  )}
  aria-label={`Drag to reorder item ${index + 1}`}
  aria-roledescription="sortable"
>
  <GripVertical className="h-4 w-4" />
</button>

// Post list grip handle (inline style)
<button
  {...listeners}
  {...attributes}
  className={cn(
    "flex items-center justify-center",
    "w-11 h-11",                          // 44px touch target
    "rounded-md",
    "text-muted-foreground/50 hover:text-muted-foreground/90",
    "cursor-grab active:cursor-grabbing",
    "transition-colors duration-150",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  )}
  aria-label={`Drag to reorder post`}
  aria-roledescription="sortable"
>
  <GripVertical className="h-4 w-4" />
</button>
```

---

### 1.2 Drop Zone Indicators

Drop zones must clearly communicate **where** an item will land, distinguishing between valid and invalid targets.

#### Media Grid Drop Zones

```
Before drag:
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  1  │ │  2  │ │  3  │ │  4  │
└─────┘ └─────┘ └─────┘ └─────┘

During drag (item 1 dragged over position 3):
┌ ─ ─ ┐ ┌─────┐ ┌─────┐ ┌─────┐
│ (1) │ │  2  │ │  3  │ │  4  │   ← Source position: dashed border, muted
└ ─ ─ ┘ └─────┘ └─────┘ └─────┘
                     ▲
              ┌─ ─ ─ ─ ─ ─┐
              │ DROP HERE  │  ← Active drop zone: highlighted border
              └─ ─ ─ ─ ─ ─┘
```

| Element | Visual | Tailwind |
|---------|--------|----------|
| **Source placeholder** | Dashed border, reduced opacity | `border-2 border-dashed border-muted-foreground/30 opacity-40` |
| **Active drop zone** | Solid border, primary accent, subtle bg | `border-2 border-primary bg-primary/5 rounded-md` |
| **Adjacent items shifting** | Smooth translate animation | Handled by `@dnd-kit` `SortableContext` with `rectSortingStrategy` |
| **Invalid zone** | Red tint, shake indicator | `border-2 border-destructive/50 bg-destructive/5` |

#### Drag Overlay (Ghost Preview)

The overlay follows the cursor/finger and represents the item being moved:

| Property | Value |
|----------|-------|
| **Scale** | `1.02` — slightly larger than source to lift off the surface |
| **Shadow** | `shadow-xl` — strong elevation to separate from content layer |
| **Border** | `border-2 border-primary` — clear ownership color |
| **Opacity** | `1.0` — fully opaque for clear visibility |
| **Border radius** | Match source element (`rounded-md`) |
| **Rotation** | `rotate(2deg)` — subtle tilt to convey "picked up" feel |
| **Pointer events** | `none` — overlay must not capture any mouse events |

```tsx
<DragOverlay dropAnimation={{
  duration: 200,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',  // Slight overshoot
}}>
  {activeItem && (
    <div className={cn(
      "rounded-md border-2 border-primary shadow-xl",
      "scale-[1.02] rotate-[2deg]",
      "pointer-events-none",
      "bg-card",
    )}>
      {/* Render item content */}
    </div>
  )}
</DragOverlay>
```

#### Calendar Drop Zones (for US-010 / P2-D006)

When dragging a post card across the calendar grid:

| Element | Visual Treatment |
|---------|-----------------|
| **Current date cell** | Normal appearance |
| **Hovered date cell** | `bg-primary/10 border-2 border-primary rounded-lg` with date number in `font-bold text-primary` |
| **Past date cell** | `bg-amber-50 border-2 border-amber-400` with ⚠️ icon — valid but warns |
| **Non-droppable cell** | No change — default appearance |
| **Today indicator** | Retains `ring-2 ring-primary` during drag |

---

### 1.3 Reorder Animation Specs

All animations must target `<16ms` frame time (60fps). Use CSS transforms only (no layout-triggering properties).

#### Animation Tokens

| Animation | Duration | Easing | Property |
|-----------|----------|--------|----------|
| **Item pickup** | `150ms` | `ease-out` | `scale`, `box-shadow`, `opacity` |
| **Adjacent item shift** | `200ms` | `cubic-bezier(0.25, 1, 0.5, 1)` | `transform` (translate) |
| **Drop settle** | `200ms` | `cubic-bezier(0.18, 0.67, 0.6, 1.22)` | `scale`, `box-shadow`, `transform` |
| **Cancel return** | `250ms` | `ease-in-out` | `transform` (translate back to origin) |
| **Success flash** | `300ms` | `ease` | `background-color` pulse (primary/10 → transparent) |

#### Detailed Keyframes

**Pickup Animation:**
```css
@keyframes dnd-pickup {
  0%   { transform: scale(1); box-shadow: var(--shadow-sm); }
  100% { transform: scale(1.02) rotate(2deg); box-shadow: var(--shadow-xl); }
}
```

**Drop Settle Animation:**
```css
@keyframes dnd-drop {
  0%   { transform: scale(1.02) rotate(2deg); box-shadow: var(--shadow-xl); }
  60%  { transform: scale(1.005) rotate(0deg); box-shadow: var(--shadow-md); }
  100% { transform: scale(1) rotate(0deg); box-shadow: var(--shadow-sm); }
}
```

**Reorder Success Flash:**
```css
@keyframes reorder-success {
  0%   { background-color: hsl(var(--primary) / 0.1); }
  100% { background-color: transparent; }
}
```

#### @dnd-kit Configuration

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,        // 5px dead zone prevents accidental drags
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,          // 200ms long-press to initiate on touch
      tolerance: 5,        // 5px movement tolerance during delay
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);

// Drop animation config
const dropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
};
```

#### Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- All transitions set to `duration: 0ms`
- No rotation or scale transforms
- Drop is instant (no settle animation)
- Success feedback uses border-color change instead of background flash

```css
@media (prefers-reduced-motion: reduce) {
  .dnd-item,
  .dnd-overlay,
  .dnd-placeholder {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}
```

---

### 1.4 Touch Target Sizing

All interactive elements in DnD flows **must** meet WCAG 2.5.5 (Enhanced) target size of **44×44px**.

#### Target Size Matrix

| Element | Min Width | Min Height | Notes |
|---------|-----------|------------|-------|
| **Grip handle** | `44px` (`w-11`) | `44px` (`h-11`) | Icon is 16px; padding fills rest |
| **Remove media button** | `44px` (`w-11`) | `44px` (`h-11`) | Visual circle can be 28px; hit area is 44px |
| **Media thumbnail (draggable)** | `80px` | `80px` | Entire thumbnail is the drag target |
| **Calendar day cell** | `44px` | `44px` min | Typically much larger in grid layout |
| **Post card (calendar drag)** | Full card width | `44px` min | Entire card is draggable |
| **Position indicator badge** | N/A (display only) | N/A | Not interactive — no target required |

#### Touch Spacing

Adjacent interactive elements must have **≥8px** gap between touch targets to prevent mis-taps:

```
┌──────────┐          ┌──────────┐
│  Grip    │← 8px+ →│  Remove  │
│  Handle  │  gap    │  Button  │
│  44×44   │         │  44×44   │
└──────────┘         └──────────┘
```

**Implementation:** Grid gap of `gap-2` (8px) or `gap-3` (12px) between items. For overlay buttons (grip + remove), position them with enough offset:
- Grip: `top-1.5 left-1.5` (6px from edges)
- Remove: `top-1.5 right-1.5` (6px from edges)
- Minimum thumbnail width must accommodate both without overlap: `≥ 6 + 44 + 8 + 44 + 6 = 108px`

#### Mobile-Specific Adjustments

| Breakpoint | Adjustment |
|------------|------------|
| `< 640px` (sm) | Grid columns: 2 (instead of 4) for larger thumbnails |
| `< 640px` (sm) | Grip handles always visible (no hover-reveal) |
| `< 640px` (sm) | Touch activation delay: 200ms (prevent scroll conflicts) |
| `≥ 640px` (sm+) | Grid columns: 3-4 depending on container |
| `≥ 640px` (sm+) | Grip handles hover-reveal (except when focused) |

---

### 1.5 Keyboard & Accessibility

#### Keyboard Controls

| Key | Action |
|-----|--------|
| `Tab` | Focus moves between grip handles in DOM order |
| `Space` / `Enter` | Pick up / drop the focused item |
| `Arrow Up` / `Arrow Left` | Move item one position backward |
| `Arrow Down` / `Arrow Right` | Move item one position forward |
| `Escape` | Cancel drag, return item to original position |

#### ARIA Implementation

```tsx
// Container
<div
  role="list"
  aria-label="Draggable media attachments. Use arrow keys to reorder."
>

// Each item
<div
  role="listitem"
  aria-roledescription="sortable"
  aria-label={`Item ${index + 1} of ${total}. ${itemDescription}`}
  aria-grabbed={isDragging}           // Deprecated but still useful for some AT
  aria-dropeffect={isOver ? "move" : "none"}
>
```

#### Live Region Announcements

Provide real-time feedback via `aria-live` region:

| Event | Announcement |
|-------|-------------|
| Pickup | `"Picked up item {n}. Current position: {n} of {total}. Use arrow keys to move."` |
| Move | `"Item moved to position {n} of {total}."` |
| Drop | `"Item dropped at position {n} of {total}."` |
| Cancel | `"Reorder cancelled. Item returned to position {n}."` |

```tsx
<div aria-live="assertive" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

---

### 1.6 Calendar-Specific DnD Patterns

For US-010 (drag-to-reschedule in ContentCalendarTab):

#### Interaction Flow

1. User hovers over a post card in the calendar → cursor changes to `grab`
2. User initiates drag (click+hold on desktop, long-press on mobile)
3. Original cell shows dashed placeholder
4. Hovered date cells highlight with primary border/background
5. Drop onto a valid date → post reschedules immediately (optimistic)
6. Undo snackbar appears at bottom for 8 seconds

#### Undo Snackbar Spec

```
┌─────────────────────────────────────────────┐
│ ↩ Post moved to March 15, 2026    [Undo]  │
└─────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Position** | Fixed bottom center, `bottom-6`, `max-w-md`, `mx-auto` |
| **Background** | `bg-foreground text-background` (inverted) |
| **Border radius** | `rounded-lg` |
| **Shadow** | `shadow-lg` |
| **Duration** | `8000ms` auto-dismiss |
| **Animation in** | `slide-in-from-bottom-4 fade-in duration-200` |
| **Animation out** | `slide-out-to-bottom-4 fade-out duration-150` |
| **Undo button** | `text-primary font-semibold underline` |
| **Z-index** | `z-50` (above floating action bar) |

---

## P2-D002: Bulk Actions UI

### 2.1 Checkbox Placement Specifications

#### Post Card Checkbox Layout

```
Desktop (list view):
┌─────────────────────────────────────────────────────┐
│ ☐  ⠿  [Thumbnail]  Post Title                      │
│         Post content preview text...                │
│         [Instagram] [Facebook]  •  Mar 10, 3:00 PM  │
└─────────────────────────────────────────────────────┘
 ↑   ↑
 │   └─ Grip handle (only in reorderable contexts)
 └──── Checkbox (44×44 touch target)

Desktop (grid/card view):
┌─────────────────────────┐
│ ☐                    ⋯  │  ← Checkbox top-left, menu top-right
│                         │
│   [Post Thumbnail]      │
│                         │
│ Post Title              │
│ [IG] [FB]  •  Scheduled │
└─────────────────────────┘

Mobile (compact list):
┌──────────────────────────────────┐
│ ☐  [Thumb]  Post Title           │
│             [IG] • Mar 10        │
└──────────────────────────────────┘
```

#### Checkbox Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Size (visual)** | `20×20px` (`h-5 w-5`) | Larger than default Shadcn `h-4 w-4` for better usability |
| **Touch target** | `44×44px` | Invisible padding around the visual checkbox |
| **Position — List view** | Leading edge, vertically centered | Before grip handle (if present) |
| **Position — Card view** | `top-3 left-3` absolute | Overlays the card content |
| **Margin from edge** | `12px` from card border | `ml-3` or `left-3` |
| **Gap to next element** | `12px` (grip) or `16px` (content) | `gap-3` or `gap-4` |
| **Border radius** | `rounded-sm` (3px) | Matches existing Shadcn checkbox |
| **Color — unchecked** | `border-primary` | Standard Shadcn |
| **Color — checked** | `bg-primary text-primary-foreground` | Standard Shadcn |
| **Color — indeterminate** | `bg-primary text-primary-foreground` with `−` icon | For "select all" with partial selection |
| **Transition** | `150ms ease` on `background-color, border-color` | Snappy but smooth |

#### Checkbox Visibility Modes

| Mode | Behavior |
|------|----------|
| **Default (no selection)** | Checkboxes hidden. Card click opens post detail. |
| **Selection mode active** | Checkboxes visible on all items. Card click toggles selection. |
| **Entering selection mode** | Long-press a card OR click "Select" button in toolbar → all checkboxes appear with `fade-in duration-150` |
| **Exiting selection mode** | Click "Cancel" or press `Escape` → checkboxes hide with `fade-out duration-100` |

**Trigger for selection mode:**

```
Desktop: "Select" text button in PostsTab toolbar (right side)
Mobile:  Long-press (500ms) on any post card
Both:    Ctrl+Click / Cmd+Click on a post card
```

#### Select All / Deselect All

Position: Inside the floating action bar (see 2.2), left side.

```
┌──────────────────────────────────────────────────────────┐
│ ☐ Select All (47 posts)  │        [Archive] [Delete]    │
│                           │                              │
│ ─ or after checking ─                                    │
│                           │                              │
│ ☑ 12 selected  [Clear]   │  [Reschedule] [Archive] [🗑] │
└──────────────────────────────────────────────────────────┘
```

---

### 2.2 Floating Action Bar

The floating action bar (FAB) appears when ≥1 item is selected, providing bulk operations.

#### Position & Layout

| Breakpoint | Position | Behavior |
|------------|----------|----------|
| **Mobile (`< 768px`)** | Fixed bottom, full width | `fixed bottom-0 left-0 right-0 z-40` with safe area padding |
| **Tablet (`768px–1023px`)** | Fixed bottom, centered | `fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto` |
| **Desktop (`≥ 1024px`)** | Sticky top of list area | `sticky top-0 z-30` below main nav, spans content width |

#### Visual Design

```
Mobile / Tablet (bottom bar):
╔══════════════════════════════════════════════════════╗
║  ☑ 5 selected  [✕]    [📅 Reschedule] [📦] [🗑️]   ║
╚══════════════════════════════════════════════════════╝
  ↑ safe-area-inset-bottom padding on iOS

Desktop (sticky top bar):
┌──────────────────────────────────────────────────────┐
│ ☑ 5 selected  [Clear]     [Reschedule] [Archive] [Delete] │
└──────────────────────────────────────────────────────┘
```

#### Styling Specification

| Property | Value | Notes |
|----------|-------|-------|
| **Background** | `bg-card border border-border` | Matches card styling |
| **Shadow** | `shadow-lg` (mobile/tablet), `shadow-md` (desktop) | Elevation for bottom bars |
| **Border radius** | `rounded-t-xl` (mobile), `rounded-xl` (tablet), `rounded-lg` (desktop) | Softer on mobile |
| **Padding** | `px-4 py-3` | Comfortable touch spacing |
| **Height** | Auto, min `56px` | Accommodates button row |
| **Safe area** | `pb-[env(safe-area-inset-bottom)]` | iOS home indicator clearance |
| **Entrance animation** | `slide-in-from-bottom-4 fade-in duration-200` | Slides up from below viewport |
| **Exit animation** | `slide-out-to-bottom-4 fade-out duration-150` | Slides back down |
| **Backdrop** | None (overlays content, elevated by shadow) | Content scrolls behind on mobile |
| **Z-index** | `z-40` | Below modals (z-50) but above content |

#### Action Buttons

| Action | Icon | Label (Desktop) | Label (Mobile) | Variant | Condition |
|--------|------|-----------------|----------------|---------|-----------|
| **Reschedule** | `Calendar` | "Reschedule" | Icon only + tooltip | `outline` | Always |
| **Archive** | `Archive` | "Archive" | Icon only + tooltip | `outline` | Always |
| **Delete** | `Trash2` | "Delete" | Icon only + tooltip | `destructive` | Always |
| **Clear selection** | `X` | "Clear" | `X` icon | `ghost` | Always (left side) |

Button sizing within the FAB:

| Breakpoint | Button size | Spacing |
|------------|-------------|---------|
| Mobile | `size="icon"` (44×44) | `gap-2` (8px) |
| Desktop | `size="default"` with label | `gap-3` (12px) |

#### Layout Implementation

```tsx
// Mobile
<div className={cn(
  "fixed bottom-0 inset-x-0 z-40",
  "bg-card border-t border-border",
  "px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
  "shadow-lg rounded-t-xl",
  "flex items-center justify-between",
  "animate-in slide-in-from-bottom-4 fade-in duration-200",
)}>
  <div className="flex items-center gap-2">
    <Checkbox checked={allSelected} onCheckedChange={toggleAll}
              className="h-5 w-5" />
    <span className="text-sm font-medium">{count} selected</span>
    <Button variant="ghost" size="icon" onClick={clearSelection}>
      <X className="h-4 w-4" />
    </Button>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="icon" onClick={onReschedule}>
      <Calendar className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon" onClick={onArchive}>
      <Archive className="h-4 w-4" />
    </Button>
    <Button variant="destructive" size="icon" onClick={onDeleteConfirm}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</div>

// Desktop
<div className={cn(
  "sticky top-0 z-30",
  "bg-card border border-border rounded-lg",
  "px-4 py-3 shadow-md",
  "flex items-center justify-between",
  "animate-in slide-in-from-top-2 fade-in duration-200",
)}>
  <div className="flex items-center gap-3">
    <Checkbox checked={allSelected} onCheckedChange={toggleAll}
              className="h-5 w-5" />
    <span className="text-sm font-medium">{count} selected</span>
    <Button variant="ghost" size="sm" onClick={clearSelection}>
      Clear
    </Button>
  </div>
  <div className="flex items-center gap-3">
    <Button variant="outline" size="default" onClick={onReschedule}>
      <Calendar className="h-4 w-4 mr-2" /> Reschedule
    </Button>
    <Button variant="outline" size="default" onClick={onArchive}>
      <Archive className="h-4 w-4 mr-2" /> Archive
    </Button>
    <Button variant="destructive" size="default" onClick={onDeleteConfirm}>
      <Trash2 className="h-4 w-4 mr-2" /> Delete
    </Button>
  </div>
</div>
```

---

### 2.3 Confirmation Dialogs for Destructive Actions

All destructive bulk actions **must** require explicit confirmation. Uses the existing Shadcn `AlertDialog` component.

#### Dialog Variants

**Bulk Delete:**

```
╔═══════════════════════════════════════════════╗
║  ⚠️ Delete 5 posts?                          ║
║                                               ║
║  This will permanently delete 5 posts.        ║
║  This action cannot be undone.                ║
║                                               ║
║  Posts to be deleted:                          ║
║  • "Spring campaign launch..."                ║
║  • "Product update announcement..."           ║
║  • "Weekly tips #12..."                       ║
║  + 2 more                                     ║
║                                               ║
║                      [Cancel]  [Delete 5]     ║
╚═══════════════════════════════════════════════╝
```

**Bulk Archive:**

```
╔═══════════════════════════════════════════════╗
║  📦 Archive 3 posts?                          ║
║                                               ║
║  3 posts will be moved to the archive.        ║
║  You can restore them later from the          ║
║  archive view.                                ║
║                                               ║
║                     [Cancel]  [Archive 3]     ║
╚═══════════════════════════════════════════════╝
```

**Bulk Reschedule:**

```
╔═══════════════════════════════════════════════╗
║  📅 Reschedule 4 posts                        ║
║                                               ║
║  New date and time:                           ║
║  ┌─────────────────────────────────────┐      ║
║  │ 📅 March 15, 2026  ⏰ 2:00 PM      │      ║
║  └─────────────────────────────────────┘      ║
║                                               ║
║  4 posts will be rescheduled to this          ║
║  date and time.                               ║
║                                               ║
║                  [Cancel]  [Reschedule 4]     ║
╚═══════════════════════════════════════════════╝
```

#### Dialog Specifications

| Property | Delete | Archive | Reschedule |
|----------|--------|---------|------------|
| **Title icon** | `⚠️` (AlertTriangle) | `📦` (Archive) | `📅` (Calendar) |
| **Title text** | "Delete {n} posts?" | "Archive {n} posts?" | "Reschedule {n} posts" |
| **Description** | Permanent deletion warning | Reversibility note | Date/time picker + note |
| **Post list preview** | Show first 3 titles + "+N more" | Not shown (low risk) | Not shown |
| **Cancel button** | `variant="outline"` | `variant="outline"` | `variant="outline"` |
| **Confirm button** | `variant="destructive"` | `variant="default"` | `variant="default"` |
| **Confirm label** | "Delete {n}" | "Archive {n}" | "Reschedule {n}" |
| **Loading state** | Button shows spinner + "Deleting..." | "Archiving..." | "Rescheduling..." |
| **Width** | `max-w-md` | `max-w-md` | `max-w-md` |

#### Confirm Button Safety Pattern

For the **Delete** action only, add a brief delay to prevent accidental rapid confirmation:

```tsx
// Destructive confirm button — enabled after 1s delay
const [canConfirm, setCanConfirm] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setCanConfirm(true), 1000);
  return () => clearTimeout(timer);
}, []);

<AlertDialogAction
  disabled={!canConfirm || isDeleting}
  className={cn(
    buttonVariants({ variant: "destructive" }),
    !canConfirm && "opacity-50 cursor-not-allowed",
  )}
  onClick={handleBulkDelete}
>
  {isDeleting ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Deleting...
    </>
  ) : (
    `Delete ${count}`
  )}
</AlertDialogAction>
```

#### Post-Action Feedback

After a bulk action completes:

| Result | Feedback |
|--------|----------|
| **Success** | Toast notification: "✓ {n} posts deleted/archived/rescheduled" — auto-dismiss 4s |
| **Partial failure** | Toast: "⚠ {succeeded} of {total} posts updated. {failed} failed." — persists until dismissed |
| **Full failure** | Toast: "✗ Failed to {action} posts. Please try again." — persists with retry button |

Selection is cleared automatically on success. On partial/full failure, failed items remain selected.

---

### 2.4 Selection States & Feedback

#### Visual States for Selectable Items

| State | Visual Treatment | Tailwind |
|-------|-----------------|----------|
| **Default (no selection mode)** | Normal card appearance | — |
| **Selection mode, unselected** | Checkbox visible, subtle hover highlight | `hover:bg-accent/50` |
| **Selected** | Checkbox checked, card has selection ring | `ring-2 ring-primary bg-primary/5` |
| **Selected + hover** | Deeper highlight | `ring-2 ring-primary bg-primary/10` |
| **Disabled (non-selectable)** | Greyed out, no checkbox | `opacity-50 pointer-events-none` |

#### Selection Interactions

| Input | Action |
|-------|--------|
| Click checkbox | Toggle single item selection |
| Click card (in selection mode) | Toggle single item selection |
| `Shift + Click` | Range select (from last selected to clicked item) |
| `Ctrl/Cmd + Click` | Toggle single without clearing others |
| `Ctrl/Cmd + A` | Select all visible items |
| `Escape` | Exit selection mode, clear all |

#### Selection Count Badge

When in selection mode, show a floating count badge near the toolbar:

```tsx
<Badge variant="default" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
  {selectedCount}
</Badge>
```

---

## Shared Design Tokens

These tokens are referenced across both P2-D001 and P2-D002 and should be added as CSS custom properties or Tailwind config entries:

### Animation Tokens

```css
:root {
  /* DnD Animations */
  --dnd-pickup-duration: 150ms;
  --dnd-shift-duration: 200ms;
  --dnd-drop-duration: 200ms;
  --dnd-cancel-duration: 250ms;

  /* Bulk Actions Animations */
  --fab-enter-duration: 200ms;
  --fab-exit-duration: 150ms;
  --selection-toggle-duration: 150ms;

  /* Shared Easings */
  --ease-overshoot: cubic-bezier(0.18, 0.67, 0.6, 1.22);
  --ease-smooth: cubic-bezier(0.25, 1, 0.5, 1);

  /* Touch Targets */
  --touch-target-min: 44px;

  /* Z-index Layers */
  --z-dnd-overlay: 50;
  --z-fab: 40;
  --z-modal: 50;
  --z-snackbar: 50;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dnd-pickup-duration: 0ms;
    --dnd-shift-duration: 0ms;
    --dnd-drop-duration: 0ms;
    --dnd-cancel-duration: 0ms;
    --fab-enter-duration: 0ms;
    --fab-exit-duration: 0ms;
    --selection-toggle-duration: 0ms;
  }
}
```

### Tailwind Config Additions

```ts
// Add to tailwind.config.ts → theme.extend
keyframes: {
  'dnd-pickup': {
    '0%': { transform: 'scale(1)', boxShadow: 'var(--shadow-sm)' },
    '100%': { transform: 'scale(1.02) rotate(2deg)', boxShadow: 'var(--shadow-xl)' },
  },
  'dnd-drop': {
    '0%': { transform: 'scale(1.02) rotate(2deg)' },
    '60%': { transform: 'scale(1.005) rotate(0deg)' },
    '100%': { transform: 'scale(1) rotate(0deg)' },
  },
  'reorder-success': {
    '0%': { backgroundColor: 'hsl(var(--primary) / 0.1)' },
    '100%': { backgroundColor: 'transparent' },
  },
  'slide-up-fab': {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
},
animation: {
  'dnd-pickup': 'dnd-pickup 150ms ease-out',
  'dnd-drop': 'dnd-drop 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  'reorder-success': 'reorder-success 300ms ease',
  'slide-up-fab': 'slide-up-fab 200ms ease-out',
},
```

---

## Implementation Notes

### Library Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@dnd-kit/core` | `^6.x` | DnD engine — already in project |
| `@dnd-kit/sortable` | `^8.x` | Sortable preset — already in project |
| `@dnd-kit/utilities` | `^3.x` | CSS transform helpers — already in project |
| `@radix-ui/react-checkbox` | existing | Shadcn Checkbox — already in project |
| `@radix-ui/react-alert-dialog` | existing | Shadcn AlertDialog — already in project |

No new dependencies required for M1 design implementation.

### Component File Map

| Component | File Path | Task |
|-----------|-----------|------|
| `SortableMediaGrid` | `client/src/components/social/SortableMediaGrid.tsx` | P2-B001 (update existing) |
| `BulkActionBar` | `client/src/components/social/BulkActionBar.tsx` | P2-B003 (new) |
| `BulkDeleteDialog` | `client/src/components/social/BulkDeleteDialog.tsx` | P2-B003 (new) |
| `BulkArchiveDialog` | `client/src/components/social/BulkArchiveDialog.tsx` | P2-B003 (new) |
| `BulkRescheduleDialog` | `client/src/components/social/BulkRescheduleDialog.tsx` | P2-B003 (new) |
| `SelectablePostCard` | `client/src/components/social/SelectablePostCard.tsx` | P2-B003 (new, wraps PostCard) |
| `useSelection` | `client/src/hooks/social/use-selection.ts` | P2-B003 (new hook) |
| `UndoSnackbar` | `client/src/components/ui/undo-snackbar.tsx` | P2-B004 (new, reusable) |

### Existing Code Alignment

The current `SortableMediaGrid.tsx` already implements basic @dnd-kit patterns. Updates needed per this spec:

1. **Grip handle**: Increase touch target from `24×24` to `44×44px` (`minWidth: 24` → `w-11 h-11`)
2. **Grip handle**: Add `cursor-grab active:cursor-grabbing` classes
3. **Grip handle**: Add touch device always-visible behavior
4. **Drop overlay**: Add `rotate-[2deg]` and `scale-[1.02]` transforms
5. **Animations**: Add drop animation config with overshoot easing
6. **Grid columns**: Make responsive (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`)
7. **Accessibility**: Add live region announcements for drag events

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Drag frame time | `< 16ms` (60fps) | Chrome DevTools Performance panel |
| Selection mode toggle | `< 100ms` | Perceived latency |
| Bulk action bar render | `< 50ms` | React Profiler |
| Dialog open | `< 100ms` | Perceived latency |
| Reorder animation | 60fps sustained | No dropped frames during shift |

### Accessibility Checklist

- [ ] All interactive elements meet 44×44px touch target minimum
- [ ] Keyboard navigation works for all DnD operations
- [ ] `aria-live` region announces drag state changes
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Color is not the only indicator of state (shape/icon changes accompany color changes)
- [ ] Focus management: focus returns to logical position after drag/drop
- [ ] Confirmation dialogs trap focus correctly (Radix handles this)
- [ ] Screen reader text describes selection count and available actions

---

*End of Phase 2 Milestone 1 Design Specifications*
