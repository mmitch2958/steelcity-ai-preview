# 🏗️ SMP-Updates Project Decomposition Plan
**Project Foreman:** R2  
**Project Code:** SMP-2026-Q1  
**Generated:** 2026-03-04 20:30 EST

---

## 1. 🎯 Goal Summary

**Transform the monolithic 3,788-line PortalSocialMedia.tsx into a maintainable, feature-rich social media management platform that delights Steel City AI's realtor clients and serves as a scalable foundation for new client acquisition.**

### Success Metrics
- **Code Health**: 90%+ TypeScript coverage, <500 lines per component
- **Performance**: <2s initial load, <100ms tab switches (lazy loading)
- **User Satisfaction**: 8+ NPS score from pilot clients
- **Business Impact**: 2+ new client sign-ups within 30 days of release

---

## 2. ✅ Definition of Done

### Code Quality
- [ ] All components <500 lines, properly typed (no `any`)
- [ ] Shared hooks extracted for mutations/queries
- [ ] Error boundaries implemented on all tab routes
- [ ] Loading skeletons on all async operations
- [ ] Optimistic updates on all mutations
- [ ] All commits follow conventional-commits spec
- [ ] Code cleaned with `deslop` before merge

### Features
- [ ] All P0 architecture issues resolved
- [ ] All P1 UX/UI issues implemented
- [ ] 50%+ P2 features delivered (prioritized by client feedback)

### Testing & Deploy
- [ ] Unit tests for shared hooks (80%+ coverage)
- [ ] E2E tests for critical paths (post creation, publishing)
- [ ] QA sign-off on regression testing
- [ ] Staging deployment validated by internal team
- [ ] Client pilot validation (1 realtor client, 2-week trial)

### Documentation
- [ ] Component architecture diagram (via ELK/Mermaid)
- [ ] Updated client-facing feature guide
- [ ] Developer onboarding doc for new contributors
- [ ] Changelog generated via `git-changelog`

---

## 3. 🗓️ Milestone Plan (Phased Rollout)

### **Phase 1: Foundation (Weeks 1-3) — "The Great Refactor"**
**Goal:** Break the monolith, establish architectural patterns  
**Priority:** P0 issues #1-6  
**Deliverable:** Component library, TypeScript interfaces, shared hooks

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Architecture design + scaffolding | Component structure, folder layout, interface definitions |
| 2 | Component extraction (Dashboard, CreatePost, Posts) | 3 tabs refactored, hooks extracted |
| 3 | Remaining tabs + error boundaries | All 9 tabs split, optimistic updates live |

**Go/No-Go Gate:** All P0 issues resolved, no regression in existing functionality

---

### **Phase 2: Core UX Wins (Weeks 4-5) — "Make It Smooth"**
**Goal:** High-impact UX improvements users will immediately notice  
**Priority:** P1 issues #7-13  
**Deliverable:** Drag-and-drop, bulk actions, real-time preview, templates

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 4 | Media management + bulk actions | Drag-and-drop reordering, post duplication, bulk delete/schedule |
| 5 | Live preview + templates | Real-time content preview, saved drafts system |

**Go/No-Go Gate:** 2+ beta testers validate UX improvements, no critical bugs

---

### **Phase 3: Advanced Features (Weeks 6-7) — "Level Up"**
**Goal:** Competitive differentiators and workflow enhancements  
**Priority:** P2 issues #14-19 (prioritized subset)  
**Deliverable:** Approval workflows, hashtag tracking, performance predictions

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 6 | Approval workflow + analytics upgrades | Client approval chain, date range filtering, hashtag performance |
| 7 | AI enhancements | Post performance predictions (using historical data) |

**Go/No-Go Gate:** Client feedback session, approval workflow validated

---

### **Phase 4: Polish & Launch (Week 8) — "Ship It"**
**Goal:** Production hardening, docs, launch prep  
**Priority:** Code quality #20-22 + documentation  
**Deliverable:** Production-ready release

