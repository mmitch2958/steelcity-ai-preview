# SMP-Updates User Story Mapping
**Project:** Client Portal Social Media App Refactor  
**Target Users:** Realtors managing social media content  
**Generated:** 2025-03-04  
**Total Stories:** 20 (22 issues consolidated)

---

## 📋 Phase 1: Architectural Foundation (P0)
**Goal:** Establish stable, maintainable codebase foundation  
**Duration:** 3-4 weeks  
**Department:** Build

### US-001: Component Splitting and Lazy Loading
**As a** developer  
**I want** the 3,788-line PortalSocialMedia.tsx split into modular components with lazy loading  
**So that** the codebase is maintainable, testable, and performs better for end users

**Acceptance Criteria:**
- [ ] Main component reduced to <500 lines (orchestration only)
- [ ] Each tab extracted to separate component (CreatePostTab, PostsTab, CalendarTab, AnalyticsTab, SettingsTab)
- [ ] Shared UI components extracted (MediaUploader, PostPreview, PlatformSelector, etc.)
- [ ] React.lazy() + Suspense implemented for tab components
- [ ] Code-splitting results in initial bundle <200KB
- [ ] All components have single responsibility
- [ ] Component tree documented in architecture diagram

**Priority:** P0  
**Phase:** 1  
**Department:** Build  
**Estimated Effort:** 24h

**Edge Cases:**
- Agent integration points preserved during split
- Tab state persists across lazy-loaded component unmount/remount
- Suspense fallback doesn't cause layout shift

---

### US-002: TypeScript Interface Definitions
**As a** developer  
**I want** all `any` types replaced with proper TypeScript interfaces  
**So that** I catch bugs at compile-time and have better IDE autocomplete

**Acceptance Criteria:**
- [ ] Zero `any` types in production code (exceptions documented in types/exceptions.ts)
- [ ] Interfaces defined for: Post, Campaign, MediaFile, Platform, Agent, User, Analytics
- [ ] API response types match backend contracts
- [ ] Mutation/query hooks fully typed
- [ ] Generic types used for reusable components
- [ ] Type guards created for runtime validation
- [ ] TypeScript strict mode enabled with zero errors

**Priority:** P0  
**Phase:** 1  
**Department:** Build  
**Estimated Effort:** 16h

**Edge Cases:**
- Agent response types (may vary by agent type)
- Platform-specific metadata fields
- Legacy data migrations

**Client Clarification Needed:**
- Do we have OpenAPI/Swagger specs for the backend?
- Are there existing type definitions we should import?

---

### US-003: State Management Refactoring
**As a** developer  
**I want** the 20+ useState calls consolidated into proper state management  
**So that** state is predictable, debuggable, and doesn't cause unnecessary re-renders

**Acceptance Criteria:**
- [ ] CreatePostTab useState calls reduced to <5
- [ ] Complex form state moved to useReducer or React Hook Form
- [ ] Global state (user, settings, agents) moved to Context API or Zustand
- [ ] Local state (UI toggles, temp values) remains in useState
- [ ] State updates batched where possible
- [ ] DevTools integration for state debugging
- [ ] Performance benchmarks show <50ms re-render time

**Priority:** P0  
**Phase:** 1  
**Department:** Build  
**Estimated Effort:** 20h

**Implementation Notes:**
- Recommend React Hook Form for post creation form
- Zustand for global state (lightweight, no boilerplate)
- useReducer for complex tab-specific state machines

---

### US-004: Shared Mutation and Query Hooks
**As a** developer  
**I want** mutations and queries extracted into shared custom hooks  
**So that** API logic is DRY and consistent across all tabs

**Acceptance Criteria:**
- [ ] All mutations moved to hooks/mutations/ directory
- [ ] All queries moved to hooks/queries/ directory
- [ ] Hooks follow naming convention: useCreatePost, useUpdatePost, useDeletePost
- [ ] Error handling standardized across hooks
- [ ] Loading states handled consistently
- [ ] Cache invalidation logic centralized
- [ ] Hooks reused in at least 2 different components
- [ ] Unit tests for all custom hooks

