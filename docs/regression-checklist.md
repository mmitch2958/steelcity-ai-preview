# Phase 4 Regression Testing Checklist

**Project:** SMP-Updates Social Media Platform  
**Tester:** Han (QA/Reliability Agent)  
**Date:** 2026-03-06  
**Branch:** SMP-Updates  
**Test Scope:** Full regression of Phase 1-3 features  

---

## 1. 🎯 Test Execution Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Pass | 0 | 0% |
| ❌ Fail | 0 | 0% |
| ⚠️ Warning | 0 | 0% |
| 🔄 In Progress | 0 | 0% |
| ⏸️ Pending | TBD | 100% |

**Test Coverage:**
- Phase 1 Features: 0/X tested
- Phase 2 Features: 0/X tested
- Phase 3 Features: 0/X tested

**P0 Bugs Found:** 0  
**P1 Bugs Found:** 0  
**P2 Bugs Found:** 0

---

## 2. 📋 Phase 1 Features - Multi-Account Management & Post Creation

### 2.1 Account Management (AccountsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **AC-001** View all connected accounts | ⏸️ | P0 | Should display account cards with platform, username, status | |
| **AC-002** Add new social account (Twitter/X) | ⏸️ | P0 | OAuth flow should work end-to-end | |
| **AC-003** Add new social account (Instagram) | ⏸️ | P0 | OAuth flow should work end-to-end | |
| **AC-004** Add new social account (LinkedIn) | ⏸️ | P0 | OAuth flow should work end-to-end | |
| **AC-005** Add new social account (Facebook) | ⏸️ | P0 | OAuth flow should work end-to-end | |
| **AC-006** Edit account settings | ⏸️ | P1 | Should update account metadata | |
| **AC-007** Disconnect account | ⏸️ | P0 | Should show confirmation, remove account, invalidate tokens | |
| **AC-008** View account connection status | ⏸️ | P1 | Should show active/inactive/error states | |
| **AC-009** Reconnect expired account | ⏸️ | P1 | Should trigger OAuth refresh | |
| **AC-010** Handle account connection errors gracefully | ⏸️ | P1 | Should display helpful error messages | |

### 2.2 Post Creation - Manual Mode (CreatePostTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **PC-001** Switch to Manual mode | ⏸️ | P0 | Mode selector should highlight Manual | |
| **PC-002** Select single platform | ⏸️ | P0 | Platform selector should toggle individual platforms | |
| **PC-003** Select multiple platforms | ⏸️ | P0 | Should allow multi-platform posting | |
| **PC-004** Enter post content | ⏸️ | P0 | Textarea should accept text input | |
| **PC-005** Character count updates correctly | ⏸️ | P1 | Should show per-platform character limits | |
| **PC-006** Character limit enforcement | ⏸️ | P1 | Should warn when exceeding platform limits | |
| **PC-007** Add hashtags | ⏸️ | P0 | Should parse and display hashtags | |
| **PC-008** Add media attachments (image) | ⏸️ | P0 | Should upload and preview images | |
| **PC-009** Add media attachments (video) | ⏸️ | P0 | Should upload and preview videos | |
| **PC-010** Add multiple media attachments | ⏸️ | P1 | Should support multiple files | |
| **PC-011** Remove media attachment | ⏸️ | P1 | Should remove file from list | |
| **PC-012** Reorder media attachments | ⏸️ | P2 | Should use drag-and-drop (SortableMediaGrid) | |
| **PC-013** Media upload progress indicator | ⏸️ | P1 | Should show upload progress | |
| **PC-014** Media upload error handling | ⏸️ | P1 | Should display error message | |
| **PC-015** Select campaign (optional) | ⏸️ | P1 | Should assign post to campaign | |
| **PC-016** Select accounts for posting | ⏸️ | P0 | Should select from connected accounts | |
| **PC-017** Real-time preview updates | ⏸️ | P1 | RealTimePreview should reflect changes | |
| **PC-018** Submit draft post | ⏸️ | P0 | Should save as draft status | |
| **PC-019** Submit for approval | ⏸️ | P0 | Should create approval request | |
| **PC-020** Publish immediately | ⏸️ | P0 | Should publish to selected platforms | |

