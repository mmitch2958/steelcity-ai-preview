# Phase 3 — Milestone 1 Test Specifications
**Project:** SMP-2026-Q1 — Social Media Platform  
**Phase:** 3 (Advanced Features — "Level Up")  
**Milestone:** M1 — Approval Workflows + Hashtag Backend  
**QA Tasks Covered:** P3-Q001, P3-Q002, P3-Q003  
**Author:** QA Department (automated)  
**Created:** 2026-03-05  
**Status:** DRAFT

---

## Table of Contents
1. [P3-Q001 — Phase 3 Master Test Plan](#p3-q001--phase-3-master-test-plan)
2. [P3-Q002 — Approval Workflow Happy Path](#p3-q002--approval-workflow-happy-path)
3. [P3-Q003 — Approval Workflow Edge Cases](#p3-q003--approval-workflow-edge-cases)
4. [Appendices](#appendices)

---

## P3-Q001 — Phase 3 Master Test Plan

### 1.1 Test Strategy Overview

Phase 3 introduces three pillars: **Approval Workflows (US-015)**, **Hashtag Performance Tracking (US-017)**, and **AI Post Performance Predictions (US-018)**. Testing must verify each feature in isolation and their cross-feature interactions while ensuring zero regression to Phase 1 and Phase 2 functionality.

#### Test Levels
| Level | Scope | Tooling | Owner |
|-------|-------|---------|-------|
| Unit | State machine transitions, scoring algorithm, utility functions | Vitest | Build |
| Integration | API endpoints, DB queries, email dispatch, hook behavior | Vitest + supertest + test DB | Build/QA |
| Component | UI rendering, user interactions, optimistic updates | Vitest + React Testing Library | Build/QA |
| E2E | Full user flows across browser | Playwright | QA |
| Manual/Exploratory | Edge cases, UX review, accessibility spot checks | Human QA | QA |

#### Test Environments
| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| Local Dev | Unit + integration tests | SQLite or local Postgres, test SMTP (Ethereal/Mailhog) |
| Staging | E2E tests, UAT | Staging DB seeded with test data, test SMTP capture |
| Preview (Cloudflare) | Visual QA, cross-browser | Deployed branch preview, production-like config |

### 1.2 Test Data Requirements

#### User Roles Required
| Role | Description | Auth Level |
|------|-------------|------------|
| Admin (owner) | Full access, can configure approval chains | admin |
| Admin (team member) | Can manage posts, may be an approver | admin |
| Portal User (creator) | Client-side content creator, submits for approval | portal |
| Portal User (approver) | Client-side approver, can approve/reject | portal |
| Portal User (viewer) | Read-only portal access, cannot approve | portal |

#### Seed Data Script Requirements
```
seed-phase3-test-data.ts must provide:
├── 3 clients (ClientA, ClientB, ClientC)
├── Per client:
│   ├── 5 admin users (varying roles)
│   ├── 3 portal users (creator, approver, viewer)
│   ├── 20+ published posts with engagement data spanning 60 days
│   ├── Posts using 15+ distinct hashtags
│   ├── Engagement data (impressions, reach, clicks, saves) per post
│   └── Approval configs (1-level, 2-level, 3-level chains)
├── Hashtag metrics records backfilled from post engagement
├── At least 10 posts per status (draft, scheduled, published)
└── Posts with varied content: text-only, single-image, multi-media, with/without hashtags
```

#### Mock Services
| Service | Mock Strategy | Notes |
|---------|---------------|-------|
| Email (Gmail) | Test SMTP server (Ethereal or Mailhog) | Capture sent emails for assertion; verify recipients, subject, body content |
| AI/LLM (social-generator.ts) | Deterministic mock returning fixed suggestions | Hashtag suggestions should return predictable results for test content |
| Prediction API (post-predictor.ts) | Mock with fixed scoring weights | Ensure deterministic score output for given inputs |
| External platform APIs | Existing mocks from Phase 1/2 | No new platform API interactions in Phase 3 |

### 1.3 Test Cases — Approval Workflow (US-015)

> Detailed cases in [P3-Q002](#p3-q002--approval-workflow-happy-path) and [P3-Q003](#p3-q003--approval-workflow-edge-cases).

| Area | Happy Path Cases | Edge Cases | Integration Cases |
|------|-----------------|------------|-------------------|
| Submit for Approval | 6 | 4 | 2 |
| Approve/Reject/Request Changes | 8 | 9 | 3 |
| Email Notifications | 6 | 3 | 2 |
| Approval Config CRUD | 4 | 3 | 1 |
| Approval History/Audit | 4 | 2 | 1 |
| UI State Management | 5 | 4 | 2 |
| **Total** | **33** | **25** | **11** |

### 1.4 Test Cases — Hashtag Performance Tracking (US-017)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| HT-001 | Dashboard loads and displays top hashtags sorted by engagement rate | E2E | P0 |
| HT-002 | Clicking column headers re-sorts hashtag table (impressions, reach, engagement) | Component | P0 |
| HT-003 | Date range filter changes displayed metrics (uses Phase 2 date picker) | Integration | P0 |
| HT-004 | Selecting a hashtag shows time-series line chart with daily data points | E2E | P0 |
| HT-005 | Multi-hashtag comparison renders distinct colored lines (2-4 hashtags) | Component | P1 |
| HT-006 | Empty state renders correctly when client has no hashtag data | Component | P0 |
| HT-007 | Sparkline mini-charts in table render correctly for each hashtag | Component | P1 |
| HT-008 | `GET /api/{admin|portal}/social/analytics/hashtags` returns paginated, sorted results | Integration | P0 |
| HT-009 | `GET /api/{admin|portal}/social/analytics/hashtags/:tag/timeseries` returns daily data points | Integration | P0 |
| HT-010 | Hashtag suggestion API returns relevant hashtags for given post content | Integration | P1 |
| HT-011 | Suggestions ranked by historical performance (best-performing first) | Integration | P1 |
| HT-012 | "Save as Preset" creates reusable hashtag template | E2E | P1 |
| HT-013 | Saved preset appears in hashtag presets list and can be applied to new posts | E2E | P1 |
| HT-014 | Multi-platform data aggregates correctly (same hashtag across Facebook + Instagram) | Integration | P1 |
| HT-015 | Portal users see only their client's hashtag data | Integration | P0 |
| HT-016 | Admin users can filter hashtag data by client | Component | P1 |
| HT-017 | Hashtag with special characters (emoji, accented chars, CJK) displays correctly | Component | P2 |
| HT-018 | Very large dataset (1000+ hashtags) renders without performance degradation | Performance | P2 |
| HT-019 | Backfill script correctly populates `hashtag_metrics` from existing `social_posts.engagement` | Integration | P0 |

### 1.5 Test Cases — AI Post Performance Predictions (US-018)

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| PR-001 | Prediction score (1-10) displays in CreatePostTab when content is entered | E2E | P0 |
| PR-002 | Score updates when content changes (debounced at 500ms) | Component | P0 |
| PR-003 | Score gauge color matches range: red (1-3), yellow (4-6), green (7-10) | Component | P0 |
| PR-004 | Factor breakdown list shows contributing factors with positive/negative indicators | Component | P0 |
| PR-005 | Improvement suggestions display as actionable cards with "Apply" buttons | Component | P1 |
| PR-006 | Clicking "Add Media" suggestion opens media uploader | E2E | P1 |
| PR-007 | Clicking "Change posting time" suggestion navigates to time picker | E2E | P1 |
| PR-008 | Score recalculates after user applies a suggestion | E2E | P1 |
| PR-009 | "Potential score" badge shows estimated score improvement per suggestion | Component | P1 |
| PR-010 | Empty content shows no prediction / graceful empty state | Component | P0 |
| PR-011 | Very long content (5000+ chars) doesn't break prediction API | Integration | P1 |
| PR-012 | Prediction with zero historical data shows low-confidence warning | Component | P0 |
| PR-013 | `POST /api/{...}/social/ai/predict-performance` returns correct schema | Integration | P0 |
| PR-014 | API accepts all input fields: content, platforms, hashtags, mediaUrls, scheduledAt | Integration | P0 |
| PR-015 | Scoring weights: time-of-day (20%), content quality (25%), hashtag strength (15%), media (20%), historical (20%) | Unit | P0 |
| PR-016 | Prediction loading shows skeleton/spinner (not blank space) | Component | P1 |
| PR-017 | Rapid typing cancels previous prediction requests (no stale results) | Integration | P1 |
| PR-018 | Prediction score stored when post is published (`prediction_records` table) | Integration | P0 |
| PR-019 | Accuracy calculation: actual engagement scored at 48h post-publish | Integration | P1 |
| PR-020 | Accuracy dashboard shows overall accuracy %, trend line, scatter plot | E2E | P1 |
| PR-021 | Post with zero engagement handled gracefully in accuracy tracker | Integration | P2 |
| PR-022 | Old predictions (>90 days) don't skew recent accuracy metrics | Integration | P2 |
| PR-023 | Feature flag gates prediction UI — disabled = no prediction panel visible | Component | P0 |
| PR-024 | Mobile layout: prediction panel renders as collapsible bottom panel | Component | P1 |

### 1.6 Integration Test Boundaries

| Boundary | Test Approach |
|----------|---------------|
| Email notifications | Use Ethereal/Mailhog test SMTP. Assert: recipient, subject line, body contains post title, action links are valid URLs |
| AI hashtag suggestions | Mock LLM service returning deterministic output. Assert: suggestions format, confidence scores, ranking |
| Prediction scoring | Use fixed historical data seed. Assert: deterministic score for identical inputs |
| Database migrations | Run migration forward + rollback on staging DB snapshot. Assert: no data loss, existing queries unaffected |
| TanStack Query cache | Assert: optimistic updates reflect immediately in UI, server confirmation reconciles, error rollback works |

### 1.7 Test Execution Schedule

| Phase | When | What |
|-------|------|------|
| During Build | Continuous | Unit tests written alongside implementation (TDD for state machine + scoring) |
| M1 Completion | Day 5 | P3-Q002, P3-Q003 executed against approval workflow |
| M2 Day 9 | Day 9 | P3-Q004 (hashtag), P3-Q005 (predictions), P3-Q006 (accuracy) |
| M2 Day 10 | Day 10 | P3-Q007 (cross-feature), P3-Q008 (email), P3-Q009 (regression) |

---

## P3-Q002 — Approval Workflow Happy Path

### Prerequisites
- Seed data loaded (3 clients, users with creator/approver/admin roles)
- Approval config set for ClientA: 1-level (single approver)
- Approval config set for ClientB: 2-level chain (L1: team lead, L2: client owner)
- Test SMTP server running and capturing emails
- At least 3 draft posts created per client

---

### TC-AHP-001: Submit Draft Post for Approval
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-001 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | User is a content creator for ClientA. Post "Test Post Alpha" exists in draft status. ClientA has approval config with 1 approver. |
| **Steps** | 1. Navigate to PostsTab. <br>2. Locate "Test Post Alpha" (status: draft). <br>3. Click "Submit for Approval" button on the post card. <br>4. Confirmation dialog appears showing approval chain (1 level, approver name). <br>5. Click "Submit" in dialog. |
| **Expected Result** | • Post status badge changes to "Pending Approval" (blue badge) immediately (optimistic update). <br>• `POST /api/{mode}/social/posts/:id/submit-approval` returns 200. <br>• Post card shows "Pending Approval" badge. <br>• Post content becomes read-only for the creator. <br>• `approval_requests` row created with status=pending, level=1. |
| **Rollback Verification** | If API fails, optimistic update reverts to "Draft" status. Error toast displayed. |

---

### TC-AHP-002: Approver Receives Email Notification
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-002 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | TC-AHP-001 completed successfully. Test SMTP server capturing emails. |
| **Steps** | 1. Check test SMTP inbox for the approver's email address. <br>2. Locate the approval notification email. |
| **Expected Result** | • Email received within 5 seconds of submission. <br>• Subject contains post title: "Approval Requested: Test Post Alpha". <br>• Body includes: post content preview, requester name, "Approve" and "Review" action links. <br>• Action links point to the approval dashboard with the correct approval request ID. <br>• Email uses Steel City AI branding. |

---

### TC-AHP-003: Approver Views Pending Approval in Dashboard
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-003 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | TC-AHP-001 completed. Logged in as the designated approver. |
| **Steps** | 1. Navigate to ApprovalQueueTab. <br>2. Locate "Test Post Alpha" in the pending approvals list. |
| **Expected Result** | • Approval card shows: post content preview, requester name/avatar, submission timestamp. <br>• Three action buttons visible: "Approve" (green), "Request Changes" (yellow), "Reject" (red). <br>• Inline comment field available for feedback. <br>• `GET /api/{mode}/social/approval-requests?status=pending` returns the approval request. |

---

### TC-AHP-004: Approve Post — Status Changes to Approved
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-004 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | TC-AHP-003 completed. Approver is viewing the pending approval card. |
| **Steps** | 1. Optionally enter comment: "Looks great, approved!" <br>2. Click "Approve" button. <br>3. Confirmation prompt appears. <br>4. Confirm approval. |
| **Expected Result** | • Approval card removed from pending queue (optimistic update). <br>• `PUT /api/{mode}/social/approval-requests/:id/respond` with `{action: "approve", comment: "Looks great, approved!"}` returns 200. <br>• Post `approvalStatus` changes to "approved" (green badge). <br>• `approval_comments` row created with action="approve". <br>• Creator receives email notification: "Your post has been approved: Test Post Alpha". <br>• Post can now be scheduled or published. <br>• Approval history shows the approve action with timestamp and comment. |

---

### TC-AHP-005: Reject Post — Status Changes to Rejected with Comments
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-005 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | A different draft post "Test Post Beta" has been submitted for approval. Approver is viewing it in ApprovalQueueTab. |
| **Steps** | 1. Enter comment: "The tone doesn't match our brand guidelines. Please revise the opening paragraph." <br>2. Click "Reject" button. <br>3. Confirm rejection. |
| **Expected Result** | • Approval card removed from pending queue. <br>• `PUT /api/{mode}/social/approval-requests/:id/respond` with `{action: "reject", comment: "The tone doesn't match..."}` returns 200. <br>• Post `approvalStatus` changes to "rejected" (red badge). <br>• `approval_comments` row created with action="reject" and the comment text. <br>• Creator receives email: "Your post was rejected: Test Post Beta" with the rejection comment in the email body. <br>• Post becomes editable again for the creator. <br>• "Re-submit for Approval" button appears on the post. |

---

### TC-AHP-006: Request Changes — Creator Gets Notification
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-006 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | A third draft post "Test Post Gamma" has been submitted for approval. Approver is viewing it. |
| **Steps** | 1. Enter comment: "Great concept! Can you add a CTA at the end and swap the image for something more seasonal?" <br>2. Click "Request Changes" button. <br>3. Confirm action. |
| **Expected Result** | • Post `approvalStatus` changes to "changes_requested" (yellow badge). <br>• `approval_comments` row created with action="request_changes". <br>• Creator receives email: "Changes requested on: Test Post Gamma" with the feedback comment. <br>• Post becomes editable for the creator. <br>• Creator can see the feedback comment in the post's approval history. <br>• "Re-submit for Approval" button appears. <br>• Post is removed from the approver's pending queue. |

---

### TC-AHP-007: Approved Post Can Be Scheduled
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-007 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | TC-AHP-004 completed. "Test Post Alpha" is in approved status. |
| **Steps** | 1. Navigate to PostsTab. <br>2. Locate "Test Post Alpha" (approved). <br>3. Click "Schedule" action. <br>4. Set a future date/time. <br>5. Confirm scheduling. |
| **Expected Result** | • Post status changes from "approved" to "scheduled". <br>• `approvalStatus` remains "approved". <br>• Post appears on the calendar at the scheduled time. <br>• No additional approval required for scheduling an already-approved post. |

---

### TC-AHP-008: Multi-Level Approval — L1 Approves, Auto-Forwards to L2
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-008 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | ClientB has 2-level approval config. L1 approver: "Team Lead". L2 approver: "Client Owner". A draft post "Multi-Level Post" exists for ClientB. |
| **Steps** | 1. Creator submits "Multi-Level Post" for approval. <br>2. Log in as L1 approver (Team Lead). <br>3. Navigate to ApprovalQueueTab. <br>4. Approve the post with comment: "Content looks good, forwarding to client." |
| **Expected Result** | • After L1 approval, post `approvalStatus` remains "pending" (not yet fully approved). <br>• `approval_requests` record updated: level advances from 1 to 2, `currentApproverId` changes to L2 approver. <br>• L2 approver (Client Owner) receives email notification. <br>• L1 approval is logged in `approval_comments`. <br>• L2 approver sees the post in their ApprovalQueueTab with L1's approval comment visible. <br>• Post shows "Pending Approval (Level 2 of 2)" badge. |

---

### TC-AHP-009: Multi-Level Approval — L2 Final Approval
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-009 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | TC-AHP-008 completed. L2 approver is logged in and sees the post in their queue. |
| **Steps** | 1. L2 approver (Client Owner) reviews the post. <br>2. Enters comment: "Approved for publication." <br>3. Clicks "Approve". |
| **Expected Result** | • Post `approvalStatus` changes to "approved" (green badge) — all levels passed. <br>• Creator receives email: "Your post has been fully approved: Multi-Level Post". <br>• If `autoPublishOnApproval` is true in config, post auto-schedules. <br>• Approval history shows complete chain: Submit → L1 Approve → L2 Approve. <br>• Post now eligible for scheduling/publishing. |

---

### TC-AHP-010: Requester Sees Approval Status in PostsTab
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-010 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | Posts exist in various approval states: pending, approved, rejected, changes_requested. |
| **Steps** | 1. Navigate to PostsTab. <br>2. Observe approval status badges on post cards. |
| **Expected Result** | • Draft posts (no approval needed): no approval badge. <br>• Pending: blue "Pending Approval" badge. <br>• Approved: green "Approved" badge. <br>• Rejected: red "Rejected" badge. <br>• Changes Requested: yellow "Changes Requested" badge. <br>• Badge colors match design spec P3-D001. |

---

### TC-AHP-011: Approval Status Visible in PostEditDialog
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-011 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | Post "Test Post Alpha" is approved. |
| **Steps** | 1. Click on "Test Post Alpha" to open PostEditDialog. <br>2. Observe the approval section. |
| **Expected Result** | • Approval status badge displayed prominently. <br>• "Approval History" section shows timeline of all approval actions. <br>• Each timeline entry shows: actor name, action (with color-coded icon), timestamp, comment. <br>• Timeline is in reverse chronological order (most recent first). |

---

### TC-AHP-012: Approval Config CRUD — Admin Creates Config
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-012 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Logged in as admin. ClientC has no approval config. |
| **Steps** | 1. Navigate to approval config settings for ClientC. <br>2. Add Level 1 approver: select user "Manager Mike". <br>3. Add Level 2 approver: select user "Client Carol". <br>4. Toggle `autoPublishOnApproval` to ON. <br>5. Save configuration. |
| **Expected Result** | • `PUT /api/admin/social/approval-config/:clientId` returns 200. <br>• `approval_configs` row created with `levels: [{role: "L1", approverIds: ["manager-mike-id"]}, {role: "L2", approverIds: ["client-carol-id"]}]`. <br>• `autoPublishOnApproval: true`. <br>• New draft posts for ClientC now show "Submit for Approval" button. |

---

### TC-AHP-013: Approval Config — Verify Retrieval
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-013 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | TC-AHP-012 completed. |
| **Steps** | 1. `GET /api/admin/social/approval-config/:clientId` for ClientC. |
| **Expected Result** | • Response includes levels array with correct approver IDs. <br>• `autoPublishOnApproval` is true. <br>• `createdAt` and `updatedAt` timestamps present. |

---

### TC-AHP-014: Optimistic Update Verification
| Field | Value |
|-------|-------|
| **ID** | TC-AHP-014 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | Draft post ready for submission. Network throttled or API response delayed. |
| **Steps** | 1. Submit post for approval. <br>2. Immediately observe UI before API response. |
| **Expected Result** | • Badge changes to "Pending Approval" before server confirms (<50ms UI update). <br>• No loading spinner on the post card itself — status updates optimistically. <br>• After server confirms (200), state remains "Pending Approval". <br>• TanStack Query cache is updated for both PostsTab and any open PostEditDialog. |

---

## P3-Q003 — Approval Workflow Edge Cases

### TC-AEC-001: Publish Without Approval Should Be Blocked
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-001 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | ClientA has approval config. Post "Unapproved Post" is in draft status (never submitted for approval). |
| **Steps** | 1. Navigate to PostsTab. <br>2. Attempt to click "Schedule" or "Publish Now" on "Unapproved Post". |
| **Expected Result** | • "Schedule" and "Publish Now" buttons are either: (a) disabled with tooltip "Approval required before publishing", or (b) hidden entirely, replaced by "Submit for Approval". <br>• If user bypasses UI and calls `POST /api/{mode}/social/posts/:id/publish` directly, API returns 403 with message: "Post requires approval before publishing." <br>• Post status does not change. |

---

### TC-AEC-002: Publish Pending-Approval Post Should Be Blocked
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-002 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post is in `approvalStatus: pending`. |
| **Steps** | 1. Attempt API call: `POST /api/{mode}/social/posts/:id/publish`. |
| **Expected Result** | • API returns 403: "Post is pending approval and cannot be published." <br>• Post status unchanged. |

---

### TC-AEC-003: Rejected Post — Edit and Re-Submit
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-003 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Post "Test Post Beta" was rejected in TC-AHP-005. Creator is logged in. |
| **Steps** | 1. Navigate to PostsTab. <br>2. Open "Test Post Beta" (rejected). <br>3. View rejection comment in approval history. <br>4. Edit the post content to address feedback. <br>5. Click "Re-submit for Approval". |
| **Expected Result** | • Post is editable (fields unlocked). <br>• Rejection comment is visible in approval history section. <br>• After re-submission: `approvalStatus` changes to "pending" (new cycle). <br>• New `approval_requests` row created (previous one remains for audit trail). <br>• Approver receives fresh notification email. <br>• Approval history now shows: Submit → Reject (with comment) → Re-submit. |

---

### TC-AEC-004: Changes Requested — Feedback Visible, Edit, Re-Submit
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-004 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Post "Test Post Gamma" has `approvalStatus: changes_requested` from TC-AHP-006. |
| **Steps** | 1. Open "Test Post Gamma" in PostEditDialog. <br>2. Verify feedback comment is visible. <br>3. Make requested changes (add CTA, swap image). <br>4. Click "Re-submit for Approval". |
| **Expected Result** | • Feedback comment from approver is displayed clearly. <br>• Post fields are editable. <br>• On re-submit, `approvalStatus` resets to "pending". <br>• Approver notified again. <br>• History shows: Submit → Changes Requested → Re-submit. |

---

### TC-AEC-005: Non-Approver Attempts to Approve (403)
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-005 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post is pending approval. Logged in as a user NOT in the approverIds list. |
| **Steps** | 1. Attempt `PUT /api/{mode}/social/approval-requests/:id/respond` with `{action: "approve"}`. |
| **Expected Result** | • API returns 403: "You are not authorized to approve this request." <br>• No state change on the approval request or post. <br>• No email notifications triggered. |

---

### TC-AEC-006: Non-Approver UI — Approve Buttons Not Visible
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-006 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | Logged in as portal viewer (not an approver). Post is pending approval. |
| **Steps** | 1. Navigate to ApprovalQueueTab (if accessible) or view the pending post. |
| **Expected Result** | • Approve/Reject/Request Changes buttons are NOT rendered. <br>• User can view post status but cannot take action. <br>• Portal viewers may not see ApprovalQueueTab at all (depending on design). |

---

### TC-AEC-007: Post Deleted While Pending Approval
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-007 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Post is pending approval. |
| **Steps** | 1. Admin deletes the post via PostsTab or API. <br>2. Approver navigates to ApprovalQueueTab. |
| **Expected Result** | • Post deletion succeeds. <br>• Associated `approval_requests` are either: (a) soft-deleted, or (b) marked with a "post_deleted" status. <br>• Approver no longer sees the post in their pending queue. <br>• No error when approver loads the queue. <br>• Attempting to respond to the now-orphaned approval request returns 404 or 410 (Gone). |

---

### TC-AEC-008: Bulk Submit Multiple Posts for Approval
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-008 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | E2E |
| **Preconditions** | 5 draft posts exist for ClientA. Bulk selection UI available (from Phase 2). |
| **Steps** | 1. Select 5 draft posts using bulk selection. <br>2. Click "Submit for Approval" bulk action. <br>3. Confirm submission for all 5. |
| **Expected Result** | • All 5 posts transition to "pending_approval". <br>• 5 `approval_requests` rows created. <br>• Approver receives a single batched email (not 5 separate emails) — or maximum 1 email per approver per batch. <br>• All 5 posts show "Pending Approval" badge in PostsTab. |

---

### TC-AEC-009: Approval with Empty Comment
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-009 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Post is pending approval. |
| **Steps** | 1. Approver clicks "Approve" without entering a comment. |
| **Expected Result** | • Approval succeeds (comment is optional). <br>• `approval_comments` row created with action="approve", content=null or empty string. <br>• Approval history shows the action with no comment text. <br>• Email to creator still sent (without comment section if empty). |

---

### TC-AEC-010: Approval with Very Long Comment (>1000 chars)
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-010 |
| **User Story** | US-015 |
| **Priority** | P2 |
| **Type** | Integration |
| **Preconditions** | Post is pending approval. |
| **Steps** | 1. Enter a comment with 1500+ characters. <br>2. Click "Reject" (rejection comments are most likely to be long). |
| **Expected Result** | • If UI enforces character limit: input is truncated or prevented beyond limit, with visible counter. <br>• If no limit enforced: comment is saved in full, displayed correctly with text wrapping. <br>• Email includes full comment (or truncated with "View full comment" link). <br>• No API error or database truncation. |

---

### TC-AEC-011: Concurrent Approval Attempts (Race Condition)
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-011 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post is pending approval. Two browser sessions open as the same approver (or two approvers if multi-approver per level). |
| **Steps** | 1. Session A: Click "Approve" (but slow network — request in flight). <br>2. Session B: Click "Reject" before Session A's response returns. |
| **Expected Result** | • First request to reach server wins (database-level optimistic locking or status check). <br>• Second request returns 409 Conflict: "This approval request has already been processed." <br>• Final state is consistent — post is either approved OR rejected, not in an inconsistent state. <br>• UI in the losing session shows error and refreshes to show current state. |

---

### TC-AEC-012: Approver Approves Already-Approved Post (Idempotent)
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-012 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Post was already approved. Approver has a stale UI showing the post as pending. |
| **Steps** | 1. Approver clicks "Approve" on the stale card. |
| **Expected Result** | • API returns 409 or 200 with a message indicating the post is already approved. <br>• No duplicate `approval_comments` entries. <br>• UI refreshes to show current (approved) state. <br>• No duplicate email notifications sent. |

---

### TC-AEC-013: Multi-Level Chain — L1 Rejects, Skips L2
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-013 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | ClientB has 2-level approval chain. Post submitted for approval. |
| **Steps** | 1. L1 approver rejects the post with comment. |
| **Expected Result** | • Post `approvalStatus` changes to "rejected" immediately. <br>• L2 approver is NOT notified (rejection at any level terminates the chain). <br>• Creator is notified of rejection. <br>• Approval history shows: Submit → L1 Reject. <br>• No L2 approval request is created. |

---

### TC-AEC-014: Multi-Level Chain — L2 Rejects After L1 Approval
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-014 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | ClientB 2-level chain. L1 has already approved. Post is pending at L2. |
| **Steps** | 1. L2 approver rejects the post with comment: "Not aligned with Q1 campaign." |
| **Expected Result** | • Post `approvalStatus` changes to "rejected". <br>• Creator receives rejection notification with L2's comment. <br>• L1's earlier approval is preserved in history but overridden. <br>• History shows: Submit → L1 Approve → L2 Reject. <br>• Creator must edit and re-submit, restarting from L1. |

---

### TC-AEC-015: Re-Submit After Multi-Level Rejection Restarts Full Chain
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-015 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | TC-AEC-014 completed. Post was rejected at L2. Creator has edited the post. |
| **Steps** | 1. Creator clicks "Re-submit for Approval". |
| **Expected Result** | • New approval cycle starts from L1 (not L2). <br>• L1 approver receives notification. <br>• Post `approvalStatus` resets to "pending", level=1. <br>• Previous approval cycle's history is preserved. <br>• Full chain must be traversed again. |

---

### TC-AEC-016: L1 Requests Changes in Multi-Level Chain
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-016 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | E2E |
| **Preconditions** | ClientB 2-level chain. Post submitted, pending at L1. |
| **Steps** | 1. L1 approver clicks "Request Changes" with feedback. |
| **Expected Result** | • Post `approvalStatus` changes to "changes_requested". <br>• Creator notified with feedback. <br>• L2 is NOT involved (changes requested at L1 pauses the chain). <br>• After creator edits and re-submits, chain restarts from L1. |

---

### TC-AEC-017: 3-Level Approval Chain Full Traversal
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-017 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | E2E |
| **Preconditions** | Configure a 3-level approval chain: L1 (Editor), L2 (Manager), L3 (Client). Create and submit a post. |
| **Steps** | 1. Creator submits post. <br>2. L1 (Editor) approves. <br>3. L2 (Manager) approves. <br>4. L3 (Client) approves. |
| **Expected Result** | • After L1: status "Pending (L2 of 3)". L2 notified. <br>• After L2: status "Pending (L3 of 3)". L3 notified. <br>• After L3: status "Approved". Creator notified. <br>• Each level transition logged in approval history. <br>• Post badge shows current level progress throughout. |

---

### TC-AEC-018: Admin "Skip Approval" Override
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-018 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | E2E |
| **Preconditions** | Admin user with full access. Client has approval config. |
| **Steps** | 1. Admin creates a post for the client. <br>2. Admin clicks "Publish Now" or "Schedule" (bypassing approval). |
| **Expected Result** | • Admin can publish without approval (admin override). <br>• Or: admin sees "Skip Approval & Publish" option alongside "Submit for Approval". <br>• `approvalStatus` set to "approved" (auto-approved by admin). <br>• Audit log records admin bypass: "Auto-approved by admin: [admin name]". |

---

### TC-AEC-019: Client Without Approval Config — No Approval Required
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-019 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | ClientC has NO approval config (or config deleted). |
| **Steps** | 1. Create a draft post for ClientC. <br>2. Attempt to schedule or publish. |
| **Expected Result** | • "Submit for Approval" button does NOT appear. <br>• "Schedule" and "Publish Now" buttons work normally. <br>• `approvalStatus` remains null on the post. <br>• No approval workflow triggered. <br>• Post lifecycle identical to Phase 1/2 behavior. |

---

### TC-AEC-020: Editing a Pending-Approval Post (Creator Blocked)
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-020 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | Post is in `approvalStatus: pending`. Creator is logged in. |
| **Steps** | 1. Open the pending post in PostEditDialog. <br>2. Attempt to edit content, media, hashtags, or scheduling. |
| **Expected Result** | • All form fields are disabled/read-only. <br>• Message displayed: "This post is pending approval and cannot be edited." <br>• "Withdraw from Approval" button is available (optional — allows creator to cancel the submission and return to draft). <br>• If Withdraw is clicked: `approvalStatus` reverts to null/draft, post becomes editable, approval request cancelled. |

---

### TC-AEC-021: Portal User Sees Only Their Client's Approval Requests
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-021 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Pending approvals exist for ClientA, ClientB, and ClientC. Portal user logged in for ClientA. |
| **Steps** | 1. Navigate to ApprovalQueueTab. <br>2. Observe listed approval requests. |
| **Expected Result** | • Only ClientA's approval requests are visible. <br>• `GET /api/portal/social/approval-requests` filters by authenticated user's client. <br>• No data leakage from ClientB or ClientC. |

---

### TC-AEC-022: Notification Preferences — Email Disabled
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-022 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Approval config has email notifications disabled (in-app only). |
| **Steps** | 1. Submit a post for approval. <br>2. Check test SMTP inbox. |
| **Expected Result** | • No email sent to approver. <br>• In-app notification still appears (approval shows in ApprovalQueueTab). <br>• Approval flow works normally without email. |

---

### TC-AEC-023: Approval Config Update — Affects New Submissions Only
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-023 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Post is currently pending approval with old config (1-level). Admin changes config to 2-level. |
| **Steps** | 1. While a post is pending approval (1-level config), admin updates approval config to 2 levels. <br>2. Approver approves the pending post. <br>3. Creator submits a new post for approval. |
| **Expected Result** | • Existing pending approval completes under old config (1-level — approved after L1). <br>• New submission uses new config (2-level chain). <br>• Config changes are not retroactive to in-flight approvals. |

---

### TC-AEC-024: API Error During Approval — Optimistic Rollback
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-024 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | Post is pending approval. API will fail (simulate with network error or 500). |
| **Steps** | 1. Click "Approve" on a pending post. <br>2. API returns 500 error. |
| **Expected Result** | • Optimistic update (card removed from queue) rolls back. <br>• Post reappears in pending queue. <br>• Error toast displayed: "Failed to approve post. Please try again." <br>• No state corruption — post remains in pending status. <br>• TanStack Query refetches to ensure cache consistency. |

---

### TC-AEC-025: Concurrent Submission — Same Post Submitted Twice
| Field | Value |
|-------|-------|
| **ID** | TC-AEC-025 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Post is in draft. Two tabs open by the same creator. |
| **Steps** | 1. Tab A: Click "Submit for Approval" (request in flight). <br>2. Tab B: Click "Submit for Approval" before Tab A's response. |
| **Expected Result** | • First request succeeds (creates approval_request, changes status). <br>• Second request returns 409 Conflict: "Post is already pending approval." <br>• Only one `approval_requests` row exists. <br>• Tab B refreshes to show current (pending) state. |

---

## Appendices

### Appendix A: Approval Status State Machine

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    ▼                                             │
  ┌──────┐    ┌──────────────────┐    ┌──────────┐    ┌──────────────┐
  │ null │───▶│ pending_approval │───▶│ approved │───▶│ scheduled/   │
  │(draft)│   │  (level N of M)  │    │          │    │ published    │
  └──────┘    └──────────────────┘    └──────────┘    └──────────────┘
     ▲              │         │
     │              │         │
     │    ┌─────────┘         └────────────┐
     │    ▼                                ▼
     │  ┌──────────┐            ┌──────────────────┐
     │  │ rejected │            │changes_requested │
     │  └──────────┘            └──────────────────┘
     │       │                           │
     │       │      ┌────────────────────┘
     │       ▼      ▼
     │   ┌──────────────┐
     └───│ edit + re-   │
         │ submit       │
         └──────────────┘
```

### Appendix B: Test Data Quick Reference

| Entity | Count | Notes |
|--------|-------|-------|
| Clients | 3 | ClientA (1-level), ClientB (2-level), ClientC (no config) |
| Admin users | 5 per client | Varying roles, some are approvers |
| Portal users | 3 per client | Creator, Approver, Viewer |
| Draft posts | 10 per client | For submission testing |
| Published posts | 20+ per client | With engagement data for predictions/hashtags |
| Distinct hashtags | 15+ per client | For hashtag analytics testing |
| Approval configs | 2 active | 1-level (ClientA), 2-level (ClientB) |

### Appendix C: API Endpoint Test Matrix

| Endpoint | Auth | Happy Path | Error Cases | Notes |
|----------|------|------------|-------------|-------|
| `POST .../submit-approval` | Creator | TC-AHP-001 | TC-AEC-001, TC-AEC-025 | Requires draft status |
| `GET .../approval-requests` | Any auth | TC-AHP-003 | TC-AEC-021 | Filtered by client for portal |
| `PUT .../respond` | Approver only | TC-AHP-004/5/6 | TC-AEC-005, TC-AEC-011/12 | Permission-gated |
| `GET .../approval-history` | Any auth | TC-AHP-011 | — | Read-only audit trail |
| `GET/PUT .../approval-config` | Admin only | TC-AHP-012/13 | TC-AEC-023 | Admin-only |

### Appendix D: Risk Coverage Mapping

| Risk (from Risk Register) | Mitigated By Test Cases |
|---------------------------|------------------------|
| Approval workflow complexity creep | TC-AEC-017 (3-level max), TC-AHP-008/009 (multi-level) |
| Email delivery reliability | TC-AHP-002, TC-AEC-022 (email disabled fallback) |
| Approval blocks publishing velocity | TC-AEC-018 (admin override), TC-AEC-019 (no config = no approval) |
| Concurrent approval race conditions | TC-AEC-011, TC-AEC-025 |
| Cross-feature state complexity | TC-AEC-019 (approval optional), TC-AEC-023 (config isolation) |
| Config changes break in-flight approvals | TC-AEC-023 (non-retroactive) |

---

*End of Phase 3 Milestone 1 Test Specifications*