**Priority:** P0  
**Phase:** 1  
**Department:** Build  
**Estimated Effort:** 12h

**Example Hooks:**
- `useCreatePost()` - used in CreatePostTab, DuplicatePostModal
- `useSchedulePost()` - used in CreatePostTab, CalendarTab
- `useAgentStatus()` - used in header, settings, autonomous mode

---

### US-005: Error Boundary Implementation
**As a** realtor  
**I want** graceful error handling when something breaks  
**So that** one broken feature doesn't crash my entire app

**Acceptance Criteria:**
- [ ] Root-level error boundary catches uncaught errors
- [ ] Tab-level error boundaries isolate failures
- [ ] Error boundary shows user-friendly message (not stack trace)
- [ ] "Report Bug" button integrated with error boundary
- [ ] Errors logged to monitoring service (Sentry/LogRocket)
- [ ] Error boundary has reset functionality
- [ ] Development mode shows detailed error info

**Priority:** P0  
**Phase:** 1  
**Department:** Build  
**Estimated Effort:** 8h

**Edge Cases:**
- Async errors from agent webhooks
- Network failures during post publishing
- Quota exceeded errors from social platforms

---

### US-006: Optimistic UI Updates
**As a** realtor  
**I want** the UI to update immediately when I perform actions  
**So that** the app feels fast and responsive

**Acceptance Criteria:**
- [ ] Post creation shows in list immediately (before server confirms)
- [ ] Post deletion removes from UI immediately
- [ ] Schedule changes reflect in calendar immediately
- [ ] Rollback logic if server rejects mutation
- [ ] Loading states show for operations >500ms
- [ ] Optimistic updates work offline (queue for later)
- [ ] Conflict resolution if data changed server-side

**Priority:** P0  
**Phase:** 1  
**Department:** Build  
**Estimated Effort:** 16h

**Implementation:**
- Use React Query's optimistic updates feature
- Implement conflict detection with version numbers
- Queue failed mutations for retry

---

## 🎨 Phase 2: Core UX Improvements (P1)
**Goal:** Improve daily workflow efficiency  
**Duration:** 3-4 weeks  
**Department:** Build + Design

### US-007: Drag-and-Drop Media Reordering
**As a** realtor  
**I want** to reorder uploaded images by dragging them  
**So that** my most important image appears first in the carousel

**Acceptance Criteria:**
- [ ] Media thumbnails are draggable in CreatePostTab
- [ ] Visual feedback during drag (cursor, ghost image, drop zone)
- [ ] Touch-friendly on tablets
- [ ] Order persists if user switches tabs
- [ ] Order saved to draft
- [ ] Undo/redo for reordering
- [ ] Keyboard navigation for accessibility (arrow keys + space)

**Priority:** P1  
**Phase:** 2  
**Department:** Build + Design  
**Estimated Effort:** 12h

**Recommended Library:** `@dnd-kit/react` or `react-beautiful-dnd`

---

### US-008: Post Duplication
**As a** realtor  
**I want** to duplicate an existing post from the Posts tab  
**So that** I can quickly create similar content without starting from scratch

**Acceptance Criteria:**
- [ ] "Duplicate" button on each post in Posts tab
- [ ] Duplicates: content, media, platforms, hashtags
- [ ] Does NOT duplicate: schedule, published status, analytics
- [ ] Opens duplicated post in CreatePostTab for editing
- [ ] Confirmation modal if user has unsaved changes
- [ ] Duplicate marked as draft
- [ ] Bulk duplicate (select multiple → duplicate all)

**Priority:** P1  
**Phase:** 2  
**Department:** Build  
**Estimated Effort:** 8h

**Edge Cases:**
- Media files need new upload IDs (reference same S3 path)
- Campaign links should ask: keep same campaign or clear?

---

### US-009: Bulk Actions for Posts
**As a** realtor  
**I want** to select multiple posts and perform actions on all at once  
**So that** I can efficiently manage large content calendars

