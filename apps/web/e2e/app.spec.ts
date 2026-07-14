import { test, expect } from '@playwright/test';

test('homepage redirects to dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('dashboard page renders', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('new project page renders', async ({ page }) => {
  await page.goto('/projects/new');
  await expect(page.getByRole('heading', { name: 'New Analysis' })).toBeVisible();
  await expect(page.getByText('GitHub Repository')).toBeVisible();
});

test('command palette opens with keyboard shortcut', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Control+k');
  await expect(page.getByPlaceholder('Search commands...')).toBeVisible();
});
