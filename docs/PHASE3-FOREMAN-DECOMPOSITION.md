# Phase 3 Decomposition: Social Media Integration Project
**Foreman:** Steel City AI Foreman  
**Project Code:** SMP-2026-Q1  
**Branch:** SMP-Updates  
**Phase:** 3 (Advanced Features — "Level Up")  
**Generated:** 2026-03-05

---

## 1. 🎯 Goal Summary

Deliver competitive differentiators and workflow enhancements that elevate the social media platform from a content management tool to an intelligent, enterprise-ready publishing system. Phase 3 introduces three pillars:

1. **Approval Workflows** — Multi-level client approval chains that gate post publication, with email notifications, feedback loops, and audit trails. Transforms the tool from a single-user content creator into a team-based publishing pipeline.

2. **Hashtag Performance Tracking** — Deep analytics on hashtag effectiveness, trending detection, and data-driven suggestions. Moves analytics beyond vanity metrics into actionable content strategy.

3. **AI Post Performance Predictions** — Machine-learning-powered scoring that predicts engagement before publishing, with improvement suggestions and historical accuracy tracking. The key differentiator that turns the platform into an intelligent advisor.

### Phase 3 Scope (4 User Stories from Master Plan)
| US | User Story | Impact | Est. |
|----|-----------|--------|------|
| US-015 | Content Approval Workflow | HIGH — Enables agency/client collaboration | 32h |
| US-017 | Hashtag Performance Tracking | HIGH — Data-driven content strategy | 28h |
| US-018 | Post Performance Predictions | HIGH — AI differentiator, competitive moat | 48h |
| US-019 | Campaign-to-Post Linking in UI *(stretch)* | MEDIUM — Holistic campaign tracking | 16h |

> **Note:** US-016 (A/B Testing) and US-020 (Multi-Day Autonomous Scheduling) are deferred to Phase 4 per scope refinement. US-019 is a stretch goal if Week 7 velocity permits.

**Total Estimated Hours:** ~124h (core) + 16h (stretch) = ~140h max

---

## 2. ✅ Definition of Done

### Feature Completion
- [ ] US-015: Full approval workflow operational — Draft → Pending Approval → Approved/Rejected → Scheduled/Published
- [ ] US-015: Email notifications sent to approvers when posts are submitted
- [ ] US-015: Approvers can approve, request changes, or reject with comments
- [ ] US-015: Multi-level approval chains configurable per client
- [ ] US-015: Approval history/audit log viewable per post
- [ ] US-017: Hashtag analytics dashboard renders per-hashtag metrics (impressions, reach, engagement rate)
- [ ] US-017: Hashtag performance over time displayed as time-series graph
- [ ] US-017: AI-powered hashtag suggestions based on post content and historical data
- [ ] US-017: Top-performing hashtags exportable as preset/template
- [ ] US-018: Engagement prediction score (1-10) displayed in CreatePostTab
- [ ] US-018: Predictions consider content, media, hashtags, posting time, and historical performance
- [ ] US-018: Improvement suggestions rendered inline (e.g., "Add image", "Post at 6pm instead")
- [ ] US-018: Prediction accuracy tracker compares predicted vs actual engagement

### Code Quality
- [ ] All new components <500 lines, TypeScript strict mode
- [ ] New DB tables have migration scripts and rollback support
- [ ] API endpoints follow existing REST conventions (`/api/{admin|portal}/social/...`)
- [ ] Approval workflow uses existing optimistic update patterns from Phase 1
- [ ] Prediction model abstracted behind service interface (swappable heuristic → ML)
- [ ] All new hooks follow `use-social-*.ts` naming convention

### UX/UI Standards
- [ ] Approval workflow UI follows existing Shadcn component patterns
- [ ] Hashtag dashboard integrates with existing AnalyticsTab date range filtering (Phase 2)
- [ ] Prediction score uses clear visual indicator (gauge, bar, color-coded badge)
- [ ] Mobile responsive (tablet minimum) for all new features
- [ ] WCAG 2.1 AA compliance for interactive elements

### Testing
- [ ] Unit tests for approval state machine transitions
- [ ] Unit tests for prediction scoring algorithm
- [ ] Integration tests for approval email notifications
- [ ] QA sign-off on all user stories
- [ ] Regression: Phase 1 & 2 features unaffected

---

## 3. 🗓️ Milestone Plan