| Day | Focus | Key Deliverables |
|-----|-------|------------------|
| 1-2 | E2E testing, accessibility audit | Full regression suite, WCAG 2.1 AA compliance |
| 3-4 | Performance optimization | Lazy loading, bundle size analysis, Lighthouse 90+ |
| 5-7 | Client pilot + docs | Feature guide, video walkthrough, changelog |

**Launch Gate:** Client sign-off, no P0/P1 bugs, docs complete

---

## 4. 📋 Department Task Board

### **Research/Product (3CP0) — 12 tasks**

| ID | Task | Dependencies | Est | Priority | Status |
|----|------|--------------|-----|----------|--------|
| R001 | User story mapping for all 22 issues | None | 8h | P0 | READY |
| R002 | Interview 3 realtor clients on pain points | None | 6h | P1 | READY |
| R003 | Validate approval workflow requirements | R001 | 4h | P2 | BLOCKED |
| R004 | Analytics feature prioritization (P2 subset) | R002 | 3h | P2 | BLOCKED |
| R005 | Post template taxonomy (categories/tags) | R002 | 4h | P1 | BLOCKED |
| R006 | A/B testing viability research | R002 | 6h | P2 | BLOCKED |
| R007 | Hashtag performance metrics definition | R002 | 3h | P2 | BLOCKED |
| R008 | Beta tester recruitment (2-3 clients) | R001 | 2h | P1 | BLOCKED |
| R009 | Phase 2 UX validation session | A006 | 4h | P1 | BLOCKED |
| R010 | Phase 3 approval workflow walkthrough | B014 | 3h | P2 | BLOCKED |
| R011 | Final pilot validation (2-week trial) | All phases | 80h | P0 | BLOCKED |
| R012 | NPS survey design + distribution | R011 | 4h | P1 | BLOCKED |

---

### **System Architect (Akbar) — 10 tasks**

| ID | Task | Dependencies | Est | Priority | Status |
|----|------|--------------|-----|----------|--------|
| A001 | Design component architecture (folder structure, naming) | R001 | 12h | P0 | READY |
| A002 | Define TypeScript interfaces for all entities | R001 | 10h | P0 | READY |
| A003 | Design shared hooks architecture (queries/mutations) | A001 | 8h | P0 | BLOCKED |
| A004 | State management pattern design (context vs hooks) | A001 | 6h | P0 | BLOCKED |
| A005 | Error boundary strategy + fallback UI specs | A001 | 4h | P0 | BLOCKED |
| A006 | Optimistic update patterns for mutations | A003 | 6h | P0 | BLOCKED |
| A007 | Drag-and-drop architecture (media, calendar) | A001 | 5h | P1 | BLOCKED |
| A008 | Real-time preview architecture | A003 | 4h | P1 | BLOCKED |
| A009 | Approval workflow data model + API design | R003, A002 | 8h | P2 | BLOCKED |
| A010 | Performance prediction ML integration pattern | A003 | 8h | P2 | BLOCKED |

---

### **Build (Luke) — 28 tasks**

