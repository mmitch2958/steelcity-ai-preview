# Phase 2 — Milestone 2 Design Specifications

**Tasks:** P2-D006 (Calendar Drag Interaction)  
**Project:** SMP-2026-Q1 — Social Media Integration  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** COMPLETE  
**Related User Stories:** US-010 (Calendar DnD)

---

## P2-D006: Calendar Drag Interaction

Extends calendar DnD patterns from P2-D001 §1.6 with detailed interaction feedback.

### Visual Feedback During Drag

- **Drag ghost:** Card clone follows cursor at `scale(1.05)`, `shadow-xl`, `rotate(1deg)`, `opacity-90`, `pointer-events-none`
- **Source cell:** Original card replaced with `border-2 border-dashed border-muted-foreground/30 rounded-md` placeholder matching card height
- **Cursor:** `cursor-grabbing` on body during active drag

### Drop Zone Indicators

| Cell State | Treatment | Tailwind |
|------------|-----------|----------|
| **Hovered (valid)** | Primary highlight | `bg-primary/10 border-2 border-primary` — date label becomes `font-bold text-primary` |
| **Adjacent cells** | No change | Default styling preserved |
| **Today** | Retains today ring | `ring-2 ring-primary` persists under drop highlight |

### Past Date Warning

Dropping onto a past date is **allowed** but flagged:

- Cell highlights amber: `bg-amber-50 border-2 border-amber-400 dark:bg-amber-950/30`
- `AlertTriangle` icon (`h-4 w-4 text-amber-600`) renders beside date number
- Tooltip on hover: "This date is in the past"
- On drop, confirmation toast: `"⚠️ Scheduled in the past — March 2, 2026"` (auto-dismiss `5000ms`)

### Undo Snackbar After Reschedule

Reuses `UndoSnackbar` component from P2-D001 §1.6 spec:

```
┌──────────────────────────────────────────────────┐
│  ↩ Moved "Post title…" → Mar 15     [Undo]     │
└──────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Trigger** | Immediately after successful drop |
| **Duration** | `8000ms` auto-dismiss |
| **Position** | `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` |
| **Style** | `bg-foreground text-background rounded-lg shadow-lg px-4 py-3` |
| **Undo action** | Reverts `scheduledDate` optimistically, re-fires API PUT |
| **Stacking** | New snackbar replaces previous (only one visible at a time) |
| **Animation** | In: `slide-in-from-bottom-4 fade-in 200ms` / Out: `slide-out-to-bottom-4 fade-out 150ms` |
| **Reduced motion** | Instant show/hide, no slide |

### Accessibility

- `aria-live="polite"` announces: `"Post moved to {date}. Press Ctrl+Z or activate Undo to revert."`
- `Ctrl+Z` / `Cmd+Z` triggers undo while snackbar is visible
- Past-date warning announced via `aria-live="assertive"`: `"Warning: scheduled date is in the past"`

---

*End of Phase 2 Milestone 2 Design Specifications*
