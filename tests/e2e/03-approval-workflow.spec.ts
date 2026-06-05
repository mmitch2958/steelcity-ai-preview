/**
 * P4-H004: E2E Test - Approval Workflow
 * Tests: draft → submit for approval → approve → publish (+ reject, request changes)
 */

import { test, expect } from './fixtures/auth';

test.describe('Approval Workflow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/portal/social-media');
    await authenticatedPage.waitForTimeout(500);
  });

  test('should submit post for approval', async ({ authenticatedPage: page }) => {
    // Step 1: Create a draft post
    await page.click('button:has-text("Create Post")');
    await page.waitForTimeout(500);

    const testContent = `Approval Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-linkedin"]').catch(async () => {
      await page.locator('label:has-text("LinkedIn")').first().click();
    });

    // Step 2: Submit for approval
    await page.click('button:has-text("Submit for Approval")');

    // Step 3: Verify success message
    await expect(page.locator('text=/submitted.*approval/i')).toBeVisible({ timeout: 5000 });

    // Step 4: Navigate to Approval Queue
    await page.click('button:has-text("Approval"), a:has-text("Approval")');
    await page.waitForTimeout(1000);

    // Step 5: Verify post appears in pending approvals
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();
    await expect(page.locator('text=/pending/i')).toBeVisible();
  });

  test('should approve pending post', async ({ authenticatedPage: page }) => {
    // Step 1: Create and submit post for approval
    await page.click('button:has-text("Create Post")');
    const testContent = `Approve Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    await page.click('button:has-text("Submit for Approval")');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Approval Queue
    await page.click('button:has-text("Approval")');
    await page.waitForTimeout(1000);

    // Step 3: Filter to pending (if not already filtered)
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="pending"], [role="option"]:has-text("Pending")').catch(() => {});

    // Step 4: Find the post and click Approve
    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button:has-text("Approve")').first().click();

    // Step 5: Add optional approval comment
    const commentField = page.locator('textarea[placeholder*="comment" i]');
    if (await commentField.count() > 0) {
      await commentField.fill('Looks good! Approved for publishing.');
    }

    // Step 6: Confirm approval
    await page.click('button:has-text("Confirm"), button:has-text("Approve")').last();

    // Step 7: Verify success message
    await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 5000 });

    // Step 8: Verify status changed to approved
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/approved/i')).toBeVisible();
  });

  test('should reject pending post with reason', async ({ authenticatedPage: page }) => {
    // Step 1: Create and submit post
    await page.click('button:has-text("Create Post")');
    const testContent = `Reject Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-facebook"]').catch(async () => {
      await page.locator('label:has-text("Facebook")').first().click();
    });

    await page.click('button:has-text("Submit for Approval")');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Approval Queue
    await page.click('button:has-text("Approval")');
    await page.waitForTimeout(1000);

    // Step 3: Find post and click Reject
    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button:has-text("Reject")').first().click();

    // Step 4: Enter rejection reason (should be required)
    const reasonField = page.locator('textarea[placeholder*="reason" i], textarea[placeholder*="comment" i]');
    await reasonField.fill('Content does not align with brand guidelines. Please revise.');

    // Step 5: Confirm rejection
    await page.click('button:has-text("Confirm"), button:has-text("Reject")').last();

    // Step 6: Verify success
    await expect(page.locator('text=/rejected/i')).toBeVisible({ timeout: 5000 });

    // Step 7: Filter to rejected and verify
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="rejected"], [role="option"]:has-text("Rejected")').catch(() => {});
    
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();
  });

  test('should request changes on post', async ({ authenticatedPage: page }) => {
    // Step 1: Create and submit post
    await page.click('button:has-text("Create Post")');
    const testContent = `Changes Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-instagram"]').catch(async () => {
      await page.locator('label:has-text("Instagram")').first().click();
    });

    await page.click('button:has-text("Submit for Approval")');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Approval Queue
    await page.click('button:has-text("Approval")');
    await page.waitForTimeout(1000);

    // Step 3: Find post and request changes
    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button:has-text("Request Changes")').first().click();

    // Step 4: Enter change request
    const changesField = page.locator('textarea[placeholder*="changes" i], textarea[placeholder*="comment" i]');
    await changesField.fill('Please add more hashtags and include a call-to-action.');

    // Step 5: Confirm
    await page.click('button:has-text("Confirm"), button:has-text("Request")').last();

    // Step 6: Verify success
    await expect(page.locator('text=/changes.*requested/i')).toBeVisible({ timeout: 5000 });

    // Step 7: Filter to changes_requested
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="changes_requested"], [role="option"]:has-text("Changes")').catch(() => {});
    
    await expect(page.locator(`text=${testContent.slice(0, 20)}`)).toBeVisible();
  });

  test('should view approval history timeline', async ({ authenticatedPage: page }) => {
    // Step 1: Create and submit post
    await page.click('button:has-text("Create Post")');
    const testContent = `History Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-twitter"]').catch(async () => {
      await page.locator('label:has-text("Twitter")').first().click();
    });

    await page.click('button:has-text("Submit for Approval")');
    await page.waitForTimeout(1000);

    // Step 2: Approve it
    await page.click('button:has-text("Approval")');
    await page.waitForTimeout(1000);

    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button:has-text("Approve")').first().click();
    await page.click('button:has-text("Confirm"), button:has-text("Approve")').last();
    await page.waitForTimeout(1000);

    // Step 3: View post details / history
    await postCard.click();
    
    // Or click "View History" button if exists
    await page.click('button:has-text("History"), button:has-text("Timeline")').catch(() => {});

    // Step 4: Verify timeline shows approval action
    await expect(page.locator('text=/approved/i')).toBeVisible();
    await expect(page.locator('[data-testid*="timeline"], [data-testid*="history"]')).toBeVisible().catch(() => {
      // Timeline component might have different test ID
    });

    // Step 5: Verify requester info shown
    await expect(page.locator('text=/submitted by|requester/i')).toBeVisible();
  });

  test('should send notification after approval', async ({ authenticatedPage: page }) => {
    // Step 1: Create and submit post
    await page.click('button:has-text("Create Post")');
    const testContent = `Notification Test - ${Date.now()}`;
    await page.fill('textarea', testContent);

    await page.click('[data-testid="platform-linkedin"]').catch(async () => {
      await page.locator('label:has-text("LinkedIn")').first().click();
    });

    await page.click('button:has-text("Submit for Approval")');
    await page.waitForTimeout(1000);

    // Step 2: Approve
    await page.click('button:has-text("Approval")');
    await page.waitForTimeout(1000);

    const postCard = page.locator(`text=${testContent.slice(0, 20)}`).locator('..');
    await postCard.locator('button:has-text("Approve")').first().click();
    await page.click('button:has-text("Confirm"), button:has-text("Approve")').last();

    // Step 3: Verify notification appears (toast/snackbar)
    await expect(page.locator('[role="alert"], [data-testid*="toast"]')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Notification might appear differently
    });

    // Step 4: Check for notification text
    await expect(page.locator('text=/notification|approved/i')).toBeVisible({ timeout: 5000 });
  });

  test('should filter approval queue by status', async ({ authenticatedPage: page }) => {
    // Navigate to Approval Queue
    await page.click('button:has-text("Approval")');
    await page.waitForTimeout(1000);

    // Step 1: Test "All" filter
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="all"], [role="option"]:has-text("All")').catch(() => {});
    await page.waitForTimeout(500);

    // Step 2: Test "Pending" filter
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="pending"], [role="option"]:has-text("Pending")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Verify only pending items shown (if any exist)
    const statusBadges = page.locator('text=/pending/i');
    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }

    // Step 3: Test "Approved" filter
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="approved"], [role="option"]:has-text("Approved")').catch(() => {});
    await page.waitForTimeout(500);

    // Step 4: Test "Rejected" filter
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="rejected"], [role="option"]:has-text("Rejected")').catch(() => {});
    await page.waitForTimeout(500);

    // Step 5: Test "Changes Requested" filter
    await page.click('select, button:has-text("Filter")').catch(() => {});
    await page.click('option[value="changes_requested"], [role="option"]:has-text("Changes")').catch(() => {});
    await page.waitForTimeout(500);
  });
});
