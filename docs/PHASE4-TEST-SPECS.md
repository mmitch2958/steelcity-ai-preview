# Phase 4 — Test Specifications: Polish & Launch
**Project:** SMP-2026-Q1 — Social Media Management Platform  
**Phase:** 4 ("Ship It")  
**QA Tasks Covered:** P4-Q001, P4-Q002, P4-Q003, P4-Q004  
**Author:** QA Department  
**Created:** 2026-03-05  
**Status:** DRAFT

---

## Table of Contents
1. [P4-Q001 — Full Regression Test Suite (Phase 1-3)](#p4-q001--full-regression-test-suite-phase-1-3)
2. [P4-Q002 — E2E Tests: Critical Flows](#p4-q002--e2e-tests-critical-flows)
3. [P4-Q003 — Bug Bash: P0/P1 Issue Catalog](#p4-q003--bug-bash-p0p1-issue-catalog)
4. [P4-Q004 — Pre-Launch Checklist Verification](#p4-q004--pre-launch-checklist-verification)
5. [Appendices](#appendices)

---

## Prerequisites (All Sections)

### Test Environments

| Environment | URL | Purpose | Database |
|-------------|-----|---------|----------|
| **Local Dev** | `localhost:5000` | Developer testing, unit tests | Local Neon (dev branch) |
| **Staging** | `staging.steelcity-ai.com` | Full regression, E2E, accessibility audit | Neon staging branch |
| **Production** | `steelcity-ai.com` | Post-deploy smoke tests ONLY | Neon main branch |

### Browser Matrix

| Browser | Versions | Priority | Notes |
|---------|----------|----------|-------|
| Chrome | Latest, Latest-1 | P0 | Primary target |
| Firefox | Latest | P1 | @dnd-kit, CSS, Recharts compat |
| Safari | Latest (macOS + iOS) | P1 | Touch events, CSS differences |
| Edge | Latest | P2 | Chromium-based, lower risk |

### Device / Viewport Matrix

| Device | Viewport | Priority |
|--------|----------|----------|
| Desktop | 1920×1080 | P0 |
| Laptop | 1440×900 | P0 |
| Tablet (landscape) | 1024×768 | P1 |
| Tablet (portrait) | 768×1024 | P2 |
| Mobile | 375×812 | P3 |

### Test Data Requirements
- Phase 3 seed data loaded (3 clients, approval configs, hashtag metrics, prediction records)
- 25+ posts across all statuses (draft, scheduled, published, failed)
- 15+ hashtags per client with 60+ days of `social_hashtag_metrics`
- Approval configs: ClientA (1-level), ClientB (2-level), ClientC (none)
- Test SMTP server (Ethereal/Mailhog) running
- Mock AI services for deterministic prediction results

### Tools & Frameworks

| Tool | Purpose |
|------|---------|
| Vitest + Jest | Unit tests for hooks, utilities, scoring |
| React Testing Library | Component integration tests |
| Playwright | E2E tests for full flows |
| axe-core / Lighthouse | Accessibility and performance |
| Chrome DevTools Performance | Frame rate, CLS, bundle analysis |
| `tsc --noEmit` | TypeScript strict mode validation |

---

## P4-Q001 — Full Regression Test Suite (Phase 1-3)

**Priority:** P0  
**Estimate:** 8h  
**Dependency:** All Phase 1-3 builds complete  
**Pass Criteria:** 100% of P0 tests pass, ≥95% of P1 tests pass, no new regressions

---

### 1.1 Phase 1 Regression: Architecture & Foundation

#### 1.1.1 Component Architecture

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P1-001 | Tab navigation: all 8 tabs load independently | Dashboard, Posts, CreatePost, Campaigns, Accounts, BrandVoice, Calendar, Analytics all render without errors | P0 | E2E |
| REG-P1-002 | Lazy loading: non-Dashboard tabs use React.lazy | PostsTab, CreatePostTab, CampaignsTab, AccountsTab, BrandVoiceTab, ContentCalendarTab, AnalyticsTab all imported via `lazy()` in PortalSocialMedia.tsx | P0 | Code Review + DevTools |
| REG-P1-003 | Suspense fallback: skeleton appears during lazy load | Throttle network → navigate to Posts tab → TabSkeleton visible before content renders | P0 | E2E |
| REG-P1-004 | Error boundary isolation | Inject error in one tab component → other tabs remain functional; error fallback UI displayed | P0 | Component |
| REG-P1-005 | ErrorBoundary displays recovery UI | Error boundary shows "Something went wrong" with retry button for tab-level errors | P1 | Component |
| REG-P1-006 | Tab URL sync via query params | Navigate to `?tab=analytics` → AnalyticsTab active; switch tabs → URL updates | P1 | E2E |
| REG-P1-007 | Invalid tab param defaults to Dashboard | Navigate to `?tab=invalid` → Dashboard tab active | P1 | E2E |
| REG-P1-008 | Tab alias mapping: `ai-compose` → `create` | Navigate to `?tab=ai-compose` → CreatePostTab active | P2 | E2E |

#### 1.1.2 TypeScript & Code Quality

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P1-009 | TypeScript strict mode compiles | `tsc --noEmit` exits with 0 errors | P0 | CLI |
| REG-P1-010 | No component exceeds 500 lines | All portal/social and components/social files < 500 lines | P1 | Script: `wc -l` |
| REG-P1-011 | Shared hooks extracted | Queries/mutations use shared hooks from `hooks/social/` (not inline `useQuery`/`useMutation`) | P1 | Code Review |
| REG-P1-012 | No `any` types in social components | `grep -r ': any' client/src/pages/portal/social/ client/src/components/social/` returns zero matches (excluding test files) | P2 | Script |

#### 1.1.3 Core CRUD Operations

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P1-013 | Create social post (draft) | Fill content + select platform → Save → Post appears in PostsTab with "Draft" badge | P0 | E2E |
| REG-P1-014 | Edit existing post | Open post → change content → Save → Changes persist on reload | P0 | E2E |
| REG-P1-015 | Delete post | Delete post → confirm → post removed from list; undo toast appears | P0 | E2E |
| REG-P1-016 | Create campaign | Fill name + description → Save → Campaign appears in CampaignsTab | P0 | E2E |
| REG-P1-017 | Edit campaign | Open campaign → change name → Save → Changes persist | P1 | E2E |
| REG-P1-018 | Delete campaign | Delete campaign → confirm → removed from list | P1 | E2E |
| REG-P1-019 | Create social account | Add account (platform + name) → Account appears in AccountsTab | P0 | E2E |
| REG-P1-020 | Delete social account | Delete account → confirm → removed from list | P1 | E2E |
| REG-P1-021 | Create brand voice profile | Fill name + tone + guidelines → Save → Profile appears in BrandVoiceTab | P0 | E2E |
| REG-P1-022 | Edit brand voice profile | Open profile → change tone → Save → Changes persist | P1 | E2E |
| REG-P1-023 | Delete brand voice profile | Delete profile → confirm → removed from list | P1 | E2E |
| REG-P1-024 | Optimistic updates on create | Create post → UI updates immediately before server response | P0 | Component |
| REG-P1-025 | Optimistic updates on delete | Delete post → UI removes immediately; rolls back on API failure | P0 | Component |
| REG-P1-026 | Optimistic update rollback | Simulate API failure on delete → post reappears in list; error toast shown | P1 | Component |

#### 1.1.4 AI Compose Features

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P1-027 | AI generate post (manual mode) | Enter prompt → click Generate → AI-generated content populates content field | P0 | E2E |
| REG-P1-028 | AI vibe edit | Select content → apply vibe (professional/casual/etc.) → content updated with new tone | P1 | E2E |
| REG-P1-029 | AI review | Submit content for review → AI feedback displayed | P1 | E2E |
| REG-P1-030 | AI orchestrate | Orchestration flow generates research → design → content | P1 | E2E |
| REG-P1-031 | AI autonomous mode | Autonomous pipeline generates complete post with content + media suggestions | P1 | E2E |
| REG-P1-032 | AI uses selected brand voice | Select brand voice profile → generate content → output matches selected tone/guidelines | P1 | E2E |

#### 1.1.5 Portal vs Admin Isolation

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P1-033 | Portal user sees only their client data | Login as ClientA portal user → Posts, Campaigns, Accounts show ClientA data only | P0 | Integration |
| REG-P1-034 | Admin user can filter by client | Login as admin → client filter dropdown visible; selecting client filters data | P0 | E2E |
| REG-P1-035 | Portal auth required for portal routes | `GET /api/portal/social/posts` without portal session → 401 | P0 | Integration |
| REG-P1-036 | Admin auth required for admin routes | `GET /api/admin/social/posts` without admin session → 401 | P0 | Integration |

---

### 1.2 Phase 2 Regression: Core UX Wins

#### 1.2.1 Drag-and-Drop Media Reordering (US-007)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-001 | Basic DnD reorder (2 items) | Upload 2 images → drag image 2 above image 1 → order updates to [2, 1] | P0 | E2E |
| REG-P2-002 | Reorder persists after tab switch | Reorder to [3, 1, 2] → switch tabs → return → order preserved | P0 | E2E |
| REG-P2-003 | Reorder saved to draft | Upload, reorder, save draft → reload → media order matches | P0 | E2E |
| REG-P2-004 | DnD visual feedback | Start drag → cursor changes, ghost visible, drop zones highlighted | P1 | Manual |
| REG-P2-005 | Cancel drag (Escape) | Start drag → press Escape → item returns to original position | P1 | E2E |
| REG-P2-006 | Touch drag on tablet | Touch and hold → drag to new position → reorder works | P1 | Manual |
| REG-P2-007 | Keyboard DnD (Space + Arrow + Space) | Focus item → Space → Arrow → Space → item repositioned | P1 | E2E |
| REG-P2-008 | DnD frame rate ≥ 60fps | DevTools Performance recording → ≥60fps during drag | P1 | Performance |

#### 1.2.2 Post Duplication (US-008)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-009 | Basic duplication | Click "Duplicate" on published post → "Copy of {title}" created as draft | P0 | E2E |
| REG-P2-010 | Content fields copied | Duplicate → content, hashtags, media, platforms all copied | P0 | E2E |
| REG-P2-011 | Schedule NOT copied | Duplicate scheduled post → duplicate has no schedule; status = draft | P0 | E2E |
| REG-P2-012 | Analytics NOT copied | Duplicate published post with engagement → duplicate has zero metrics | P0 | E2E |
| REG-P2-013 | Duplicate is independent | Duplicate → edit duplicate → original unchanged | P1 | E2E |

#### 1.2.3 Bulk Actions (US-009)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-014 | Single checkbox select | Click checkbox → post selected; action bar appears | P0 | E2E |
| REG-P2-015 | Select All | Click "Select All" → all posts selected; count in action bar | P0 | E2E |
| REG-P2-016 | Bulk delete with confirmation | Select 5 → Delete → Confirm → all removed; "5 posts deleted" toast | P0 | E2E |
| REG-P2-017 | Bulk delete undo | Bulk delete → Click "Undo" within 10s → posts restored | P1 | E2E |
| REG-P2-018 | Bulk reschedule | Select 4 posts → Schedule → Pick date → All 4 rescheduled | P0 | E2E |
| REG-P2-019 | Mixed status disables incompatible actions | Select draft + published → incompatible actions grayed/disabled | P1 | Component |
| REG-P2-020 | Shift-click range select | Select post 2 → Shift+click post 6 → posts 2-6 selected | P1 | E2E |

#### 1.2.4 Drag-to-Reschedule Calendar (US-010)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-021 | Drag post to new date | Drag scheduled post from Mar 10 to Mar 15 → date updates | P0 | E2E |
| REG-P2-022 | Optimistic calendar update | Drag → calendar updates immediately before API response | P0 | Component |
| REG-P2-023 | Undo reschedule | Drag → click "Undo" → post returns to original date | P1 | E2E |
| REG-P2-024 | Drag cancelled (Escape) | Start drag → Escape → no change; no API call | P1 | E2E |
| REG-P2-025 | Timezone consistency | Schedule at 3 PM EST → drag to different date → time (3 PM) preserved | P1 | E2E |

#### 1.2.5 Analytics Date Range Filtering (US-011)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-026 | Preset: Last 7 days | Click "Last 7 days" → analytics refetch; metrics update | P0 | E2E |
| REG-P2-027 | Custom date range | Select start + end dates → analytics filtered to exact range | P0 | E2E |
| REG-P2-028 | Invalid range (start > end) | Error shown; filter not applied | P1 | E2E |
| REG-P2-029 | Clear filter | Apply filter → click "Clear" → returns to all data | P1 | E2E |
| REG-P2-030 | Empty state (no data in range) | Select range with no posts → "No analytics data for this period" | P1 | Component |

#### 1.2.6 Real-Time Post Preview (US-012)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-031 | Preview updates while typing | Type "Hello" → preview shows "Hello" within 100ms of last keystroke | P0 | E2E |
| REG-P2-032 | Platform-specific preview tabs | Select FB + IG + X → 3 preview tabs; each platform-appropriate | P0 | E2E |
| REG-P2-033 | Character count + limit warning | Type past X's 280-char limit → warning indicator; text truncated in X preview | P1 | Component |
| REG-P2-034 | Media in preview | Upload 3 images → images visible in preview | P1 | E2E |
| REG-P2-035 | XSS prevention | Type `<script>alert('xss')</script>` → rendered as text, not executed | P0 | E2E |

#### 1.2.7 Post Templates & Drafts (US-013)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-036 | Create template | Fill content → "Save as Template" → template saved with success toast | P0 | E2E |
| REG-P2-037 | Use template (apply) | Click "Use Template" → CreatePostTab pre-filled with template content | P0 | E2E |
| REG-P2-038 | Template library search | Open template picker → type search term → matching templates filtered | P1 | E2E |
| REG-P2-039 | Auto-save every 30s | Start typing → wait 35s → "Draft saved" indicator visible | P0 | E2E |
| REG-P2-040 | Restore from draft | Click draft in PostsTab → opens in CreatePostTab with all fields restored | P0 | E2E |
| REG-P2-041 | Draft → Publish workflow | Open auto-saved draft → click Publish → post published; draft converted | P0 | E2E |

#### 1.2.8 Loading Skeletons (US-014)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P2-042 | Posts tab skeleton | Throttle network → navigate to Posts → skeleton post cards displayed | P0 | E2E |
| REG-P2-043 | Calendar tab skeleton | Throttle → navigate to Calendar → skeleton calendar grid displayed | P0 | E2E |
| REG-P2-044 | Analytics tab skeleton | Throttle → navigate to Analytics → skeleton metric cards + chart | P0 | E2E |
| REG-P2-045 | Skeleton → content transition (no CLS) | Observe skeleton → data load → CLS = 0; smooth fade transition | P0 | Performance |
| REG-P2-046 | `aria-busy="true"` during loading | Inspect skeleton container → `aria-busy="true"` set; removed after load | P1 | Component |

---

### 1.3 Phase 3 Regression: Advanced Features

#### 1.3.1 Approval Workflows (US-015)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P3-001 | Submit draft for approval | Click "Submit for Approval" → post status changes to "Pending Approval" (blue badge) | P0 | E2E |
| REG-P3-002 | Approve post | Approver clicks "Approve" → status changes to "Approved" (green badge) | P0 | E2E |
| REG-P3-003 | Reject post with comment | Approver rejects with feedback → status "Rejected" (red badge); creator sees feedback | P0 | E2E |
| REG-P3-004 | Request changes | Approver requests changes → status "Changes Requested" (yellow badge); post editable | P0 | E2E |
| REG-P3-005 | Re-submit after rejection | Creator edits and re-submits → new approval cycle starts from L1 | P0 | E2E |
| REG-P3-006 | Multi-level approval (2-level) | L1 approves → auto-forwards to L2 → L2 approves → post fully approved | P0 | E2E |
| REG-P3-007 | Multi-level rejection at L1 skips L2 | L1 rejects → post rejected; L2 never notified | P0 | E2E |
| REG-P3-008 | Approval blocks publishing | Attempt publish on unapproved post → blocked (403 or disabled UI) | P0 | Integration |
| REG-P3-009 | Non-approver cannot approve (403) | Non-approver calls approve API → 403 "Not authorized" | P0 | Integration |
| REG-P3-010 | Client without approval config — no workflow | ClientC post → no "Submit for Approval" button; publish works directly | P0 | E2E |
| REG-P3-011 | Pending post is read-only for creator | Open pending post → form fields disabled; "Pending approval, cannot edit" | P0 | Component |
| REG-P3-012 | Approval history timeline | Open approved post → timeline shows Submit → Approve with timestamps + comments | P1 | Component |
| REG-P3-013 | Optimistic update on approval action | Click Approve → card removed from queue instantly (before API response) | P1 | Component |
| REG-P3-014 | Optimistic rollback on approval error | API fails → card reappears in queue; error toast | P1 | Component |
| REG-P3-015 | Portal user sees only their client's approvals | Portal user → ApprovalQueue shows only their client's requests | P0 | Integration |
| REG-P3-016 | Email notification on submit | Submit for approval → approver receives email within 5s (test SMTP) | P0 | Integration |
| REG-P3-017 | Email notification on approve | Approve post → creator receives "approved" email | P0 | Integration |
| REG-P3-018 | Email notification on reject | Reject post → creator receives "rejected" email with comment | P0 | Integration |
| REG-P3-019 | Notification preferences — email disabled | Disable email pref → no email sent; in-app workflow still works | P1 | Integration |

#### 1.3.2 Hashtag Performance Tracking (US-017)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P3-020 | Hashtag dashboard loads with metrics | Navigate to Hashtags → table with hashtag, impressions, reach, engagement rate, sparkline | P0 | E2E |
| REG-P3-021 | Column sorting | Click "Impressions" header → table sorts descending; click again → ascending | P0 | Component |
| REG-P3-022 | Date range filter changes metrics | Change to "Last 7 days" → metrics update; "Last 60 days" → values increase | P0 | Integration |
| REG-P3-023 | Select hashtag → time-series chart | Click "#SteelCity" → LineChart appears with daily data points | P0 | E2E |
| REG-P3-024 | Multi-hashtag comparison (up to 4) | Select 4 hashtags → 4 distinct colored lines; 5th selection blocked | P1 | Component |
| REG-P3-025 | Empty state — no hashtag data | Client with no hashtags → "No hashtag data yet" message | P0 | Component |
| REG-P3-026 | Portal user sees only their client data | Portal user → hashtag API filters by authenticated client | P0 | Integration |
| REG-P3-027 | Pagination works correctly | 15+ hashtags → page 1 shows 10; page 2 shows remaining; no duplicates | P0 | Component |
| REG-P3-028 | Sparkline mini-charts render | Each row has sparkline (~80px wide) showing engagement trend | P1 | Component |

#### 1.3.3 AI Post Performance Predictions (US-018)

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-P3-029 | Prediction score displayed in CreatePostTab | Enter content → prediction panel shows score 0-100 with gauge/bar | P0 | E2E |
| REG-P3-030 | Score updates on content change (debounced) | Edit content → wait 500ms → new score displayed | P0 | Component |
| REG-P3-031 | Score color coding | Red (0-30), yellow (31-60), green (61-100) | P0 | Component |
| REG-P3-032 | Factor breakdown visible | 5 factors shown: Time of Day, Content Quality, Hashtag Strength, Media, Historical | P0 | Component |
| REG-P3-033 | Improvement suggestions | Suggestions shown as cards with "Apply" buttons and "+N" score impact | P1 | Component |
| REG-P3-034 | Empty content — graceful state | Clear content → "Start writing to see predicted score" placeholder | P0 | Component |
| REG-P3-035 | Low-confidence warning | New client (0 history) → "⚠️ Limited data — low confidence" warning | P0 | Component |
| REG-P3-036 | Prediction score stored on publish | Publish post → `prediction_records` row created with predicted score | P0 | Integration |
| REG-P3-037 | Rapid typing cancels previous requests | Type rapidly → only final content triggers prediction; no stale results | P1 | Integration |
| REG-P3-038 | Feature flag gates prediction UI | Flag OFF → no prediction panel visible; no API calls | P0 | Component |
| REG-P3-039 | Mobile layout — collapsible panel | Mobile viewport → prediction as collapsible bottom panel | P1 | Component |

---

### 1.4 Cross-Phase Integration Regression

| ID | Test Case | Expected Result | Priority | Method |
|----|-----------|-----------------|----------|--------|
| REG-INT-001 | DnD media order → Duplicate post | Reorder media → duplicate → duplicate preserves reordered media sequence | P1 | E2E |
| REG-INT-002 | Bulk delete → Calendar | Bulk delete 3 posts → all 3 disappear from calendar immediately | P1 | E2E |
| REG-INT-003 | Bulk reschedule → Calendar | Bulk reschedule 3 posts → new dates reflected on calendar | P1 | E2E |
| REG-INT-004 | Template → Preview | Apply template → real-time preview updates with template content | P1 | E2E |
| REG-INT-005 | Draft auto-save → DnD media order | Reorder media → auto-save → reload → media order preserved | P1 | E2E |
| REG-INT-006 | Date filter → Hashtag analytics | Apply date range → hashtag metrics reflect filtered window | P1 | Integration |
| REG-INT-007 | Skeleton → Error boundary | Data fetch fails during skeleton → error boundary catches gracefully | P1 | Component |
| REG-INT-008 | Approval + Bulk actions | Select 5 drafts → bulk "Submit for Approval" → all 5 pending | P1 | E2E |
| REG-INT-009 | Prediction + Brand voice | Select brand voice → generate AI content → prediction score reflects content quality | P1 | E2E |
| REG-INT-010 | Approval + Calendar | Approved post scheduled → shows on calendar; pending post shows approval badge on calendar | P1 | E2E |
| REG-INT-011 | Hashtag suggestions → CreatePostTab | Hashtag dashboard shows top performer → use same hashtag in new post → prediction considers hashtag strength | P2 | E2E |
| REG-INT-012 | DnD media → Preview sync | Reorder media → real-time preview updates to show new image order | P1 | Component |

---

## P4-Q002 — E2E Tests: Critical Flows

**Priority:** P0  
**Estimate:** 6h  
**Dependency:** P4-B004 (production build verified)  
**Pass Criteria:** All critical flow tests pass in Playwright; no blocking errors

These are the Playwright-based E2E tests covering the most critical user journeys. Each flow represents a real-world user scenario that must work flawlessly for launch.

---

### 2.1 Critical Flow 1: Create Post → Schedule → Publish → View Analytics

**File:** `e2e/critical-flow-post-lifecycle.spec.ts`

#### CF1-001: Full Post Lifecycle (Happy Path)
| Field | Value |
|-------|-------|
| **ID** | CF1-001 |
| **Priority** | P0 |
| **Type** | E2E (Playwright) |
| **Preconditions** | Portal user logged in for ClientA. At least 1 social account connected. Approval config disabled for ClientA (or ClientC used). |
| **Steps** |
1. Navigate to `/:clientSlug/social-media?tab=create`.
2. Enter content: "Open house this Saturday at 123 Main St! 🏠 Don't miss this stunning property. #PittsburghRealEstate #OpenHouse".
3. Select platforms: Facebook, Instagram.
4. Upload 2 images (JPEG, < 5MB each).
5. Verify real-time preview updates (both FB and IG tabs).
6. Verify prediction score is displayed (green range expected).
7. Click "Schedule" and select tomorrow at 2:00 PM.
8. Confirm scheduling.
9. Navigate to Posts tab → verify post appears with "Scheduled" badge and correct date.
10. Navigate to Calendar tab → verify post appears on tomorrow's date cell.
11. (Simulate) Trigger publish via scheduler or API call `POST /api/portal/social/posts/:id/publish`.
12. Navigate to Posts tab → verify status changed to "Published".
13. (Seed) Add engagement data to the published post.
14. Navigate to Analytics tab → verify post's engagement metrics visible.
15. Apply date range filter including today → verify published post's metrics displayed.

| **Expected Result** |
- Post created as draft, then scheduled successfully.
- Real-time preview renders correct content for both platforms.
- Prediction score visible and in expected range.
- Post visible on Calendar at scheduled date.
- After publishing, status changes to "Published".
- Analytics tab shows engagement metrics for the published post.
- Date range filter works correctly with new data.
- No console errors throughout the entire flow.

---

#### CF1-002: Post Lifecycle with AI Content Generation
| Field | Value |
|-------|-------|
| **ID** | CF1-002 |
| **Priority** | P0 |
| **Type** | E2E |
| **Steps** |
1. Navigate to CreatePostTab.
2. Select a brand voice profile.
3. Enter prompt: "Promote a new listing at 456 Oak Ave, 4BR, $350K".
4. Click "Generate" (AI compose).
5. Wait for AI-generated content to populate.
6. Verify content field is populated with AI-generated text.
7. Verify real-time preview updates.
8. Verify prediction score reflects the generated content.
9. Edit AI content slightly (add a personal touch).
10. Select platforms and schedule for future date.
11. Save.

| **Expected Result** |
- AI generates relevant real estate content matching brand voice.
- Preview updates in real-time as AI content populates.
- Prediction score reflects content quality.
- Post saved successfully with AI-generated content.

---

#### CF1-003: Post Lifecycle with Media Reordering
| Field | Value |
|-------|-------|
| **ID** | CF1-003 |
| **Priority** | P1 |
| **Type** | E2E |
| **Steps** |
1. Create a new post with 4 images.
2. Reorder images via drag-and-drop: move image 4 to position 1.
3. Verify preview reflects new order.
4. Save as draft.
5. Navigate to Posts tab.
6. Open the saved draft.
7. Verify media order is preserved [4, 2, 3, 1].
8. Duplicate the post.
9. Verify duplicate has same media order [4, 2, 3, 1].

| **Expected Result** |
- DnD reorder works smoothly.
- Media order persists through save, reload, and duplication.

---

### 2.2 Critical Flow 2: Approval Workflow (Multi-Level)

**File:** `e2e/critical-flow-approval.spec.ts`

#### CF2-001: Submit → L1 Approve → L2 Approve → Schedule
| Field | Value |
|-------|-------|
| **ID** | CF2-001 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | ClientB with 2-level approval chain. Creator, L1 approver, L2 approver users available. |
| **Steps** |
1. **Creator:** Create and save a draft post with content, platforms, and media.
2. **Creator:** Click "Submit for Approval".
3. **Verify:** Post status → "Pending Approval (Level 1 of 2)".
4. **Verify:** Post becomes read-only for creator.
5. **Verify:** Email sent to L1 approver (test SMTP).
6. **L1 Approver:** Navigate to ApprovalQueueTab → locate the post.
7. **L1 Approver:** Enter comment "Content approved" → click "Approve".
8. **Verify:** Post advances to "Pending Approval (Level 2 of 2)".
9. **Verify:** Email sent to L2 approver (not creator).
10. **L2 Approver:** Navigate to ApprovalQueueTab → locate the post.
11. **L2 Approver:** Enter comment "Final approval" → click "Approve".
12. **Verify:** Post status → "Approved" (green badge).
13. **Verify:** Creator receives "fully approved" email.
14. **Creator:** Schedule the approved post for future date.
15. **Verify:** Post status → "Scheduled"; no additional approval required.

| **Expected Result** |
- Full 2-level approval chain traversed correctly.
- Each level transition triggers correct email notification.
- Post becomes publishable only after final approval.
- Scheduling works normally after full approval.
- Approval history shows complete chain: Submit → L1 Approve → L2 Approve.

---

#### CF2-002: Submit → L1 Reject → Edit → Re-submit → Approve
| Field | Value |
|-------|-------|
| **ID** | CF2-002 |
| **Priority** | P0 |
| **Type** | E2E |
| **Steps** |
1. **Creator:** Submit post for approval.
2. **L1 Approver:** Reject with comment: "Needs stronger CTA".
3. **Verify:** Post status → "Rejected" (red badge).
4. **Verify:** Creator receives rejection email with comment.
5. **Creator:** Open rejected post → verify rejection feedback visible.
6. **Creator:** Edit content to add CTA.
7. **Creator:** Click "Re-submit for Approval".
8. **Verify:** New approval cycle starts from L1.
9. **L1 Approver:** Approve.
10. **(If 2-level)** **L2 Approver:** Approve.
11. **Verify:** Post fully approved.

| **Expected Result** |
- Rejection → re-submit cycle works end-to-end.
- Re-submission restarts from L1 (not L2).
- Approval history preserves full audit trail.

---

#### CF2-003: Approval Bypass for Clients Without Config
| Field | Value |
|-------|-------|
| **ID** | CF2-003 |
| **Priority** | P0 |
| **Type** | E2E |
| **Steps** |
1. Login as portal user for ClientC (no approval config).
2. Create a draft post.
3. Verify "Submit for Approval" button does NOT appear.
4. Click "Schedule" directly → post scheduled.
5. Click "Publish Now" directly → post published.

| **Expected Result** |
- No approval workflow for unconfigured clients.
- Post lifecycle is identical to pre-Phase 3 behavior.

---

### 2.3 Critical Flow 3: Bulk Operations + Calendar

**File:** `e2e/critical-flow-bulk-calendar.spec.ts`

#### CF3-001: Bulk Select → Schedule → Calendar Verification
| Field | Value |
|-------|-------|
| **ID** | CF3-001 |
| **Priority** | P0 |
| **Type** | E2E |
| **Steps** |
1. Ensure 5+ draft posts exist.
2. Navigate to PostsTab.
3. Select 4 draft posts using checkboxes.
4. Click "Schedule" bulk action.
5. Pick a date 7 days from now.
6. Confirm scheduling.
7. Navigate to ContentCalendarTab.
8. Navigate to the scheduled date.
9. Verify all 4 posts appear on that calendar cell.

| **Expected Result** |
- All 4 posts transition from draft to scheduled.
- Calendar shows 4 posts on the selected date.
- Post cards on calendar display titles and platform badges.

---

#### CF3-002: Bulk Delete → Undo → Calendar Sync
| Field | Value |
|-------|-------|
| **ID** | CF3-002 |
| **Priority** | P1 |
| **Type** | E2E |
| **Steps** |
1. Ensure 3 scheduled posts exist on a specific date.
2. Navigate to PostsTab.
3. Select all 3 posts.
4. Bulk delete → confirm.
5. Verify posts removed from PostsTab.
6. Navigate to Calendar → verify posts removed from calendar.
7. Click "Undo" within 10 seconds.
8. Verify posts restored in PostsTab.
9. Navigate to Calendar → verify posts restored on calendar.

| **Expected Result** |
- Deletion propagates to calendar view instantly.
- Undo restores posts in both PostsTab and Calendar.

---

#### CF3-003: Calendar Drag-Reschedule → PostsTab Sync
| Field | Value |
|-------|-------|
| **ID** | CF3-003 |
| **Priority** | P0 |
| **Type** | E2E |
| **Steps** |
1. Create a scheduled post for March 10.
2. Navigate to ContentCalendarTab.
3. Drag the post from March 10 to March 17.
4. Verify the post appears on March 17.
5. Navigate to PostsTab.
6. Verify the post's scheduled date shows March 17.

| **Expected Result** |
- Calendar drag updates both calendar and post record.
- PostsTab reflects the new scheduled date.

---

### 2.4 Critical Flow 4: Hashtag Analytics + Prediction Loop

**File:** `e2e/critical-flow-analytics-prediction.spec.ts`

#### CF4-001: View Hashtag Performance → Use Insights in New Post
| Field | Value |
|-------|-------|
| **ID** | CF4-001 |
| **Priority** | P1 |
| **Type** | E2E |
| **Steps** |
1. Navigate to AnalyticsTab → Hashtags section.
2. Note top-performing hashtag (e.g., "#PittsburghRealEstate", engagement rate 4.2%).
3. Click on the hashtag → view time-series chart.
4. Verify chart renders with daily data points.
5. Navigate to CreatePostTab.
6. Enter post content using the top-performing hashtag.
7. Observe prediction score — hashtag strength factor should be positive.
8. Remove the hashtag.
9. Observe prediction score decrease (hashtag factor → neutral/negative).

| **Expected Result** |
- Hashtag analytics accurately display performance.
- Prediction engine considers hashtag strength based on historical data.
- Adding/removing high-performing hashtags visibly affects prediction score.

---

#### CF4-002: Publish Post → Verify Prediction Accuracy Tracking
| Field | Value |
|-------|-------|
| **ID** | CF4-002 |
| **Priority** | P1 |
| **Type** | E2E |
| **Steps** |
1. Create a post, note the prediction score (e.g., 72).
2. Publish the post.
3. Verify `prediction_records` row created with `predictedScore = 72`, `actualScore = NULL`.
4. (Seed) Add engagement data to the post simulating 48h post-publish.
5. Trigger accuracy calculation (API or cron).
6. Verify `prediction_records` updated with `actualScore` populated.
7. Navigate to Analytics → Prediction Accuracy section.
8. Verify the prediction appears in accuracy metrics.

| **Expected Result** |
- Prediction stored on publish.
- Accuracy calculated after engagement data available.
- Accuracy dashboard reflects the new data point.

---

### 2.5 Critical Flow 5: Portal User Complete Session

**File:** `e2e/critical-flow-portal-session.spec.ts`

#### CF5-001: Login → Dashboard → Create → Review → Publish → Logout
| Field | Value |
|-------|-------|
| **ID** | CF5-001 |
| **Priority** | P0 |
| **Type** | E2E |
| **Steps** |
1. Navigate to `/:clientSlug` (portal login page).
2. Login with valid credentials.
3. Verify redirect to Dashboard tab.
4. Verify Dashboard shows summary stats (total posts, scheduled, engagement).
5. Navigate to CreatePostTab.
6. Create a post with content, platform, and image.
7. Save as draft.
8. Navigate to PostsTab → verify draft appears.
9. Open the draft → publish directly (ClientC, no approval).
10. Navigate to Analytics → verify published post shows.
11. Navigate to Campaigns → verify campaigns list loads.
12. Navigate to Accounts → verify accounts list loads.
13. Navigate to BrandVoice → verify profiles load.
14. Navigate to Calendar → verify calendar renders with posts.
15. Session ends (logout or timeout).

| **Expected Result** |
- Complete portal user session with all features functional.
- All 8 tabs load without errors.
- All lazy-loaded tabs trigger Suspense fallback correctly.
- No console errors throughout the session.

---

## P4-Q003 — Bug Bash: P0/P1 Issue Catalog

**Priority:** P1  
**Estimate:** 4h  
**Dependency:** P4-Q001 (regression execution reveals issues)  
**Deliverable:** Categorized bug list with severity, reproduction steps, and suggested fix

---

### 3.1 Bug Bash Methodology

#### Focus Areas
| Area | What to Look For | Priority |
|------|------------------|----------|
| **Data Integrity** | Posts/campaigns lost on save, media references broken, approval state corruption | P0 |
| **Auth & Security** | Portal user data leakage across clients, admin route access without auth, XSS vectors | P0 |
| **State Management** | Stale TanStack Query cache, optimistic updates not rolling back, stale UI after mutation | P0 |
| **Edge Cases** | Empty states showing errors, very long content breaking layout, special chars in hashtags | P1 |
| **Performance** | DnD jank, slow tab switches (>200ms), CLS during skeleton→content transition | P1 |
| **UX Polish** | Missing loading indicators, confusing error messages, broken keyboard navigation | P1 |
| **Mobile/Tablet** | Layout breakage on tablet viewports, touch DnD failures, collapsible panels not working | P1 |

#### Severity Classification

| Severity | Definition | SLA |
|----------|-----------|-----|
| **P0 — Critical** | Feature completely broken, data loss, security vulnerability, or prevents launch | Must fix before launch |
| **P1 — Major** | Significant workflow disruption, degraded UX on primary flows, accessibility violations | Should fix before launch |
| **P2 — Minor** | Cosmetic issues, edge cases, minor inconveniences | Fix in post-launch sprint |
| **P3 — Trivial** | Nitpick, polish, nice-to-have improvements | Backlog |

---

### 3.2 Structured Bug Exploration Scenarios

#### 3.2.1 Rapid-Fire State Mutations

| ID | Scenario | Steps | Look For |
|----|----------|-------|----------|
| BB-001 | Rapid post creation | Create 5 posts in quick succession (click Save → immediately start next) | Duplicate posts, missed saves, stale list |
| BB-002 | Rapid tab switching | Switch tabs quickly: Dashboard → Posts → Calendar → Analytics → Dashboard (within 2s) | Blank tabs, errors, stale data |
| BB-003 | Create during delete | Start creating a post → switch to PostsTab → delete another post → switch back to CreatePost | Lost work, state confusion |
| BB-004 | Concurrent bulk + single | Select 3 posts for bulk delete → while loading, click duplicate on another post | Race conditions, double-counting |
| BB-005 | Approval + edit race | Submit for approval → immediately open PostEditDialog → attempt edit | Edit should be blocked; verify no partial state |

#### 3.2.2 Edge Case Content

| ID | Scenario | Steps | Look For |
|----|----------|-------|----------|
| BB-006 | Empty post | Try to save a post with no content and no platforms | Validation prevents save; helpful error message |
| BB-007 | Maximum content | Paste 10,000 characters of content | No crash; preview handles overflow; auto-save works |
| BB-008 | Unicode/emoji heavy | Content: "🏠🔑💰🎉🏗️ 日本語テスト العربية" | Correct rendering in preview, PostsTab, calendar |
| BB-009 | HTML injection in title | Post content: `<img src=x onerror=alert(1)>` | Rendered as text, never executed |
| BB-010 | URL-only content | Content is just "https://steelcity-ai.com" | Preview renders correctly; no broken layout |
| BB-011 | Hashtag edge cases | Hashtags: "#", "##double", "#CaféVibes", "#123numbers", "#a" | Validation handles gracefully; no API errors |

#### 3.2.3 Network Failure Scenarios

| ID | Scenario | Steps | Look For |
|----|----------|-------|----------|
| BB-012 | Save post offline | Disable network → attempt to save post | Error toast; no silent data loss; retry guidance |
| BB-013 | Delete post offline | Disable network → delete post → optimistic update → verify rollback | Post reappears after optimistic removal; error toast |
| BB-014 | Load tab offline | Disable network → switch to Analytics tab | Error boundary or empty state (not infinite spinner) |
| BB-015 | Approval offline | Disable network → submit for approval | Optimistic update rolls back; error toast |
| BB-016 | Prediction timeout | Throttle prediction API to 10s delay | Loading skeleton → timeout message ("taking longer than expected") |

#### 3.2.4 Authentication & Authorization

| ID | Scenario | Steps | Look For |
|----|----------|-------|----------|
| BB-017 | Session expiry during operation | Let session expire → attempt to save post | Redirect to login or clear error; no silent failure |
| BB-018 | Portal user accesses admin routes | Portal user navigates to `/admin/social-media` directly | 401/403 or redirect to portal login |
| BB-019 | Cross-client data access | Portal user for ClientA calls `GET /api/portal/social/posts?clientId=clientB-id` | Only ClientA's data returned; clientId param ignored or rejected |
| BB-020 | Admin API without auth | Call `POST /api/admin/social/posts` without session | 401 response |

#### 3.2.5 Multi-Browser/Tab Scenarios

| ID | Scenario | Steps | Look For |
|----|----------|-------|----------|
| BB-021 | Same post edited in 2 tabs | Open same draft in 2 tabs → edit in both → save from both | No data corruption; later save wins; no error |
| BB-022 | Approval in 2 tabs | Approver opens ApprovalQueue in 2 tabs → approve in Tab A → attempt approve in Tab B | Tab B shows 409 or "already processed"; no duplicate |
| BB-023 | Auto-save draft in 2 tabs | Open same draft in 2 tabs → edit in both → auto-save fires | No data loss; consistent final state |

---

### 3.3 Bug Report Template

```markdown
### BUG-XXXX: [Short Title]

**Severity:** P0 / P1 / P2 / P3
**Component:** [Tab/Feature name]
**Found By:** [QA / Bug Bash]
**Date:** 2026-03-XX
**Status:** OPEN

#### Environment
- Browser: Chrome 130 / Firefox 124 / Safari 17.4
- Viewport: 1920×1080 / 1024×768 / 375×812
- Route: /clientSlug/social-media?tab=posts

#### Steps to Reproduce
1. ...
2. ...
3. ...

#### Expected Result
- ...

#### Actual Result
- ...
- [Screenshot/Recording]

#### Console Errors
```
[paste any console errors]
```

#### Suggested Fix
- ...

#### Related Test Cases
- REG-P2-014, CF1-001, etc.
```

---

### 3.4 Known Risk Areas (Pre-Bug-Bash)

Based on Phase 1-3 risk registers, these areas deserve extra scrutiny:

| Area | Risk | What Could Go Wrong |
|------|------|-------------------|
| SocialMediaPage.tsx (admin) | 4,075 lines — monolithic | Performance, state management bugs, difficult to debug |
| Meta OAuth callbacks | Token expiry, missing pages | Silent auth failures, stale tokens |
| DnD + Shadcn overlays | z-index/event conflicts | DnD broken inside dialogs, dropdowns |
| Multi-level approval state machine | Complex state transitions | Stale state, bypassed levels, orphaned requests |
| Prediction API with mock LLM | Deterministic mock vs. real AI | Inconsistent scores, timeout handling |
| Bulk actions with optimistic updates | Race conditions, partial failures | Inconsistent UI state, lost deletions |
| Calendar timezone handling | EST vs UTC vs server time | Off-by-one day errors, wrong time display |

---

## P4-Q004 — Pre-Launch Checklist Verification

**Priority:** P0  
**Estimate:** 2h  
**Dependency:** P4-Q003 (no open P0/P1 bugs)  
**Pass Criteria:** ALL items checked and verified

---

### 4.1 Code Quality Gates

| # | Checkpoint | Command / Method | Pass Criteria | Status |
|---|-----------|-----------------|---------------|--------|
| 1 | TypeScript compiles with zero errors | `npx tsc --noEmit` | Exit code 0 | ☐ |
| 2 | No component exceeds 500 lines | `find client/src/pages/portal/social client/src/components/social -name '*.tsx' \| xargs wc -l \| sort -rn \| head -20` | All files < 500 lines | ☐ |
| 3 | No `any` types in social components | `grep -rn ': any' client/src/pages/portal/social/ client/src/components/social/ client/src/hooks/social/ --include='*.ts' --include='*.tsx' \| grep -v test \| grep -v '__tests__'` | Zero matches (or only safe exceptions) | ☐ |
| 4 | All lazy-loaded tabs use React.lazy | Review `PortalSocialMedia.tsx` imports | PostsTab, CreatePostTab, CampaignsTab, AccountsTab, BrandVoiceTab, ContentCalendarTab, AnalyticsTab all use `lazy()` | ☐ |
| 5 | Error boundaries on all tab routes | Review `PortalSocialMedia.tsx` render | All `<TabsContent>` wrapped in `<SafeTab>` with `<ErrorBoundary>` + `<Suspense>` | ☐ |
| 6 | Shared hooks extracted (no inline queries) | Review hooks/social/ | `use-social-posts.ts`, `use-social-campaigns.ts`, `use-social-accounts.ts`, `use-brand-voice.ts`, etc. all exist and are imported by tab components | ☐ |
| 7 | Conventional commits on SMP-Updates branch | `git log --oneline SMP-Updates ^main \| head -20` | All commits follow `feat:`, `fix:`, `refactor:`, etc. format | ☐ |

---

### 4.2 Performance Gates

| # | Checkpoint | Method | Pass Criteria | Status |
|---|-----------|--------|---------------|--------|
| 8 | Production build succeeds | `npm run build` | Exit code 0; no errors | ☐ |
| 9 | Bundle size < 500KB initial load | `ls -lh dist/public/assets/*.js` + Vite bundle analysis | Main JS chunk < 500KB (gzipped < 150KB) | ☐ |
| 10 | Lighthouse Performance ≥ 90 | Run Lighthouse on staging (Desktop) | Performance score ≥ 90 | ☐ |
| 11 | Lighthouse Accessibility ≥ 90 | Run Lighthouse on staging (Desktop) | Accessibility score ≥ 90 | ☐ |
| 12 | Lighthouse Best Practices ≥ 90 | Run Lighthouse on staging (Desktop) | Best Practices score ≥ 90 | ☐ |
| 13 | Lighthouse SEO ≥ 90 | Run Lighthouse on staging (Desktop) | SEO score ≥ 90 | ☐ |
| 14 | Tab switch < 100ms (lazy cache hit) | Chrome DevTools Performance → navigate between tabs | Tab content renders < 100ms after click | ☐ |
| 15 | DnD frame rate ≥ 60fps | Chrome DevTools Performance → drag media item | ≥ 60fps sustained during drag | ☐ |
| 16 | Preview update latency < 100ms | Type in CreatePostTab → measure debounced preview update | Preview reflects content < 100ms after last keystroke | ☐ |
| 17 | Skeleton → content CLS = 0 | Measure CLS during tab loads | Cumulative Layout Shift = 0 for all skeleton transitions | ☐ |
| 18 | Initial page load (LCP) < 2s | Lighthouse on staging | Largest Contentful Paint < 2s | ☐ |

---

### 4.3 Accessibility Gates (WCAG 2.1 AA)

| # | Checkpoint | Method | Pass Criteria | Status |
|---|-----------|--------|---------------|--------|
| 19 | Keyboard navigation: all tabs | Tab + Enter through all 8 social media tabs | All tabs reachable and activatable via keyboard | ☐ |
| 20 | Keyboard navigation: post creation | Tab through all form fields in CreatePostTab | All inputs, selects, buttons focusable in logical order | ☐ |
| 21 | Keyboard navigation: bulk actions | Tab to checkboxes → Space to select → Tab to action bar | Checkboxes, Select All, action buttons all keyboard accessible | ☐ |
| 22 | Keyboard DnD media reorder | Focus media → Space (pick up) → Arrow (move) → Space (drop) | Media reorders via keyboard; screen reader announces pick/move/drop | ☐ |
| 23 | Focus indicators visible | Tab through interactive elements | Visible focus ring on all buttons, links, inputs, checkboxes | ☐ |
| 24 | Color contrast ≥ 4.5:1 (text) | axe-core scan or Lighthouse | All text meets WCAG AA contrast ratio | ☐ |
| 25 | Color contrast ≥ 3:1 (large text/UI) | axe-core scan | Large text and UI components meet contrast ratio | ☐ |
| 26 | Touch targets ≥ 44×44px | Inspect interactive elements on tablet | All buttons, checkboxes, handles meet minimum size | ☐ |
| 27 | Screen reader: tab navigation | VoiceOver/NVDA → navigate tabs | Tabs announced correctly; active tab state announced | ☐ |
| 28 | Screen reader: approval badges | VoiceOver/NVDA → focus on post with approval badge | Badge status read aloud (e.g., "Pending Approval") | ☐ |
| 29 | Screen reader: bulk action bar | VoiceOver/NVDA → select posts | `aria-live="polite"` announces "X posts selected" | ☐ |
| 30 | Screen reader: skeletons | VoiceOver/NVDA → navigate to loading tab | `aria-busy="true"` announced; "Loading content" or equivalent | ☐ |
| 31 | axe-core scan: zero critical violations | Run `axe-core` on all 8 tabs | 0 critical/serious violations | ☐ |
| 32 | Images have alt text | Inspect all `<img>` elements | All images have meaningful `alt` attributes (or `alt=""` for decorative) | ☐ |
| 33 | Form labels present | Inspect all form inputs | All `<input>`, `<select>`, `<textarea>` have associated `<label>` or `aria-label` | ☐ |

---

### 4.4 Testing Gates

| # | Checkpoint | Method | Pass Criteria | Status |
|---|-----------|--------|---------------|--------|
| 34 | P4-Q001 regression suite: all P0 pass | Execute regression suite | 100% P0 tests pass | ☐ |
| 35 | P4-Q001 regression suite: ≥95% P1 pass | Execute regression suite | ≥ 95% P1 tests pass | ☐ |
| 36 | P4-Q002 E2E critical flows: all pass | Execute Playwright suite | All 5 critical flows pass | ☐ |
| 37 | P4-Q003 bug bash: zero P0 bugs open | Bug tracker review | No P0 severity bugs unresolved | ☐ |
| 38 | P4-Q003 bug bash: zero P1 bugs open | Bug tracker review | No P1 severity bugs unresolved (or explicitly deferred with approval) | ☐ |
| 39 | Existing test suites pass | `npx jest --passWithNoTests` or `npx vitest run` | All existing unit/integration tests pass | ☐ |
| 40 | Server routes test passes | `npx jest server/routes.test.ts` | All API route tests pass | ☐ |

---

### 4.5 Security Gates

| # | Checkpoint | Method | Pass Criteria | Status |
|---|-----------|--------|---------------|--------|
| 41 | No hardcoded secrets in source | `grep -rn 'API_KEY\|SECRET\|PASSWORD\|TOKEN' client/ server/ shared/ --include='*.ts' --include='*.tsx' \| grep -v node_modules \| grep -v '.env'` | No real secrets in source (only env references) | ☐ |
| 42 | Portal auth enforced on all portal routes | Review `social-media-routes.ts` | All `/api/portal/*` routes use `requirePortalAuth` middleware | ☐ |
| 43 | Admin auth enforced on all admin routes | Review `social-media-routes.ts` | All `/api/admin/*` routes use `requireAuth` middleware | ☐ |
| 44 | Portal user data isolation | API test: portal user for ClientA calls GET posts → only ClientA data | No cross-client data leakage | ☐ |
| 45 | XSS prevention in post preview | Input `<script>alert(1)</script>` → rendered as text | No script execution in preview, PostsTab, or calendar | ☐ |
| 46 | CSRF protection | Check session configuration | Session cookies have `httpOnly`, `secure`, `sameSite` flags | ☐ |
| 47 | File upload validation | Upload non-media file (e.g., `.exe`, `.html`) | Rejected by multer filter; error returned | ☐ |
| 48 | File upload size limit | Upload file > 50MB | Rejected; error message shown | ☐ |

---

### 4.6 Documentation Gates

| # | Checkpoint | Method | Pass Criteria | Status |
|---|-----------|--------|---------------|--------|
| 49 | CHANGELOG.md updated | Review `CHANGELOG.md` | All Phase 1-3 features documented with dates and categories | ☐ |
| 50 | README.md includes setup instructions | Review `README.md` | Clone → install → configure → run instructions present and accurate | ☐ |
| 51 | API endpoints documented | Review docs or inline comments | All social media API endpoints have description, params, response format | ☐ |
| 52 | ADR-001 architecture doc current | Review `docs/ADR-001-social-media-component-architecture.md` | Reflects current component structure (post-Phase 3) | ☐ |

---

### 4.7 Deployment Gates

| # | Checkpoint | Method | Pass Criteria | Status |
|---|-----------|--------|---------------|--------|
| 53 | Production build runs successfully | `npm run build && npm start` | Server starts, serves client assets, API responds | ☐ |
| 54 | Database migrations applied | `npm run db:push` on staging | No migration errors; new tables (prediction_records, notification_preferences, social_hashtag_metrics) present | ☐ |
| 55 | Environment variables documented | Check `.env.example` or docs | All required env vars listed with descriptions | ☐ |
| 56 | Post-scheduler starts without errors | Check server logs on startup | `startPostScheduler()` initializes; no unhandled promise rejections | ☐ |
| 57 | WebSocket connections work | Open social media page → check WS connection | WebSocket connects; no connection errors in console | ☐ |

---

### 4.8 Launch Gate Summary

| Category | Total Checks | Must Pass | Status |
|----------|-------------|-----------|--------|
| Code Quality | 7 | All | ☐ |
| Performance | 11 | All except #15 (P1) | ☐ |
| Accessibility | 15 | All except #26, #32 (P2) | ☐ |
| Testing | 7 | All | ☐ |
| Security | 8 | All | ☐ |
| Documentation | 4 | #49, #50 required; #51, #52 recommended | ☐ |
| Deployment | 5 | All | ☐ |
| **TOTAL** | **57** | **≥52 required** | ☐ |

### 🚦 Launch Decision Matrix

| Condition | Decision |
|-----------|----------|
| All 57 checks pass | ✅ **GO** — Launch to production |
| 52-56 pass, remaining are P2+ | ✅ **GO** — Launch with known issues documented |
| 45-51 pass, remaining are P1 | ⚠️ **CONDITIONAL GO** — Requires team approval; fix timeline committed |
| < 45 pass OR any P0 fails | ❌ **NO GO** — Fix issues and re-validate |

---

## Appendices

### Appendix A: Test Case ID Conventions

| Prefix | Area | Phase |
|--------|------|-------|
| `REG-P1-` | Phase 1 regression (architecture + CRUD) | P4-Q001 |
| `REG-P2-` | Phase 2 regression (DnD, bulk, calendar, preview, templates) | P4-Q001 |
| `REG-P3-` | Phase 3 regression (approval, hashtags, predictions) | P4-Q001 |
| `REG-INT-` | Cross-phase integration regression | P4-Q001 |
| `CF1-` through `CF5-` | Critical flow E2E (5 flows) | P4-Q002 |
| `BB-` | Bug bash exploration scenarios | P4-Q003 |
| Checklist #1-57 | Pre-launch verification items | P4-Q004 |

### Appendix B: Component Inventory

#### Portal Social Media Tabs (PortalSocialMedia.tsx)
| Tab | Component | File | Lines | Lazy Loaded |
|-----|-----------|------|-------|-------------|
| Dashboard | DashboardTab | `pages/portal/social/DashboardTab.tsx` | 227 | No (eagerly loaded) |
| Posts | PostsTab | `pages/portal/social/PostsTab.tsx` | 822 | Yes |
| Create Post | CreatePostTab | `pages/portal/social/CreatePostTab.tsx` | 763 | Yes |
| Campaigns | CampaignsTab | `pages/portal/social/CampaignsTab.tsx` | 444 | Yes |
| Accounts | AccountsTab | `pages/portal/social/AccountsTab.tsx` | 284 | Yes |
| Brand Voice | BrandVoiceTab | `pages/portal/social/BrandVoiceTab.tsx` | 360 | Yes |
| Calendar | ContentCalendarTab | `pages/portal/social/ContentCalendarTab.tsx` | 549 | Yes |
| Analytics | AnalyticsTab | `pages/portal/social/AnalyticsTab.tsx` | 579 | Yes |

#### Shared Social Components (components/social/)
| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| SortableMediaGrid | SortableMediaGrid.tsx | 172 | DnD media reordering |
| RealTimePreview | RealTimePreview.tsx | 217 | Live post preview |
| TemplatePicker | TemplatePicker.tsx | 267 | Template library browser |
| DraftBanner | DraftBanner.tsx | 102 | Auto-save status |
| UndoSnackbar | UndoSnackbar.tsx | 78 | Undo delete toast |
| ApprovalStatusBadge | ApprovalStatusBadge.tsx | 56 | Color-coded approval badge |
| ApprovalActionButtons | ApprovalActionButtons.tsx | 156 | Approve/Reject/Request Changes |
| ApprovalHistoryTimeline | ApprovalHistoryTimeline.tsx | 167 | Audit trail timeline |
| NotificationPreferencesPanel | NotificationPreferencesPanel.tsx | 198 | Email notification settings |
| HashtagDashboard | HashtagDashboard.tsx | 297 | Hashtag analytics main |
| HashtagRankingTable | HashtagRankingTable.tsx | 285 | Sortable hashtag table |
| HashtagPerformanceCards | HashtagPerformanceCards.tsx | 212 | Summary metric cards |
| HashtagTrendChart | HashtagTrendChart.tsx | 169 | Time-series line chart |
| PredictionResultDisplay | PredictionResultDisplay.tsx | 337 | Score gauge + factors |
| Skeletons | Skeletons.tsx | 408 | Loading skeleton variants |

#### Shared Hooks (hooks/social/)
| Hook | File | Lines | Purpose |
|------|------|-------|---------|
| use-social-posts | use-social-posts.ts | 247 | Post CRUD queries/mutations |
| use-post-prediction | use-post-prediction.ts | 189 | Prediction API integration |
| use-approval-workflow | use-approval-workflow.ts | 180 | Approval submit/respond hooks |
| use-social-templates | use-social-templates.ts | 160 | Template CRUD |
| use-social-campaigns | use-social-campaigns.ts | 153 | Campaign CRUD |
| use-draft-autosave | use-draft-autosave.ts | 124 | Auto-save draft timer |
| use-approval-notification | use-approval-notification.ts | 90 | In-app approval alerts |
| use-media-upload | use-media-upload.ts | 74 | File upload handling |
| use-hashtag-analytics | use-hashtag-analytics.ts | 67 | Hashtag metrics queries |
| use-brand-voice | use-brand-voice.ts | 58 | Brand voice CRUD |
| use-social-ai | use-social-ai.ts | 54 | AI generation hooks |
| use-social-accounts | use-social-accounts.ts | 53 | Account CRUD |

### Appendix C: API Endpoint Coverage Map

| Endpoint Group | Count | Auth | Regression Coverage |
|----------------|-------|------|-------------------|
| Admin Social Accounts | 4 (CRUD) | `requireAuth` | REG-P1-019/020 |
| Admin Social Campaigns | 5 (CRUD + detail) | `requireAuth` | REG-P1-016/017/018 |
| Admin Social Posts | 5 (CRUD + detail) | `requireAuth` | REG-P1-013/014/015 |
| Admin Brand Voice | 4 (CRUD) | `requireAuth` | REG-P1-021/022/023 |
| Admin AI Generation | 7 (generate, vibe, review, orchestrate, autonomous, research, design) | `requireAuth` | REG-P1-027-032 |
| Admin Publish | 1 (POST) | `requireAuth` | CF1-001 |
| Admin Media Upload | 3 (upload, from-url, from-youtube) | `requireAuth` | CF1-001 |
| Admin Approval | 5 (request, approve, reject, request-changes, history) | `requireAuth` | REG-P3-001-019 |
| Admin Hashtag Analytics | 2 (list + detail) | `requireAuth` | REG-P3-020-028 |
| Admin Predictions | 4 (predict, get, track, accuracy) | `requireAuth` | REG-P3-029-039 |
| Admin Notification Prefs | 2 (GET + PUT) | `requireAuth` | REG-P3-019 |
| Portal equivalents | ~30 (mirrors admin) | `requirePortalAuth` | REG-P1-033-036 |
| **Total** | ~72 endpoints | | |

### Appendix D: Test Execution Schedule

| Day | Activity | Duration | Deliverable |
|-----|----------|----------|-------------|
| Day 1 (AM) | P4-Q001: Phase 1 regression | 3h | REG-P1-001 through REG-P1-036 results |
| Day 1 (PM) | P4-Q001: Phase 2 regression | 3h | REG-P2-001 through REG-P2-046 results |
| Day 2 (AM) | P4-Q001: Phase 3 regression + cross-phase | 4h | REG-P3-001 through REG-INT-012 results |
| Day 2 (PM) | P4-Q002: Critical flow E2E | 4h | CF1 through CF5 Playwright results |
| Day 3 (AM) | P4-Q003: Bug bash | 4h | Bug report document |
| Day 3 (PM) | P4-Q004: Pre-launch checklist | 2h | Signed-off checklist (57 items) |
| Day 4 | Bug fix verification (if needed) | 4h | Retest failed cases |

### Appendix E: Test Execution Results Template

```markdown
## P4 QA Execution Results — [Date]

### Summary
| Suite | Total | Passed | Failed | Blocked | Pass Rate |
|-------|-------|--------|--------|---------|-----------|
| P1 Regression | 36 | | | | |
| P2 Regression | 46 | | | | |
| P3 Regression | 39 | | | | |
| Cross-Phase Integration | 12 | | | | |
| Critical Flows (E2E) | 12 | | | | |
| Pre-Launch Checklist | 57 | | | | |
| **Total** | **202** | | | | |

### P0 Failures
| Test ID | Description | Root Cause | Assigned To | ETA |
|---------|-------------|------------|-------------|-----|

### P1 Failures
| Test ID | Description | Root Cause | Assigned To | ETA |
|---------|-------------|------------|-------------|-----|

### Bugs Found
| Bug ID | Severity | Title | Component | Status |
|--------|----------|-------|-----------|--------|

### Launch Recommendation
☐ GO / ☐ CONDITIONAL GO / ☐ NO GO

**Signed:**
- QA Lead: ___________  Date: ___________
- Build Lead: ___________  Date: ___________
- Project Lead: ___________  Date: ___________
```

### Appendix F: Risk Coverage Matrix

| Risk (from Phase 4 Risk Register) | Covered By |
|-----------------------------------|-----------|
| Regression bugs discovered late | P4-Q001 (133 regression cases across 3 phases) |
| Bundle size exceeds target | Checklist #9 (bundle < 500KB) |
| Accessibility issues require rework | Checklist #19-33 (15 accessibility checks) |
| Client pilot reveals issues | CF5-001 (complete portal session E2E) |
| Approval workflow complexity | CF2-001, CF2-002, CF2-003 + REG-P3-001-019 (19 approval tests) |
| Cross-feature state corruption | REG-INT-001 through REG-INT-012 (12 integration tests) |
| DnD library conflicts with Shadcn | BB scenario during bug bash |
| Meta OAuth token expiry | BB-017, BB-018 (auth scenarios) |

---

*End of Phase 4 Test Specifications — P4-Q001, P4-Q002, P4-Q003, P4-Q004*

**Total Test Coverage:**
- **133** regression test cases (P4-Q001)
- **12** critical flow E2E test scenarios (P4-Q002)
- **23** structured bug bash scenarios (P4-Q003)
- **57** pre-launch checklist items (P4-Q004)
- **= 225 total verification points**
