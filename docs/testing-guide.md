# Phase 4 Testing Execution Guide

**Project:** SMP-Updates Social Media Platform  
**Phase:** 4 - Polish & Launch  
**QA Lead:** Han (QA/Reliability Agent)  
**Date:** 2026-03-06

---

## 📋 Overview

This guide outlines the complete testing strategy for Phase 4, including:
1. Manual regression testing
2. E2E automated testing
3. Exploratory testing
4. Performance testing
5. Accessibility testing
6. Cross-browser testing

---

## 🎯 Testing Objectives

### Success Criteria

- ✅ All P0 bugs fixed before launch
- ✅ All P1 bugs fixed or documented for post-launch
- ✅ 100% regression coverage of Phase 1-3 features
- ✅ E2E tests passing for all critical flows
- ✅ WCAG 2.1 AA compliance verified
- ✅ Cross-browser compatibility confirmed
- ✅ Performance metrics met (Lighthouse 90+)

---

## 📅 Testing Schedule

### Week 1: M1 - Foundation & Audit

**Days 1-2**

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| Day 1 AM | Manual regression (Phase 1 features) | Regression checklist 50% complete | Han |
| Day 1 PM | E2E test creation (create post flow) | `01-create-post.spec.ts` passing | Han |
| Day 2 AM | Manual regression (Phase 2 features) | Regression checklist 80% complete | Han |
| Day 2 PM | E2E tests (scheduling + approval) | `02-scheduling.spec.ts`, `03-approval-workflow.spec.ts` | Han |

### Week 1: M2 - Fix & Optimize

**Days 3-5**

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| Day 3 | Complete regression + bug logging | Regression checklist 100%, bugs logged | Han |
| Day 4 | E2E bulk actions + exploratory testing | `04-bulk-actions.spec.ts`, bug bash notes | Han |
| Day 5 | Cross-browser testing + accessibility audit | Browser compatibility report, a11y issues | Han |

### Week 2: M3 - Launch Prep

**Days 6-7**

| Day | Activity | Deliverable | Owner |
|-----|----------|-------------|-------|
| Day 6 | Re-test fixed bugs, verify E2E suite | All tests passing | Han |
| Day 7 | Final pre-launch checklist | Pre-launch report, QA sign-off | Han |

---

## 📝 Test Execution Instructions

### 1. Manual Regression Testing

**Location:** `docs/regression-checklist.md`

**Instructions:**

1. **Setup Test Environment**
   ```bash
   # Start local dev server
   npm run dev
   
   # In browser, navigate to http://localhost:5173
   # Login with test credentials
   ```

2. **Execute Test Cases**
   - Work through each section of regression checklist
   - Update status column: ✅ Pass, ❌ Fail, ⚠️ Warning
   - For failures: capture screenshot, log bug in GitHub Issues
   - Add bug ID to checklist

3. **Bug Logging Template**
   ```markdown
   **Title:** [Component] Brief description
   
   **Priority:** P0 / P1 / P2
   
   **Environment:** Browser, OS, version
   
   **Steps to Reproduce:**
   1. Navigate to...
   2. Click...
   3. Observe...
   
   **Expected:** What should happen
   
   **Actual:** What actually happened
   
   **Screenshot:** [Attach]
   
   **Impact:** Who is affected, how severe
   
   **Related Test Case:** PC-001, etc.
   ```

4. **Daily Reporting**
   - Update regression checklist summary table
   - Report status in team sync
   - Escalate P0 bugs immediately

---

### 2. E2E Automated Testing

**Location:** `tests/e2e/`

**Instructions:**

1. **Setup**
   ```bash
   # Install Playwright
   npm install
   npx playwright install
   
   # Create test environment file
   cp .env.example .env.test
   # Edit .env.test with test credentials
   ```

2. **Run All Tests**
   ```bash
   npm run test:e2e
   ```

3. **Run Specific Test Suite**
   ```bash
   npx playwright test tests/e2e/01-create-post.spec.ts
   ```

4. **Debug Failed Tests**
   ```bash
   # Run in headed mode (see browser)
   npx playwright test --headed
   
   # Run in debug mode (step through)
   npx playwright test --debug
   
   # View test report
   npx playwright show-report
   ```