### 2.3 Post Creation - AI-Assisted Mode (CreatePostTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **AI-001** Switch to AI-Assisted mode | ⏸️ | P0 | Mode selector should highlight AI-Assisted | |
| **AI-002** Enter topic/prompt | ⏸️ | P0 | Should accept user input | |
| **AI-003** Select Brand Voice | ⏸️ | P1 | Should load available brand voices | |
| **AI-004** Generate AI post | ⏸️ | P0 | Should call AI generation endpoint | |
| **AI-005** AI generation loading state | ⏸️ | P1 | Should show spinner/skeleton | |
| **AI-006** AI generation error handling | ⏸️ | P1 | Should display error message | |
| **AI-007** Display generated content | ⏸️ | P0 | Should populate content field | |
| **AI-008** Edit AI-generated content | ⏸️ | P1 | Should allow manual edits | |
| **AI-009** Regenerate AI content | ⏸️ | P1 | Should generate new version | |
| **AI-010** Vibe Edit functionality | ⏸️ | P1 | Should allow tone/style adjustments | |
| **AI-011** AI Review suggestions | ⏸️ | P2 | Should provide feedback on content | |
| **AI-012** Research mode | ⏸️ | P2 | Should gather topic research | |
| **AI-013** Design mode (image generation) | ⏸️ | P2 | Should generate images | |
| **AI-014** Design mode (video generation) | ⏸️ | P2 | Should generate videos | |

### 2.4 Post Creation - Autonomous Mode (CreatePostTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **AU-001** Switch to Autonomous mode | ⏸️ | P0 | Mode selector should highlight Create Everything | |
| **AU-002** Select automation trigger | ⏸️ | P1 | Should offer trigger options | |
| **AU-003** Configure automation settings | ⏸️ | P1 | Should save automation config | |
| **AU-004** Enable autonomous posting | ⏸️ | P1 | Should activate automation | |
| **AU-005** View autonomous post queue | ⏸️ | P2 | Should list scheduled autonomous posts | |
| **AU-006** Disable autonomous posting | ⏸️ | P1 | Should deactivate automation | |

### 2.5 Prediction UI (PredictionResultDisplay.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **PR-001** Trigger post prediction | ⏸️ | P1 | Should analyze post content | |
| **PR-002** Display prediction score | ⏸️ | P1 | Should show engagement score | |
| **PR-003** Display prediction suggestions | ⏸️ | P1 | Should show improvement tips | |
| **PR-004** Apply prediction suggestion | ⏸️ | P2 | Should modify content based on suggestion | |
| **PR-005** Prediction loading state | ⏸️ | P2 | Should show spinner during analysis | |
| **PR-006** Prediction error handling | ⏸️ | P2 | Should display error message | |

### 2.6 Hashtag Suggestions (use-hashtag-analytics.ts)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **HT-001** Get hashtag suggestions for topic | ⏸️ | P1 | Should return relevant hashtags | |
| **HT-002** Display hashtag ranking | ⏸️ | P2 | Should show popularity/reach | |
| **HT-003** Insert suggested hashtag | ⏸️ | P1 | Should add to content | |
| **HT-004** Hashtag limit enforcement | ⏸️ | P2 | Should warn on excessive hashtags | |

### 2.7 Template System (TemplatePicker.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **TP-001** View template gallery | ⏸️ | P1 | Should list available templates | |
| **TP-002** Preview template | ⏸️ | P1 | Should show template content | |
| **TP-003** Apply template to post | ⏸️ | P1 | Should populate content field | |
| **TP-004** Create custom template | ⏸️ | P2 | Should save user-defined template | |
| **TP-005** Edit custom template | ⏸️ | P2 | Should update template | |
| **TP-006** Delete custom template | ⏸️ | P2 | Should remove template | |

### 2.8 Draft Autosave (use-draft-autosave.ts)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **DR-001** Autosave draft on content change | ⏸️ | P1 | Should save after debounce period | |
| **DR-002** Autosave indicator shows "Saving..." | ⏸️ | P2 | Should display save status | |
| **DR-003** Autosave indicator shows "Saved" | ⏸️ | P2 | Should confirm save completion | |
| **DR-004** Restore draft on page load | ⏸️ | P1 | Should load last saved draft | |
| **DR-005** Clear draft after publishing | ⏸️ | P1 | Should remove autosave data | |
| **DR-006** Manual save draft | ⏸️ | P1 | Should save via button click | |
| **DR-007** Discard draft | ⏸️ | P1 | Should clear all draft data | |

---

## 3. 📋 Phase 2 Features - Scheduling & Bulk Operations

