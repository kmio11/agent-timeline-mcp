/**
 * E2E tests for API integration
 */

import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should handle successful API connection', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/posts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          posts: [
            {
              id: 1,
              agent_id: 1,
              content: 'Test post content from E2E test',
              timestamp: new Date().toISOString(),
              metadata: null,
              agent_name: 'E2ETestAgent',
              display_name: 'E2E Test Agent - Running tests'
            },
            {
              id: 2,
              agent_id: 1,
              content: 'Second test post for verification',
              timestamp: new Date(Date.now() - 60000).toISOString(),
              metadata: { test: true },
              agent_name: 'E2ETestAgent',
              display_name: 'E2E Test Agent - Running tests'
            }
          ]
        })
      });
    });

    await page.goto('/');
    
    // Wait for posts to appear
    await expect(page.getByText('Test post content from E2E test')).toBeVisible();
    await expect(page.getByText('Second test post for verification')).toBeVisible();
    
    // Verify agent information is displayed (first occurrence is sufficient)
    await expect(page.getByText('E2E Test Agent - Running tests').first()).toBeVisible();
    
    // Check status indicator shows "Live"
    await expect(page.getByText('Live')).toBeVisible();
  });

  test('should handle API 404 errors', async ({ page }) => {
    // Mock 404 response
    await page.route('**/api/posts*', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not Found' })
      });
    });

    await page.goto('/');
    
    // Wait for error to appear (use role to be more specific)
    await expect(page.getByRole('heading', { name: 'Connection Error' })).toBeVisible();
    await expect(page.getByText(/Failed to.*404/)).toBeVisible();
  });

  test('should handle API server errors', async ({ page }) => {
    // Mock server error response
    await page.route('**/api/posts*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/');
    
    // Wait for error to appear
    await expect(page.getByRole('heading', { name: 'Connection Error' })).toBeVisible();
    await expect(page.getByText(/Failed to.*500/)).toBeVisible();
  });

  test('should handle network failures', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/posts*', async route => {
      await route.abort('failed');
    });

    await page.goto('/');
    
    // Wait for error to appear
    await expect(page.getByRole('heading', { name: 'Connection Error' })).toBeVisible();
  });

  test('should retry failed requests', async ({ page }) => {
    let callCount = 0;
    
    await page.route('**/api/posts*', async route => {
      callCount++;
      if (callCount === 1) {
        // First call fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        // Subsequent calls succeed
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            posts: [{
              id: 1,
              agent_id: 1,
              content: 'Recovery test post',
              timestamp: new Date().toISOString(),
              metadata: null,
              agent_name: 'RecoveryAgent',
              display_name: 'Recovery Agent - Testing resilience'
            }]
          })
        });
      }
    });

    await page.goto('/');
    
    // Initially should show error
    await expect(page.getByRole('heading', { name: 'Connection Error' })).toBeVisible();
    
    // Wait for retry (polling mechanism should retry)
    await page.waitForTimeout(3000);
    
    // Should eventually show the post after retry
    await expect(page.getByText('Recovery test post')).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty responses', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/posts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 0,
          posts: []
        })
      });
    });

    await page.goto('/');
    
    // Should show empty state
    await expect(page.getByText('No posts yet')).toBeVisible();
    await expect(page.getByText('AI agents haven\'t started sharing')).toBeVisible();
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    // Mock malformed JSON response
    await page.route('**/api/posts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json {'
      });
    });

    await page.goto('/');
    
    // Should handle JSON parse error gracefully
    await expect(page.getByRole('heading', { name: 'Connection Error' })).toBeVisible();
  });
});