| ID | Task | Dependencies | Est | Priority | Status |
|----|------|--------------|-----|----------|--------|
| **Phase 1: Foundation** |
| B001 | Create folder structure + base components | A001 | 4h | P0 | BLOCKED |
| B002 | Extract TypeScript interfaces to types/ | A002 | 6h | P0 | BLOCKED |
| B003 | Implement shared query hooks | A003 | 12h | P0 | BLOCKED |
| B004 | Implement shared mutation hooks | A003 | 12h | P0 | BLOCKED |
| B005 | Refactor Dashboard tab | B001, B003 | 8h | P0 | BLOCKED |
| B006 | Refactor CreatePost tab (split into 5 components) | B001, B004, A004 | 20h | P0 | BLOCKED |
| B007 | Refactor Posts tab | B001, B003 | 10h | P0 | BLOCKED |
| B008 | Refactor Campaigns tab | B001, B003 | 8h | P0 | BLOCKED |
| B009 | Refactor Accounts tab | B001, B003 | 6h | P0 | BLOCKED |
| B010 | Refactor BrandVoice tab | B001, B003 | 8h | P0 | BLOCKED |
| B011 | Refactor Calendar tab | B001, B003 | 10h | P0 | BLOCKED |
| B012 | Refactor Analytics tab | B001, B003 | 8h | P0 | BLOCKED |
| B013 | Implement error boundaries | A005, B001 | 6h | P0 | BLOCKED |
| B014 | Add optimistic updates to all mutations | A006, B004 | 10h | P0 | BLOCKED |
| **Phase 2: Core UX** |
| B015 | Drag-and-drop media reordering | A007, L002 | 12h | P1 | BLOCKED |
| B016 | Post duplication feature | B007 | 4h | P1 | BLOCKED |
| B017 | Bulk actions (delete/schedule) | B007, L003 | 10h | P1 | BLOCKED |
| B018 | Drag-to-reschedule calendar | A007, B011 | 12h | P1 | BLOCKED |
| B019 | Analytics date range filtering | B012 | 6h | P1 | BLOCKED |
| B020 | Real-time preview component | A008, L004 | 10h | P1 | BLOCKED |
| B021 | Post templates system (CRUD) | R005, B007 | 14h | P1 | BLOCKED |
| **Phase 3: Advanced Features** |
| B022 | Approval workflow UI + API integration | A009, L005 | 16h | P2 | BLOCKED |
| B023 | Hashtag performance tracking | R007, B012 | 8h | P2 | BLOCKED |
| B024 | Post performance predictions integration | A010 | 12h | P2 | BLOCKED |
| B025 | Campaign-to-post linking UI | B008, L006 | 6h | P2 | BLOCKED |
| **Phase 4: Polish** |
| B026 | Lazy loading for all tabs | B005-B012 | 8h | P1 | BLOCKED |
| B027 | Loading skeletons for all async operations | L007 | 10h | P1 | BLOCKED |
| B028 | Bundle size optimization + code splitting | B026 | 6h | P1 | BLOCKED |

---

### **Design/UX (Leia) — 14 tasks**

| ID | Task | Dependencies | Est | Priority | Status |
|----|------|--------------|-----|----------|--------|
| L001 | Design system audit (Shadcn/ui components) | None | 4h | P0 | READY |
| L002 | Drag-and-drop interaction patterns | A007 | 6h | P1 | BLOCKED |
| L003 | Bulk actions UI design (checkboxes, action bar) | None | 4h | P1 | READY |
| L004 | Real-time preview layout + UX flow | None | 6h | P1 | READY |
| L005 | Approval workflow UI/UX design | R003 | 10h | P2 | BLOCKED |
| L006 | Campaign-to-post linking UI patterns | None | 4h | P2 | READY |
| L007 | Loading skeleton designs (all tabs) | A001 | 6h | P1 | BLOCKED |
| L008 | Error state designs (boundaries, fallbacks) | A005 | 4h | P0 | BLOCKED |
| L009 | Empty state designs (all tabs) | None | 6h | P1 | READY |
| L010 | Post template picker UI | R005 | 6h | P1 | BLOCKED |
| L011 | Accessibility audit (WCAG 2.1 AA) | B005-B012 | 8h | P1 | BLOCKED |
| L012 | Mobile responsive review | B005-B012 | 6h | P1 | BLOCKED |
| L013 | Analytics date picker UI | None | 3h | P1 | READY |
| L014 | Hashtag performance visualization | R007 | 6h | P2 | BLOCKED |

---

### **QA (Han) — 10 tasks**

| ID | Task | Dependencies | Est | Priority | Status |
|----|------|--------------|-----|----------|--------|
| Q001 | Phase 1 regression test plan | B001-B014 | 6h | P0 | BLOCKED |
| Q002 | Phase 1 regression execution | B014, Q001 | 12h | P0 | BLOCKED |
| Q003 | Phase 2 UX validation test plan | B015-B021 | 4h | P1 | BLOCKED |
| Q004 | Phase 2 UX validation execution | B021, Q003 | 10h | P1 | BLOCKED |
| Q005 | Phase 3 feature validation test plan | B022-B025 | 4h | P2 | BLOCKED |
| Q006 | Phase 3 feature validation execution | B025, Q005 | 8h | P2 | BLOCKED |
| Q007 | E2E test suite (Playwright/Cypress) | B021 | 16h | P1 | BLOCKED |
| Q008 | Unit tests for shared hooks | B003, B004 | 12h | P0 | BLOCKED |
| Q009 | Performance testing (Lighthouse) | B028 | 4h | P1 | BLOCKED |
| Q010 | Final production smoke tests | All phases | 6h | P0 | BLOCKED |