**Acceptance Criteria:**
- [ ] Checkbox on each post in Posts tab
- [ ] "Select All" checkbox in header
- [ ] Bulk actions menu appears when >0 selected
- [ ] Supported actions: Delete, Reschedule, Change Platform, Archive
- [ ] Confirmation modal shows count of affected posts
- [ ] Progress indicator for bulk operations
- [ ] Undo option for 10 seconds after bulk delete
- [ ] Keyboard shortcuts (Cmd+A, Shift+Click for range select)

**Priority:** P1  
**Phase:** 2  
**Department:** Build  
**Estimated Effort:** 16h

**Edge Cases:**
- Mixed selection (draft + published) - some actions unavailable
- Partial failures (3/10 posts failed to delete)

---

### US-010: Drag-to-Reschedule Calendar
**As a** realtor  
**I want** to reschedule posts by dragging them on the calendar  
**So that** I can visually organize my content timeline

**Acceptance Criteria:**
- [ ] Posts draggable to different dates
- [ ] Posts draggable to different times (if day/week view)
- [ ] Visual conflict warning if too many posts on one day
- [ ] Confirmation if moving published post
- [ ] Multi-day drag (autonomous campaign spanning days)
- [ ] Calendar updates optimistically
- [ ] Undo reschedule
- [ ] Touch-friendly on tablets

**Priority:** P1  
**Phase:** 2  
**Department:** Build + Design  
**Estimated Effort:** 20h

**Client Clarification Needed:**
- Should we prevent scheduling conflicts (e.g., max posts per platform per day)?
- Do we need timezone handling for travel scenarios?

---

### US-011: Analytics Date Range Filtering
**As a** realtor  
**I want** to filter analytics by custom date ranges  
**So that** I can compare performance across different time periods

**Acceptance Criteria:**
- [ ] Date picker with preset ranges (Last 7 days, Last 30 days, This Month, Custom)
- [ ] Custom range picker (start + end date)
- [ ] Analytics data refetches on range change
- [ ] URL params preserve selected range (shareable links)
- [ ] Compare mode (compare two date ranges side-by-side)
- [ ] Export CSV button respects date filter
- [ ] Loading skeleton while refetching

**Priority:** P1  
**Phase:** 2  
**Department:** Build  
**Estimated Effort:** 10h

**Enhancement Ideas:**
- Saved filter presets ("Q1 2025", "Holiday Season")
- Relative ranges ("Last 90 days" auto-updates daily)

---

### US-012: Real-Time Post Preview
**As a** realtor  
**I want** the post preview to update as I type  
**So that** I can see exactly how my post will look before publishing

**Acceptance Criteria:**
- [ ] Preview updates with <100ms debounce
- [ ] Preview shows platform-specific rendering (Twitter char limit, Instagram aspect ratio)
- [ ] Media preview updates when media reordered
- [ ] Hashtags highlighted in preview
- [ ] Mentions highlighted and validated
- [ ] Character count updates in real-time
- [ ] Preview for each selected platform (tabbed view)
- [ ] Mobile/desktop preview toggle

**Priority:** P1  
**Phase:** 2  
**Department:** Build  
**Estimated Effort:** 14h

**Technical Notes:**
- Use `useDeferredValue` or `debounce` for performance
- Platform-specific preview components

---

### US-013: Post Templates and Drafts System
**As a** realtor  
**I want** to save post templates and drafts  
**So that** I can quickly create posts from proven formats and resume unfinished work

**Acceptance Criteria:**
- [ ] "Save as Template" button in CreatePostTab
- [ ] "Save Draft" auto-saves every 30 seconds
- [ ] Templates library with search/filter
- [ ] Template preview before applying
- [ ] Template includes: content structure, platforms, hashtag strategy (not specific content)
- [ ] Drafts list shows last edited time
- [ ] Create post from template prefills fields
- [ ] Delete template/draft with confirmation

**Priority:** P1  
**Phase:** 2  
**Department:** Build  
**Estimated Effort:** 18h

