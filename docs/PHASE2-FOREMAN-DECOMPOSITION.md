# Phase 2 Decomposition: Social Media Integration Project
**Foreman:** Steel City AI Foreman  
**Project Code:** SMP-2026-Q1  
**Branch:** SMP-Updates  
**Phase:** 2 (Core UX Wins - "Make It Smooth")  
**Generated:** 2026-03-05

---

## 1. 🎯 Goal Summary

Deliver high-impact UX improvements that users will immediately notice, transforming the social media management experience from functional to delightful. Phase 2 focuses on interaction patterns that reduce friction: drag-and-drop workflows, bulk operations, real-time feedback, and content reusability.

### Phase 2 Scope (8 User Stories)
| US | User Story | Impact |
|----|-----------|--------|
| US-007 | Drag-drop media reordering in CreatePostTab | High - Reduces friction in content creation |
| US-008 | Post duplication from Posts tab | Medium - Enables quick content variation |
| US-009 | Bulk actions (select multiple → delete/reschedule/archive) | High - Major time saver for power users |
| US-010 | Drag-to-reschedule calendar (ContentCalendarTab) | High - Intuitive scheduling interaction |
| US-011 | Analytics date range filtering | Medium - Required for meaningful analytics |
| US-012 | Real-time post preview (updates as you type) | High - Builds confidence before publishing |
| US-013 | Post templates and drafts system | High - Enables content reusability |
| US-014 | Loading skeletons | Medium - Perceived performance improvement |

**Total Estimated Hours:** ~106h

---

## 2. ✅ Definition of Done

### Feature Completion
- [ ] US-007: Drag-drop media reordering functional with smooth animations
- [ ] US-008: Post duplication creates editable copy with "Copy of" prefix
- [ ] US-009: Bulk actions work for delete, reschedule, and archive operations
- [ ] US-010: Calendar drag-to-reschedule updates post schedule instantly
- [ ] US-011: Date range picker filters analytics data correctly
- [ ] US-012: Real-time preview updates within 100ms of typing
- [ ] US-013: Templates CRUD operational; drafts auto-save every 30s
- [ ] US-014: Loading skeletons display during all async operations

### Code Quality
- [ ] All new components <500 lines, TypeScript strict mode
- [ ] Drag-and-drop uses @dnd-kit library (or proven alternative)
- [ ] Optimistic updates maintain consistency during bulk operations
- [ ] Error states handled gracefully with user-friendly messages

### UX/UI Standards
- [ ] All interactions follow Design/UX specifications (L002, L003, L004, L007)
- [ ] Keyboard navigation functional for all new features
- [ ] Mobile responsive (tablet minimum) for calendar and bulk actions
- [ ] WCAG 2.1 AA compliance for interactive elements

### Testing
- [ ] Unit tests for new hooks and utilities (80% coverage)
- [ ] Integration tests for drag-and-drop scenarios
- [ ] QA sign-off on all 8 user stories

---

## 3. 🗓️ Milestone Plan

### **Milestone 1: Interaction Foundation (Week 4)**
**Goal:** Core drag-and-drop and selection interactions
**Focus:** US-007, US-008, US-009, US-010

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 1-2 | Architecture (A007), Design specs (L002, L003) | DnD architecture approved, bulk action UI spec |
| 3-4 | B015 (Media DnD), B016 (Post duplication) | Media reordering works in CreatePostTab |
| 5 | B017 (Bulk actions) | Bulk delete/schedule UI functional |

**Milestone 1 Exit Criteria:** All 4 user stories have functional implementation

---

### **Milestone 2: Calendar & Analytics (Week 5前半)**
**Goal:** Calendar scheduling and analytics filtering
**Focus:** US-010, US-011

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 6-7 | B018 (Calendar DnD reschedule), B019 (Date filtering) | Calendar drag works; analytics date range functional |

**Milestone 2 Exit Criteria:** Calendar and analytics features operational

---

### **Milestone 3: Preview & Templates (Week 5後半)**
**Goal:** Real-time feedback and content reusability
**Focus:** US-012, US-013, US-014

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 8-9 | B020 (Real-time preview), B021 (Templates) | Preview updates live; templates system works |
| 10 | B027 (Loading skeletons), L007 (Skeleton designs) | All async operations show skeletons |

**Milestone 3 Exit Criteria:** All 8 user stories complete, QA validated

---

## 4. 📋 Department Task Board