---

### **Growth/Content (Lando) — 8 tasks**

| ID | Task | Dependencies | Est | Priority | Status |
|----|------|--------------|-----|----------|--------|
| G001 | Changelog copy (Phase 1 release) | B014 | 2h | P0 | BLOCKED |
| G002 | Feature announcement (internal) | B014 | 1h | P0 | BLOCKED |
| G003 | Client-facing feature guide (Phase 2) | B021, L004 | 6h | P1 | BLOCKED |
| G004 | Video walkthrough (new features) | B021 | 4h | P1 | BLOCKED |
| G005 | Sales enablement deck (feature highlights) | G003 | 4h | P1 | BLOCKED |
| G006 | Developer onboarding doc | A001, B001 | 6h | P1 | BLOCKED |
| G007 | Architecture diagram (Mermaid) | A001 | 3h | P0 | BLOCKED |
| G008 | Post-launch case study (pilot client) | R011 | 8h | P2 | BLOCKED |

---

## 5. ⚠️ Risk Register

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Scope creep during refactor | HIGH | MEDIUM | Lock Phase 1 scope after A001 approved; defer new features to backlog | Akbar |
| TypeScript migration reveals hidden bugs | HIGH | HIGH | Incremental typing (tab by tab); comprehensive regression testing per tab | Luke, Han |
| Realtor client disruption during refactor | HIGH | LOW | Feature-flag new components; maintain backward compatibility | Luke |
| Drag-and-drop library conflicts with Shadcn | MEDIUM | MEDIUM | Prototype with dnd-kit early; fallback to manual reorder buttons | Akbar, Luke |
| Meta OAuth token expiry during testing | MEDIUM | HIGH | Document token refresh flow; automate renewal in tests | Han |
| Performance regression from new features | MEDIUM | LOW | Lighthouse CI gate; bundle size budget alerts | Han, Luke |
| Client feedback delays Phase 3 scope | LOW | MEDIUM | Pre-validate with internal team; async feedback via recorded demos | 3CP0 |

---

## 6. 🚀 Next 48 Hours

### Immediate (Today)
- [ ] **3CP0**: Start R001 (user story mapping)
- [ ] **Leia**: Start L001 (design system audit), L003 (bulk actions UI), L004 (preview layout)
- [ ] **Akbar**: Start A001 (component architecture) and A002 (TypeScript interfaces)

### Tomorrow
- [ ] **3CP0**: Continue R001, start R002 (client interviews)
- [ ] **Akbar**: Complete A001, start A003 (hooks architecture)
- [ ] **Leia**: Complete L001, L003; start L009 (empty states), L013 (date picker)
- [ ] **Luke**: Begin B001 (folder structure) once A001 is approved
- [ ] **Han**: Review A001 architecture for testability
- [ ] **Lando**: Start G007 (architecture diagram) once A001 complete

### Critical Path
```
R001 → A001 → A003 → B003/B004 → B005-B014 → Q001/Q002
```
Any delay on R001 or A001 delays everything.

---

## 7. 📊 PM Export (JSON)

```json
{
  "project": {
    "code": "SMP-2026-Q1",
    "name": "SMP-Updates: Portal Social Media Improvements",
    "branch": "SMP-Updates",
    "repo": "SteelCity-ai/steelcity-ai.com",
    "start_date": "2026-03-04",
    "target_end": "2026-04-29",
    "total_tasks": 82,
    "total_estimate_hours": 558,
    "phases": 4
  },
  "sprint_health": "GREEN",
  "blocker_list": [],
  "ready_tasks": ["R001", "R002", "A001", "A002", "L001", "L003", "L004", "L006", "L009", "L013"],
  "critical_path": ["R001", "A001", "A003", "B003", "B005", "B014", "Q001", "Q002"]
}
```