**User Stories:**
- Template: "New Listing Announcement"
- Template: "Open House Reminder"
- Draft: Half-written post when user got interrupted

---

### US-014: Loading Skeletons
**As a** realtor  
**I want** to see skeleton loaders instead of blank screens  
**So that** I know the app is working and what content is coming

**Acceptance Criteria:**
- [ ] Skeleton loaders on all tabs during initial load
- [ ] Skeleton shapes match actual content (post cards, calendar grid, charts)
- [ ] Smooth transition from skeleton to real content (no layout shift)
- [ ] Skeletons for infinite scroll (Posts tab pagination)
- [ ] Accessible (aria-busy, screen reader announcements)
- [ ] Skeletons use theme colors

**Priority:** P1  
**Phase:** 2  
**Department:** Design + Build  
**Estimated Effort:** 8h

**Tabs Needing Skeletons:**
- Posts tab (grid of post cards)
- Calendar tab (calendar grid)
- Analytics tab (chart placeholders)

---

## 🚀 Phase 3: Advanced Features (P2)
**Goal:** Add power-user features for scale  
**Duration:** 4-5 weeks  
**Department:** Build + Product

### US-015: Content Approval Workflow
**As a** realtor agency owner  
**I want** a client approval workflow for posts  
**So that** my clients can review and approve content before it goes live

**Acceptance Criteria:**
- [ ] Post status: Draft → Pending Approval → Approved → Scheduled/Published
- [ ] "Submit for Approval" button in CreatePostTab
- [ ] Email notification to approver(s)
- [ ] Approver can: Approve, Request Changes, Reject
- [ ] Comments/feedback on approval request
- [ ] Approval history log
- [ ] Multi-level approval (client → manager → publish)
- [ ] Permissions system (who can approve for which clients)

**Priority:** P2  
**Phase:** 3  
**Department:** Build  
**Estimated Effort:** 32h

**Client Clarification Needed:**
- Who are the approvers? (End clients, agency account managers, both?)
- Should approved posts auto-publish or require manual final action?
- Email vs in-app notifications?

---

### US-016: A/B Testing for Posts
**As a** realtor  
**I want** to test multiple versions of a post  
**So that** I can discover which messaging resonates with my audience

**Acceptance Criteria:**
- [ ] Create A/B test with 2-4 variants
- [ ] Variants can differ by: copy, image, hashtags, CTA
- [ ] Split traffic evenly or custom percentage
- [ ] Define success metric (engagement rate, clicks, conversions)
- [ ] Winner declared after configurable duration or sample size
- [ ] Analytics show variant performance comparison
- [ ] Auto-boost winning variant (optional)

**Priority:** P2  
**Phase:** 3  
**Department:** Build + Product  
**Estimated Effort:** 40h

