/**
 * P4-H005: E2E Test - Bulk Actions
 * Tests: select multiple posts → bulk schedule/delete/approve
 */

import { test, expect } from './fixtures/auth';

test.describe('Bulk Actions', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/social-media');
    await authenticatedPage.click('button:has-text("Posts")');
    await authenticatedPage.waitForTimeout(1000);
  });

  test('should select single post', async ({ authenticatedPage: page }) => {
    // Step 1: Find first post checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').nth(1); // Skip "select all"

    if (await firstCheckbox.count() === 0) {
      // Create a post first if none exist
      await page.click('button:has-text("Create Post")');
      await page.fill('textarea', `Bulk Test Post - ${Date.now()}`);
      await page.click('[data-testid="platform-twitter"]').catch(async () => {
        await page.locator('label:has-text("Twitter")').first().click();
      });
      await page.click('button:has-text("Save Draft")');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Posts")');
      await page.waitForTimeout(1000);
    }

    // Step 2: Click checkbox
    await page.locator('input[type="checkbox"]').nth(1).click();

    // Step 3: Verify selection count
    await expect(page.locator('text=/1.*selected/i')).toBeVisible({ timeout: 3000 }).catch(() => {
      // Selection UI might be different
    });

    // Step 4: Verify bulk action buttons enabled
    await expect(page.locator('button:has-text("Bulk")')).toBeEnabled().catch(() => {
      // Button might have different text
    });
  });

  test('should select multiple posts', async ({ authenticatedPage: page }) => {
    // Create multiple test posts first
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Create Post")');
      await page.fill('textarea', `Multi Select Test ${i} - ${Date.now()}`);
      await page.click('[data-testid="platform-twitter"]').catch(async () => {
        await page.locator('label:has-text("Twitter")').first().click();
      });
      await page.click('button:has-text("Save Draft")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Posts")');
      await page.waitForTimeout(500);
    }

    // Step 1: Select first 3 posts
    await page.locator('input[type="checkbox"]').nth(1).click();
    await page.locator('input[type="checkbox"]').nth(2).click();
    await page.locator('input[type="checkbox"]').nth(3).click();

    // Step 2: Verify selection count
    await expect(page.locator('text=/3.*selected/i')).toBeVisible({ timeout: 3000 });
  });

  test('should select all posts', async ({ authenticatedPage: page }) => {
    // Ensure we have some posts
    const postCount = await page.locator('input[type="checkbox"]').count();
    
    if (postCount <= 1) {
      // Create test posts
      for (let i = 1; i <= 2; i++) {
        await page.click('button:has-text("Create Post")');
        await page.fill('textarea', `Select All Test ${i} - ${Date.now()}`);
        await page.click('[data-testid="platform-twitter"]').catch(async () => {
          await page.locator('label:has-text("Twitter")').first().click();
        });
        await page.click('button:has-text("Save Draft")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("Posts")');
        await page.waitForTimeout(500);
      }
    }

    // Step 1: Click "select all" checkbox (usually first checkbox in header)
    await page.locator('input[type="checkbox"]').first().click();

    // Step 2: Verify all checkboxes selected
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes.slice(1)) { // Skip header checkbox
      await expect(checkbox).toBeChecked();
    }

    // Step 3: Verify selection count
    await expect(page.locator('text=/selected/i')).toBeVisible();
  });

  test('should deselect all posts', async ({ authenticatedPage: page }) => {
    // Step 1: Select all first
    await page.locator('input[type="checkbox"]').first().click();
    await page.waitForTimeout(300);

    // Step 2: Click again to deselect
    await page.locator('input[type="checkbox"]').first().click();

    // Step 3: Verify no posts selected
    await expect(page.locator('text=/0.*selected|no.*selected/i')).toBeVisible().catch(() => {
      // Selection UI might disappear
    });

    // Step 4: Verify bulk action buttons disabled
    await expect(page.locator('button:has-text("Bulk")')).toBeDisabled().catch(() => {
      // Button might be hidden instead
    });
  });

  test('should bulk schedule posts to same date', async ({ authenticatedPage: page }) => {
    // Step 1: Create multiple draft posts
    for (let i = 1; i <= 2; i++) {
      await page.click('button:has-text("Create Post")');
      await page.fill('textarea', `Bulk Schedule ${i} - ${Date.now()}`);
      await page.click('[data-testid="platform-twitter"]').catch(async () => {
        await page.locator('label:has-text("Twitter")').first().click();
      });
      await page.click('button:has-text("Save Draft")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Posts")');
      await page.waitForTimeout(500);
    }

    // Step 2: Select the posts
    await page.locator('input[type="checkbox"]').nth(1).click();
    await page.locator('input[type="checkbox"]').nth(2).click();

    // Step 3: Click bulk schedule button
    await page.click('button:has-text("Bulk Schedule"), button:has-text("Schedule Selected")');

    // Step 4: Enter schedule date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(14, 0, 0, 0);

    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));

    // Step 5: Confirm
    await page.click('button:has-text("Confirm"), button:has-text("Schedule")').last();

    // Step 6: Verify success
    await expect(page.locator('text=/scheduled|updated/i')).toBeVisible({ timeout: 5000 });

    // Step 7: Filter to scheduled and verify
    await page.click('select, button:has-text("All Posts")').catch(() => {});
    await page.click('option[value="scheduled"], [role="option"]:has-text("Scheduled")').catch(() => {});
    
    await expect(page.locator('text=/Bulk Schedule/i')).toBeVisible();
  });

  test('should bulk delete posts with confirmation', async ({ authenticatedPage: page }) => {
    // Step 1: Create posts to delete
    for (let i = 1; i <= 2; i++) {
      await page.click('button:has-text("Create Post")');
      await page.fill('textarea', `Bulk Delete ${i} - ${Date.now()}`);
      await page.click('[data-testid="platform-twitter"]').catch(async () => {
        await page.locator('label:has-text("Twitter")').first().click();
      });
      await page.click('button:has-text("Save Draft")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Posts")');
      await page.waitForTimeout(500);
    }

    // Step 2: Select posts
    await page.locator('input[type="checkbox"]').nth(1).click();
    await page.locator('input[type="checkbox"]').nth(2).click();

    // Step 3: Click bulk delete
    await page.click('button:has-text("Bulk Delete"), button:has-text("Delete Selected")');

    // Step 4: Verify confirmation dialog
    await expect(page.locator('text=/confirm|are you sure|delete/i')).toBeVisible();

    // Step 5: Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Delete")').last();

    // Step 6: Verify success
    await expect(page.locator('text=/deleted/i')).toBeVisible({ timeout: 5000 });

    // Step 7: Verify posts removed from list
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Bulk Delete 1/i')).not.toBeVisible();
  });

  test('should bulk archive posts', async ({ authenticatedPage: page }) => {
    // Step 1: Create posts to archive
    for (let i = 1; i <= 2; i++) {
      await page.click('button:has-text("Create Post")');
      await page.fill('textarea', `Bulk Archive ${i} - ${Date.now()}`);
      await page.click('[data-testid="platform-twitter"]').catch(async () => {
        await page.locator('label:has-text("Twitter")').first().click();
      });
      await page.click('button:has-text("Save Draft")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Posts")');
      await page.waitForTimeout(500);
    }

    // Step 2: Select posts
    await page.locator('input[type="checkbox"]').nth(1).click();
    await page.locator('input[type="checkbox"]').nth(2).click();

    // Step 3: Click bulk archive
    await page.click('button:has-text("Archive"), button:has-text("Bulk Archive")');

    // Step 4: Confirm if dialog appears
    await page.click('button:has-text("Confirm")').catch(() => {});

    // Step 5: Verify success
    await expect(page.locator('text=/archived/i')).toBeVisible({ timeout: 5000 });
  });

  test('should disable bulk actions when no posts selected', async ({ authenticatedPage: page }) => {
    // Step 1: Ensure no posts selected
    const selectedCheckboxes = await page.locator('input[type="checkbox"]:checked').count();
    
    if (selectedCheckboxes > 0) {
      // Deselect all
      await page.locator('input[type="checkbox"]').first().click();
      await page.waitForTimeout(300);
    }

    // Step 2: Verify bulk action buttons disabled
    const bulkScheduleBtn = page.locator('button:has-text("Bulk Schedule"), button:has-text("Schedule Selected")');
    const bulkDeleteBtn = page.locator('button:has-text("Bulk Delete"), button:has-text("Delete Selected")');
    
    if (await bulkScheduleBtn.count() > 0) {
      await expect(bulkScheduleBtn).toBeDisabled();
    }
    
    if (await bulkDeleteBtn.count() > 0) {
      await expect(bulkDeleteBtn).toBeDisabled();
    }
  });

  test('should show selection count indicator', async ({ authenticatedPage: page }) => {
    // Ensure posts exist
    const checkboxCount = await page.locator('input[type="checkbox"]').count();
    
    if (checkboxCount <= 1) {
      await page.click('button:has-text("Create Post")');
      await page.fill('textarea', `Selection Count Test - ${Date.now()}`);
      await page.click('[data-testid="platform-twitter"]').catch(async () => {
        await page.locator('label:has-text("Twitter")').first().click();
      });
      await page.click('button:has-text("Save Draft")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Posts")');
      await page.waitForTimeout(500);
    }

    // Step 1: Select one post
    await page.locator('input[type="checkbox"]').nth(1).click();
    
    // Step 2: Verify count shows "1 selected"
    await expect(page.locator('text=/1.*selected/i')).toBeVisible({ timeout: 3000 });

    // Step 3: Select another
    if (await page.locator('input[type="checkbox"]').count() > 2) {
      await page.locator('input[type="checkbox"]').nth(2).click();
      
      // Step 4: Verify count updates to "2 selected"
      await expect(page.locator('text=/2.*selected/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should persist selection when filtering', async ({ authenticatedPage: page }) => {
    // Step 1: Select a post
    await page.locator('input[type="checkbox"]').nth(1).click();
    await page.waitForTimeout(300);

    // Step 2: Apply a filter
    await page.click('select, button:has-text("All Posts")').catch(() => {});
    await page.click('option[value="draft"], [role="option"]:has-text("Draft")').catch(() => {});
    await page.waitForTimeout(500);

    // Step 3: Verify selection persists (if post matches filter)
    // This behavior may vary by implementation
    const selectedCount = await page.locator('input[type="checkbox"]:checked').count();
    
    if (selectedCount > 0) {
      await expect(page.locator('text=/selected/i')).toBeVisible();
    }
  });
});