### 3.1 Post Scheduling (PostsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **SC-001** Schedule post for future date | ⏸️ | P0 | Should accept datetime input | |
| **SC-002** Schedule post for multiple dates | ⏸️ | P1 | Should create recurring posts | |
| **SC-003** Reschedule existing post | ⏸️ | P0 | Should update scheduledAt | |
| **SC-004** Cancel scheduled post | ⏸️ | P0 | Should change status to draft | |
| **SC-005** View scheduled posts in list | ⏸️ | P0 | Should filter by status=scheduled | |
| **SC-006** Timezone handling | ⏸️ | P1 | Should respect user timezone | |
| **SC-007** Invalid date handling | ⏸️ | P1 | Should reject past dates | |

### 3.2 Content Calendar (ContentCalendarTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **CA-001** View calendar grid | ⏸️ | P0 | Should display current month | |
| **CA-002** Navigate to previous month | ⏸️ | P0 | Should load previous month's posts | |
| **CA-003** Navigate to next month | ⏸️ | P0 | Should load next month's posts | |
| **CA-004** View posts on specific date | ⏸️ | P0 | Should show all posts for that day | |
| **CA-005** Drag post to new date | ⏸️ | P0 | Should reschedule post via drag-drop | |
| **CA-006** Drop post on same date (no change) | ⏸️ | P2 | Should handle gracefully | |
| **CA-007** Drop post on invalid target | ⏸️ | P2 | Should revert position | |
| **CA-008** Undo drag-to-reschedule | ⏸️ | P1 | UndoSnackbar should restore previous date | |
| **CA-009** Calendar loading state | ⏸️ | P2 | Should show skeleton loader | |
| **CA-010** Calendar empty state | ⏸️ | P2 | Should show "No posts" message | |
| **CA-011** Color-coded post status | ⏸️ | P1 | Should differentiate draft/scheduled/published | |
| **CA-012** Click post to view details | ⏸️ | P1 | Should open post preview dialog | |

### 3.3 Bulk Actions (PostsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **BK-001** Select single post | ⏸️ | P0 | Checkbox should toggle selection | |
| **BK-002** Select multiple posts | ⏸️ | P0 | Should add to selection set | |
| **BK-003** Select all posts | ⏸️ | P1 | Should select all visible posts | |
| **BK-004** Deselect all posts | ⏸️ | P1 | Should clear selection | |
| **BK-005** Bulk schedule to same date | ⏸️ | P0 | Should update all selected posts | |
| **BK-006** Bulk delete posts | ⏸️ | P0 | Should delete all selected posts | |
| **BK-007** Bulk delete confirmation dialog | ⏸️ | P0 | Should require user confirmation | |
| **BK-008** Bulk archive posts | ⏸️ | P1 | Should change status to archived | |
| **BK-009** Bulk archive confirmation | ⏸️ | P1 | Should require user confirmation | |
| **BK-010** Bulk actions disabled when 0 selected | ⏸️ | P1 | Buttons should be disabled | |
| **BK-011** Selection count display | ⏸️ | P2 | Should show "X posts selected" | |

### 3.4 Post Duplication (PostsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **DU-001** Duplicate single post | ⏸️ | P0 | Should create copy with "(Copy)" suffix | |
| **DU-002** Duplicate post preserves content | ⏸️ | P0 | All fields should match original | |
| **DU-003** Duplicate post has draft status | ⏸️ | P0 | New post should be draft | |
| **DU-004** Duplicate post resets scheduled date | ⏸️ | P1 | Should not inherit schedule | |
| **DU-005** Duplicate post copies media attachments | ⏸️ | P1 | Should reference same media URLs | |

### 3.5 Post List View & Filtering (PostsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **PL-001** View all posts | ⏸️ | P0 | Default view should show all | |
| **PL-002** Filter by status: draft | ⏸️ | P0 | Should show only drafts | |
| **PL-003** Filter by status: scheduled | ⏸️ | P0 | Should show only scheduled | |
| **PL-004** Filter by status: published | ⏸️ | P0 | Should show only published | |
| **PL-005** Filter by status: failed | ⏸️ | P1 | Should show only failed posts | |
| **PL-006** Post list pagination | ⏸️ | P1 | Should paginate large lists | |
| **PL-007** Post list loading state | ⏸️ | P1 | Should show skeleton loader | |
| **PL-008** Post list empty state | ⏸️ | P1 | Should show "No posts" message | |
| **PL-009** Post card displays correct info | ⏸️ | P0 | Content, platform badges, status | |

---

## 4. 📋 Phase 3 Features - Approval Workflows & Analytics