**Edge Cases:**
- Platform limitations (some platforms don't support A/B)
- Statistical significance calculation
- Early stopping if one variant clearly losing

**Client Clarification Needed:**
- Which platforms support this?
- Integration with platform analytics or separate tracking?

---

### US-017: Hashtag Performance Tracking
**As a** realtor  
**I want** to see which hashtags drive the most engagement  
**So that** I can optimize my hashtag strategy

**Acceptance Criteria:**
- [ ] Hashtag analytics dashboard
- [ ] Metrics per hashtag: impressions, reach, engagement rate, clicks
- [ ] Trending hashtags in my niche (real estate)
- [ ] Suggested hashtags based on post content
- [ ] Hashtag performance over time (graph)
- [ ] Compare hashtags side-by-side
- [ ] Export top-performing hashtags as preset

**Priority:** P2  
**Phase:** 3  
**Department:** Build + Product  
**Estimated Effort:** 28h

**Data Sources:**
- Platform APIs (Instagram Insights, Twitter Analytics)
- Third-party hashtag research APIs
- Historical post performance

---

### US-018: Post Performance Predictions
**As a** realtor  
**I want** AI to predict how well my post will perform  
**So that** I can optimize before publishing

**Acceptance Criteria:**
- [ ] Prediction shown in CreatePostTab (engagement score 1-10)
- [ ] Predictions based on: content, media, hashtags, posting time, historical performance
- [ ] Suggestions to improve score (e.g., "Add image", "Post at 6pm instead")
- [ ] Accuracy tracker (predicted vs actual performance)
- [ ] Model retrains weekly on new data
- [ ] Confidence interval shown
- [ ] Works with Research Agent to improve copy

**Priority:** P2  
**Phase:** 3  
**Department:** Build + AI/ML  
**Estimated Effort:** 48h

**Technical Notes:**
- ML model or heuristic-based scoring?
- Need historical data for training

**Client Clarification Needed:**
- Do we have enough historical data?
- Which engagement metrics matter most (likes, shares, clicks, conversions)?

---

### US-019: Campaign-to-Post Linking in UI
**As a** realtor  
**I want** to easily link posts to marketing campaigns  
**So that** I can track campaign performance holistically

**Acceptance Criteria:**
- [ ] Campaign selector in CreatePostTab
- [ ] Create new campaign inline (without leaving tab)
- [ ] Campaign details shown in post card
- [ ] Filter Posts tab by campaign
- [ ] Analytics tab shows per-campaign metrics
- [ ] Campaign timeline view (all posts in campaign)
- [ ] Multi-campaign tagging (one post, multiple campaigns)

**Priority:** P2  
**Phase:** 3  
**Department:** Build  
**Estimated Effort:** 16h

**Campaign Examples:**
- "Spring 2025 Open Houses"
- "New Agent Introduction"
- "Holiday Client Appreciation"

---

### US-020: Multi-Day Autonomous Scheduling UI
**As a** realtor  
**I want** to configure autonomous agents to create content over multiple days  
**So that** I can set-and-forget my content calendar

**Acceptance Criteria:**
- [ ] "Autonomous Mode" configuration panel
- [ ] Set: start date, end date, posts per day, platforms, themes
- [ ] Calendar preview of autonomous schedule
- [ ] Agent selection (which agents to use)
- [ ] Content guidelines input (tone, topics, hashtags)
- [ ] Review queue before agents publish
- [ ] Pause/resume autonomous mode
- [ ] Notification when autonomous batch complete

**Priority:** P2  
**Phase:** 3  
**Department:** Build + AI  
**Estimated Effort:** 36h

**Client Clarification Needed:**
- How do agents currently get configured?
- What level of autonomy is desired (full auto-publish or review-required)?

---

## 📊 Summary

| Phase | Priority | Stories | Estimated Effort |
|-------|----------|---------|------------------|
| Phase 1: Architecture | P0 | 6 | 96h (~2.5 weeks) |
| Phase 2: UX Improvements | P1 | 8 | 106h (~2.5 weeks) |
| Phase 3: Advanced Features | P2 | 6 | 200h (~5 weeks) |
| **TOTAL** | | **20** | **402h (~10 weeks)** |

---

## 🚨 Client Clarification Required

1. **US-002 (TypeScript):** Backend type definitions available?
2. **US-010 (Calendar):** Scheduling conflict rules? Timezone handling?
3. **US-015 (Approval):** Who are approvers? Auto-publish after approval?
4. **US-016 (A/B Testing):** Which platforms supported? Tracking method?
5. **US-018 (Predictions):** Sufficient historical data? Key metrics?
6. **US-020 (Autonomous):** Current agent config? Desired autonomy level?

---

## 🎯 Recommended Phases

**Phase 1 (Weeks 1-3):** Critical path - architectural cleanup makes all future work easier and safer.

**Phase 2 (Weeks 4-6):** High-impact UX wins that improve daily workflow.

**Phase 3 (Weeks 7-12):** Advanced features that differentiate the product but aren't blockers.

**Phase 4 (Optional):** Performance optimization, accessibility audit, mobile-specific improvements.

---

*Generated by 3CP0 | Steel City AI | Task R001*
