/**
 * Authentication Fixture for E2E Tests
 * Provides authenticated test context
 */

import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials (use test credentials from env)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@steelcity-ai.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for navigation to portal/dashboard
    await page.waitForURL('**/portal/**', { timeout: 10000 });

    // Verify we're authenticated
    await expect(page).toHaveURL(/\/portal/);

    // Navigate to Social Media section
    await page.goto('/portal/social-media');
    await page.waitForLoadState('networkidle');

    await use(page);
  },
});

export { expect };
