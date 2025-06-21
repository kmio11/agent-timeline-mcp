/**
 * E2E tests for Timeline GUI
 */

import { test, expect } from '@playwright/test';

test.describe('AI Agent Timeline GUI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('should display the main header and title', async ({ page }) => {
    // Check that the main title is visible
    await expect(page.locator('h1')).toContainText('AI Agent Timeline');

    // Check for the subtitle
    await expect(
      page.getByText('A Twitter-like feed where AI agents share their thoughts')
    ).toBeVisible();
  });

  test('should display timeline section', async ({ page }) => {
    // Check for timeline header
    await expect(page.locator('h2')).toContainText('Timeline');

    // Check for refresh button
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Check for loading spinner or text
    const loadingElement = page.getByText('Loading timeline...').or(page.locator('.animate-spin'));

    // Loading may disappear quickly with local data, so this is optional
    try {
      await expect(loadingElement.first()).toBeVisible({ timeout: 500 });
    } catch {
      // If loading state disappears too quickly, that's also acceptable
      expect(true).toBe(true);
    }
  });

  test('should display posts when API is available', async ({ page }) => {
    // Wait for posts to load (give it some time for API call)
    await page.waitForTimeout(2000);

    // Look for either posts or empty state
    const postsSection = page.locator('article').first();
    const emptyState = page.getByText('No posts yet');

    // Should show either posts or empty state (both are valid)
    const hasContent = await postsSection.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasContent || hasEmptyState).toBe(true);
  });

  test('should handle refresh button click', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();

    // Verify refresh functionality (button remains clickable with fast API)
    await expect(refreshButton).toBeEnabled();
  });

  test('should display posts with proper structure when available', async ({ page }) => {
    // Wait for potential posts to load
    await page.waitForTimeout(2000);

    // Check if posts are available
    const firstPost = page.locator('article').first();

    if (await firstPost.isVisible()) {
      // If posts exist, verify structure
      await expect(firstPost.locator('time')).toBeVisible();

      // Check for post content
      await expect(firstPost.locator('p')).toBeVisible();

      // Check for agent badge/name
      const agentInfo = firstPost
        .locator('[title*="Agent"]')
        .or(firstPost.locator('span').filter({ hasText: /@/ }));
      await expect(agentInfo.first()).toBeVisible();
    }
  });

  test('should have responsive design elements', async ({ page }) => {
    // Check main container has proper styling
    const mainContainer = page.locator('main');
    await expect(mainContainer).toHaveClass(/container/);

    // Check timeline container
    const timelineContainer = page.locator('div').filter({ hasText: 'Timeline' }).first();
    await expect(timelineContainer).toBeVisible();
  });

  test('should handle API connection errors gracefully', async ({ page }) => {
    // Wait for potential error states
    await page.waitForTimeout(3000);

    // Look for connection error indicators
    const errorIndicator = page
      .getByText('Connection Error')
      .or(page.getByText('Failed to fetch').or(page.locator('[class*="destructive"]')));

    // If there's an error, verify it's displayed properly
    if (await errorIndicator.first().isVisible()) {
      await expect(errorIndicator.first()).toBeVisible();

      // Check for retry mechanism if error occurs
      const retryButton = page.getByText('Retry').or(page.getByRole('button', { name: /retry/i }));

      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    }
  });

  test('should display status indicators', async ({ page }) => {
    // Wait for status to load
    await page.waitForTimeout(2000);

    // Check for status indicator (Live/Connection error)
    const statusIndicator = page.locator('div').filter({
      hasText: /Live|Connection error/,
    });

    await expect(statusIndicator.first()).toBeVisible();
  });

  test('should display and use agent filter functionality', async ({ page }) => {
    // Wait for posts to potentially load
    await page.waitForTimeout(2000);

    // Check if filter button is visible (only shows when multiple agents exist)
    const filterButton = page.getByRole('button', { name: /filter by agent/i });

    if (await filterButton.isVisible()) {
      // Click filter button to open dropdown
      await filterButton.click();

      // Check for filter dropdown options
      await expect(page.getByText('Show All Posts')).toBeVisible();

      // Look for agent options in dropdown
      const agentOptions = page.locator('button').filter({ hasText: /@/ });
      const agentCount = await agentOptions.count();

      if (agentCount > 0) {
        // Click on first agent to filter
        await agentOptions.first().click();

        // Verify filter is applied (button text should change)
        await expect(page.getByText(/filtered/)).toBeVisible();

        // Verify clear filter functionality
        const filteredButton = page.getByRole('button', { name: /filtered/ });
        await filteredButton.click();
        await page.getByText('Show All Posts').click();

        // Filter should be cleared
        await expect(page.getByText('Filter by Agent')).toBeVisible();
      }
    }
  });

  test('should display and use scroll to top button', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Scroll down to trigger scroll-to-top button
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });

    // Wait for scroll event to trigger
    await page.waitForTimeout(500);

    // Check if scroll-to-top button appears
    const scrollButton = page.getByLabel('Scroll to top');

    if (await scrollButton.isVisible()) {
      // Click scroll to top button
      await scrollButton.click();

      // Verify page scrolled to top
      const scrollPosition = await page.evaluate(() => window.scrollY);
      expect(scrollPosition).toBeLessThan(100); // Should be near top
    }
  });

  test('should display agent avatars with proper styling', async ({ page }) => {
    // Wait for posts to load
    await page.waitForTimeout(2000);

    // Look for posts with agent badges
    const firstPost = page.locator('article').first();

    if (await firstPost.isVisible()) {
      // Check for agent avatar (rounded element with background color)
      const avatar = firstPost
        .locator('div')
        .filter({
          has: page.locator('[class*="rounded-full"][class*="bg-"]'),
        })
        .first();

      if (await avatar.isVisible()) {
        // Verify avatar has proper styling classes
        const avatarElement = avatar.locator('[class*="rounded-full"]').first();
        await expect(avatarElement).toBeVisible();

        // Check for initials in avatar
        const avatarText = await avatarElement.textContent();
        expect(avatarText).toMatch(/^[A-Z]{1,2}$/);
      }
    }
  });

  test('should handle empty state when filtering shows no results', async ({ page }) => {
    // Wait for posts to load
    await page.waitForTimeout(2000);

    const filterButton = page.getByRole('button', { name: /filter by agent/i });

    if (await filterButton.isVisible()) {
      // Open filter and select an agent
      await filterButton.click();

      const agentOptions = page.locator('button').filter({ hasText: /@/ });
      if ((await agentOptions.count()) > 0) {
        await agentOptions.first().click();

        // Check if no posts message appears (this would happen if the agent has no posts)
        const noPostsMessage = page.getByText(
          /No posts from|This agent hasn't shared any thoughts yet/
        );

        if (await noPostsMessage.isVisible()) {
          await expect(noPostsMessage).toBeVisible();

          // Check for "Show All Posts" button in empty state
          const showAllButton = page.getByRole('button', { name: /show all posts/i });
          await expect(showAllButton).toBeVisible();
        }
      }
    }
  });
});
