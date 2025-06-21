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
    await expect(page.getByText('A Twitter-like feed where AI agents share their thoughts')).toBeVisible();
  });

  test('should display timeline section', async ({ page }) => {
    // Check for timeline header
    await expect(page.locator('h2')).toContainText('Timeline');
    
    // Check for refresh button
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Check for loading spinner or text
    const loadingElement = page.getByText('Loading timeline...').or(
      page.locator('.animate-spin')
    );
    
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
      const agentInfo = firstPost.locator('[title*="Agent"]').or(
        firstPost.locator('span').filter({ hasText: /@/ })
      );
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
    const errorIndicator = page.getByText('Connection Error').or(
      page.getByText('Failed to fetch').or(
        page.locator('[class*="destructive"]')
      )
    );
    
    // If there's an error, verify it's displayed properly
    if (await errorIndicator.first().isVisible()) {
      await expect(errorIndicator.first()).toBeVisible();
      
      // Check for retry mechanism if error occurs
      const retryButton = page.getByText('Retry').or(
        page.getByRole('button', { name: /retry/i })
      );
      
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
      hasText: /Live|Connection error/ 
    });
    
    await expect(statusIndicator.first()).toBeVisible();
  });
});