5. **Analyze Failures**
   - Check `test-results/` for screenshots, videos, traces
   - Determine if test is flaky or real bug
   - Update test or log bug accordingly

6. **Add New Tests**
   - Follow pattern in existing spec files
   - Use `authenticatedPage` fixture
   - Add descriptive test names
   - Update `tests/e2e/README.md`

---

### 3. Exploratory Testing (Bug Bash)

**Location:** `docs/exploratory-testing-notes.md`

**Instructions:**

1. **Review Charter**
   - Read session objectives
   - Understand focus areas

2. **Execute Sessions**
   - Set timer for 30-60 min per session
   - Think like a user trying to break things
   - Try unusual workflows
   - Test edge cases

3. **Document Findings**
   - Update session table with results
   - Log bugs immediately
   - Note UX friction points
   - Capture improvement ideas

4. **Techniques**
   - **Boundary testing:** Min/max values
   - **Invalid input:** Garbage data
   - **Race conditions:** Simultaneous actions
   - **Error injection:** Disconnect network mid-action
   - **State corruption:** Modify local storage
   - **Performance:** Large datasets

---

### 4. Performance Testing

**Tools:** Chrome DevTools, Lighthouse

**Instructions:**

1. **Lighthouse Audit**
   ```bash
   # In Chrome DevTools
   1. Open DevTools (F12)
   2. Navigate to Lighthouse tab
   3. Select "Desktop"
   4. Run audit
   5. Save report as docs/lighthouse-[date].html
   ```

2. **Metrics to Check**
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+
   - First Contentful Paint: <1.8s
   - Largest Contentful Paint: <2.5s
   - Cumulative Layout Shift: <0.1
   - Time to Interactive: <3.8s

3. **Performance Profiling**
   ```bash
   # In Chrome DevTools Performance tab
   1. Start recording
   2. Perform user action (e.g., load calendar)
   3. Stop recording
   4. Analyze timeline for long tasks (>50ms)
   5. Document bottlenecks
   ```

4. **Bundle Size Analysis**
   ```bash
   npm run build
   # Check dist/ folder size
   # Verify main bundle <500KB
   ```

---

### 5. Accessibility Testing

**Tools:** axe DevTools, NVDA/VoiceOver, Keyboard only

**Instructions:**

1. **Automated Scan**
   ```bash
   # Install axe DevTools browser extension
   # In browser:
   1. Navigate to page
   2. Open DevTools
   3. Click axe DevTools tab
   4. Click "Scan ALL of my page"
   5. Review violations
   6. Export report to docs/accessibility-audit.md
   ```

2. **Keyboard Navigation**
   - Disconnect mouse/trackpad
   - Tab through all interactive elements
   - Verify:
     - All elements reachable
     - Focus indicators visible
     - Logical tab order
     - Enter/Space trigger actions
     - Esc closes dialogs

3. **Screen Reader Testing**
   ```bash
   # Windows: NVDA (free)
   # Mac: VoiceOver (built-in, Cmd+F5)
   
   # Test:
   1. Navigate through page with arrow keys
   2. Verify headings announced
   3. Verify form labels read
   4. Verify error messages read
   5. Verify image alt text read
   ```

4. **Color Contrast**
   - Use contrast checker tool
   - Verify all text meets 4.5:1 (normal) or 3:1 (large)
   - Test with color blindness simulator

5. **Zoom Testing**
   - Zoom to 200% (Cmd/Ctrl + Plus)
   - Verify no content cutoff
   - Verify layout doesn't break

---

### 6. Cross-Browser Testing

**Browsers:** Chrome, Firefox, Safari (latest stable)

**Instructions:**

1. **Setup**
   ```bash
   # Install browsers
   # Or use BrowserStack for Safari (if not on Mac)
   ```

2. **Test Matrix**
   
   For each browser, test:
   - Create post flow
   - Scheduling flow
   - Approval workflow
   - Bulk actions
   - Calendar drag-and-drop
   - Media upload
   - Date picker
   - Real-time preview

