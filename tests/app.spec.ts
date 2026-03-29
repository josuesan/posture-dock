import { expect, test } from '@playwright/test';

import { messages } from '../src/translations';

test('renders the main posture workspace', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: messages.page.title })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: messages.dashboard.sections.workspaceTitle })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: messages.dashboard.buttons.startRecording })
  ).toBeVisible();
});

test('shows auth and empty history states on first load', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: messages.auth.title })
  ).toBeVisible();
  await expect(page.getByText(messages.dashboard.history.emptyTitle)).toBeVisible();
});