### **Build Department — Implementation**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P2-B001 | Implement drag-and-drop architecture using @dnd-kit for media reordering in CreatePostTab. Create sortable media list component with grip handles and smooth reorder animations. | A007, L002 | 12h | P1 | READY |
| P2-B002 | Add post duplication feature to PostsTab: duplicate button on each post card, creates new post with "Copy of {title}" prefix, navigates to edit mode. | B007 (Posts tab refactored) | 4h | P1 | READY |
| P2-B003 | Implement bulk actions system: checkbox selection on posts, floating action bar (delete/reschedule/archive), batch API endpoints, optimistic updates. | L003 | 10h | P1 | READY |
| P2-B004 | Implement drag-to-reschedule in ContentCalendarTab: drag post card to new date/time slot, inline update without dialog, visual feedback during drag. | A007, B011 | 12h | P1 | READY |
| P2-B005 | Add analytics date range filtering: date range picker component, filter API queries by date range, persist filter state in URL params. | B012 | 6h | P1 | READY |
| P2-B006 | Build real-time preview component: split-pane layout in CreatePostTab, live updates as user types (debounced 100ms), platform-specific preview rendering. | A008, L004 | 10h | P1 | READY |
| P2-B007 | Create post templates system: template CRUD (name, content, platforms, hashtags), template picker UI in CreatePostTab, template categories/tags. | R005, B007 | 14h | P1 | READY |
| P2-B008 | Implement drafts system: auto-save every 30s, drafts list in PostsTab, restore from draft functionality, delete draft option. | B007 | 8h | P1 | READY |
| P2-B009 | Add loading skeletons: replace all spinners with skeleton components matching content layout, implement skeleton component library. | L007 | 10h | P1 | READY |

---

### **Design/UX Department — UI/UX Guidance, Accessibility**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P2-D001 | Design drag-and-drop interaction patterns: grip handle visual, drop zone indicators, reorder animation specs, touch target sizing (44px min). | A007 | 6h | P1 | READY |
| P2-D002 | Design bulk actions UI: checkbox placement, floating action bar position (bottom on mobile, sticky top on desktop), confirmation dialogs for destructive actions. | None | 4h | P1 | READY |
| P2-D003 | Design real-time preview layout: split-pane or toggle view, platform preview tabs (Instagram, Facebook, Twitter, LinkedIn), character count warnings. | None | 6h | P1 | READY |
| P2-D004 | Design post templates UI: card-based template picker, category filter, preview on hover, "Use Template" action. | R005 | 6h | P1 | READY |
| P2-D005 | Design loading skeleton specifications: shimmer animation, layout matching actual content, consistent gray tones, skeleton for each component type. | None | 4h | P1 | READY |
| P2-D006 | Design calendar drag interaction: visual feedback during drag (shadow, date highlight), drop zone indicators, undo snackbar after reschedule. | A007 | 4h | P1 | READY |
| P2-D007 | Accessibility audit for Phase 2 features: keyboard navigation for DnD, focus management during bulk operations, screen reader announcements for state changes. | B001-B009 | 6h | P1 | BLOCKED |

---

### **QA Department — Test Plans**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P2-Q001 | Create Phase 2 test plan: define test cases for each user story, specify test data requirements, identify test environments. | B001-B009 | 4h | P1 | READY |
| P2-Q002 | Test drag-and-drop media reordering: verify reorder persists after refresh, test touch vs mouse, test with 10+ items. | P2-B001, P2-D001 | 6h | P1 | READY |
| P2-Q003 | Test post duplication: verify copy is independent of original, verify media is copied, test multiple duplications. | P2-B002 | 3h | P1 | READY |
| P2-Q004 | Test bulk actions: select all/deselect, bulk delete with confirmation, bulk reschedule, bulk archive, verify optimistic rollback on error. | P2-B003, P2-D002 | 8h | P1 | READY |
| P2-Q005 | Test calendar drag-to-reschedule: drag to past date (should warn), drag to occupied slot, verify notification settings update. | P2-B004, P2-D006 | 6h | P1 | READY |
| P2-Q006 | Test analytics date range: valid ranges, invalid ranges (start > end), clear filter, export with filter applied. | P2-B005 | 4h | P1 | READY |
| P2-Q007 | Test real-time preview: typing speed vs preview update, special characters, emoji rendering, platform-specific truncation. | P2-B006, P2-D003 | 5h | P1 | READY |
| P2-Q008 | Test templates and drafts: create template, use template, edit template, delete template; drafts auto-save, restore draft, delete draft. | P2-B007, P2-B008, P2-D004 | 8h | P1 | READY |
| P2-Q009 | Test loading skeletons: verify skeletons show during load, skeleton layout matches content, animation smooth. | P2-B009, P2-D005 | 3h | P1 | READY |
| P2-Q010 | Regression testing: ensure Phase 1 features still work, verify no data loss, test error boundaries. | All Phase 2 complete | 8h | P1 | BLOCKED |

