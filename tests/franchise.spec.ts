import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login, submitLogin } from './mocks';

async function openFranchiseDashboard(page: Page) {
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise', exact: true }).click();
}

async function franchiseeInit(page: Page) {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await openFranchiseDashboard(page);
  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
}

test('visitors see the franchise pitch and can log in as a franchisee', async ({ page }) => {
  await basicInit(page);
  await openFranchiseDashboard(page);

  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unleash Your Potential' })).toBeVisible();
  await expect(page.getByRole('main').locator('tbody tr')).toHaveCount(3);

  await page.getByRole('main').getByRole('link', { name: 'login' }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard\/login$/);
  await submitLogin(page, 'f@jwt.com', 'franchisee');

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
});

test('diners without a franchise see the franchise pitch', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await openFranchiseDashboard(page);

  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
});

test('franchisee sees their stores and revenue', async ({ page }) => {
  await franchiseeInit(page);

  await expect(page.getByRole('main')).toContainText('Everything you need to run an JWT Pizza franchise.');
  const rows = page.getByRole('main').locator('tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole('row', { name: /Lehi/ })).toContainText('0.05 ₿');
  await expect(page.getByRole('row', { name: /Springville/ })).toContainText('0.25 ₿');
  await expect(page.getByRole('row', { name: /American Fork/ })).toContainText('1.5 ₿');
});

test('franchisee role shows on the diner dashboard', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await page.getByRole('link', { name: 'PF' }).click();

  await expect(page.getByRole('main')).toContainText('Pizza Franchisee');
  await expect(page.getByRole('main')).toContainText('diner, Franchisee on 2');
});

test('create a store', async ({ page }) => {
  await franchiseeInit(page);
  await page.getByRole('button', { name: 'Create store' }).click();

  await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
  await page.getByPlaceholder('store name').fill('Provo');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  await expect(page.getByRole('main').locator('tbody tr')).toHaveCount(4);
  await expect(page.getByRole('row', { name: /Provo/ })).toContainText('0 ₿');
});

test('cancel creating a store', async ({ page }) => {
  await franchiseeInit(page);
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').fill('Provo');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  await expect(page.getByRole('main').locator('tbody tr')).toHaveCount(3);
  await expect(page.getByRole('main')).not.toContainText('Provo');
});

test('close a store', async ({ page }) => {
  await franchiseeInit(page);
  await page.getByRole('row', { name: /Springville/ }).getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the LotaPizza store Springville ?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  await expect(page.getByRole('main').locator('tbody tr')).toHaveCount(2);
  await expect(page.getByRole('main')).not.toContainText('Springville');
});

test('cancel closing a store', async ({ page }) => {
  await franchiseeInit(page);
  await page.getByRole('row', { name: /Lehi/ }).getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  await expect(page.getByRole('main').locator('tbody tr')).toHaveCount(3);
});