### 4.1 Approval Workflow (ApprovalQueueTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **AP-001** Submit post for approval | ⏸️ | P0 | Should create approval request | |
| **AP-002** View pending approvals | ⏸️ | P0 | Should list all pending requests | |
| **AP-003** Filter approvals by status | ⏸️ | P1 | pending/approved/rejected/changes_requested | |
| **AP-004** View approval request details | ⏸️ | P0 | Should show post content, requester info | |
| **AP-005** Approve post | ⏸️ | P0 | Should change status to approved | |
| **AP-006** Approve post with comment | ⏸️ | P1 | Should save approval comment | |
| **AP-007** Reject post | ⏸️ | P0 | Should change status to rejected | |
| **AP-008** Reject post requires comment | ⏸️ | P1 | Should validate comment field | |
| **AP-009** Request changes | ⏸️ | P0 | Should change status to changes_requested | |
| **AP-010** Request changes requires comment | ⏸️ | P1 | Should validate comment field | |
| **AP-011** View approval history | ⏸️ | P1 | ApprovalHistoryTimeline should show all actions | |
| **AP-012** Approval notification sent | ⏸️ | P1 | Requester should receive notification | |
| **AP-013** Multi-level approval workflow | ⏸️ | P2 | Should require multiple approvals if configured | |
| **AP-014** Approval permissions check | ⏸️ | P0 | Only authorized users can approve | |

### 4.2 Approval Notifications (use-approval-notification.ts)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **AN-001** In-app notification on approval | ⏸️ | P1 | Should show toast/banner | |
| **AN-002** In-app notification on rejection | ⏸️ | P1 | Should show toast/banner | |
| **AN-003** In-app notification on changes requested | ⏸️ | P1 | Should show toast/banner | |
| **AN-004** Email notification on approval | ⏸️ | P2 | Requester receives email | |
| **AN-005** Email notification on rejection | ⏸️ | P2 | Requester receives email | |

### 4.3 Analytics Dashboard (AnalyticsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **AN-001** View analytics overview | ⏸️ | P0 | Should display key metrics | |
| **AN-002** Date range filter: Last 7 days | ⏸️ | P0 | Should filter data by range | |
| **AN-003** Date range filter: Last 30 days | ⏸️ | P0 | Should filter data by range | |
| **AN-004** Date range filter: Last 90 days | ⏸️ | P0 | Should filter data by range | |
| **AN-005** Date range filter: Custom range | ⏸️ | P1 | Should accept custom dates | |
| **AN-006** Platform filter | ⏸️ | P1 | Should filter by selected platform | |
| **AN-007** Account filter | ⏸️ | P1 | Should filter by selected account | |
| **AN-008** Display engagement metrics | ⏸️ | P0 | Likes, shares, comments, clicks | |
| **AN-009** Display reach metrics | ⏸️ | P0 | Impressions, reach | |
| **AN-010** Display post count | ⏸️ | P0 | Total posts in period | |
| **AN-011** Chart: Engagement over time | ⏸️ | P1 | Should render line/bar chart | |
| **AN-012** Chart: Performance by platform | ⏸️ | P1 | Should render comparison chart | |
| **AN-013** Analytics loading state | ⏸️ | P1 | Should show skeleton loader | |
| **AN-014** Analytics empty state | ⏸️ | P1 | Should show "No data" message | |
| **AN-015** Export analytics data | ⏸️ | P2 | Should download CSV/PDF | |

### 4.4 Hashtag Analytics (HashtagDashboard.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **HA-001** View hashtag dashboard | ⏸️ | P1 | Should display top hashtags | |
| **HA-002** Hashtag performance metrics | ⏸️ | P1 | Engagement, reach, usage count | |
| **HA-003** Hashtag trend chart | ⏸️ | P1 | HashtagTrendChart should render | |
| **HA-004** Hashtag ranking table | ⏸️ | P1 | HashtagRankingTable should sort | |
| **HA-005** Filter hashtags by platform | ⏸️ | P2 | Should filter data | |
| **HA-006** Filter hashtags by date range | ⏸️ | P2 | Should filter data | |

### 4.5 Brand Voice Management (BrandVoiceTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **BV-001** View all brand voices | ⏸️ | P0 | Should list available voices | |
| **BV-002** Create new brand voice | ⏸️ | P0 | Should save voice configuration | |
| **BV-003** Edit brand voice | ⏸️ | P0 | Should update voice settings | |
| **BV-004** Delete brand voice | ⏸️ | P0 | Should remove voice | |
| **BV-005** Delete confirmation dialog | ⏸️ | P1 | Should require user confirmation | |
| **BV-006** Set default brand voice | ⏸️ | P1 | Should mark as default | |
| **BV-007** Brand voice form validation | ⏸️ | P1 | Required fields enforced | |
| **BV-008** Brand voice examples/samples | ⏸️ | P2 | Should show sample outputs | |

