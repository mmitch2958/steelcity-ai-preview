# Phase 2 — Milestone 2 Test Specifications

**Tasks:** P2-Q005 (Calendar Drag-to-Reschedule), P2-Q006 (Analytics Date Range Filtering)  
**Project:** SMP-2026-Q1 — Social Media Management Platform  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** ✅ Complete  
**Related User Stories:** US-010 (Drag-to-Reschedule Calendar), US-011 (Analytics Date Range Filtering)  
**Dependencies:** P2-B004 (Calendar DnD build), P2-B005 (Date filtering build), P2-D006 (Calendar drag design)  
**Test Plan Reference:** [PHASE2-TEST-PLAN.md](./PHASE2-TEST-PLAN.md) §7–§8  
**Design Spec Reference:** [PHASE2-M1-DESIGN-SPECS.md](./PHASE2-M1-DESIGN-SPECS.md) §1.6

---

## Table of Contents

1. [P2-Q005: Calendar Drag-to-Reschedule Test Specification](#p2-q005-calendar-drag-to-reschedule-test-specification)
   - 1.1 [Scope & Objectives](#11-scope--objectives)
   - 1.2 [Preconditions & Test Data](#12-preconditions--test-data)
   - 1.3 [Functional Tests — Core Drag-to-Reschedule](#13-functional-tests--core-drag-to-reschedule)
   - 1.4 [Drag to Past Date (Warning Scenarios)](#14-drag-to-past-date-warning-scenarios)
   - 1.5 [Drag to Occupied Slot](#15-drag-to-occupied-slot)
   - 1.6 [Notification Settings Update Verification](#16-notification-settings-update-verification)
   - 1.7 [Touch vs Mouse Testing](#17-touch-vs-mouse-testing)
   - 1.8 [Undo Functionality](#18-undo-functionality)
   - 1.9 [Visual Feedback & Animation](#19-visual-feedback--animation)
   - 1.10 [Edge Cases & Error Handling](#110-edge-cases--error-handling)
   - 1.11 [Keyboard Accessibility](#111-keyboard-accessibility)
   - 1.12 [Performance Benchmarks](#112-performance-benchmarks)
2. [P2-Q006: Analytics Date Range Filtering Test Specification](#p2-q006-analytics-date-range-filtering-test-specification)
   - 2.1 [Scope & Objectives](#21-scope--objectives)
   - 2.2 [Preconditions & Test Data](#22-preconditions--test-data)
   - 2.3 [Valid Date Range Tests](#23-valid-date-range-tests)
   - 2.4 [Invalid Date Range Tests (Start > End)](#24-invalid-date-range-tests-start--end)
   - 2.5 [Clear Filter Tests](#25-clear-filter-tests)
   - 2.6 [Export with Filter Applied](#26-export-with-filter-applied)
   - 2.7 [URL Persistence & Deep Links](#27-url-persistence--deep-links)
   - 2.8 [Edge Cases & Boundary Conditions](#28-edge-cases--boundary-conditions)
   - 2.9 [Loading & Empty States](#29-loading--empty-states)
   - 2.10 [Accessibility](#210-accessibility)
   - 2.11 [Performance Benchmarks](#211-performance-benchmarks)
3. [Cross-Feature Integration Tests](#3-cross-feature-integration-tests)
4. [Test Execution Checklist](#4-test-execution-checklist)

---

## P2-Q005: Calendar Drag-to-Reschedule Test Specification

### 1.1 Scope & Objectives

**Component under test:** `ContentCalendarTab` — drag-to-reschedule interaction  
**Build task:** P2-B004 (12h estimated)  
**Design task:** P2-D006 (Calendar drag interaction design)  
**Estimated QA time:** 6h

**Objectives:**
1. Verify core drag-to-reschedule functionality across input modalities (mouse, touch)
2. Validate warning/confirmation flows for past-date and published-post scenarios
3. Confirm occupied-slot behavior and density handling
4. Test undo/rollback patterns including optimistic update reversal
5. Verify notification/schedule settings update correctly after reschedule
6. Validate @dnd-kit integration within calendar grid context
7. Ensure 60fps drag performance with no perceptible lag

**Priority legend:**

| Priority | Meaning | When to Run |
|----------|---------|-------------|
| **P0** | Blocker — feature doesn't work | Every build |
| **P1** | Critical — main flow broken | Every build |
| **P2** | Major — secondary flow broken | Pre-release |
| **P3** | Minor — cosmetic / edge case | Pre-release |

---

### 1.2 Preconditions & Test Data

**Required seed data (from `scripts/seed-phase2-test-data.ts`):**

| Data | Details |
|------|---------|
| Scheduled posts | 8 posts spread across next 14 days (various times: 9 AM, 12 PM, 3 PM, 6 PM) |
| Published posts | 3 posts on dates within the past 7 days |
| Draft posts | 2 posts (no scheduled date) |
| Occupied dates | At least 2 dates with 3+ posts each; 1 date with 5+ posts |
| Empty dates | At least 3 consecutive dates with no posts |
| Cross-month post | 1 post scheduled for last day of current month |
| Multi-platform post | 1 post targeting 3+ platforms, scheduled for next week |

**Environment preconditions:**
- User is logged in as portal user (realtor role)
- ContentCalendarTab is accessible and rendered in month view
- Network is stable (for core tests); throttled for error/rollback tests
- Browser DevTools available for performance measurement

---

### 1.3 Functional Tests — Core Drag-to-Reschedule

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-001 | Basic drag to new future date | 1. Locate a post scheduled for March 10 on the calendar 2. Mouse down on the post card's drag handle 3. Drag to the March 15 cell 4. Release | Post's scheduled date updates to March 15. Calendar shows post on March 15 and no longer on March 10. API `PUT` fires with new date. | P0 |
| CAL-002 | Optimistic calendar update | 1. Open DevTools Network tab 2. Drag a post to a new date 3. Observe calendar before API response | Calendar updates the post's position **immediately** on drop (before API 200 response). Success toast appears after API confirms. | P0 |
| CAL-003 | Time preservation on date change | 1. Post scheduled for March 10 at 3:00 PM EST 2. Drag to March 15 | Scheduled time remains 3:00 PM EST; only the date changes to March 15. Verify via post detail or API response. | P0 |
| CAL-004 | Drag within same week | 1. Drag a post from Monday to Wednesday of the same week | Post moves to Wednesday. Both source and target cells update correctly. | P1 |
| CAL-005 | Drag across weeks | 1. Drag a post from Week 1 row to Week 3 row | Post moves to target date in Week 3. Calendar rows update correctly. | P1 |
| CAL-006 | Published post drag — confirmation | 1. Drag a post with status "published" | Confirmation dialog: "This post is already published. Rescheduling will change its publish date. Continue?" with Cancel (focused) and Confirm buttons. | P1 |
| CAL-007 | Published post drag — confirm accepted | 1. Drag published post 2. Click "Confirm" in dialog | Post rescheduled to new date. Status remains "published" (or transitions per business logic). | P1 |
| CAL-008 | Published post drag — confirm cancelled | 1. Drag published post 2. Click "Cancel" in dialog | Post returns to original date. No API call fired. | P1 |
| CAL-009 | Drag cancelled via Escape key | 1. Start dragging a post 2. Press Escape | Post returns to original position with animation. No API call fired. Calendar state unchanged. | P1 |
| CAL-010 | Drag cancelled via drop outside calendar | 1. Start dragging 2. Release mouse outside the calendar grid area | Post returns to original date. No API call fired. | P1 |
| CAL-011 | Sequential reschedules | 1. Drag post A from March 10 → March 12 2. Immediately drag post B from March 11 → March 14 3. Drag post A from March 12 → March 16 | All three moves persist correctly. No stale state. Each API call reflects the correct final position. | P1 |
| CAL-012 | Rapid same-post reschedule | 1. Drag post A to March 12 2. Before API confirms, drag post A to March 14 | Final state: post A is on March 14. API calls resolve without conflict. No duplicate entries on calendar. | P2 |
| CAL-013 | Month navigation after drag | 1. Drag post to new date 2. Navigate to next month 3. Navigate back | Post remains on the updated date. No visual glitch or stale rendering. | P1 |

---

### 1.4 Drag to Past Date (Warning Scenarios)

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-P01 | Drag to yesterday | 1. Drag a scheduled (future) post to yesterday's date | Warning dialog appears: "This date is in the past. Schedule anyway?" with Cancel (focused) and "Schedule Anyway" buttons. | P0 |
| CAL-P02 | Past date warning — accepted | 1. Drag to past date 2. Click "Schedule Anyway" | Post rescheduled to the past date. Calendar reflects the change. Toast confirms: "Post rescheduled to [date]." | P1 |
| CAL-P03 | Past date warning — cancelled | 1. Drag to past date 2. Click "Cancel" | Post returns to original date. No API call. Calendar unchanged. | P1 |
| CAL-P04 | Drag to today (same day) | 1. Drag a post scheduled for a future date to today's cell | No warning if time is still in the future. If the post's time has already passed today, show past-date warning. | P1 |
| CAL-P05 | Drag to date 30+ days in the past | 1. Navigate calendar back 2 months 2. Drag a post to a date 60 days ago | Past-date warning appears with stronger language or additional confirmation: "This date is over 30 days in the past. Are you sure?" | P2 |
| CAL-P06 | Published post to past date (double warning) | 1. Drag a published post to a past date | Both warnings shown (published confirmation + past-date warning), either stacked or combined into a single dialog addressing both concerns. | P2 |
| CAL-P07 | Past-date warning — keyboard dismiss (Escape) | 1. Drag to past date (warning appears) 2. Press Escape | Warning dismissed. Post returns to original date. Same as clicking Cancel. | P2 |

---

### 1.5 Drag to Occupied Slot

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-O01 | Drop on date with 1 existing post | 1. Drag a post to a date that already has 1 post | Post added to that date. Cell now shows 2 posts. No conflict or warning. | P0 |
| CAL-O02 | Drop on date with 3+ posts (density) | 1. Drag a post to a date with 3 existing posts | Post added (no hard block). Cell shows density indicator (e.g., "+4" badge or compact list). Visual treatment per P2-D006 spec. | P1 |
| CAL-O03 | Drop on date with 5+ posts (high density) | 1. Drag to a date with 5 existing posts | Post added. Cell may show condensed view with "+N more" indicator. Optional soft warning: "This date already has 6 scheduled posts." (non-blocking). | P1 |
| CAL-O04 | Occupied slot — time conflict | 1. Drag a post scheduled at 3 PM to a date that already has a post at 3 PM | Post rescheduled to same date. Either: (a) time auto-adjusted to next available slot, or (b) both posts at 3 PM (platform allows concurrent scheduling). Behavior should be documented and consistent. | P2 |
| CAL-O05 | Drop on occupied date — visual stacking | 1. Drop post on occupied date 2. Inspect the cell rendering | All posts visible or accessible via scroll/expand. No posts hidden without an indicator. Post cards don't overflow cell boundaries. | P1 |
| CAL-O06 | Expand occupied cell | 1. Click on a date cell with 4+ posts (should have expand affordance) | All posts for that date visible in expanded view or popover. Each post draggable from expanded view. | P2 |

---

### 1.6 Notification Settings Update Verification

**Context:** When a post is rescheduled via drag, any associated notification/reminder settings must update to reflect the new date. This includes platform-specific scheduling queues and any user-facing reminders.

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-N01 | Scheduled notification updates on drag | 1. Post A is scheduled for March 10 with a reminder set for 1 hour before (9 AM notification for 10 AM post) 2. Drag post A to March 15 | Notification/reminder updates to March 15 at 9 AM. Verify via post detail panel or API response that notification time moved proportionally. | P0 |
| CAL-N02 | Platform queue reflects new date | 1. Post scheduled to publish on March 10 via Facebook API integration 2. Drag to March 15 3. Check post detail / scheduled queue | Platform scheduling queue shows March 15 as the new publish date. If platform API is involved, verify the external schedule was updated (or flagged for update). | P1 |
| CAL-N03 | Multiple notifications on same post | 1. Post has 2 reminders: 1 hour before and 15 minutes before 2. Drag to new date | Both reminders update to reflect the new date, preserving their relative offsets (1h and 15m before). | P1 |
| CAL-N04 | Notification for past-date reschedule | 1. Drag post to a past date (accept warning) | Notifications for the past date are either: (a) marked as "missed" / not sent, or (b) suppressed entirely. No stale notifications fire for past dates. | P2 |
| CAL-N05 | Undo restores original notification settings | 1. Drag post (notifications update) 2. Click "Undo" | Notifications revert to original date/time. No duplicate or orphaned notifications. | P1 |
| CAL-N06 | Post detail panel reflects new schedule | 1. Drag post to new date 2. Open post detail (click the post card) | Detail panel shows updated scheduled date/time. Notification settings in detail panel match the new date. | P1 |
| CAL-N07 | Calendar tooltip reflects new date | 1. Drag post to new date 2. Hover over the post card on its new date | Tooltip/preview shows the correct updated schedule date and time. | P2 |
| CAL-N08 | Multi-platform post notification sync | 1. Post targeting Facebook + Instagram + X 2. Drag to new date | All platform-specific schedules update. If platforms have different scheduling constraints, appropriate warnings shown. | P2 |

---

### 1.7 Touch vs Mouse Testing

**Device matrix:**

| Device | Input | Browser | Priority |
|--------|-------|---------|----------|
| Desktop (1920×1080) | Mouse | Chrome Latest | P0 |
| Desktop (1440×900) | Mouse | Firefox Latest | P1 |
| MacBook (1440×900) | Trackpad | Safari Latest | P1 |
| iPad landscape (1024×768) | Touch | Safari iOS | P1 |
| iPad portrait (768×1024) | Touch | Safari iOS | P2 |
| Android tablet (1280×800) | Touch | Chrome Android | P2 |

#### Mouse-Specific Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-M01 | Mouse drag — standard click-and-drag | 1. Mouse down on post card 2. Move mouse to target cell 3. Mouse up | Drag initiates, visual feedback shown, post rescheduled on drop. | P0 |
| CAL-M02 | Mouse drag — right-click during drag | 1. Start dragging 2. Right-click | Drag cancelled. Context menu may appear. Post returns to original position. | P2 |
| CAL-M03 | Mouse drag — cursor leaves browser window | 1. Start dragging 2. Move cursor outside browser window 3. Return cursor to calendar | Either: (a) drag cancelled and post returns to original, or (b) drag continues when cursor re-enters. Behavior must be consistent and not leave ghost elements. | P2 |
| CAL-M04 | Trackpad drag (macOS) | 1. Click-and-hold on trackpad 2. Drag with one finger 3. Release | Same as mouse drag behavior. Smooth tracking with no jitter. | P1 |
| CAL-M05 | Mouse hover feedback before drag | 1. Hover over a draggable post card (without clicking) | Cursor changes to `cursor-grab`. Subtle highlight on the post card indicating it's draggable. | P1 |

#### Touch-Specific Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-T01 | Touch drag on tablet | 1. Touch and hold a post card (~200ms delay for drag activation) 2. Drag to target cell 3. Lift finger | Drag initiates after hold delay. Visual feedback matches mouse drag. Post rescheduled on lift. | P0 |
| CAL-T02 | Distinguish touch scroll from touch drag | 1. Swipe/scroll vertically on the calendar grid (don't target a post card) | Calendar scrolls normally. No accidental drag initiated. | P0 |
| CAL-T03 | Touch target sizing | 1. Inspect post card drag handles on tablet viewport | Touch target ≥ 44×44px per P2-D001 spec and WCAG 2.5.5. | P1 |
| CAL-T04 | Touch drag — haptic feedback (iOS) | 1. Start touch drag on iPad | Subtle haptic feedback on drag start (if device supports it). Not required, but enhances UX. | P3 |
| CAL-T05 | Touch drag with scroll | 1. Calendar has posts spanning multiple scroll areas 2. Start touch drag near edge 3. Hold near edge to trigger auto-scroll | Calendar auto-scrolls when drag nears top/bottom edge. Post follows finger during scroll. | P2 |
| CAL-T06 | Multi-touch during drag | 1. Start dragging with one finger 2. Touch calendar with a second finger | Second touch ignored. Drag continues with original finger. No crash or weird state. | P3 |
| CAL-T07 | Long press vs drag disambiguation | 1. Long-press on a post card without moving | Context action (if any) appears — e.g., quick-edit menu. Drag does NOT initiate without movement after hold. | P2 |
| CAL-T08 | Touch drag — visual feedback | 1. Touch-drag a post card | Post "lifts" visually (shadow/scale). Source cell shows placeholder/dimmed state. Target cell highlights as finger moves over it. | P1 |

#### Cross-Input Parity Check

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-X01 | Identical outcome: mouse vs touch | 1. Reschedule the same post via mouse on desktop 2. Reset 3. Reschedule the same post via touch on tablet | Final state is identical: same API calls, same visual result, same toast messages. | P1 |
| CAL-X02 | Warning dialogs work on touch | 1. Touch-drag a post to a past date on tablet | Warning dialog appears and is fully interactive via touch (buttons tappable, dialog dismissible). | P1 |

---

### 1.8 Undo Functionality

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-U01 | Undo via snackbar/toast button | 1. Drag post from March 10 to March 15 2. Toast appears: "Post rescheduled to March 15. [Undo]" 3. Click "Undo" within timeout | Post returns to March 10. Calendar updates immediately. Toast confirms: "Reschedule undone." API reverts to original date. | P0 |
| CAL-U02 | Undo timeout expiry | 1. Drag post to new date 2. Wait for undo toast to expire (expected: 8–10 seconds) | "Undo" option disappears. Reschedule is permanent. No way to revert via toast. | P1 |
| CAL-U03 | Undo toast — timer visible | 1. Drag post to new date 2. Observe undo toast | Toast shows a countdown or progress bar indicating remaining undo time. | P2 |
| CAL-U04 | Undo after navigating away and back | 1. Drag post to new date 2. Switch to another tab (e.g., Posts tab) 3. Switch back to Calendar tab within undo window | If undo toast is still visible (persistent across tab switch), undo still works. If toast dismissed on tab switch, reschedule is committed. | P2 |
| CAL-U05 | Multiple undos — most recent only | 1. Drag post A to March 12 2. Before undo expires, drag post B to March 14 3. Click "Undo" on post B's toast | Post B returns to original date. Post A remains at March 12 (Post A's undo window may have been replaced by post B's toast). | P1 |
| CAL-U06 | Undo stack (if implemented) | 1. Drag post A to March 12 2. Drag post B to March 14 3. Undo post B 4. Undo post A (if stacked) | Both posts return to their original dates. If no stack: only the most recent undo is available — previous reschedules are committed. Either behavior is acceptable if consistent. | P3 |
| CAL-U07 | Undo restores exact state | 1. Post on March 10 at 3:00 PM with reminders 2. Drag to March 15 3. Undo | Post returns to March 10 at 3:00 PM. All notification settings, platform schedules, and metadata restored to pre-drag state. | P0 |
| CAL-U08 | Undo during API failure | 1. Simulate: drag fires API → API returns 500 → optimistic update rolled back 2. Undo toast appears (or may not if auto-rolled-back) | If auto-rollback occurs, no undo needed (post already back). If undo toast appears, clicking it also restores original state. No double-rollback. | P2 |
| CAL-U09 | Undo keyboard shortcut (Ctrl/Cmd+Z) | 1. Drag post to new date 2. Press Ctrl+Z (Win) or Cmd+Z (Mac) within undo window | Same result as clicking Undo button on toast. Post returns to original date. | P3 |
| CAL-U10 | Undo toast accessibility | 1. Enable screen reader 2. Drag post to new date | Screen reader announces: "Post rescheduled to [date]. Press Undo to revert." Toast has `role="alert"` or `aria-live="assertive"`. Undo button is keyboard focusable. | P2 |

---

### 1.9 Visual Feedback & Animation

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-V01 | Drag start — post "lifts" | 1. Start dragging a post card | Post card elevates (increased `box-shadow`), scales slightly (~1.02–1.05), and opacity reduces on the source cell placeholder. Per P2-D006 design spec. | P1 |
| CAL-V02 | Drag over — target cell highlight | 1. Drag post over various calendar cells | Target cell highlights with border or background change (e.g., `border-2 border-dashed border-primary`). Only the cell under the cursor highlights. | P1 |
| CAL-V03 | Drop — settle animation | 1. Drop post on target cell | Post card animates into position (spring/ease-out, ~200ms). No teleporting or flickering. | P1 |
| CAL-V04 | Source cell cleanup | 1. After successful drop, inspect source cell | Source cell no longer shows the moved post. If the cell is now empty, it shows its empty state cleanly. | P1 |
| CAL-V05 | Drag over invalid area | 1. Drag post over non-droppable areas (header, navigation, outside grid) | No drop zone highlight. Cursor shows "not-allowed" or reverts to default. | P2 |

---

### 1.10 Edge Cases & Error Handling

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-E01 | Timezone consistency — EST | 1. Browser timezone: EST 2. Post at 3 PM EST on March 10 3. Drag to March 15 | Post shows March 15 at 3 PM EST. Internally stored as UTC, displayed in user timezone. | P1 |
| CAL-E02 | Timezone consistency — PST user | 1. Set browser timezone to PST 2. Post at 3 PM (displays as PST) 3. Drag to new date | Time preserved in user's timezone. No 3-hour shift from timezone mishandling. | P1 |
| CAL-E03 | DST boundary drag | 1. Schedule post for March 8 (before spring-forward DST in 2026) 2. Drag to March 9 (after spring-forward) | Post time adjusts correctly for DST. No off-by-one-hour error. 3 PM stays 3 PM in local display. | P2 |
| CAL-E04 | Network failure — optimistic rollback | 1. Start offline simulation or API mock returning 500 2. Drag post to new date | Calendar updates optimistically → API fails → post returns to original position. Error toast: "Failed to reschedule. Post restored to original date." | P1 |
| CAL-E05 | Network timeout | 1. Simulate slow API (>10s response) 2. Drag post | Loading indicator appears on the post card. If timeout reached, rollback with error message. | P2 |
| CAL-E06 | Concurrent edit — post deleted by another user | 1. User A starts dragging a post 2. Simulate: User B deletes that post via API 3. User A drops | Graceful error: "This post no longer exists." Calendar refreshes to correct state. No crash. | P3 |
| CAL-E07 | Drag draft post (no schedule) | 1. If draft posts appear on calendar (in an "unscheduled" area) 2. Drag to a date cell | Draft transitions to "scheduled" status with the target date. A time must be assigned (default to a sensible time or prompt user). | P2 |
| CAL-E08 | Month boundary — drag across months | 1. Post on March 31 2. Drag toward April (if month navigation during drag is supported) | Either: (a) month auto-navigates and drop on April date works, or (b) clear visual indication that cross-month drag requires navigating first. No silent failure. | P2 |

---

### 1.11 Keyboard Accessibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-A01 | Keyboard reschedule flow | 1. Tab to a post on the calendar 2. Press Enter/Space to "pick up" 3. Use Arrow keys to move between cells 4. Press Enter/Space to "drop" | Post rescheduled to the target cell. Same API call and visual update as mouse drag. | P1 |
| CAL-A02 | Keyboard cancel (Escape) | 1. Pick up post via keyboard 2. Press Escape | Post returns to original position. "Cancelled" announcement for screen readers. | P1 |
| CAL-A03 | Screen reader announcements | 1. Enable VoiceOver/NVDA 2. Perform keyboard reschedule | Announcements: "Picked up [post title]", "Over [date]", "Dropped on [date]. Post rescheduled." | P2 |
| CAL-A04 | Focus ring visibility | 1. Tab through calendar post cards | Visible focus ring on each interactive element. Meets WCAG 2.4.7 (Focus Visible). | P1 |

---

### 1.12 Performance Benchmarks

| ID | Metric | Target | Measurement | Priority |
|----|--------|--------|-------------|----------|
| CAL-PERF-01 | Drag frame rate | ≥ 60fps (< 16ms/frame) | Chrome DevTools Performance recording during drag across 10 cells | P1 |
| CAL-PERF-02 | Drop-to-visual-update | < 50ms | Timestamp between `mouseup`/`touchend` and visual position update | P1 |
| CAL-PERF-03 | API response handling | < 500ms API round-trip (optimistic UI means no user-visible delay) | Network waterfall in DevTools | P2 |
| CAL-PERF-04 | Undo restoration | < 100ms visual rollback | Measure time from Undo click to calendar state reverting | P2 |
| CAL-PERF-05 | Calendar CLS on drag | 0 | Lighthouse CLS measurement during drag operations | P2 |
| CAL-PERF-06 | Touch drag responsiveness | No perceptible lag between finger movement and card position | Manual observation on iPad, 3 evaluators | P1 |

---

## P2-Q006: Analytics Date Range Filtering Test Specification

### 2.1 Scope & Objectives

**Component under test:** `AnalyticsTab` — date range filtering  
**Build task:** P2-B005 (6h estimated)  
**Dependency:** B012 (Analytics tab refactored from Phase 1)  
**Estimated QA time:** 4h

**Objectives:**
1. Verify preset date ranges produce correct data filtering
2. Validate custom date range selection with calendar picker
3. Test invalid range handling (start > end, future-only ranges)
4. Confirm clear/reset returns to default (all-time) view
5. Validate CSV export respects active date filter
6. Test URL param persistence for shareable filtered views
7. Verify loading states and empty states during filter transitions

---

### 2.2 Preconditions & Test Data

**Required seed data:**

| Data | Details |
|------|---------|
| Analytics history | 90+ days of engagement data across all connected platforms |
| Daily metrics | Likes, shares, comments, reach, impressions per post per day |
| Platform variety | Data for Facebook, Instagram, X, LinkedIn (varying engagement levels) |
| Known date gaps | At least 1 week with no published posts (for empty-state testing) |
| Recent data | Posts with engagement in the last 7 and 30 days |
| Old data | Posts with engagement > 60 days ago |

**Environment:**
- User logged in as portal user
- AnalyticsTab accessible with loaded engagement data
- At least 4 platform accounts connected
- Known expected metric totals for key date ranges (for assertion validation)

---

### 2.3 Valid Date Range Tests

#### Preset Ranges

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-001 | Preset: Last 7 days | 1. Open AnalyticsTab 2. Click "Last 7 days" preset button | Data refetches. Metrics show only the last 7 calendar days. Date label updates to show range (e.g., "Feb 26 – Mar 5"). Charts re-render with 7-day data. | P0 |
| ADF-002 | Preset: Last 30 days | 1. Click "Last 30 days" preset | Metrics show last 30 days. Date range label reflects "Feb 3 – Mar 5" (or equivalent). | P0 |
| ADF-003 | Preset: This Month | 1. Click "This Month" | Range is March 1 – today (March 5). Only data from current month included. | P1 |
| ADF-004 | Preset: Last Month | 1. Click "Last Month" | Range is Feb 1 – Feb 28, 2026. Full previous month data shown. | P1 |
| ADF-005 | Preset: Last 90 days | 1. Click "Last 90 days" (if available) | Full 90-day range applied. All historical data within range shown. | P2 |
| ADF-006 | Preset active state | 1. Click "Last 7 days" | Preset button shows active/selected state (e.g., filled background, border highlight). Other presets deselected. | P1 |

#### Custom Date Range

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-007 | Custom range — valid selection | 1. Click "Custom" 2. Select start date: Feb 10 3. Select end date: Feb 20 | Data filtered to Feb 10–20 inclusive. Metrics, charts, and post list all reflect this range. | P0 |
| ADF-008 | Custom range — same start and end | 1. Select start: March 3 2. Select end: March 3 | Single-day data shown. Valid selection (inclusive of that day). | P1 |
| ADF-009 | Custom range — full year | 1. Select start: March 5, 2025 2. Select end: March 5, 2026 | Data loads for full year. May be slow (acceptable); no timeout or crash. Loading indicator shown during fetch. | P2 |
| ADF-010 | Date picker UX — calendar widget | 1. Click "Custom" 2. Interact with date picker | Calendar picker renders correctly. Month navigation works. Can select start then end. Clear visual distinction between start date, end date, and range between. | P1 |
| ADF-011 | Date picker — keyboard input | 1. Click "Custom" 2. Type date in mm/dd/yyyy format | Date accepted from keyboard. Invalid formats show inline validation error. | P2 |

---

### 2.4 Invalid Date Range Tests (Start > End)

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-INV-01 | Start date after end date — UI prevention | 1. Click "Custom" 2. Select start: March 10 3. Attempt to select end: March 5 | Either: (a) end dates before start are disabled/unselectable in the picker, or (b) selecting March 5 as end auto-swaps start/end. | P0 |
| ADF-INV-02 | Start date after end date — typed input | 1. Click "Custom" 2. Type start: "03/15/2026" 3. Type end: "03/10/2026" 4. Click "Apply" | Inline validation error: "End date must be after start date." Filter not applied. Previous filter remains active. | P0 |
| ADF-INV-03 | Invalid date format — typed input | 1. Type "13/45/2026" in start date field | Validation error: "Invalid date format. Use MM/DD/YYYY." | P1 |
| ADF-INV-04 | Empty start or end date | 1. Click "Custom" 2. Select only start date (leave end blank) 3. Click "Apply" | Validation error: "Both start and end dates are required." Or: end defaults to today. | P1 |
| ADF-INV-05 | Non-existent date | 1. Type "02/30/2026" | Validation error: "Invalid date." February 30 doesn't exist. | P2 |
| ADF-INV-06 | Error state clears on valid input | 1. Trigger validation error (start > end) 2. Correct the dates to a valid range 3. Click "Apply" | Error message disappears. Filter applies successfully. | P1 |

---

### 2.5 Clear Filter Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-CLR-01 | Clear preset filter | 1. Apply "Last 7 days" filter 2. Click "Clear" or "All Time" | Filter removed. All data shown (default view). Preset buttons deselected. URL params cleared. | P0 |
| ADF-CLR-02 | Clear custom filter | 1. Apply custom range (Feb 10–20) 2. Click "Clear" or "All Time" | Filter removed. Custom date fields cleared. All data shown. | P0 |
| ADF-CLR-03 | Clear restores default metrics | 1. Note all-time metric totals 2. Apply "Last 7 days" (metrics change) 3. Clear filter | Metrics match original all-time totals exactly. Charts restore to default view. | P1 |
| ADF-CLR-04 | Clear filter — URL params | 1. Apply filter (URL shows `?from=...&to=...`) 2. Clear filter 3. Check URL | URL params `from` and `to` removed. Clean URL. | P1 |
| ADF-CLR-05 | "All Time" preset acts as clear | 1. Apply "Last 30 days" 2. Click "All Time" | Same as Clear: all data shown, no filter active. | P1 |
| ADF-CLR-06 | Clear during loading | 1. Apply a filter (data starts loading) 2. Immediately click "Clear" | Loading for filtered data cancelled. All-time data loads instead. No partial/mixed state. | P2 |

---

### 2.6 Export with Filter Applied

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-EXP-01 | CSV export with preset filter | 1. Apply "Last 30 days" 2. Click "Export CSV" | Downloaded CSV contains **only** data from the last 30 days. Filename includes date range (e.g., `analytics-2026-02-03-to-2026-03-05.csv`). | P0 |
| ADF-EXP-02 | CSV export with custom filter | 1. Apply custom range Feb 10–20 2. Click "Export CSV" | CSV contains only Feb 10–20 data. Row count matches on-screen post/metric count. | P0 |
| ADF-EXP-03 | CSV export with no filter (all time) | 1. Clear any filter (all data shown) 2. Click "Export CSV" | CSV contains all available data. Filename: `analytics-all-time.csv` or similar. | P1 |
| ADF-EXP-04 | CSV column headers | 1. Export any CSV 2. Open and inspect | Headers include: Date, Post Title, Platform, Likes, Shares, Comments, Reach, Impressions (at minimum). | P1 |
| ADF-EXP-05 | CSV date range annotation | 1. Export filtered CSV 2. Inspect first row or metadata | CSV includes a header row or metadata indicating the applied filter range: "Date Range: Feb 10, 2026 – Feb 20, 2026" | P2 |
| ADF-EXP-06 | Export empty result set | 1. Apply filter for a date range with no data 2. Click "Export CSV" | Either: (a) CSV exported with headers only (no data rows), or (b) export button disabled with tooltip: "No data to export." | P2 |
| ADF-EXP-07 | Export button state during loading | 1. Apply new filter (data loading) 2. Observe Export button | Export button disabled during data fetch. Enabled once data loads. Tooltip: "Loading data…" while disabled. | P2 |
| ADF-EXP-08 | Large export (90+ days) | 1. Apply 90-day filter 2. Click "Export CSV" | Export completes without timeout. If >5s, show download progress indicator. File size reasonable (<10MB for 90 days). | P3 |

---

### 2.7 URL Persistence & Deep Links

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-URL-01 | Preset filter persists in URL | 1. Apply "Last 30 days" 2. Copy URL | URL contains query params (e.g., `?range=30d` or `?from=2026-02-03&to=2026-03-05`). | P1 |
| ADF-URL-02 | Custom filter persists in URL | 1. Apply custom range Feb 10–20 2. Copy URL | URL contains `?from=2026-02-10&to=2026-02-20`. | P1 |
| ADF-URL-03 | Open URL with filter params in new tab | 1. Copy filtered URL 2. Open in new tab/incognito (logged in) | AnalyticsTab loads with the same filter applied. Metrics match the filtered view. Preset or custom range reflected in the UI. | P0 |
| ADF-URL-04 | Bookmark filtered view | 1. Apply filter 2. Bookmark the URL 3. Close and reopen from bookmark | Filter restored from URL params. Same data shown. | P1 |
| ADF-URL-05 | Invalid URL params | 1. Manually type `?from=invalid&to=2026-03-05` | Invalid params ignored gracefully. Default (all-time) view shown. Optional: subtle notice "Invalid date range in URL." | P2 |
| ADF-URL-06 | URL params with start > end | 1. Manually type `?from=2026-03-10&to=2026-03-05` | Handled gracefully: either auto-swap, show all-time, or show validation error. No crash or empty screen. | P2 |

---

### 2.8 Edge Cases & Boundary Conditions

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-E01 | Future-only date range | 1. Select custom range: March 10–March 20 (entirely in the future) | Empty state: "No analytics data for this period." No error. Clear indication that data will appear as posts publish. | P2 |
| ADF-E02 | Very old date range (>1 year ago) | 1. Select custom range: Jan 1, 2025 – March 1, 2025 | Either: data loads (if available), or empty state if no data that old. No error or crash. | P3 |
| ADF-E03 | DST transition boundary | 1. Select range spanning March 8–9, 2026 (spring-forward DST) | All dates in range included correctly. No off-by-one day due to DST clock change. | P3 |
| ADF-E04 | Leap year date | 1. Select range including Feb 29 of a leap year (e.g., 2028) | Date picker allows Feb 29 selection. Data for that day included if available. | P3 |
| ADF-E05 | Rapid filter switching | 1. Click "Last 7 days" 2. Immediately click "Last 30 days" 3. Immediately click "This Month" | Only the last-selected filter applies. No stale data from earlier requests. Previous in-flight API calls cancelled or ignored. | P1 |
| ADF-E06 | Filter with zero posts in range | 1. Select a range known to have zero posts | Empty state with message. Charts show zero/flat lines. Metrics show 0 for all values. | P1 |

---

### 2.9 Loading & Empty States

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-LS-01 | Loading skeleton during filter change | 1. Apply a new date filter 2. Observe UI before data loads | Skeleton/shimmer placeholders appear on metric cards and charts (per US-014 skeletons, if implemented). | P1 |
| ADF-LS-02 | Loading indicator — subtle for fast loads | 1. Apply filter with fast API response (<200ms) | Skeleton may flash briefly or be skipped. No jarring flicker. Minimum skeleton display: ~150ms to avoid flash. | P2 |
| ADF-LS-03 | Empty state — friendly message | 1. Apply filter with no data in range | Message: "No analytics data for [date range]." Suggestion: "Try expanding your date range." | P1 |
| ADF-LS-04 | Empty state — charts | 1. Apply filter with no data | Charts show empty/zero state (flat line at 0, or "No data" overlay). Not broken or missing. | P1 |
| ADF-LS-05 | Transition: loading → data | 1. Observe skeleton → real data transition | Smooth transition. No layout shift (CLS = 0). Skeleton dimensions match content dimensions. | P1 |

---

### 2.10 Accessibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-ACC-01 | Date picker keyboard navigation | 1. Tab to date picker 2. Open via Enter/Space 3. Navigate dates with arrow keys 4. Select with Enter | Full keyboard navigation. No mouse required. Focus trapped within picker when open. | P1 |
| ADF-ACC-02 | Preset buttons keyboard accessible | 1. Tab through preset filter buttons | All presets focusable and activatable via keyboard. Active state announced. | P1 |
| ADF-ACC-03 | Screen reader — filter applied | 1. Enable VoiceOver/NVDA 2. Apply a filter | Announcement: "Analytics filtered to [date range]. Showing [N] posts." (`aria-live="polite"` region updates). | P2 |
| ADF-ACC-04 | Screen reader — clear filter | 1. Clear filter with screen reader active | Announcement: "Filter cleared. Showing all analytics data." | P2 |
| ADF-ACC-05 | Color contrast on active filter | 1. Check active preset button contrast | Text/background contrast ≥ 4.5:1 (WCAG AA). Active state distinguishable without color alone. | P1 |
| ADF-ACC-06 | Error message association | 1. Trigger validation error (start > end) | Error message associated with input via `aria-describedby` or `aria-errormessage`. Screen reader announces error. | P2 |

---

### 2.11 Performance Benchmarks

| ID | Metric | Target | Measurement | Priority |
|----|--------|--------|-------------|----------|
| ADF-PERF-01 | Filter-to-data-displayed | < 1s for 30-day range | Measure from filter click to data rendered (excluding network) | P1 |
| ADF-PERF-02 | API response — 30-day range | < 500ms | Network waterfall in DevTools | P1 |
| ADF-PERF-03 | API response — 90-day range | < 2s | Network waterfall | P2 |
| ADF-PERF-04 | Chart re-render | < 200ms after data arrives | Performance profiler | P2 |
| ADF-PERF-05 | CSV export — 30-day | < 2s (client-side generation + download initiation) | Manual timing | P2 |
| ADF-PERF-06 | Skeleton-to-content CLS | 0 | Lighthouse | P1 |
| ADF-PERF-07 | Rapid filter switching — no stale data | 0 stale renders | Apply 5 filters in rapid succession; verify final render matches final filter | P1 |

---

## 3. Cross-Feature Integration Tests

These tests verify that calendar reschedule and analytics filtering work correctly with other Phase 2 features and Phase 1 foundations.

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| M2-INT-01 | Calendar drag → Analytics reflects | 1. Note analytics for March 10 (1 post) 2. Drag that post to March 15 3. Check analytics for March 10 and March 15 | March 10 engagement decrements. March 15 engagement increments (if already published, data moves with post). | P1 |
| M2-INT-02 | Bulk reschedule → Calendar | 1. Bulk select 3 posts in PostsTab 2. Reschedule to March 20 3. Check Calendar tab | All 3 posts appear on March 20 in the calendar. Source dates cleared. | P1 |
| M2-INT-03 | Calendar drag → Posts tab status | 1. Drag a post to new date on calendar 2. Switch to Posts tab | Post's scheduled date reflects the new date. Status unchanged (still "scheduled"). | P1 |
| M2-INT-04 | Analytics filter → Export consistency | 1. Apply "Last 7 days" filter 2. Note on-screen metrics 3. Export CSV 4. Sum CSV values | CSV totals match on-screen metrics exactly. No discrepancy between displayed and exported data. | P0 |
| M2-INT-05 | Post duplication → Calendar | 1. Duplicate a scheduled post 2. Open Calendar | Duplicate appears as draft (unscheduled) — does not appear on calendar unless scheduled. Original remains. | P1 |
| M2-INT-06 | Bulk delete → Calendar | 1. Bulk delete 2 scheduled posts from PostsTab 2. Switch to Calendar | Deleted posts no longer appear on calendar. Dates that had them are updated. | P1 |
| M2-INT-07 | Calendar drag during analytics filter | 1. Apply a date filter on analytics 2. Switch to Calendar 3. Drag a post | Calendar drag works independently of analytics filter. No shared state conflict. | P2 |
| M2-INT-08 | Skeleton during calendar load | 1. Navigate to Calendar tab (with throttled network) | Calendar skeleton shows while data loads, then transitions to interactive calendar with draggable posts. | P2 |

---

## 4. Test Execution Checklist

Use this checklist during M2 QA execution. Mark each section as PASS/FAIL with notes.

### P2-Q005: Calendar Drag-to-Reschedule

| Section | Test IDs | Pass/Fail | Tester | Date | Notes |
|---------|----------|-----------|--------|------|-------|
| Core drag functionality | CAL-001 → CAL-013 | | | | |
| Past date warnings | CAL-P01 → CAL-P07 | | | | |
| Occupied slot behavior | CAL-O01 → CAL-O06 | | | | |
| Notification updates | CAL-N01 → CAL-N08 | | | | |
| Mouse-specific | CAL-M01 → CAL-M05 | | | | |
| Touch-specific | CAL-T01 → CAL-T08 | | | | |
| Cross-input parity | CAL-X01 → CAL-X02 | | | | |
| Undo functionality | CAL-U01 → CAL-U10 | | | | |
| Visual feedback | CAL-V01 → CAL-V05 | | | | |
| Edge cases & errors | CAL-E01 → CAL-E08 | | | | |
| Keyboard accessibility | CAL-A01 → CAL-A04 | | | | |
| Performance | CAL-PERF-01 → CAL-PERF-06 | | | | |

**P2-Q005 Total Test Cases: 82**

### P2-Q006: Analytics Date Range Filtering

| Section | Test IDs | Pass/Fail | Tester | Date | Notes |
|---------|----------|-----------|--------|------|-------|
| Preset ranges | ADF-001 → ADF-006 | | | | |
| Custom ranges | ADF-007 → ADF-011 | | | | |
| Invalid ranges | ADF-INV-01 → ADF-INV-06 | | | | |
| Clear filter | ADF-CLR-01 → ADF-CLR-06 | | | | |
| Export with filter | ADF-EXP-01 → ADF-EXP-08 | | | | |
| URL persistence | ADF-URL-01 → ADF-URL-06 | | | | |
| Edge cases | ADF-E01 → ADF-E06 | | | | |
| Loading & empty states | ADF-LS-01 → ADF-LS-05 | | | | |
| Accessibility | ADF-ACC-01 → ADF-ACC-06 | | | | |
| Performance | ADF-PERF-01 → ADF-PERF-07 | | | | |

**P2-Q006 Total Test Cases: 64**

### Cross-Feature Integration

| Section | Test IDs | Pass/Fail | Tester | Date | Notes |
|---------|----------|-----------|--------|------|-------|
| M2 integration tests | M2-INT-01 → M2-INT-08 | | | | |

**Integration Test Cases: 8**

---

### M2 QA Exit Criteria

All of the following must be met before M2 is marked complete:

- [ ] All P0 tests pass (zero failures)
- [ ] All P1 tests pass (zero failures)
- [ ] P2 tests: ≤ 3 open issues, none blocking
- [ ] P3 tests: documented, triaged — may defer to post-release
- [ ] Performance benchmarks met (CAL-PERF-*, ADF-PERF-*)
- [ ] Cross-feature integration tests pass (M2-INT-*)
- [ ] No regressions in Phase 1 features (spot-check REG-001, REG-002, REG-003)
- [ ] Calendar drag functional on Chrome (desktop) + Safari (iPad) at minimum
- [ ] Analytics filter functional with CSV export verified

**Total Test Cases in M2: 154**

---

*End of Phase 2 — Milestone 2 Test Specifications (P2-Q005 + P2-Q006)*
