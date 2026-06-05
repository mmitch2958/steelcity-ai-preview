# Phase 2 Test Plan: Core UX Wins
**Project:** SMP-2026-Q1 — Social Media Management Platform  
**QA Task:** P2-Q001  
**Phase:** 2 ("Make It Smooth")  
**Author:** QA Department  
**Created:** 2026-03-05  
**Status:** ✅ Complete

---

## Table of Contents
1. [Scope & Objectives](#1-scope--objectives)
2. [Test Environments](#2-test-environments)
3. [Test Data Requirements](#3-test-data-requirements)
4. [M1 Test Cases — US-007: Drag-and-Drop Media Reordering](#4-m1--us-007-drag-and-drop-media-reordering)
5. [M1 Test Cases — US-008: Post Duplication](#5-m1--us-008-post-duplication)
6. [M1 Test Cases — US-009: Bulk Actions](#6-m1--us-009-bulk-actions)
7. [M2 Test Cases — US-010: Drag-to-Reschedule Calendar](#7-m2--us-010-drag-to-reschedule-calendar)
8. [M2 Test Cases — US-011: Analytics Date Range Filtering](#8-m2--us-011-analytics-date-range-filtering)
9. [M3 Test Cases — US-012: Real-Time Post Preview](#9-m3--us-012-real-time-post-preview)
10. [M3 Test Cases — US-013: Post Templates & Drafts](#10-m3--us-013-post-templates--drafts)
11. [M3 Test Cases — US-014: Loading Skeletons](#11-m3--us-014-loading-skeletons)
12. [Regression Test Suite](#12-regression-test-suite)
13. [Accessibility Testing Checklist](#13-accessibility-testing-checklist)
14. [Performance Benchmarks](#14-performance-benchmarks)
15. [Risk-Based Testing Notes](#15-risk-based-testing-notes)

---

## 1. Scope & Objectives

### In Scope
- All 8 user stories (US-007 through US-014)
- Functional, integration, accessibility, and performance testing
- Cross-browser and responsive (tablet minimum) validation
- Phase 1 regression (no breakage of refactored components)

### Out of Scope
- Phase 3 features (approval workflow, A/B testing, etc.)
- Backend load/stress testing (separate effort)
- Native mobile app testing (web responsive only)

### Objectives
1. Verify each user story meets its acceptance criteria
2. Validate cross-feature interactions (e.g., DnD + duplication + bulk actions)
3. Confirm Phase 1 stability is maintained
4. Ensure WCAG 2.1 AA compliance for all new interactive elements
5. Validate performance targets (DnD 60fps, preview <100ms, skeleton no layout shift)

### Test Priority Legend
| Priority | Meaning | When to Run |
|----------|---------|-------------|
| **P0** | Blocker — feature doesn't work at all | Every build |
| **P1** | Critical — main flow broken | Every build |
| **P2** | Major — secondary flow broken | Pre-release |
| **P3** | Minor — cosmetic / edge case | Pre-release |

---

## 2. Test Environments

### Primary Environments

| Environment | URL | Purpose | Database |
|-------------|-----|---------|----------|
| **Local Dev** | `localhost:5000` | Developer testing during implementation | Local Neon (dev branch) |
| **Staging** | `staging.steelcity-ai.com` | QA validation, integration testing | Neon staging branch |
| **Production** | `steelcity-ai.com` | Smoke tests post-deploy only | Neon main branch |

### Browser Matrix

| Browser | Versions | Priority | Notes |
|---------|----------|----------|-------|
| Chrome | Latest, Latest-1 | P0 | Primary target; test DnD extensively |
| Firefox | Latest | P1 | Verify @dnd-kit compatibility |
| Safari | Latest (macOS + iOS) | P1 | Touch events, CSS differences |
| Edge | Latest | P2 | Chromium-based, lower risk |

### Device / Viewport Testing

| Device | Viewport | Priority | Notes |
|--------|----------|----------|-------|
| Desktop | 1920×1080 | P0 | Primary user scenario |
| Laptop | 1440×900 | P0 | Common realtor laptop |
| Tablet (landscape) | 1024×768 | P1 | iPad — minimum responsive target |
| Tablet (portrait) | 768×1024 | P2 | Secondary layout |
| Mobile | 375×812 | P3 | Not primary target, but shouldn't break |

### Tools & Frameworks

| Tool | Purpose |
|------|---------|
| Vitest | Unit tests for hooks, utilities |
| React Testing Library | Component integration tests |
| Playwright | E2E tests for DnD, bulk actions, calendar |
| axe-core / Lighthouse | Accessibility auditing |
| Chrome DevTools Performance | Frame rate, layout shift measurement |

---

## 3. Test Data Requirements

### Seed Data Script
A seed data script (`scripts/seed-phase2-test-data.ts`) must be created to populate test environments with consistent data.

### Required Test Data

#### Posts (minimum 25)
| Category | Count | Details |
|----------|-------|---------|
| Draft posts | 5 | Various platforms, with and without media |
| Scheduled posts | 8 | Spread across next 14 days, different times |
| Published posts | 8 | With engagement data (likes, shares, comments, reach) |
| Failed posts | 2 | With error messages |
| Multi-platform posts | 2 | Targeting 3+ platforms |

#### Media Files
| Type | Count | Details |
|------|-------|---------|
| Images (JPEG/PNG) | 12 | Mix of sizes (thumbnail, 1080p, 4K), portrait/landscape |
| Videos | 2 | Short (<30s) video files |
| Large batch | 10+ on single post | For testing DnD with many items |

#### Campaigns
| Status | Count |
|--------|-------|
| Active | 2 (with 3-5 linked posts each) |
| Draft | 1 |
| Completed | 1 (with engagement data) |

#### Accounts
| Platform | Count |
|----------|-------|
| Facebook | 1 connected |
| Instagram | 1 connected |
| X (Twitter) | 1 connected |
| LinkedIn | 1 connected |
| YouTube | 1 connected |

#### Brand Voice Profiles
| Count | Details |
|-------|---------|
| 2 | Different tones (professional realtor, casual/friendly) |

#### Analytics Data
| Requirement | Details |
|-------------|---------|
| Date range | At least 90 days of historical engagement data |
| Metrics per post | likes, shares, comments, reach, impressions |
| Platform variation | Different engagement levels per platform |

#### Users
| Role | Count | Purpose |
|------|-------|---------|
| Portal user (realtor) | 2 | Primary testers, test data isolation |
| Admin user | 1 | Verify admin-side features if applicable |

### Test Data State Requirements
- **Clean state procedure:** Reset to seed data before each test suite run
- **Isolation:** Each test case should not depend on side effects of other tests
- **Mock API fallback:** Mock server responses available for offline/isolated testing (per risk register: "QA environment data scarcity")

---

## 4. M1 — US-007: Drag-and-Drop Media Reordering

**Component:** `CreatePostTab` (portal + admin)  
**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`  
**QA Task:** P2-Q002  
**Estimated Test Time:** 6h

### Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DND-001 | Basic reorder (2 items) | 1. Upload 2 images 2. Drag image 2 above image 1 3. Release | Order updates to [2, 1]. Visual positions match logical order. | P0 |
| DND-002 | Reorder persists after tab switch | 1. Upload 3 images, reorder to [3, 1, 2] 2. Switch to Posts tab 3. Switch back to CreatePost tab | Media order remains [3, 1, 2] | P0 |
| DND-003 | Reorder with 10+ items | 1. Upload 12 images 2. Drag item 12 to position 1 3. Drag item 6 to position 12 | All items reorder correctly; no items lost or duplicated | P1 |
| DND-004 | Drag visual feedback | 1. Start dragging an image | Cursor changes, ghost/shadow of dragged item visible, valid drop zones highlighted | P1 |
| DND-005 | Drop zone indicators | 1. Drag an image over other images | Clear visual gap/highlight showing where item will be placed | P1 |
| DND-006 | Cancel drag (Escape key) | 1. Start dragging 2. Press Escape | Item returns to original position; no order change | P1 |
| DND-007 | Cancel drag (drop outside zone) | 1. Start dragging 2. Release outside the media area | Item returns to original position | P1 |
| DND-008 | Order saved to draft | 1. Upload and reorder images 2. Save as draft 3. Reload and open draft | Media order matches what was saved | P0 |
| DND-009 | Reorder during post edit | 1. Open existing post with 4 images 2. Reorder images 3. Save | Updated order persists on reload | P1 |
| DND-010 | Mix of image and video media | 1. Upload 2 images + 1 video 2. Reorder video to first position | Video renders correctly in first position; thumbnails display properly | P2 |
| DND-011 | Reorder + remove combination | 1. Upload 5 images 2. Reorder to [5,4,3,2,1] 3. Remove item in position 3 (originally image 3) | Remaining items: [5,4,2,1], positions correct | P1 |
| DND-012 | Reorder + add new media | 1. Upload 3 images, reorder 2. Upload 1 more image | New image appended to end; existing order preserved | P1 |
| DND-013 | Grip handle interaction | 1. Attempt to drag image by clicking on image area (not handle) 2. Drag by grip handle | Only grip handle initiates drag; clicking image itself does not start drag | P2 |
| DND-014 | Smooth animation during reorder | 1. Drag item past multiple positions | Items animate smoothly to new positions (no jumping/flickering) | P2 |

### Touch / Tablet Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DND-T01 | Touch drag on tablet | 1. Touch and hold image 2. Drag to new position 3. Release | Same as mouse DnD; reorder works | P1 |
| DND-T02 | Touch target size | Inspect grip handles on tablet | Touch target ≥ 44×44px (per L002 spec) | P1 |
| DND-T03 | Scroll during drag (touch) | 1. Have 10+ items (requires scroll) 2. Start drag near bottom 3. Drag toward top | Container scrolls to reveal upper positions | P2 |

### Keyboard Accessibility Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DND-A01 | Arrow key navigation | 1. Focus media item 2. Press Space to "pick up" 3. Arrow keys to move 4. Space to drop | Item repositions per arrow key direction | P1 |
| DND-A02 | Screen reader announcements | 1. Enable screen reader 2. Perform DnD via keyboard | Announcements: "Picked up item X", "Moved to position Y", "Dropped at position Z" | P2 |
| DND-A03 | Focus management | 1. Complete a DnD reorder via keyboard | Focus remains on the moved item after drop | P2 |

### Performance Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DND-P01 | Frame rate during drag | 1. Open DevTools Performance 2. Drag item across 10 positions 3. Measure frame rate | ≥ 60fps (< 16ms per frame) during drag | P1 |
| DND-P02 | No layout shift on drop | 1. Measure CLS before/after reorder | Cumulative Layout Shift = 0 after drop animation completes | P2 |

---

## 5. M1 — US-008: Post Duplication

**Component:** `PostsTab` → `CreatePostTab`  
**QA Task:** P2-Q003  
**Estimated Test Time:** 3h

### Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DUP-001 | Basic duplication | 1. Go to Posts tab 2. Click "Duplicate" on a published post | New post created with "Copy of {title}" prefix; navigates to CreatePostTab in edit mode | P0 |
| DUP-002 | Content fields copied | 1. Duplicate a post with content, hashtags, media, platform selections | Duplicate has same: content, hashtags, media attachments, platform selections | P0 |
| DUP-003 | Schedule NOT copied | 1. Duplicate a scheduled post | Duplicate has no scheduled date/time; status is "draft" | P0 |
| DUP-004 | Published status NOT copied | 1. Duplicate a published post | Duplicate status is "draft", not "published" | P0 |
| DUP-005 | Analytics NOT copied | 1. Duplicate a post with engagement data | Duplicate has zero engagement metrics | P0 |
| DUP-006 | Duplicate is independent | 1. Duplicate post A 2. Edit duplicate's content 3. Check original post A | Original post A is unchanged | P0 |
| DUP-007 | Media references | 1. Duplicate a post with 3 images | Duplicate references same media files (same S3 paths); new upload IDs generated | P1 |
| DUP-008 | Campaign association prompt | 1. Duplicate a post linked to a campaign | User prompted: "Keep same campaign?" / "Clear campaign?" / "Select different campaign" | P2 |
| DUP-009 | Unsaved changes guard | 1. Start editing a new post in CreatePostTab 2. Go to Posts tab 3. Click "Duplicate" on another post | Confirmation modal: "You have unsaved changes. Discard and load duplicate?" | P1 |
| DUP-010 | Duplicate from draft post | 1. Duplicate a draft post | Works same as published post duplication | P1 |
| DUP-011 | Duplicate from failed post | 1. Duplicate a post with "failed" status | Duplicate created as draft; error metadata not copied | P2 |
| DUP-012 | Duplicate post with no media | 1. Duplicate a text-only post | Duplicate created successfully with only text content | P1 |
| DUP-013 | Multiple duplications | 1. Duplicate post A → "Copy of A" 2. Duplicate "Copy of A" | Creates "Copy of Copy of A" (or incremental "Copy of A (2)") | P2 |
| DUP-014 | Bulk duplicate | 1. Select 3 posts in Posts tab 2. Choose "Duplicate" from bulk actions | 3 new draft posts created with "Copy of" prefix; all appear in Posts list | P2 |

### Edge Cases

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DUP-E01 | Long title truncation | 1. Duplicate a post with a 250-character title | "Copy of" prefix added; total title doesn't exceed max length (truncated if needed) | P3 |
| DUP-E02 | Special characters in title | 1. Duplicate post titled `Test & "Quotes" <html>` | Title correctly escaped: `Copy of Test & "Quotes" <html>` | P3 |
| DUP-E03 | Duplicate while media is uploading | 1. Start creating a post and upload media 2. Before upload completes, switch to Posts and duplicate another | Upload on original post is not affected; duplicate gets its own media set | P3 |

---

## 6. M1 — US-009: Bulk Actions

**Component:** `PostsTab`  
**Design Spec:** L003 (Bulk Actions UI)  
**QA Task:** P2-Q004  
**Estimated Test Time:** 8h

### Selection Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-001 | Single checkbox select | 1. Click checkbox on a post | Post selected (highlighted per L003: `bg-blue-50/50`, `border-l-4 border-blue-500`); action bar appears | P0 |
| BULK-002 | Select All | 1. Click "Select All" checkbox in header | All visible posts selected; checkbox shows checked state; count displayed in action bar | P0 |
| BULK-003 | Deselect All | 1. Select All 2. Click "Deselect All" in action bar | All posts deselected; action bar hidden | P0 |
| BULK-004 | Select All → deselect one | 1. Select All 2. Uncheck one post | "Select All" checkbox shows indeterminate state; count decremented | P1 |
| BULK-005 | Shift-click range select (desktop) | 1. Select post 2 2. Shift+click post 6 | Posts 2–6 selected (5 posts) | P1 |
| BULK-006 | Tap-to-select (tablet) | 1. On tablet, tap checkbox on a post | Post selected; no long-press or special gesture needed | P1 |
| BULK-007 | Selection persists across scroll | 1. Select 3 posts 2. Scroll down 3. Scroll back up | Original 3 posts still selected | P1 |
| BULK-008 | Selection count accuracy | 1. Select 7 posts | Action bar displays "7 posts selected" | P0 |

### Bulk Delete Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-D01 | Bulk delete with confirmation | 1. Select 5 posts 2. Click "Delete" in action bar 3. Confirm in AlertDialog | All 5 posts deleted; toast confirms "5 posts deleted"; posts removed from list | P0 |
| BULK-D02 | Bulk delete cancel | 1. Select 3 posts 2. Click "Delete" 3. Click "Cancel" in AlertDialog | No posts deleted; selection preserved | P0 |
| BULK-D03 | Confirmation dialog text | 1. Select 5 posts 2. Click "Delete" | Dialog says "Delete 5 posts" (not generic "Yes/No"); Cancel button focused initially | P1 |
| BULK-D04 | Undo after bulk delete | 1. Bulk delete 3 posts 2. Click "Undo" in toast (within 10 seconds) | 3 posts restored; toast confirms restoration | P1 |
| BULK-D05 | Undo timer expiry | 1. Bulk delete 2 posts 2. Wait >10 seconds | Undo option disappears; deletion is permanent | P2 |
| BULK-D06 | Partial failure | 1. Bulk delete 10 posts (simulate 3 failures via mock) | Toast: "7 of 10 posts deleted. 3 failed." Failed posts remain in list and are highlighted | P1 |

### Bulk Reschedule Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-S01 | Bulk reschedule to future date | 1. Select 4 draft/scheduled posts 2. Click "Schedule" 3. Pick date/time via Popover 4. Confirm | All 4 posts scheduled to new date; calendar reflects changes | P0 |
| BULK-S02 | Reschedule shows date picker | 1. Select posts 2. Click "Schedule" | Popover with date picker appears (per L003 spec) | P1 |
| BULK-S03 | Reschedule past date warning | 1. Select posts 2. Attempt to schedule to a past date | Warning shown; scheduling blocked or requires explicit confirmation | P1 |

### Bulk Archive Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-A01 | Bulk archive | 1. Select 3 posts 2. Click "Archive" | Posts archived; removed from default view; accessible in archived filter | P1 |
| BULK-A02 | Archive confirmation | 1. Select posts 2. Click "Archive" | Confirmation dialog (less severe than delete — may not focus Cancel) | P2 |

### Mixed State Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-M01 | Mixed statuses (draft + published) | 1. Select 1 draft + 1 published post 2. Open bulk actions | Actions incompatible with any selected post are disabled/grayed; tooltip explains why | P1 |
| BULK-M02 | No actions on empty selection | 1. Ensure no posts selected | Action bar not visible | P0 |
| BULK-M03 | Optimistic update + rollback | 1. Bulk delete 5 posts (simulate API error) | Posts disappear optimistically → reappear after error; error toast displayed | P1 |

### Progress & Loading Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-L01 | Progress indicator for >5 items | 1. Select 8 posts 2. Perform bulk delete | Progress bar or spinner visible during processing; buttons disabled | P1 |
| BULK-L02 | Buttons disabled during processing | 1. Start a bulk action | All action bar buttons disabled; checkboxes frozen | P1 |

### Keyboard Shortcut Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-K01 | Cmd/Ctrl+A select all | 1. Focus is in Posts tab 2. Press Cmd+A (Mac) / Ctrl+A (Win) | All posts selected (should not select page text) | P2 |
| BULK-K02 | Tab to focus checkboxes | 1. Press Tab through the post list | Checkboxes receive focus in order; focus ring visible | P2 |

### Accessibility Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BULK-AC01 | Checkbox aria-labels | Inspect each checkbox element | `aria-label="Select post: {title}"` or equivalent | P1 |
| BULK-AC02 | Action bar screen reader | Enable screen reader when action bar appears | Announcement: "Bulk actions available. X posts selected." (`aria-live="polite"`) | P2 |
| BULK-AC03 | Focus management after delete | 1. Bulk delete posts 2. Check focus | Focus moves to a sensible element (e.g., next post in list or "no posts" message) | P2 |

---

## 7. M2 — US-010: Drag-to-Reschedule Calendar

**Component:** `ContentCalendarTab`  
**QA Task:** P2-Q005  
**Estimated Test Time:** 6h

### Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-001 | Drag post to new date | 1. Drag a scheduled post from March 10 to March 15 | Post's scheduled date updates to March 15; calendar reflects change | P0 |
| CAL-002 | Optimistic calendar update | 1. Drag post to new date | Calendar updates immediately (before API confirms) | P0 |
| CAL-003 | Drag to past date warning | 1. Drag a post to a date in the past | Warning dialog: "This date is in the past. Are you sure?" | P1 |
| CAL-004 | Drag to occupied date | 1. Drag a post to a date that already has 3+ posts | Post added to that date; visual indicator of density (no hard block unless configured) | P1 |
| CAL-005 | Undo reschedule | 1. Drag post to new date 2. Click "Undo" in snackbar/toast | Post returns to original date | P1 |
| CAL-006 | Published post drag warning | 1. Drag a published post | Confirmation: "This post is already published. Rescheduling will change its publish date." | P1 |
| CAL-007 | Visual feedback during drag | 1. Start dragging a post on the calendar | Post shadow visible; target date cell highlighted; drop zone clearly indicated | P1 |
| CAL-008 | Month navigation during drag | 1. Start dragging near end of month 2. Drag toward month boundary | Able to navigate to next/previous month while dragging (or clear indication this isn't supported) | P2 |
| CAL-009 | Drag cancelled (Escape) | 1. Start dragging 2. Press Escape | Post returns to original date; no API call fired | P1 |
| CAL-010 | Multiple reschedules in sequence | 1. Drag post A to March 12 2. Drag post B to March 14 3. Drag post A to March 16 | All moves persist; no stale state | P1 |

### Touch / Tablet Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-T01 | Touch drag on tablet | 1. Touch and drag post card on calendar | Same behavior as mouse drag | P1 |
| CAL-T02 | Distinguish scroll from drag | 1. Scroll the calendar normally | Scrolling works; accidental drag does not trigger | P2 |

### Edge Cases

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| CAL-E01 | Timezone consistency | 1. Schedule post at 3 PM in EST timezone 2. Drag to different date | Time (3 PM) preserved; only date changes | P1 |
| CAL-E02 | Network failure during reschedule | 1. Drag post (simulate API failure) | Optimistic update rolls back; toast: "Failed to reschedule. Post restored to original date." | P1 |
| CAL-E03 | Concurrent edit conflict | 1. User A drags post while User B deletes same post | Graceful error message; calendar refreshes to correct state | P3 |

---

## 8. M2 — US-011: Analytics Date Range Filtering

**Component:** `AnalyticsTab`  
**QA Task:** P2-Q006  
**Estimated Test Time:** 4h

### Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-001 | Preset: Last 7 days | 1. Click "Last 7 days" preset | Analytics data refetches for last 7 days; metrics update | P0 |
| ADF-002 | Preset: Last 30 days | 1. Click "Last 30 days" preset | Correct date range applied | P0 |
| ADF-003 | Preset: This Month | 1. Click "This Month" | Range is 1st of current month → today | P1 |
| ADF-004 | Custom date range | 1. Click "Custom" 2. Select start date 3. Select end date | Analytics filtered to exact range; both dates inclusive | P0 |
| ADF-005 | Invalid range (start > end) | 1. Set start date after end date | Error message shown; filter not applied; or end date auto-adjusts | P1 |
| ADF-006 | Clear filter | 1. Apply a filter 2. Click "Clear" / "All time" | Returns to default (all data); URL params cleared | P1 |
| ADF-007 | URL param persistence | 1. Apply "Last 30 days" filter 2. Copy URL 3. Open in new tab | Same filter applied from URL params | P1 |
| ADF-008 | Loading skeleton during refetch | 1. Change date range | Skeleton/loading indicator shown while data refetches | P2 |
| ADF-009 | Empty state (no data in range) | 1. Select a date range with no posts | Friendly empty state: "No analytics data for this period" | P1 |
| ADF-010 | Compare mode | 1. Enable compare mode 2. Select two date ranges | Side-by-side or overlay comparison of metrics | P2 |
| ADF-011 | Export CSV with filter | 1. Apply a date filter 2. Click "Export CSV" | CSV contains only data within the filtered range | P2 |

### Edge Cases

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ADF-E01 | Future date range | 1. Select a range entirely in the future | Empty state (no data); no error | P3 |
| ADF-E02 | Very large range (1 year+) | 1. Select a 365-day range | Data loads (may be slower); no timeout or crash | P2 |
| ADF-E03 | Date range across DST transition | 1. Select range spanning daylight saving time change | Data correctly included for all dates; no off-by-one errors | P3 |

---

## 9. M3 — US-012: Real-Time Post Preview

**Component:** `CreatePostTab` (split-pane layout)  
**QA Task:** P2-Q007  
**Estimated Test Time:** 5h

### Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-001 | Preview updates while typing | 1. Type "Hello world" in content field | Preview pane shows "Hello world" within 100ms of last keystroke | P0 |
| PRV-002 | Platform-specific preview tabs | 1. Select Facebook + Instagram + X 2. Check preview | Separate preview tabs for each platform; each shows platform-appropriate rendering | P0 |
| PRV-003 | Character count updates | 1. Type content | Character count updates in real-time; shows remaining for each platform (e.g., X: 280 limit) | P1 |
| PRV-004 | Character limit warning | 1. Type past X/Twitter's 280-char limit | Warning indicator; text truncated in X preview; other platforms unaffected | P1 |
| PRV-005 | Hashtag highlighting | 1. Type "#realestate #pittsburgh" | Hashtags styled distinctly (color/bold) in preview | P1 |
| PRV-006 | Mention highlighting | 1. Type "@steelcityai" | Mentions highlighted; if validation exists, show valid/invalid state | P2 |
| PRV-007 | Media in preview | 1. Upload 3 images 2. Check preview | Images shown in preview matching platform layout (carousel, grid, etc.) | P1 |
| PRV-008 | Media reorder reflected in preview | 1. Upload images 2. Reorder via DnD | Preview updates to show new image order | P1 |
| PRV-009 | Emoji rendering | 1. Type content with emojis: "Great listing! 🏠🔑" | Emojis render correctly in preview across all platform tabs | P2 |
| PRV-010 | Empty content state | 1. Clear all content | Preview shows placeholder: "Start typing to see preview…" | P2 |
| PRV-011 | Mobile/desktop preview toggle | 1. Toggle between mobile and desktop preview | Preview dimensions change to match selected device type | P2 |
| PRV-012 | Long content handling | 1. Paste 5000 characters | Preview renders without lag; scrollable if needed; debounce keeps it smooth | P1 |

### Performance Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-P01 | Update latency | 1. Open DevTools 2. Type rapidly for 5 seconds 3. Measure debounce | Preview updates within 100ms of last keystroke (not per keystroke) | P0 |
| PRV-P02 | No jank during fast typing | 1. Type at >100 WPM for 10 seconds | Input field remains responsive; no dropped characters; preview catches up smoothly | P1 |

### Edge Cases

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-E01 | Special characters: HTML entities | 1. Type `<script>alert('xss')</script>` | Rendered as literal text in preview, not executed | P0 |
| PRV-E02 | RTL text | 1. Type Arabic or Hebrew content | Preview displays correctly with RTL direction | P3 |
| PRV-E03 | URL rendering | 1. Type `https://steelcity-ai.com` | URL shown as clickable link or plain text depending on platform preview | P3 |

---

## 10. M3 — US-013: Post Templates & Drafts

**Component:** `CreatePostTab` + `PostsTab`  
**API:** `GET/POST/PUT/DELETE /api/social/templates` + `/api/social/drafts`  
**QA Task:** P2-Q008  
**Estimated Test Time:** 8h

### Template Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-001 | Create template | 1. In CreatePostTab, fill content 2. Click "Save as Template" 3. Name: "Open House" | Template saved; success toast | P0 |
| TPL-002 | Template library view | 1. Open template picker in CreatePostTab | Card-based grid of templates; search/filter available | P0 |
| TPL-003 | Use template (apply) | 1. Click "Use Template" on "Open House" template | CreatePostTab fields pre-filled with template content, platforms, hashtag structure | P0 |
| TPL-004 | Template preview | 1. Hover over a template card (desktop) or tap (mobile) | Preview of template content shown before applying | P1 |
| TPL-005 | Edit template | 1. Open template 2. Modify content 3. Save | Template updated; existing posts not affected | P1 |
| TPL-006 | Delete template | 1. Click delete on template 2. Confirm | Template removed from library; confirmation dialog shown | P1 |
| TPL-007 | Template categories/tags | 1. Create template with category "Listings" 2. Filter by category | Only templates in "Listings" category shown | P2 |
| TPL-008 | Search templates | 1. Type "open house" in template search | Matching templates filtered in real-time | P2 |
| TPL-009 | Template includes structure not content | 1. Check a template | Template stores content structure, platforms, hashtag strategy — not specific listing details | P1 |
| TPL-010 | Apply template with existing content | 1. Start writing a post 2. Apply a template | Confirmation: "Replace current content with template?" or merge option | P1 |

### Draft Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DFT-001 | Auto-save every 30s | 1. Start typing a post 2. Wait 35 seconds without saving | Draft saved automatically; visual indicator (e.g., "Draft saved" timestamp) | P0 |
| DFT-002 | Drafts list in PostsTab | 1. Go to Posts tab 2. Filter by "Drafts" | All auto-saved and manually saved drafts listed with "last edited" timestamp | P0 |
| DFT-003 | Restore from draft | 1. Click on a draft in Posts tab | Opens in CreatePostTab with all fields restored (content, media, platforms) | P0 |
| DFT-004 | Delete draft | 1. Delete a draft 2. Confirm | Draft removed; confirmation dialog shown | P1 |
| DFT-005 | Draft with media | 1. Upload images 2. Auto-save triggers | Draft includes media references; media visible on restore | P1 |
| DFT-006 | Multiple drafts | 1. Create draft A 2. Navigate away 3. Create draft B | Both drafts exist independently in drafts list | P1 |
| DFT-007 | Draft overwrite on same post | 1. Open draft 2. Edit 3. Auto-save | Same draft updated (not new draft created) | P1 |
| DFT-008 | Draft ↔ Publish workflow | 1. Start with auto-saved draft 2. Click "Publish" | Post publishes; draft is deleted/converted to published post | P0 |
| DFT-009 | Browser close during edit | 1. Start typing 2. Close browser before 30s auto-save | On reopen, if auto-save fired: draft available. If not: unsaved content lost (expected) | P2 |
| DFT-010 | Auto-save timing indicator | 1. Edit a post | UI shows when last auto-save occurred (e.g., "Saved 15 seconds ago") | P2 |

### Edge Cases

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-E01 | Template with no platforms | 1. Save template without selecting platforms | Template saves; on apply, platform selector is empty (user must choose) | P3 |
| DFT-E01 | Draft conflict (edited on two tabs) | 1. Open same draft in 2 browser tabs 2. Edit in both 3. Both auto-save | Later save wins; no data corruption; ideally a conflict prompt | P3 |
| DFT-E02 | Very long draft content | 1. Paste 10,000 characters 2. Wait for auto-save | Draft saves successfully; no timeout | P3 |

---

## 11. M3 — US-014: Loading Skeletons

**Component:** All tab components  
**Design Spec:** L007 (to be delivered)  
**QA Task:** P2-Q009  
**Estimated Test Time:** 3h

### Functional Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-001 | Posts tab skeleton | 1. Navigate to Posts tab (with throttled network) | Skeleton grid of post cards displayed; matches PostCard layout shape | P0 |
| SKL-002 | Calendar tab skeleton | 1. Navigate to Calendar tab (throttled) | Skeleton calendar grid displayed; 7-column layout matches real calendar | P0 |
| SKL-003 | Analytics tab skeleton | 1. Navigate to Analytics tab (throttled) | Skeleton metric cards + chart placeholder displayed | P0 |
| SKL-004 | Dashboard tab skeleton | 1. Navigate to Dashboard tab (throttled) | Skeleton matching dashboard card layout | P1 |
| SKL-005 | CreatePostTab skeleton | 1. Navigate to CreatePost with pre-loaded draft (throttled) | Skeleton for form fields while draft data loads | P2 |
| SKL-006 | Transition: skeleton → real content | 1. Observe skeleton → data loaded transition | Smooth fade/transition; no layout shift (CLS = 0) | P0 |
| SKL-007 | Shimmer animation | 1. Observe any skeleton | Shimmer/pulse animation playing; uses theme-appropriate gray tones | P1 |
| SKL-008 | Skeleton during infinite scroll | 1. Scroll to bottom of Posts tab | Skeleton post cards appear while next page loads | P2 |

### Accessibility Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-A01 | aria-busy attribute | Inspect skeleton container | `aria-busy="true"` while loading; removed when content loads | P1 |
| SKL-A02 | Screen reader announcement | 1. Enable screen reader 2. Navigate to loading tab | Announcement: "Loading content…" or equivalent | P2 |

### Performance Tests

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-P01 | No layout shift | 1. Measure CLS during skeleton → content transition | CLS = 0 (skeleton dimensions match content dimensions exactly) | P0 |
| SKL-P02 | Skeleton render time | 1. Measure time to first paint of skeleton | Skeleton visible within 100ms of navigation (instant perceived load) | P1 |

---

## 12. Regression Test Suite

**QA Task:** P2-Q010 (blocked until all Phase 2 features complete)  
**Estimated Test Time:** 8h

### Phase 1 Feature Regression

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| REG-001 | Tab navigation still works | All 8+ tabs load independently; lazy loading functional | P0 |
| REG-002 | Post creation flow | Create new post → schedule → publish; no regressions | P0 |
| REG-003 | Campaign CRUD | Create, edit, delete campaigns; links to posts preserved | P0 |
| REG-004 | Account management | Add, remove, view social accounts | P1 |
| REG-005 | Brand voice profiles | Create, apply, edit brand voice; AI compose uses selected voice | P1 |
| REG-006 | AI compose (manual/AI/autonomous modes) | All 3 creation modes functional | P0 |
| REG-007 | Optimistic updates (Phase 1) | Post delete/create still updates UI optimistically | P1 |
| REG-008 | Error boundaries | Trigger an error in one tab; other tabs remain functional | P1 |
| REG-009 | TypeScript strict mode | `tsc --noEmit` passes with zero errors | P0 |
| REG-010 | Component size check | No component exceeds 500 lines | P2 |

### Cross-Feature Integration

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| REG-INT-01 | DnD media → Duplicate post | Duplicate preserves reordered media sequence | P1 |
| REG-INT-02 | Bulk delete → Calendar | Deleted posts disappear from calendar immediately | P1 |
| REG-INT-03 | Bulk reschedule → Calendar | Rescheduled posts appear on new dates in calendar | P1 |
| REG-INT-04 | Template → Preview | Applying template updates real-time preview | P1 |
| REG-INT-05 | Draft auto-save → DnD media order | Auto-saved draft preserves media reorder | P1 |
| REG-INT-06 | Date filter → CSV export | Export matches filtered data | P2 |
| REG-INT-07 | Skeleton → Error boundary | If data fetch fails during skeleton, error boundary catches it gracefully | P2 |

---

## 13. Accessibility Testing Checklist

**Related Task:** P2-D007 (blocked until builds stabilize)

### Per-Feature Accessibility Requirements

| Feature | WCAG Requirement | Test Method |
|---------|------------------|-------------|
| DnD media (US-007) | Keyboard alternative (arrow keys + space) | Manual + axe-core |
| DnD media (US-007) | Screen reader announcements for pick/move/drop | Manual with VoiceOver/NVDA |
| Bulk actions (US-009) | All checkboxes have `aria-label` | axe-core automated scan |
| Bulk actions (US-009) | `aria-live="polite"` on action bar | Code review + manual test |
| Bulk actions (US-009) | Focus management on delete (focus next item) | Manual |
| Calendar DnD (US-010) | Keyboard alternative for rescheduling | Manual |
| Date picker (US-011) | Keyboard navigable date selection | Manual |
| Preview (US-012) | Preview updates announced to screen readers | Manual |
| Templates (US-013) | Template picker keyboard navigable | Manual |
| Skeletons (US-014) | `aria-busy="true"` during load | axe-core + code review |
| All features | Focus rings visible on all interactive elements | Visual inspection |
| All features | Color contrast ≥ 4.5:1 (AA) for all text | Lighthouse audit |
| All features | Touch targets ≥ 44×44px on tablet | Measurement |

---

## 14. Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| DnD frame rate | ≥ 60fps (<16ms/frame) | Chrome DevTools Performance recording |
| Preview update latency | < 100ms from last keystroke | Timestamp logging in component |
| Bulk action (5 items) | < 2s total | Network waterfall analysis |
| Bulk action (20 items) | < 5s total; progress indicator shown | Network waterfall analysis |
| Skeleton → content CLS | 0 | Lighthouse CLS measurement |
| Tab switch time | < 100ms (lazy load cache hit) | Chrome DevTools |
| Auto-save draft | < 500ms per save | Network timing |
| Calendar drag responsiveness | No perceptible lag | Manual observation |
| Initial page load | < 2s (LCP) | Lighthouse |
| Template picker open | < 200ms | Manual observation |

---

## 15. Risk-Based Testing Notes

Based on the Phase 2 Risk Register:

| Risk | QA Mitigation |
|------|---------------|
| **DnD library conflicts with Shadcn UI** | Test DnD inside dialogs, dropdowns, and other Shadcn overlays. Verify no z-index/event conflicts. |
| **Bulk action race conditions** | Test rapid sequential bulk operations (delete → immediately reschedule remaining). Verify request queuing works. |
| **Calendar timezone handling** | Test with browser set to EST, PST, UTC, and UTC+5:30 (half-hour offset). Verify dates are correct. |
| **Template content size bloat** | Create 50+ templates; verify template picker performance doesn't degrade. Test max character limits. |
| **Preview performance with long content** | Paste 10K+ characters; verify debounce prevents UI freeze. Test with complex markdown/emoji content. |
| **Auto-save draft conflicts** | Open same draft in 2 tabs; edit both; verify no data loss or corruption. |
| **QA environment data scarcity** | Validate seed data script produces consistent, comprehensive test data. Maintain mock API responses as backup. |

---

## Appendix A: Test Case ID Conventions

| Prefix | Feature Area |
|--------|-------------|
| `DND-` | Drag-and-drop media (US-007) |
| `DND-T` | DnD touch tests |
| `DND-A` | DnD accessibility tests |
| `DND-P` | DnD performance tests |
| `DUP-` | Post duplication (US-008) |
| `DUP-E` | Duplication edge cases |
| `BULK-` | Bulk actions selection (US-009) |
| `BULK-D` | Bulk delete |
| `BULK-S` | Bulk schedule |
| `BULK-A` | Bulk archive |
| `BULK-M` | Mixed state tests |
| `BULK-L` | Bulk loading/progress |
| `BULK-K` | Bulk keyboard shortcuts |
| `BULK-AC` | Bulk accessibility |
| `CAL-` | Calendar drag-reschedule (US-010) |
| `CAL-T` | Calendar touch tests |
| `CAL-E` | Calendar edge cases |
| `ADF-` | Analytics date filter (US-011) |
| `ADF-E` | Analytics edge cases |
| `PRV-` | Real-time preview (US-012) |
| `PRV-P` | Preview performance |
| `PRV-E` | Preview edge cases |
| `TPL-` | Templates (US-013) |
| `DFT-` | Drafts (US-013) |
| `SKL-` | Skeletons (US-014) |
| `SKL-A` | Skeleton accessibility |
| `SKL-P` | Skeleton performance |
| `REG-` | Regression tests |
| `REG-INT-` | Cross-feature integration |

## Appendix B: Test Execution Schedule

| Milestone | Test Suites to Execute | Blocking? |
|-----------|----------------------|-----------|
| **M1 complete** (Week 4) | DND-*, DUP-*, BULK-*, REG-001–REG-010 | Yes — must pass before M2 starts |
| **M2 complete** (Week 5 early) | CAL-*, ADF-*, REG-INT-01–03 | Yes — must pass before M3 starts |
| **M3 complete** (Week 5 late) | PRV-*, TPL-*, DFT-*, SKL-*, REG-INT-04–07 | Yes — must pass before go/no-go gate |
| **Pre-release** | Full regression (REG-*), Accessibility audit, Performance benchmarks | Yes — required for QA sign-off |

---

*End of Phase 2 Test Plan — P2-Q001*