### **Milestone 1: Approval Workflows (Week 6)**
**Goal:** Full approval pipeline — schema, API, UI, notifications
**Focus:** US-015 (Content Approval Workflow)

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 1 | P3-B001 (DB schema), P3-D001 (approval UI design), P3-B002 (API endpoints) | Schema migrated, API spec finalized |
| 2 | P3-B002 (API cont'd), P3-B003 (approval state machine hook) | Core approval mutations working |
| 3 | P3-B004 (Submit for Approval UI), P3-B005 (Approval Dashboard) | Approval flow end-to-end in UI |
| 4 | P3-B006 (Email notifications), P3-B007 (Approval history/audit log) | Notifications firing, audit log visible |
| 5 | P3-B008 (Hashtag analytics schema + API), P3-D002 (Hashtag dashboard design) | Hashtag backend ready, UI spec approved |

**Milestone 1 Exit Criteria:**
- Approval workflow fully functional: submit → notify → approve/reject → publish
- Hashtag analytics backend in place and serving data

---

### **Milestone 2: Analytics & AI Predictions (Week 7)**
**Goal:** Hashtag dashboard live + AI prediction engine integrated
**Focus:** US-017 (Hashtag Tracking), US-018 (Performance Predictions)

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 6 | P3-B009 (Hashtag dashboard UI), P3-B010 (Hashtag suggestions engine) | Hashtag analytics dashboard rendering |
| 7 | P3-B011 (Prediction scoring engine), P3-D003 (Prediction UI design) | Scoring algorithm returning results |
| 8 | P3-B012 (Prediction UI in CreatePostTab), P3-B013 (Improvement suggestions) | Prediction score visible during composition |
| 9 | P3-B014 (Accuracy tracker), P3-Q001-Q008 (QA begins) | Predicted vs actual tracking operational |
| 10 | QA, bug fixes, P3-D004 (Accessibility audit), P3-Q009 (Regression) | All features polished, regression clear |

**Milestone 2 Exit Criteria:**
- Hashtag dashboard showing real data with time-series graphs
- Prediction score visible and actionable in CreatePostTab
- All QA test cases passing

---

## 4. 📋 Department Task Board

### **Build Department — Implementation**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P3-B001 | **DB Schema: Approval Workflow Tables.** Create Drizzle migration adding: `approval_requests` table (id, postId, requesterId, status [pending/approved/rejected/changes_requested], level, approverIds, currentApproverId, comments jsonb, createdAt, updatedAt), `approval_comments` table (id, approvalRequestId, authorId, content, action [approve/reject/request_changes/comment], createdAt), `approval_configs` table (id, clientId, levels jsonb [{role, approverIds}], autoPublishOnApproval boolean, createdAt, updatedAt). Add `approvalStatus` column to `social_posts` table (null = no approval needed). Create indexes on postId, clientId, status. | None | 6h | P0 | READY |
| P3-B002 | **API: Approval Workflow Endpoints.** Implement REST endpoints: `POST /api/{admin\|portal}/social/posts/:id/submit-approval` (creates approval_request, updates post status to 'pending_approval'), `GET /api/{admin\|portal}/social/approval-requests` (list pending approvals, filterable by status/client), `PUT /api/{admin\|portal}/social/approval-requests/:id/respond` (body: {action: approve\|reject\|request_changes, comment}), `GET /api/{admin\|portal}/social/posts/:id/approval-history` (full audit trail), `GET/PUT /api/admin/social/approval-config/:clientId` (manage approval chains). All endpoints must validate permissions — only configured approvers can approve. | P3-B001 | 10h | P0 | READY |
| P3-B003 | **Hook: useApprovalWorkflow.** Create `client/src/hooks/social/use-approval-workflow.ts` with: `useApprovalRequests(mode)` — query pending approvals, `useSubmitForApproval(mode)` — mutation that submits post and optimistically updates status to 'pending_approval', `useRespondToApproval(mode)` — mutation for approve/reject/request_changes with optimistic UI, `useApprovalHistory(postId, mode)` — query audit trail for a post, `useApprovalConfig(clientId, mode)` — query/mutate approval chain configuration. Follow existing patterns from `use-social-posts.ts` (optimistic updates, cache invalidation). | P3-B002 | 6h | P0 | READY |
| P3-B004 | **UI: Submit for Approval Button & Flow.** In `CreatePostTab.tsx` and `PostsTab.tsx`, add "Submit for Approval" button that appears when: (a) post is in 'draft' status, (b) client has an approval config. Button opens confirmation dialog showing approval chain levels. On submit, calls `useSubmitForApproval`. Post card in PostsTab shows approval badge (pending/approved/rejected). CreatePostTab disables editing when post is 'pending_approval' unless user is an approver. Use existing `Badge` component with new approval-status color variants. | P3-B003, P3-D001 | 8h | P0 | READY |
| P3-B005 | **UI: Approval Dashboard.** Create new tab or section in SocialMediaPage/PortalSocialMedia: `ApprovalQueueTab.tsx`. Displays: (1) Pending approval cards with post preview, requester info, submitted timestamp, (2) Approve/Reject/Request Changes action buttons, (3) Inline comment field for feedback, (4) Filter by client, status, date. For portal users, show only their pending items. For admin, show all with client filter. Use existing `Card`, `Badge`, `Button` components. Include `PostPreview` component inline for each approval item. | P3-B003, P3-D001 | 10h | P1 | READY |
| P3-B006 | **Email Notifications for Approvals.** Integrate with existing Gmail service (`server/services/google-gmail.ts`) or a transactional email provider. Send notifications on: (1) Post submitted for approval → email to next approver, (2) Post approved → email to requester + auto-schedule if configured, (3) Post rejected / changes requested → email to requester with comments. Create email templates using HTML with Steel City AI branding. Add notification preferences to approval_configs (email on/off, in-app only option). Implement debounced batch sending for bulk submissions. | P3-B002, Gmail service | 8h | P1 | READY |
| P3-B007 | **UI: Approval History & Audit Log.** Add "Approval History" section to `PostEditDialog.tsx` and post detail view. Shows timeline of: submissions, approvals, rejections, comments, re-submissions. Each entry shows: actor name, action, timestamp, comment if any. Use `ScrollArea` for long histories. Include "Re-submit for Approval" button on rejected posts. Color-coded timeline (green=approved, red=rejected, yellow=changes requested, blue=comment). | P3-B003, P3-D001 | 5h | P1 | READY |
| P3-B008 | **DB Schema + API: Hashtag Analytics.** Create `hashtag_metrics` table (id, hashtag text, postId, platform, impressions int, reach int, engagementRate numeric, clicks int, saves int, measuredAt timestamp, createdAt). Create aggregation query functions: `getHashtagPerformance(hashtag, dateRange)` → aggregated metrics, `getTopHashtags(clientId, limit, dateRange)` → ranked list, `getHashtagTimeSeries(hashtag, dateRange, granularity)` → daily/weekly data points. API endpoints: `GET /api/{admin\|portal}/social/analytics/hashtags` (top hashtags with metrics), `GET /api/{admin\|portal}/social/analytics/hashtags/:tag/timeseries` (time-series for specific hashtag), `POST /api/{admin\|portal}/social/analytics/hashtags/suggest` (AI suggestions based on content). Backfill existing post engagement data by hashtag from `social_posts.engagement` jsonb. | None | 10h | P0 | READY |
| P3-B009 | **UI: Hashtag Analytics Dashboard.** Add "Hashtags" sub-tab or section in AnalyticsTab. Components: (1) Top Hashtags Table — sortable by impressions/reach/engagement, with sparkline mini-charts, (2) Hashtag Performance Chart — Recharts line graph showing selected hashtag(s) over time, (3) Hashtag Comparison — select 2-4 hashtags for side-by-side metrics, (4) "Save as Preset" button to export top hashtags as a template hashtag set. Integrate with existing date range picker from Phase 2 (US-011). Use `AnalyticsCards` component pattern for summary stats. | P3-B008, P3-D002 | 10h | P1 | READY |
| P3-B010 | **Hashtag Suggestions Engine.** Create `server/services/hashtag-suggestions.ts`: (1) Analyze post content using AI (existing `social-generator.ts` patterns) to suggest relevant hashtags, (2) Cross-reference with `hashtag_metrics` to rank suggestions by historical performance, (3) Detect trending hashtags in client's niche by analyzing recent high-performing posts, (4) Return suggestions with confidence score and historical avg engagement. Client hook: `useHashtagSuggestions(content, platforms)` in `client/src/hooks/social/use-hashtag-analytics.ts`. Integrate suggestions into CreatePostTab — show suggestions below hashtag input with one-click add. | P3-B008, AI service | 8h | P1 | READY |
| P3-B011 | **AI Prediction Scoring Engine.** Create `server/services/post-predictor.ts` implementing a prediction service: (1) **Feature extraction:** content length, media count, hashtag count, posting hour/day-of-week, platform, has-CTA, question-mark usage, emoji count, content sentiment, (2) **Historical baseline:** query avg engagement by platform, by hour, by content type from `social_posts` table, (3) **Scoring algorithm v1 (heuristic):** weighted composite score (0-10) combining: time-of-day fit (20%), content quality signals (25%), hashtag strength (15%), media presence (20%), historical client average comparison (20%), (4) **Confidence interval:** based on historical data volume — low data = wider interval. Expose via `POST /api/{admin\|portal}/social/ai/predict-performance` accepting `{content, platforms, hashtags, mediaUrls, scheduledAt}`. Return `{score, confidence, factors[{name, impact, suggestion}]}`. Abstract behind interface so heuristic can be swapped for ML model later. | Existing social_posts data | 12h | P0 | READY |
| P3-B012 | **UI: Prediction Score in CreatePostTab.** Add prediction panel to CreatePostTab (right sidebar or collapsible section): (1) Circular gauge or horizontal bar showing score 1-10 with color gradient (red 1-3, yellow 4-6, green 7-10), (2) Score updates live as user types (debounced 500ms — heavier than preview), (3) Factor breakdown list showing what's helping/hurting the score, (4) Each factor shows icon + label + impact (positive/negative/neutral). Use `usePostPrediction` hook that calls API with current form state. Show skeleton while prediction loads. Gate behind feature flag initially. | P3-B011, P3-D003 | 8h | P1 | READY |
| P3-B013 | **Improvement Suggestions UI.** Extend prediction panel with actionable suggestions: (1) Each suggestion is a card with: icon, title ("Add an image"), description ("Posts with images get 2.3x more engagement"), action button ("Add Media" → opens media uploader), (2) Suggestions ranked by potential score impact, (3) Show "potential score if applied" for each suggestion, (4) Suggestions auto-update when user acts on one. Suggestion types: add media, change posting time, add/remove hashtags, add CTA, shorten/lengthen content, add emoji. Wire action buttons to existing form controls in CreatePostTab. | P3-B012 | 6h | P1 | READY |
| P3-B014 | **Prediction Accuracy Tracker.** Create `prediction_records` table (id, postId, predictedScore numeric, predictedAt timestamp, actualScore numeric, actualMeasuredAt timestamp, factors jsonb, createdAt). On post publish: store prediction. After 48h (via cron or on-demand): calculate actual engagement score using same normalization. API: `GET /api/{admin\|portal}/social/ai/prediction-accuracy` → returns {avgError, predictionCount, recentAccuracy[], calibrationData[]}. UI: Add "Prediction Accuracy" card in AnalyticsTab showing: overall accuracy %, trend line, and scatter plot (predicted vs actual). Use this data to auto-calibrate scoring weights over time. | P3-B011 | 8h | P2 | READY |

---

### **Design/UX Department — UI/UX Guidance, Accessibility**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P3-D001 | **Design: Approval Workflow UI.** Specifications for: (1) Approval status badges — color system (gray=draft, blue=pending, green=approved, red=rejected, yellow=changes requested), (2) Approval queue card layout — post preview, requester avatar, action buttons placement, (3) Submit for Approval dialog — chain visualization showing approval levels, (4) Inline comment UI for feedback — threaded or flat, character limit, (5) Approval history timeline — vertical timeline with icons per action type, (6) Mobile: approval actions must be reachable with one hand (bottom-aligned action bar on mobile). Deliver as Figma frames or annotated mockups. | None | 6h | P0 | READY |
| P3-D002 | **Design: Hashtag Analytics Dashboard.** Specifications for: (1) Hashtag leaderboard table — columns, sorting indicators, sparkline chart sizing, (2) Time-series chart — axis labels, legend placement, color palette for multi-hashtag comparison, (3) Suggestion cards — layout for AI-suggested hashtags with confidence indicator, (4) "Save as Preset" flow — modal or inline, naming convention, (5) Integration with existing AnalyticsTab — placement as sub-tab or accordion section, (6) Empty state design for clients with insufficient hashtag data. | None | 4h | P0 | READY |
| P3-D003 | **Design: Performance Prediction UI.** Specifications for: (1) Score gauge — circular dial vs. horizontal bar vs. radial gradient, choose most scannable format, (2) Color scale — continuous gradient or discrete stops (red/yellow/green), (3) Factor breakdown — list layout with positive/negative indicators (↑↓ arrows or +/- chips), (4) Suggestion cards — actionable card design with "Apply" button, potential score impact shown as "+1.2" badge, (5) Placement in CreatePostTab — right sidebar (desktop) vs collapsible bottom panel (mobile), (6) Loading state — skeleton for prediction while computing, (7) Low-confidence warning — visual indicator when prediction has high uncertainty. | None | 5h | P0 | READY |
| P3-D004 | **Accessibility Audit for Phase 3 Features.** Audit all Phase 3 UI for: (1) Approval actions keyboard-navigable (approve/reject/comment), (2) Score gauge readable by screen readers (aria-label with numeric value), (3) Color-blind safe — approval status badges use icons in addition to color, (4) Hashtag charts include alt text or data table alternative, (5) Focus management: after approval action, focus moves to next pending item, (6) Suggestion action buttons have descriptive aria-labels. Deliver as audit report with remediation tasks. | P3-B004, P3-B005, P3-B009, P3-B012 | 5h | P1 | BLOCKED |

---

### **QA Department — Test Plans**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P3-Q001 | **Test Plan: Phase 3 Master.** Define test strategy for all Phase 3 features: test environments, test data requirements (need posts with engagement history, multiple user roles for approval), seed data script for hashtag metrics, mock prediction API for deterministic testing. Identify integration test boundaries (email notifications → use test SMTP). | All P3-B* tasks defined | 3h | P0 | READY |
| P3-Q002 | **Test: Approval Workflow — Happy Path.** Test cases: (1) Draft → Submit for Approval → status becomes 'pending_approval', (2) Approver receives notification email, (3) Approver approves → post status becomes 'approved', (4) Approved post can be scheduled/published, (5) Multi-level approval: L1 approves → auto-forwards to L2, (6) Requester sees approval status in PostsTab and PostEditDialog, (7) Approval config CRUD works for admin. Verify optimistic updates work correctly for status changes. | P3-B004, P3-B005, P3-B006, P3-B007 | 6h | P0 | READY |
| P3-Q003 | **Test: Approval Workflow — Edge Cases.** Test: (1) Reject → requester edits → re-submit → new approval cycle, (2) Request Changes → feedback comment visible → edit → re-submit, (3) Approver approves already-approved post (idempotent), (4) Non-approver tries to approve (should fail with 403), (5) Post deleted while pending approval, (6) Bulk submit multiple posts for approval, (7) Approval with empty comment (should still work), (8) Very long approval comment (>1000 chars), (9) Concurrent approvals on same post (race condition). | P3-B004, P3-B005 | 6h | P0 | READY |
| P3-Q004 | **Test: Hashtag Analytics.** Test: (1) Dashboard shows hashtags sorted by engagement, (2) Date range filter affects hashtag metrics, (3) Time-series graph renders correctly for selected hashtag, (4) Multi-hashtag comparison shows distinct lines, (5) Empty state renders when no hashtag data exists, (6) Hashtag suggestions return relevant results for given content, (7) "Save as Preset" creates reusable hashtag set, (8) Performance data from multiple platforms aggregates correctly. | P3-B009, P3-B010 | 5h | P1 | READY |
| P3-Q005 | **Test: Performance Predictions.** Test: (1) Score displays in CreatePostTab when content entered, (2) Score updates on content change (debounced), (3) Factor breakdown shows relevant factors, (4) Suggestions are actionable (clicking "Add Media" opens uploader), (5) Score changes when suggestion is applied, (6) Empty content returns no prediction (graceful empty state), (7) Very long content doesn't break prediction API, (8) Prediction with no historical data shows low-confidence warning. | P3-B012, P3-B013 | 5h | P1 | READY |
| P3-Q006 | **Test: Prediction Accuracy Tracker.** Test: (1) Prediction stored when post is published, (2) Accuracy calculation correct after engagement data collected, (3) Accuracy dashboard shows chart and metrics, (4) Calibration data feeds back into scoring weights, (5) Edge: post with zero engagement handled gracefully, (6) Edge: very old predictions don't skew recent accuracy. | P3-B014 | 4h | P2 | READY |
| P3-Q007 | **Test: Integration & Cross-Feature.** Test: (1) Approval workflow + prediction: predicted score visible during approval review, (2) Hashtag analytics + suggestions: suggestions draw from analytics data, (3) Approval + templates: template-based post goes through approval, (4) Phase 2 features still work: drag-drop, bulk actions, calendar, previews, (5) Existing post CRUD unaffected by new approval status column, (6) Portal users see only their client's data across all new features. | All P3-B* complete | 5h | P1 | READY |
| P3-Q008 | **Test: Email Notifications.** Test: (1) Approval submission triggers email to correct approver, (2) Email contains post preview and action link, (3) Approval/rejection triggers email to requester, (4) Notification preferences respected (email off = no email sent), (5) Batch submissions don't flood approver inbox (debounced), (6) Email links work and land on correct approval page. Use test SMTP or email capture service. | P3-B006 | 4h | P1 | READY |
| P3-Q009 | **Regression Testing: Phase 1 & 2.** Full regression pass: (1) Component splitting and lazy loading still work, (2) TypeScript strict mode passes, (3) Optimistic updates for create/update/delete posts, (4) Drag-drop media reordering, (5) Post duplication, (6) Bulk actions, (7) Calendar drag-to-reschedule, (8) Analytics date range filtering, (9) Real-time preview, (10) Templates and drafts, (11) Loading skeletons. Verify no data schema changes broke existing queries. | All Phase 3 complete | 6h | P0 | BLOCKED |

---

## 5. ⚠️ Risk Register

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Approval workflow complexity creep (too many levels/options) | HIGH | MEDIUM | Start with max 3 approval levels. Ship simple config first, iterate based on client feedback. Hard-code sensible defaults. | Build |
| Email delivery reliability (spam filters, delays) | HIGH | MEDIUM | Use transactional email service (SendGrid/Resend) over raw SMTP. Implement in-app notification as primary, email as secondary. Add delivery status tracking. | Build |
| Insufficient historical data for meaningful predictions | HIGH | HIGH | Ship heuristic-based scoring v1 that works with zero history. Show "limited data" confidence indicator. Predictions improve automatically as data accumulates. Seed with industry benchmarks. | Build/AI |
| Prediction model accuracy undermines user trust | HIGH | MEDIUM | Show confidence intervals. Track accuracy transparently. Allow users to dismiss/hide predictions. Default to conservative scores rather than overconfident ones. | Build/AI |
| Hashtag metrics data collection lag | MEDIUM | MEDIUM | Implement scheduled backfill job for existing posts. For new posts, collect metrics at 24h and 48h post-publish. Show "collecting data" state for recent posts. | Build |
| New DB tables cause migration issues in production | HIGH | LOW | Test migrations against production data snapshot. Write rollback scripts for every migration. Deploy schema changes during low-traffic window. | Build/DevOps |
| Approval workflow blocks publishing velocity | MEDIUM | MEDIUM | Make approval optional per client. Provide "skip approval" for admin users. Set auto-approve timeout (configurable, e.g., 48h auto-approve if no response). | Build/Product |
| Performance regression from prediction API calls | MEDIUM | LOW | Debounce prediction calls (500ms). Cache predictions for unchanged content. Implement request cancellation for rapid typing. Server-side: cache historical baseline data. | Build |
| Scope creep into US-016 (A/B Testing) or US-020 (Autonomous) | MEDIUM | MEDIUM | Strict scope freeze on Phase 3. US-016 and US-020 logged in backlog for Phase 4. Any scope addition requires trade-off (drop equivalent effort). | PM |
| Cross-feature state complexity (approval + prediction + hashtags) | MEDIUM | LOW | Keep features decoupled. Approval is post-status driven. Predictions are read-only advisory. Hashtag analytics are separate dashboard. No circular dependencies. | Build |

---

## 6. 📊 PM Export JSON

```json
{
  "project": {
    "code": "SMP-2026-Q1",
    "phase": 3,
    "name": "Phase 3: Advanced Features — Level Up",
    "branch": "SMP-Updates",
    "repo": "steelcity-ai/steelcity-ai.com",
    "start_date": "2026-03-23",
    "target_end": "2026-04-03",
    "total_tasks": 27,
    "total_estimate_hours": 124,
    "stretch_estimate_hours": 140
  },
  "user_stories": [
    {
      "id": "US-015",
      "title": "Content Approval Workflow",
      "tasks": ["P3-B001", "P3-B002", "P3-B003", "P3-B004", "P3-B005", "P3-B006", "P3-B007"],
      "estimate_hours": 53,
      "milestone": "M1"
    },
    {
      "id": "US-017",
      "title": "Hashtag Performance Tracking",
      "tasks": ["P3-B008", "P3-B009", "P3-B010"],
      "estimate_hours": 28,
      "milestone": "M1/M2"
    },
    {
      "id": "US-018",
      "title": "Post Performance Predictions",
      "tasks": ["P3-B011", "P3-B012", "P3-B013", "P3-B014"],
      "estimate_hours": 34,
      "milestone": "M2"
    }
  ],
  "milestones": [
    {
      "id": "M1",
      "name": "Approval Workflows + Hashtag Backend",
      "tasks": [
        "P3-B001", "P3-B002", "P3-B003", "P3-B004", "P3-B005", "P3-B006", "P3-B007",
        "P3-B008",
        "P3-D001", "P3-D002"
      ],
      "target_date": "2026-03-27",
      "user_stories": ["US-015", "US-017"],
      "exit_criteria": "Approval workflow end-to-end functional; hashtag analytics API serving data"
    },
    {
      "id": "M2",
      "name": "Analytics Dashboard + AI Predictions",
      "tasks": [
        "P3-B009", "P3-B010", "P3-B011", "P3-B012", "P3-B013", "P3-B014",
        "P3-D003", "P3-D004",
        "P3-Q001", "P3-Q002", "P3-Q003", "P3-Q004", "P3-Q005", "P3-Q006", "P3-Q007", "P3-Q008", "P3-Q009"
      ],
      "target_date": "2026-04-03",
      "user_stories": ["US-017", "US-018"],
      "exit_criteria": "Hashtag dashboard live; prediction score in CreatePostTab; all QA passing"
    }
  ],
  "department_tasks": {
    "build": [
      {"task_id": "P3-B001", "user_story": "US-015", "estimate": "6h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-B002", "user_story": "US-015", "estimate": "10h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-B003", "user_story": "US-015", "estimate": "6h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-B004", "user_story": "US-015", "estimate": "8h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-B005", "user_story": "US-015", "estimate": "10h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B006", "user_story": "US-015", "estimate": "8h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B007", "user_story": "US-015", "estimate": "5h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B008", "user_story": "US-017", "estimate": "10h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-B009", "user_story": "US-017", "estimate": "10h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B010", "user_story": "US-017", "estimate": "8h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B011", "user_story": "US-018", "estimate": "12h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-B012", "user_story": "US-018", "estimate": "8h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B013", "user_story": "US-018", "estimate": "6h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-B014", "user_story": "US-018", "estimate": "8h", "status": "READY", "priority": "P2"}
    ],
    "design_ux": [
      {"task_id": "P3-D001", "user_story": "US-015", "estimate": "6h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-D002", "user_story": "US-017", "estimate": "4h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-D003", "user_story": "US-018", "estimate": "5h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-D004", "user_story": "ALL", "estimate": "5h", "status": "BLOCKED", "priority": "P1"}
    ],
    "qa": [
      {"task_id": "P3-Q001", "user_story": "ALL", "estimate": "3h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-Q002", "user_story": "US-015", "estimate": "6h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-Q003", "user_story": "US-015", "estimate": "6h", "status": "READY", "priority": "P0"},
      {"task_id": "P3-Q004", "user_story": "US-017", "estimate": "5h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-Q005", "user_story": "US-018", "estimate": "5h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-Q006", "user_story": "US-018", "estimate": "4h", "status": "READY", "priority": "P2"},
      {"task_id": "P3-Q007", "user_story": "ALL", "estimate": "5h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-Q008", "user_story": "US-015", "estimate": "4h", "status": "READY", "priority": "P1"},
      {"task_id": "P3-Q009", "user_story": "REGRESSION", "estimate": "6h", "status": "BLOCKED", "priority": "P0"}
    ]
  },
  "sprint_health": "GREEN",
  "blocker_list": [
    "P3-D004: Waiting for build tasks to stabilize before accessibility audit",
    "P3-Q009: Waiting for all Phase 3 features to be complete before regression testing"
  ],
  "ready_tasks": [
    "P3-B001", "P3-B002", "P3-B003", "P3-B004", "P3-B005", "P3-B006", "P3-B007",
    "P3-B008", "P3-B009", "P3-B010", "P3-B011", "P3-B012", "P3-B013", "P3-B014",
    "P3-D001", "P3-D002", "P3-D003",
    "P3-Q001", "P3-Q002", "P3-Q003", "P3-Q004", "P3-Q005", "P3-Q006", "P3-Q007", "P3-Q008"
  ],
  "critical_path": [
    "P3-B001 (schema) → P3-B002 (API) → P3-B003 (hooks) → P3-B004 (submit UI) → P3-Q002 (test)",
    "P3-B008 (hashtag schema) → P3-B009 (dashboard UI) → P3-Q004 (test)",
    "P3-B011 (prediction engine) → P3-B012 (prediction UI) → P3-B013 (suggestions) → P3-Q005 (test)",
    "P3-D001 (approval design) → P3-B004 (submit UI) + P3-B005 (approval dashboard)"
  ],
  "dependencies_from_other_phases": {
    "required_from_phase1": [
      "B007: Posts tab refactored (PostsTab.tsx — for approval badges)",
      "B005: Error boundaries (for graceful approval/prediction failures)",
      "B006: Optimistic updates pattern (for approval state changes)",
      "Shared hooks pattern (use-social-posts.ts — template for new hooks)"
    ],
    "required_from_phase2": [
      "P2-B005: Analytics date range filtering (reused by hashtag dashboard)",
      "P2-B006: Real-time preview (prediction score updates alongside preview)",
      "P2-B007: Templates system (templates go through approval workflow)",
      "P2-B009: Loading skeletons (reused for approval queue, prediction loading)",
      "P2-D003: Preview layout (prediction panel shares space with preview)"
    ]
  },
  "deferred_to_phase4": [
    "US-016: A/B Testing for Posts (40h — needs platform API integration research)",
    "US-019: Campaign-to-Post Linking in UI (16h — stretch goal, can be Phase 3 if velocity allows)",
    "US-020: Multi-Day Autonomous Scheduling UI (36h — depends on agent infrastructure)"
  ]
}
```

---

## 7. 📝 Notes

### Architecture Decisions

#### Approval Workflow State Machine
```
Draft ──→ Pending Approval ──→ Approved ──→ Scheduled/Published
                │                   ↑
                ├──→ Rejected ──────┘ (after edit + re-submit)
                │
                └──→ Changes Requested ──→ (edit) ──→ Pending Approval
```
The `approvalStatus` column on `social_posts` is **separate** from the existing `status` column to avoid breaking Phase 1/2 post lifecycle. Posts can be in `status=draft` + `approvalStatus=pending` simultaneously.

#### Prediction Engine — Heuristic v1, ML v2
Phase 3 ships a weighted heuristic model. The service interface is designed for drop-in replacement with a trained ML model in Phase 4 once sufficient engagement data has been collected. Target: 500+ published posts with engagement data before ML training is viable.

#### Hashtag Metrics Collection
Hashtag metrics are denormalized into `hashtag_metrics` table rather than computed on-the-fly from `social_posts.engagement` jsonb. This trades storage for query performance — hashtag leaderboards and time-series queries need fast aggregation.

### API Endpoints Summary (New in Phase 3)
```
# Approval Workflow
POST   /api/{admin|portal}/social/posts/:id/submit-approval
GET    /api/{admin|portal}/social/approval-requests
PUT    /api/{admin|portal}/social/approval-requests/:id/respond
GET    /api/{admin|portal}/social/posts/:id/approval-history
GET    /api/admin/social/approval-config/:clientId
PUT    /api/admin/social/approval-config/:clientId

# Hashtag Analytics
GET    /api/{admin|portal}/social/analytics/hashtags
GET    /api/{admin|portal}/social/analytics/hashtags/:tag/timeseries
POST   /api/{admin|portal}/social/analytics/hashtags/suggest

# Performance Predictions
POST   /api/{admin|portal}/social/ai/predict-performance
GET    /api/{admin|portal}/social/ai/prediction-accuracy
```

### New Database Tables (Phase 3)
1. `approval_requests` — tracks each approval submission and its lifecycle
2. `approval_comments` — threaded comments on approval requests
3. `approval_configs` — per-client approval chain configuration
4. `hashtag_metrics` — denormalized per-hashtag per-post engagement data
5. `prediction_records` — predicted vs actual engagement for accuracy tracking
6. Column addition: `social_posts.approvalStatus` (nullable varchar)

### Performance Targets
- Approval status change: optimistic UI update <50ms, server confirmation <500ms
- Hashtag dashboard load: <1s for top-50 hashtags with sparklines
- Prediction API response: <2s (acceptable for advisory, debounced)
- Prediction score update: 500ms debounce from last keystroke
- Email notification dispatch: <5s after approval action

### Key Dependencies on Existing Infrastructure
- **Gmail service** (`server/services/google-gmail.ts`): Used for approval email notifications
- **AI generation service** (`server/services/social-generator.ts`): Pattern for hashtag suggestion AI calls
- **TanStack Query** patterns: All new hooks follow `use-social-posts.ts` optimistic update pattern
- **Shadcn components**: Badge, Card, Dialog, ScrollArea, Tabs for all new UI
- **Recharts**: Already available for analytics — reused for hashtag time-series and prediction accuracy charts

---

*End of Phase 3 Decomposition*