---

## 5. ⚠️ Risk Register

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| DnD library conflicts with Shadcn UI | HIGH | MEDIUM | Prototype with @dnd-kit early; have fallback to manual reorder buttons | Build |
| Bulk action race conditions | HIGH | LOW | Implement request queuing; show clear loading states; optimistic with conflict resolution | Build |
| Calendar timezone handling | HIGH | MEDIUM | Use UTC internally; display in user's timezone; explicit timezone indicator | Build |
| Template content size bloat | MEDIUM | LOW | Implement character limits per template; lazy load template previews | Build |
| Preview performance with long content | MEDIUM | MEDIUM | Debounce updates; virtualize long content rendering; lazy render | Build |
| Auto-save draft conflicts | MEDIUM | LOW | Timestamp checks before overwrite; prompt user on conflict | Build |
| Accessibility timeline pressure | HIGH | HIGH | Start accessibility work in parallel with build; daily checks | Design/UX |
| QA environment data scarcity | MEDIUM | MEDIUM | Create seed data script; mock API responses for isolated testing | QA |

---

## 6. 📊 PM Export JSON

```json
{
  "project": {
    "code": "SMP-2026-Q1",
    "phase": 2,
    "name": "Phase 2: Core UX Wins",
    "branch": "SMP-Updates",
    "repo": "steelcity-ai/steelcity-ai.com",
    "start_date": "2026-03-09",
    "target_end": "2026-03-20",
    "total_tasks": 25,
    "total_estimate_hours": 106
  },
  "user_stories": [
    {
      "id": "US-007",
      "title": "Drag-drop media reordering in CreatePostTab",
      "tasks": ["P2-B001", "P2-D001"],
      "estimate_hours": 18
    },
    {
      "id": "US-008",
      "title": "Post duplication from Posts tab",
      "tasks": ["P2-B002"],
      "estimate_hours": 4
    },
    {
      "id": "US-009",
      "title": "Bulk actions (select multiple → delete/reschedule/archive)",
      "tasks": ["P2-B003", "P2-D002"],
      "estimate_hours": 14
    },
    {
      "id": "US-010",
      "title": "Drag-to-reschedule calendar (ContentCalendarTab)",
      "tasks": ["P2-B004", "P2-D006"],
      "estimate_hours": 16
    },
    {
      "id": "US-011",
      "title": "Analytics date range filtering",
      "tasks": ["P2-B005"],
      "estimate_hours": 6
    },
    {
      "id": "US-012",
      "title": "Real-time post preview (updates as you type)",
      "tasks": ["P2-B006", "P2-D003"],
      "estimate_hours": 16
    },
    {
      "id": "US-013",
      "title": "Post templates and drafts system",
      "tasks": ["P2-B007", "P2-B008", "P2-D004"],
      "estimate_hours": 28
    },
    {
      "id": "US-014",
      "title": "Loading skeletons",
      "tasks": ["P2-B009", "P2-D005"],
      "estimate_hours": 14
    }
  ],
  "milestones": [
    {
      "id": "M1",
      "name": "Interaction Foundation",
      "tasks": ["P2-B001", "P2-B002", "P2-B003", "P2-D001", "P2-D002"],
      "target_date": "2026-03-13",
      "user_stories": ["US-007", "US-008", "US-009"]
    },
    {
      "id": "M2",
      "name": "Calendar & Analytics",
      "tasks": ["P2-B004", "P2-B005", "P2-D006"],
      "target_date": "2026-03-16",
      "user_stories": ["US-010", "US-011"]
    },
    {
      "id": "M3",
      "name": "Preview & Templates",
      "tasks": ["P2-B006", "P2-B007", "P2-B008", "P2-B009", "P2-D003", "P2-D004", "P2-D005"],
      "target_date": "2026-03-20",
      "user_stories": ["US-012", "US-013", "US-014"]
    }
  ],
  "department_tasks": {
    "build": [
      {"task_id": "P2-B001", "user_story": "US-007", "estimate": "12h", "status": "READY"},
      {"task_id": "P2-B002", "user_story": "US-008", "estimate": "4h", "status": "READY"},
      {"task_id": "P2-B003", "user_story": "US-009", "estimate": "10h", "status": "READY"},
      {"task_id": "P2-B004", "user_story": "US-010", "estimate": "12h", "status": "READY"},
      {"task_id": "P2-B005", "user_story": "US-011", "estimate": "6h", "status": "READY"},
      {"task_id": "P2-B006", "user_story": "US-012", "estimate": "10h", "status": "READY"},
      {"task_id": "P2-B007", "user_story": "US-013", "estimate": "14h", "status": "READY"},
      {"task_id": "P2-B008", "user_story": "US-013", "estimate": "8h", "status": "READY"},
      {"task_id": "P2-B009", "user_story": "US-014", "estimate": "10h", "status": "READY"}
    ],
    "design_ux": [
      {"task_id": "P2-D001", "user_story": "US-007", "estimate": "6h", "status": "READY"},
      {"task_id": "P2-D002", "user_story": "US-009", "estimate": "4h", "status": "READY"},
      {"task_id": "P2-D003", "user_story": "US-012", "estimate": "6h", "status": "READY"},
      {"task_id": "P2-D004", "user_story": "US-013", "estimate": "6h", "status": "READY"},
      {"task_id": "P2-D005", "user_story": "US-014", "estimate": "4h", "status": "READY"},
      {"task_id": "P2-D006", "user_story": "US-010", "estimate": "4h", "status": "READY"},
      {"task_id": "P2-D007", "user_story": "ALL", "estimate": "6h", "status": "BLOCKED"}
    ],
    "qa": [
      {"task_id": "P2-Q001", "user_story": "ALL", "estimate": "4h", "status": "READY"},
      {"task_id": "P2-Q002", "user_story": "US-007", "estimate": "6h", "status": "READY"},
      {"task_id": "P2-Q003", "user_story": "US-008", "estimate": "3h", "status": "READY"},
      {"task_id": "P2-Q004", "user_story": "US-009", "estimate": "8h", "status": "READY"},
      {"task_id": "P2-Q005", "user_story": "US-010", "estimate": "6h", "status": "READY"},
      {"task_id": "P2-Q006", "user_story": "US-011", "estimate": "4h", "status": "READY"},
      {"task_id": "P2-Q007", "user_story": "US-012", "estimate": "5h", "status": "READY"},
      {"task_id": "P2-Q008", "user_story": "US-013", "estimate": "8h", "status": "READY"},
      {"task_id": "P2-Q009", "user_story": "US-014", "estimate": "3h", "status": "READY"},
      {"task_id": "P2-Q010", "user_story": "REGRESSION", "estimate": "8h", "status": "BLOCKED"}
    ]
  },
  "sprint_health": "GREEN",
  "blocker_list": [
    "P2-D007: Waiting for build tasks to stabilize before accessibility audit",
    "P2-Q010: Waiting for all Phase 2 features to be complete"
  ],
  "ready_tasks": [
    "P2-B001", "P2-B002", "P2-B003", "P2-B004", "P2-B005", "P2-B006", "P2-B007", "P2-B008", "P2-B009",
    "P2-D001", "P2-D002", "P2-D003", "P2-D004", "P2-D005", "P2-D006",
    "P2-Q001", "P2-Q002", "P2-Q003", "P2-Q004", "P2-Q005", "P2-Q006", "P2-Q007", "P2-Q008", "P2-Q009"
  ],
  "critical_path": [
    "A007 (architecture) → P2-B001 (media DnD) → P2-Q002 (test)",
    "L002 (design spec) → P2-B001 → P2-Q002",
    "P2-B003 (bulk actions) → P2-Q004 (test)",
    "P2-B006 (preview) → P2-Q007 (test)"
  ],
  "dependencies_from_other_phases": {
    "required_from_phase1": [
      "B007: Posts tab refactored (for P2-B002, P2-B003)",
      "B011: Calendar tab refactored (for P2-B004)",
      "B012: Analytics tab refactored (for P2-B005)",
      "A007: Drag-and-drop architecture design",
      "A008: Real-time preview architecture",
      "L007: Skeleton designs"
    ]
  }
}
```

---

## 7. 📝 Notes

### Architecture Dependencies
- **A007** (Drag-and-drop architecture) must be completed before P2-B001, P2-B004
- **A008** (Real-time preview architecture) must be completed before P2-B006
- **L002, L003, L004, L007** (Design specs) should be ready before build tasks start

### API Considerations
- Need batch endpoints: `POST /api/social/posts/bulk-delete`, `POST /api/social/posts/bulk-schedule`, `POST /api/social/posts/bulk-archive`
- Templates need CRUD: `GET/POST/PUT/DELETE /api/social/templates`
- Drafts: `GET/POST/PUT/DELETE /api/social/drafts` (or use post status='draft')

### Performance Targets
- Drag-and-drop: <16ms frame time (60fps)
- Real-time preview: <100ms update latency
- Bulk actions: Show progress for >5 items
- Skeletons: Match content layout exactly to prevent layout shift

---

*End of Phase 2 Decomposition*