3. **Document Issues**
   ```markdown
   **Browser:** Firefox 120
   **OS:** Windows 11
   **Issue:** Calendar drag-and-drop doesn't work
   **Screenshot:** [Attach]
   **Workaround:** Use reschedule button instead
   ```

4. **Playwright Cross-Browser**
   ```typescript
   // Uncomment in playwright.config.ts:
   projects: [
     { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
     { name: 'webkit', use: { ...devices['Desktop Safari'] } },
   ]
   ```
   
   ```bash
   npx playwright install firefox webkit
   npm run test:e2e
   ```

---

## 📊 Test Reporting

### Daily Status Report

**Template:**

```markdown
## QA Daily Status - [Date]

### Progress
- Regression testing: X% complete
- E2E tests: X/Y passing
- Bugs logged: X (P0: X, P1: X, P2: X)

### Completed
- [Test case IDs completed]

### In Progress
- [Current activity]

### Blockers
- [Any issues preventing progress]

### Next 24h
- [Planned activities]
```

### Bug Summary Report

**Template:**

```markdown
## Bug Summary - [Date]

### Critical (P0)
- [Bug ID] [Component] [Brief description] - [Status]

### High (P1)
- [Bug ID] [Component] [Brief description] - [Status]

### Medium (P2)
- [Bug ID] [Component] [Brief description] - [Status]

### Metrics
- Total bugs: X
- Fixed: X
- In progress: X
- Open: X
- Won't fix: X
```

---

## ✅ Pre-Launch Checklist

**Run this checklist before launch approval**

### Regression Testing
- [ ] All regression test cases executed
- [ ] Regression checklist 100% complete
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed or documented

### E2E Testing
- [ ] All E2E tests passing
- [ ] Tests run in CI/CD pipeline
- [ ] No flaky tests
- [ ] Test coverage adequate

### Exploratory Testing
- [ ] All bug bash sessions complete
- [ ] Findings documented
- [ ] Critical issues logged

### Performance
- [ ] Lighthouse score 90+ on all metrics
- [ ] Bundle size <500KB
- [ ] No layout shift issues
- [ ] Load time <3s

### Accessibility
- [ ] axe DevTools shows 0 violations
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast AA compliant
- [ ] Focus indicators visible

### Cross-Browser
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] No major browser-specific issues

### Documentation
- [ ] Test results documented
- [ ] Known issues documented
- [ ] Release notes prepared

### Sign-Off
- [ ] QA Lead approval (Han)
- [ ] Tech Lead approval (Luke)
- [ ] Product Owner approval (Mike)

---

## 🔧 Troubleshooting

### Common Issues

**E2E Tests Fail Locally**
- Ensure dev server is running on port 5173
- Check test credentials in `.env.test`
- Clear browser cache: `npx playwright test --clear-cache`
- Update Playwright: `npm install -D @playwright/test@latest`

**Regression Tests Take Too Long**
- Prioritize P0/P1 test cases first
- Run smoke tests before full regression
- Use test automation for repetitive tasks

**Can't Reproduce Bug**
- Check browser version
- Verify test data state
- Clear local storage/cookies
- Try incognito mode

**Tests Flaky**
- Add explicit waits: `waitForLoadState('networkidle')`
- Increase timeout: `{ timeout: 10000 }`
- Use test retries: `retries: 2` in config

---

## 📞 Escalation

**For critical issues (P0 bugs):**
1. Log bug immediately in GitHub Issues
2. Notify Luke (Tech Lead) in Slack
3. Add to daily standup
4. Track fix progress
5. Re-test as soon as fixed

**For blocked testing:**
1. Try workaround
2. Document blocker
3. Notify team
4. Switch to other test cases
5. Follow up daily

---

## 📚 Resources

- **Regression Checklist:** `docs/regression-checklist.md`
- **E2E Tests:** `tests/e2e/`
- **Exploratory Notes:** `docs/exploratory-testing-notes.md`
- **Phase 4 Plan:** `docs/PHASE4-REFINED-DECOMPOSITION.md`

**Tools:**
- Playwright Docs: https://playwright.dev
- axe DevTools: https://www.deque.com/axe/devtools/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- NVDA: https://www.nvaccess.org/

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-06  
**Owner:** Han (QA/Reliability Agent)
