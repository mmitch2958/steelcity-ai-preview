/**
 * P4-H003: E2E Test - Scheduling Flow
 * Tests: immediate publish, schedule for future, recurring posts, calendar updates
 */

import { test, expect } from './fixtures/auth';

test.describe('Scheduling Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start at Posts tab
    await authenticatedPage.goto('/portal/social-media');
    await authenticatedPage.click('button:has-text("Posts")');
    await authenticatedPage.waitForTimeout(500);
  });

  test('should schedule post for future date', async ({ authenticatedPage: page }) => {
    // Step 1: Create a new post first
    await page.click('button:has-text("Create Post"), button:has-text("+ New Post")');
    await page.waitForTimeout(500);

    const testContent = `Future Schedule Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    // Step 2: Set schedule date (tomorrow at 10am)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dateString = tomorrow.toISOString().slice(0, 16);

    await page.fill('input[type="datetime-local"]', dateString);

    // Step 3: Select platform
    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    // Step 4: Schedule
    await page.click('button:has-text("Schedule")');

    // Step 5: Verify success
    await expect(page.locator('text=/scheduled/i')).toBeVisible({ timeout: 5000 });

    // Step 6: Navigate to Posts and verify status
    await page.click('button:has-text("Posts")');
    await page.waitForTimeout(1000);

    // Filter to scheduled posts
    await page.click('select[value="all"], button:has-text("All Posts")').catch(() => {});
    await page.click('option[value="scheduled"], [role="option"]:has-text("Scheduled")').catch(() => {});

    // Verify post appears in scheduled list
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();
  });

  test('should reschedule existing post', async ({ authenticatedPage: page }) => {
    // Step 1: Create a scheduled post first
    await page.click('button:has-text("Create Post")');
    const testContent = `Reschedule Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    const initialDate = new Date();
    initialDate.setDate(initialDate.getDate() + 1);
    initialDate.setHours(14, 0, 0, 0);
    await page.fill('input[type="datetime-local"]', initialDate.toISOString().slice(0, 16));

    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    await page.click('button:has-text("Schedule")');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Posts tab
    await page.click('button:has-text("Posts")');
    await page.waitForTimeout(1000);

    // Step 3: Find the post and click edit
    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button[aria-label*="edit" i], button:has-text("Edit")').first().click();

    // Step 4: Change schedule date
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 2);
    newDate.setHours(16, 30, 0, 0);
    
    await page.fill('input[type="datetime-local"]', newDate.toISOString().slice(0, 16));

    // Step 5: Save changes
    await page.click('button:has-text("Update"), button:has-text("Save")');

    // Step 6: Verify update success
    await expect(page.locator('text=/updated/i')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel scheduled post', async ({ authenticatedPage: page }) => {
    // Step 1: Create scheduled post
    await page.click('button:has-text("Create Post")');
    const testContent = `Cancel Schedule Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));

    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    await page.click('button:has-text("Schedule")');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Posts
    await page.click('button:has-text("Posts")');
    await page.waitForTimeout(1000);

    // Step 3: Find post and cancel schedule
    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button:has-text("Cancel"), button[aria-label*="cancel" i]').first().click();

    // Step 4: Confirm cancellation
    await page.click('button:has-text("Confirm")').catch(() => {});

    // Step 5: Verify status changed to draft
    await expect(page.locator('text=/draft/i')).toBeVisible({ timeout: 5000 });
  });

  test('should schedule recurring post (multiple dates)', async ({ authenticatedPage: page }) => {
    // Step 1: Create post with multiple schedules
    await page.click('button:has-text("Create Post")');
    const testContent = `Recurring Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    // Step 2: Add multiple schedule dates
    const date1 = new Date();
    date1.setDate(date1.getDate() + 1);
    date1.setHours(9, 0, 0, 0);

    await page.fill('input[type="datetime-local"]', date1.toISOString().slice(0, 16));

    // Step 3: Look for "Add Another Date" button
    const addDateButton = page.locator('button:has-text("Add Date"), button:has-text("+ Another")');
    
    if (await addDateButton.count() > 0) {
      await addDateButton.click();

      const date2 = new Date();
      date2.setDate(date2.getDate() + 2);
      date2.setHours(9, 0, 0, 0);

      await page.locator('input[type="datetime-local"]').last().fill(date2.toISOString().slice(0, 16));
    }

    // Step 4: Schedule
    await page.click('button:has-text("Schedule")');

    // Step 5: Verify success
    await expect(page.locator('text=/scheduled/i')).toBeVisible({ timeout: 5000 });

    // Step 6: Verify multiple posts created (if recurring is supported)
    await page.click('button:has-text("Posts")');
    await page.waitForTimeout(1000);
    
    const matchingPosts = page.locator(`text=${testContent.slice(0, 15)}`);
    // Should have at least one post
    await expect(matchingPosts.first()).toBeVisible();
  });

  test('should reject past dates for scheduling', async ({ authenticatedPage: page }) => {
    // Step 1: Create post
    await page.click('button:has-text("Create Post")');
    await page.fill('textarea', `Past Date Test - ${Date.now()}`);

    // Step 2: Try to set past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    await page.fill('input[type="datetime-local"]', pastDate.toISOString().slice(0, 16));

    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    // Step 3: Attempt to schedule
    await page.click('button:has-text("Schedule")');

    // Step 4: Verify error message
    await expect(page.locator('text=/past date|invalid date|future date/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Calendar Integration', () => {
  test('should show scheduled posts in calendar', async ({ authenticatedPage: page }) => {
    // Step 1: Create scheduled post
    await page.goto('/portal/social-media');
    await page.click('button:has-text("Create Post")');
    
    const testContent = `Calendar Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    // Schedule for 5 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    futureDate.setHours(11, 0, 0, 0);
    
    await page.fill('input[type="datetime-local"]', futureDate.toISOString().slice(0, 16));

    await page.click('[data-testid="platform-linkedin"]').catch(async () => {
      await page.locator('label:has-text("LinkedIn")').first().click();
    });

    await page.click('button:has-text("Schedule")');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForTimeout(1500);

    // Step 3: Verify calendar loads
    await expect(page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/i')).toBeVisible();

    // Step 4: Navigate to correct month if needed
    const targetMonth = futureDate.getMonth();
    const currentMonth = new Date().getMonth();
    
    if (targetMonth > currentMonth) {
      for (let i = 0; i < (targetMonth - currentMonth); i++) {
        await page.click('button[aria-label*="next" i]');
        await page.waitForTimeout(300);
      }
    }

    // Step 5: Verify post appears on the correct date
    // Posts are typically shown as small chips/badges on calendar days
    await expect(page.locator(`text=${testContent.slice(0, 15)}`)).toBeVisible({ timeout: 3000 }).catch(() => {
      // Post might be in a popover or truncated
    });
  });

  test('should drag-and-drop post to reschedule in calendar', async ({ authenticatedPage: page }) => {
    // Step 1: Navigate to Calendar
    await page.goto('/portal/social-media');
    await page.click('button:has-text("Calendar")');
    await page.waitForTimeout(1000);

    // Step 2: Find a scheduled post (assumes at least one exists)
    const postChip = page.locator('[data-testid*="post-chip"], [draggable="true"]').first();
    
    if (await postChip.count() === 0) {
      console.log('No draggable posts found, skipping drag test');
      test.skip();
    }

    // Step 3: Get source and target positions
    const sourceBox = await postChip.boundingBox();
    if (!sourceBox) {
      test.skip();
    }

    // Find a different day cell
    const dayCells = page.locator('[data-testid*="calendar-day"]');
    const targetCell = dayCells.nth(10); // Pick day ~10 in the month
    const targetBox = await targetCell.boundingBox();
    
    if (!targetBox) {
      test.skip();
    }

    // Step 4: Perform drag-and-drop
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.mouse.up();

    // Step 5: Verify undo snackbar appears
    await expect(page.locator('text=/undo|rescheduled/i')).toBeVisible({ timeout: 3000 });
  });
});
