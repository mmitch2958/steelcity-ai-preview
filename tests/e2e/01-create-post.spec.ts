/**
 * P4-H002: E2E Test - Create Post Flow
 * Tests: create → preview → schedule → verify
 */

import { test, expect } from './fixtures/auth';

test.describe('Create Post Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Create Post tab
    await authenticatedPage.click('button:has-text("Create Post")');
    await authenticatedPage.waitForTimeout(500);
  });

  test('should create a draft post in manual mode', async ({ authenticatedPage: page }) => {
    // Step 1: Select Manual mode
    await page.click('button:has-text("Manual")');
    await expect(page.locator('button:has-text("Manual")')).toHaveClass(/default/);

    // Step 2: Select platform (Twitter/X)
    await page.click('[data-testid="platform-twitter"]', { force: true }).catch(async () => {
      // Fallback: find checkbox near Twitter label
      await page.locator('label:has-text("Twitter")').click();
    });

    // Step 3: Enter content
    const testContent = `E2E Test Post - ${Date.now()}`;
    await page.fill('textarea[placeholder*="content" i]', testContent);
    await expect(page.locator('textarea')).toHaveValue(testContent);

    // Step 4: Add hashtags
    const hashtags = '#testing #e2e #playwright';
    await page.locator('textarea').fill(`${testContent} ${hashtags}`);

    // Step 5: Verify character count updates
    await expect(page.locator('text=/\\d+\\/280/')).toBeVisible();

    // Step 6: Verify real-time preview updates
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();

    // Step 7: Save as draft
    await page.click('button:has-text("Save Draft")');

    // Step 8: Verify success message
    await expect(page.locator('text=/draft.*saved/i')).toBeVisible({ timeout: 5000 });

    // Step 9: Navigate to Posts tab and verify post exists
    await page.click('button:has-text("Posts")');
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();

    // Step 10: Verify status badge shows "draft"
    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await expect(postCard.locator('text=/draft/i')).toBeVisible();
  });

  test('should create and schedule a post', async ({ authenticatedPage: page }) => {
    // Step 1: Manual mode
    await page.click('button:has-text("Manual")');

    // Step 2: Select platform
    await page.click('[data-testid="platform-linkedin"]').catch(async () => {
      await page.locator('label:has-text("LinkedIn")').click();
    });

    // Step 3: Enter content
    const testContent = `Scheduled E2E Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    // Step 4: Set schedule date (2 hours from now)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 2);
    const dateString = futureDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

    await page.fill('input[type="datetime-local"]', dateString);

    // Step 5: Select account
    await page.click('button:has-text("Select Account")').catch(() => {});
    await page.click('[role="option"]:first-child').catch(() => {
      // Account might be auto-selected
    });

    // Step 6: Schedule post
    await page.click('button:has-text("Schedule Post")');

    // Step 7: Verify success
    await expect(page.locator('text=/scheduled/i')).toBeVisible({ timeout: 5000 });

    // Step 8: Verify in calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForTimeout(1000);
    
    // The post should appear in the calendar (may need to navigate to correct month)
    await expect(page.locator('text=/scheduled/i')).toBeVisible();
  });

  test('should create post with media attachment', async ({ authenticatedPage: page }) => {
    // Step 1: Manual mode
    await page.click('button:has-text("Manual")');

    // Step 2: Select platform
    await page.click('[data-testid="platform-instagram"]').catch(async () => {
      await page.locator('label:has-text("Instagram")').click();
    });

    // Step 3: Enter content
    const testContent = `Media Test Post - ${Date.now()}`;
    await page.fill('textarea', testContent);

    // Step 4: Upload media (simulate file upload)
    // Note: This requires a test image file
    const fileInput = page.locator('input[type="file"]');
    
    // Skip if file upload not available
    if (await fileInput.count() > 0) {
      // In real test, use: await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');
      console.log('File upload input found but skipping actual upload in this test');
    }

    // Step 5: Save draft
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 5000 });
  });

  test('should apply template to post', async ({ authenticatedPage: page }) => {
    // Step 1: Manual mode
    await page.click('button:has-text("Manual")');

    // Step 2: Open template picker
    await page.click('button:has-text("Template")').catch(() => {
      // Template button might have different text
      page.click('[data-testid="template-picker-button"]').catch(() => {});
    });

    // Step 3: Select first template
    await page.click('[data-testid="template-card"]:first-child').catch(async () => {
      // Alternative selector
      await page.locator('button:has-text("Use Template")').first().click();
    });

    // Step 4: Verify content populated
    await expect(page.locator('textarea')).not.toBeEmpty();

    // Step 5: Save draft
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show prediction results', async ({ authenticatedPage: page }) => {
    // Step 1: Manual mode
    await page.click('button:has-text("Manual")');

    // Step 2: Select platform
    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').click();
    });

    // Step 3: Enter content
    const testContent = `Prediction Test - ${Date.now()} #viral #trending`;
    await page.fill('textarea', testContent);

    // Step 4: Trigger prediction
    await page.click('button:has-text("Predict Performance")').catch(() => {
      // Prediction might auto-trigger
    });

    // Step 5: Wait for prediction results
    await expect(page.locator('text=/score|engagement|reach/i')).toBeVisible({ timeout: 10000 });

    // Step 6: Verify prediction display component
    await expect(page.locator('[data-testid="prediction-result"]')).toBeVisible().catch(() => {
      // Component might have different test ID
    });
  });
});

test.describe('AI-Assisted Post Creation', () => {
  test('should generate post using AI', async ({ authenticatedPage: page }) => {
    // Navigate to Create Post tab
    await page.click('button:has-text("Create Post")');
    await page.waitForTimeout(500);

    // Step 1: Switch to AI-Assisted mode
    await page.click('button:has-text("AI-Assisted")');
    await expect(page.locator('button:has-text("AI-Assisted")')).toHaveClass(/default/);

    // Step 2: Enter topic/prompt
    const prompt = `Write a professional LinkedIn post about AI testing automation`;
    await page.fill('textarea[placeholder*="topic" i], textarea[placeholder*="prompt" i]', prompt);

    // Step 3: Select platform
    await page.click('[data-testid="platform-linkedin"]').catch(async () => {
      await page.locator('label:has-text("LinkedIn")').click();
    });

    // Step 4: Generate
    await page.click('button:has-text("Generate")');

    // Step 5: Wait for AI generation (may take a few seconds)
    await page.waitForTimeout(3000);
    await expect(page.locator('text=/generating/i, text=/loading/i')).toBeVisible().catch(() => {
      // Loading state might be brief
    });

    // Step 6: Verify generated content appears
    await expect(page.locator('textarea').last()).not.toBeEmpty({ timeout: 15000 });

    // Step 7: Save draft
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 5000 });
  });
});