### 4.6 Campaign Management (CampaignsTab.tsx)

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **CM-001** View all campaigns | ⏸️ | P0 | Should list campaigns | |
| **CM-002** Create new campaign | ⏸️ | P0 | Should save campaign | |
| **CM-003** Edit campaign | ⏸️ | P0 | Should update campaign | |
| **CM-004** Delete campaign | ⏸️ | P0 | Should remove campaign | |
| **CM-005** Archive campaign | ⏸️ | P1 | Should change status to archived | |
| **CM-006** Assign posts to campaign | ⏸️ | P0 | Should link posts | |
| **CM-007** View campaign posts | ⏸️ | P0 | Should filter posts by campaignId | |
| **CM-008** Campaign analytics | ⏸️ | P1 | Should show campaign-level metrics | |

---

## 5. 🧪 Cross-Cutting Concerns

### 5.1 Performance

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **PF-001** Page load time < 3s | ⏸️ | P1 | Measure with DevTools | |
| **PF-002** No layout shift on load | ⏸️ | P1 | CLS score check | |
| **PF-003** Lazy loading of tabs | ⏸️ | P0 | Verify route-based code splitting | |
| **PF-004** Media upload doesn't block UI | ⏸️ | P1 | Should be async | |
| **PF-005** Large post lists paginate | ⏸️ | P1 | 100+ posts | |

### 5.2 Accessibility

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **A11Y-001** Keyboard navigation works | ⏸️ | P0 | All interactive elements focusable | |
| **A11Y-002** Focus indicators visible | ⏸️ | P0 | Visual focus ring | |
| **A11Y-003** ARIA labels present | ⏸️ | P0 | Screen reader compatible | |
| **A11Y-004** Color contrast meets AA | ⏸️ | P0 | 4.5:1 minimum | |
| **A11Y-005** Form validation messages accessible | ⏸️ | P1 | Announced to screen readers | |

### 5.3 Error Handling

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **ER-001** Network error displays message | ⏸️ | P0 | User-friendly error | |
| **ER-002** API error displays message | ⏸️ | P0 | User-friendly error | |
| **ER-003** Invalid form input shows validation | ⏸️ | P0 | Field-level errors | |
| **ER-004** Upload failure shows retry option | ⏸️ | P1 | Should allow retry | |
| **ER-005** Auth expiration redirects to login | ⏸️ | P0 | Should handle 401 | |

### 5.4 Responsive Design

| Test Case | Status | Priority | Notes | Bug ID |
|-----------|--------|----------|-------|--------|
| **RD-001** Mobile viewport (375px) renders correctly | ⏸️ | P1 | No horizontal scroll | |
| **RD-002** Tablet viewport (768px) renders correctly | ⏸️ | P1 | Responsive layout | |
| **RD-003** Desktop viewport (1920px) renders correctly | ⏸️ | P0 | Optimal layout | |
| **RD-004** Touch interactions work on mobile | ⏸️ | P1 | Drag-and-drop, etc. | |

---

## 6. 🐛 Bug Log

### P0 Bugs (Critical - Blocks Core Functionality)

| Bug ID | Component | Description | Status | Assigned To |
|--------|-----------|-------------|--------|-------------|
| - | - | - | - | - |

### P1 Bugs (High - Degrades User Experience)

| Bug ID | Component | Description | Status | Assigned To |
|--------|-----------|-------------|--------|-------------|
| - | - | - | - | - |

### P2 Bugs (Medium - Minor Issues)

| Bug ID | Component | Description | Status | Assigned To |
|--------|-----------|-------------|--------|-------------|
| - | - | - | - | - |

---

## 7. 📊 Test Environment

**Testing Environment:**
- Browser: TBD
- OS: TBD
- Screen Resolution: TBD
- Network Speed: TBD

**Backend:**
- API Base URL: TBD
- Database: TBD

**Test Data:**
- Test accounts: TBD
- Sample posts: TBD
- Sample media: TBD

---

## 8. ✅ Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | Han | - | - |
| Tech Lead | Luke | - | - |
| Product Owner | Mike | - | - |

---

**Next Steps:**
1. Execute manual regression testing (all test cases)
2. Log any bugs found in GitHub Issues
3. Update this checklist with results
4. Create E2E test suite based on critical flows
5. Final pre-launch verification

**Notes:**
- This checklist will be updated in real-time as testing progresses
- All P0 bugs must be fixed before Phase 4 sign-off
- All P1 bugs should be fixed or documented for post-launch
