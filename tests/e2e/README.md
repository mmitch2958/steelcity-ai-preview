# E2E Test Suite - Social Media Platform

**Phase 4 Testing Suite**  
**Created:** 2026-03-06  
**Framework:** Playwright  
**Coverage:** Phase 1-3 critical flows

---

## 📋 Test Coverage

### ✅ Implemented Tests

| Test ID | File | Description | Status |
|---------|------|-------------|--------|
| **P4-H002** | `01-create-post.spec.ts` | Create post flow (manual, AI-assisted, with media, templates, prediction) | ✅ Complete |
| **P4-H003** | `02-scheduling.spec.ts` | Scheduling flow (future dates, reschedule, cancel, recurring, calendar) | ✅ Complete |
| **P4-H004** | `03-approval-workflow.spec.ts` | Approval workflow (submit, approve, reject, request changes, history) | ✅ Complete |
| **P4-H005** | `04-bulk-actions.spec.ts` | Bulk actions (select, schedule, delete, archive) | ✅ Complete |

### 🔄 Pending Tests

| Test ID | Description | Priority |
|---------|-------------|----------|
| **P4-H006** | Analytics Dashboard E2E | P1 |
| **P4-H007** | Cross-browser testing (Firefox, Safari) | P1 |

---

## 🚀 Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Set environment variables:**
   Create `.env.test` file:
   ```env
   TEST_USER_EMAIL=test@steelcity-ai.com
   TEST_USER_PASSWORD=testpassword123
   PLAYWRIGHT_BASE_URL=http://localhost:5173
   ```

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/01-create-post.spec.ts
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run in Debug Mode

```bash
npx playwright test --debug
```

### Run Specific Test by Name

```bash
npx playwright test -g "should create a draft post"
```

---

## 📊 Viewing Test Reports

### HTML Report (Interactive)

```bash
npx playwright show-report
```

Opens browser with detailed test results, screenshots, videos, and traces.

### JSON Report

Results saved to `test-results/results.json`

---

## 🏗️ Test Structure

### Directory Layout

```
tests/e2e/
├── fixtures/
│   └── auth.ts              # Authenticated page fixture
├── 01-create-post.spec.ts   # Create post flow tests
├── 02-scheduling.spec.ts    # Scheduling & calendar tests
├── 03-approval-workflow.spec.ts  # Approval workflow tests
├── 04-bulk-actions.spec.ts  # Bulk operations tests
└── README.md                # This file
```

### Test Pattern

All tests follow this pattern:

1. **Authentication:** Uses `authenticatedPage` fixture (auto-login)
2. **Navigation:** Navigates to relevant tab/section
3. **Action:** Performs user actions (click, fill, drag, etc.)
4. **Assertion:** Verifies expected behavior
5. **Cleanup:** Implicit (Playwright handles browser cleanup)

### Selectors Strategy

- **Preferred:** `data-testid` attributes (to be added)
- **Fallback 1:** ARIA roles and labels
- **Fallback 2:** Text content matching
- **Last Resort:** CSS classes (fragile)

---

## 🐛 Debugging Failed Tests

### 1. View Screenshots

Failed tests automatically capture screenshots:
```
test-results/<test-name>/test-failed-*.png
```

### 2. View Videos

Failed tests record video:
```
test-results/<test-name>/video.webm
```

### 3. View Traces

Open trace viewer for detailed inspection:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### 4. Run Single Test in Debug Mode

```bash
npx playwright test --debug -g "test name here"
```

---

## ✅ Best Practices

### Writing Tests

1. **Descriptive test names:** Use "should..." format
2. **Arrange-Act-Assert:** Clear test structure
3. **Wait for elements:** Use `waitForSelector`, `waitForLoadState`
4. **Avoid hard timeouts:** Use built-in waits when possible
5. **Clean test data:** Create fresh test data per test
6. **Idempotent tests:** Tests should pass in any order

### Selectors

1. **Add `data-testid` to components:**
   ```tsx
   <button data-testid="create-post-button">Create</button>
   ```

2. **Use semantic selectors:**
   ```ts
   page.locator('button:has-text("Create Post")')
   page.locator('[role="button"][aria-label="Create"]')
   ```

3. **Avoid fragile selectors:**
   ```ts
   // ❌ Bad
   page.locator('.css-abc123 > div:nth-child(2)')
   
   // ✅ Good
   page.locator('[data-testid="post-card"]')
   ```

### Error Handling

1. **Use `.catch()` for optional elements:**
   ```ts
   await page.click('button:has-text("Optional")').catch(() => {});
   ```

2. **Conditional logic:**
   ```ts
   if (await element.count() > 0) {
     await element.click();
   }
   ```

3. **Custom timeouts for slow operations:**
   ```ts
   await expect(page.locator('text=Saved')).toBeVisible({ timeout: 10000 });
   ```

---

## 🔧 Maintenance

### Adding New Tests

1. Create new spec file: `XX-feature-name.spec.ts`
2. Import auth fixture: `import { test, expect } from './fixtures/auth';`
3. Write test cases following existing patterns
4. Update this README with new coverage

### Updating Fixtures

Edit `fixtures/auth.ts` to:
- Modify login flow
- Add new shared setup
- Create additional fixtures

### Updating Selectors

When UI changes:
1. Run tests to identify failures
2. Update selectors in affected tests
3. Prefer adding `data-testid` to components
4. Document breaking changes in commit message

---

## 📈 CI/CD Integration

### GitHub Actions (Example)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🎯 Coverage Goals

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Critical Flows | 100% | 80% | 🟡 In Progress |
| P0 Features | 100% | 90% | 🟢 On Track |
| P1 Features | 80% | 60% | 🟡 In Progress |
| Cross-browser | Chrome + Firefox + Safari | Chrome only | 🔴 Pending |

---

## 📞 Support

**Issues?** Report bugs in GitHub Issues with:
- Test name
- Error message
- Screenshots/videos from `test-results/`
- Steps to reproduce

**Questions?** Contact Han (QA Lead)

---

**Last Updated:** 2026-03-06  
**Maintainer:** Han (QA/Reliability Agent)
