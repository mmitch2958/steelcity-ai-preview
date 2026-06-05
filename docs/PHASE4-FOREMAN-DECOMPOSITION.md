# Phase 4 Decomposition: Polish & Launch
**Foreman:** Steel City AI Foreman  
**Project Code:** SMP-2026-Q1  
**Branch:** SMP-Updates  
**Phase:** 4 ("Ship It")  
**Generated:** 2026-03-05

---

## 1. 🎯 Goal Summary

Production-hardening and launch prep for the Social Media Management Platform. Phase 4 focuses on performance optimization, comprehensive testing, accessibility compliance, and documentation to ensure a smooth client launch.

### Phase 4 Scope
| Area | Deliverables |
|------|--------------|
| Performance | Lazy loading verification, bundle size <500KB, Lighthouse 90+ |
| Testing | Full regression suite, E2E tests for critical paths |
| Accessibility | WCAG 2.1 AA compliance audit + fixes |
| Documentation | Feature guide, changelog, API docs |

**Launch Gate:** No P0/P1 bugs, docs complete, client sign-off

---

## 2. ✅ Definition of Done

### Performance
- [ ] All tabs use lazy loading (verified via React DevTools)
- [ ] Bundle size <500KB initial load
- [ ] Lighthouse score 90+ on Performance, Accessibility, Best Practices, SEO

### Testing
- [ ] All Phase 1-3 features pass regression tests
- [ ] E2E tests for critical user flows (create post, schedule, approve)
- [ ] No P0/P1 bugs open

### Accessibility
- [ ] WCAG 2.1 AA compliance (keyboard nav, screen reader, color contrast)
- [ ] Focus indicators on all interactive elements

### Documentation
- [ ] CHANGELOG.md updated with all Phase 1-3 changes
- [ ] README.md includes setup and usage instructions

---

## 3. 🗓️ Milestone Plan

### **M1: Performance & Polish (Days 1-2)**
| Focus | Deliverables |
|-------|--------------|
| Bundle optimization | Lazy loading verified, code splitting, tree shaking |
| Performance fixes | Any Lighthouse issues addressed |

### **M2: Testing & Accessibility (Days 3-4)**
| Focus | Deliverables |
|-------|--------------|
| E2E testing | Playwright tests for critical flows |
| Accessibility | Audit fixes for WCAG compliance |

### **M3: Documentation & Launch (Days 5-7)**
| Focus | Deliverables |
|-------|--------------|
| Docs | CHANGELOG, README, feature guide |
| Launch prep | Client pilot, final sign-off |

---

## 4. 📋 Department Task Board

### **Build — Implementation**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P4-B001 | Verify lazy loading on all tabs (Dashboard, Posts, Campaigns, Calendar, Analytics, BrandVoice, Accounts) | B005-B012 complete | 4h | P1 | READY |
| P4-B002 | Bundle size analysis and optimization: run bundle analyzer, identify large dependencies, implement code splitting | P4-B001 | 6h | P1 | READY |
| P4-B003 | Fix any Lighthouse issues (image optimization, caching, CLS fixes) | P4-B002 | 4h | P1 | READY |
| P4-B004 | Run production build and verify no build errors | All phases | 2h | P0 | READY |

### **Design/UX — UI Polish**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P4-D001 | Accessibility audit: keyboard navigation, focus indicators, color contrast | All phases | 6h | P1 | READY |
| P4-D002 | Fix accessibility issues found in audit | P4-D001 | 4h | P1 | READY |
| P4-D003 | Visual polish: spacing consistency, button states, loading states | All phases | 4h | P2 | READY |

### **QA — Testing**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P4-Q001 | Run full regression test suite (all Phase 1-3 features) | All phases complete | 8h | P0 | READY |
| P4-Q002 | E2E tests for critical flows: create post → schedule → publish → analytics | P4-B004 | 6h | P0 | READY |
| P4-Q003 | Bug bash: find and document any P0/P1 issues | P4-Q001 | 4h | P1 | READY |
| P4-Q004 | Pre-launch checklist verification | P4-Q003 | 2h | P0 | READY |

### **Growth/Content — Documentation**

| task_id | instructions | dependencies | estimate | priority | status |
|---------|--------------|--------------|----------|----------|--------|
| P4-G001 | Update CHANGELOG.md with all Phase 1-3 features | All phases complete | 4h | P1 | READY |
| P4-G002 | Update README.md with setup and usage docs | P4-G001 | 4h | P1 | READY |
| P4-G003 | Create feature guide for client training | P4-G002 | 6h | P2 | READY |

---

## 5. ⚠️ Risk Register

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Regression bugs discovered late | HIGH | MEDIUM | Run regression early in Phase 4 | QA |
| Bundle size exceeds target | MEDIUM | LOW | Analyze early, optimize aggressively | Build |
| Accessibility issues require significant rework | HIGH | MEDIUM | Start accessibility work immediately | Design |
| Client pilot reveals issues | HIGH | MEDIUM | Buffer 1 day for fixes | All |

---

## 6. 📊 PM Export JSON

```json
{
  "project": {
    "code": "SMP-2026-Q1",
    "phase": 4,
    "name": "Phase 4: Polish & Launch",
    "branch": "SMP-Updates",
    "repo": "steelcity-ai/steelcity-ai.com",
    "start_date": "2026-03-09",
    "target_end": "2026-03-15",
    "total_tasks": 13,
    "total_estimate_hours": 52
  },
  "milestones": [
    {
      "id": "M1",
      "name": "Performance & Polish",
      "tasks": ["P4-B001", "P4-B002", "P4-B003", "P4-B004"],
      "estimate_hours": 16
    },
    {
      "id": "M2",
      "name": "Testing & Accessibility",
      "tasks": ["P4-D001", "P4-D002", "P4-Q001", "P4-Q002", "P4-Q003"],
      "estimate_hours": 24
    },
    {
      "id": "M3",
      "name": "Documentation & Launch",
      "tasks": ["P4-D003", "P4-Q004", "P4-G001", "P4-G002", "P4-G003"],
      "estimate_hours": 16
    }
  ],
  "critical_path": ["P4-B001", "P4-B002", "P4-B004", "P4-Q001", "P4-Q002", "P4-Q004"],
  "launch_criteria": [
    "No P0/P1 bugs",
    "Lighthouse 90+",
    "WCAG 2.1 AA compliant",
    "CHANGELOG and README updated"
  ]
}
```
