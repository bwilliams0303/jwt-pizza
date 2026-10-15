import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login } from './mocks';

async function adminInit(page: Page) {
  await basicInit(page);
  await login(page, 'a@jwt.com', 'admin');
  await page.getByLabel('Global').getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
}

// Franchise rows start with the franchise name and end with its Close button
function franchiseRow(page: Page, name: string) {
  return page.getByRole('row', { name: new RegExp(`^${name}\\b.*Close$`) });
}

// User rows start with the user's name
function userRow(page: Page, name: string) {
  return page.getByRole('row', { name: new RegExp(`^${name}\\b`) });
}

test('visitors cannot see the admin dashboard', async ({ page }) => {
  await basicInit(page);
  await page.goto('/admin-dashboard');

  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('It looks like we have dropped a pizza on the floor.');
});

test('diners cannot see the admin dashboard', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await expect(page.getByLabel('Global').getByRole('link', { name: 'Admin' })).not.toBeVisible();

  await page.goto('/admin-dashboard');
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});

test('admin sees franchises, franchisees, stores, and revenue', async ({ page }) => {
  await adminInit(page);

  await expect(page.getByLabel('Global').getByRole('link', { name: 'Franchise', exact: true })).not.toBeVisible();
  await expect(franchiseRow(page, 'LotaPizza')).toContainText('Pizza Franchisee');
  await expect(page.getByRole('row', { name: /Lehi/ })).toContainText('0.05 ₿');
  await expect(page.getByRole('row', { name: /Spanish Fork/ })).toContainText('0 ₿');
  await expect(franchiseRow(page, 'topSpot')).toBeVisible();
  await expect(franchiseRow(page, 'SliceOfLife')).not.toBeVisible();
});

test('admin pages through franchises', async ({ page }) => {
  await adminInit(page);
  const previous = page.getByRole('button', { name: 'Previous page of franchises' });
  const next = page.getByRole('button', { name: 'Next page of franchises' });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(franchiseRow(page, 'SliceOfLife')).toBeVisible();
  await expect(franchiseRow(page, 'LotaPizza')).not.toBeVisible();
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(franchiseRow(page, 'LotaPizza')).toBeVisible();
  await expect(previous).toBeDisabled();
});

test('admin filters franchises by name', async ({ page }) => {
  await adminInit(page);
  await page.getByPlaceholder('Filter franchises').fill('pizza');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(franchiseRow(page, 'LotaPizza')).toBeVisible();
  await expect(franchiseRow(page, 'PizzaCorp')).toBeVisible();
  await expect(franchiseRow(page, 'topSpot')).not.toBeVisible();
});

test('admin creates a franchise', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('button', { name: 'Add Franchise' }).click();

  await expect(page.getByRole('heading', { name: 'Create franchise' })).toBeVisible();
  await page.getByPlaceholder('franchise name').fill('PieHard');
  await page.getByPlaceholder('franchisee admin email').fill('f@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  await page.getByPlaceholder('Filter franchises').fill('PieHard');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(franchiseRow(page, 'PieHard')).toContainText('Pizza Franchisee');
});

test('admin cancels creating a franchise', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByPlaceholder('franchise name').fill('PieHard');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText('PieHard');
});

test('admin closes a franchise', async ({ page }) => {
  await adminInit(page);
  await franchiseRow(page, 'topSpot').getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the topSpot franchise?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  await expect(franchiseRow(page, 'topSpot')).not.toBeVisible();
  await expect(franchiseRow(page, 'SliceOfLife')).toBeVisible();
});

test('admin cancels closing a franchise', async ({ page }) => {
  await adminInit(page);
  await franchiseRow(page, 'topSpot').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  await expect(franchiseRow(page, 'topSpot')).toBeVisible();
});

test('admin closes a store', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('row', { name: /Spanish Fork/ }).getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the PizzaCorp store Spanish Fork ?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  await expect(franchiseRow(page, 'PizzaCorp')).toBeVisible();
  await expect(page.getByRole('row', { name: /Spanish Fork/ })).not.toBeVisible();
});

test('admin sees users with name, email, and role', async ({ page }) => {
  await adminInit(page);

  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(userRow(page, 'Kai Chen')).toContainText('d@jwt.com');
  await expect(userRow(page, 'Kai Chen')).toContainText('diner');
  await expect(userRow(page, 'Pizza Franchisee')).toContainText('f@jwt.com');
  await expect(userRow(page, 'Pizza Franchisee')).toContainText('franchisee');
  await expect(userRow(page, 'Pizza Admin')).toContainText('a@jwt.com');
  await expect(userRow(page, 'Pizza Admin')).toContainText('admin');
});

test('admin pages through users', async ({ page }) => {
  await adminInit(page);
  const previous = page.getByRole('button', { name: 'Previous page of users' });
  const next = page.getByRole('button', { name: 'Next page of users' });
  await expect(userRow(page, 'Kai Chen')).toBeVisible();
  await expect(userRow(page, 'Lily')).not.toBeVisible();
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(userRow(page, 'Lily')).toBeVisible();
  await expect(userRow(page, 'Kai Chen')).not.toBeVisible();
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(userRow(page, 'Kai Chen')).toBeVisible();
  await expect(previous).toBeDisabled();
});

test('admin filters users by name', async ({ page }) => {
  await adminInit(page);
  await page.getByPlaceholder('Name', { exact: true }).fill('pizza');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(userRow(page, 'Pizza Franchisee')).toBeVisible();
  await expect(userRow(page, 'Pizza Admin')).toBeVisible();
  await expect(userRow(page, 'Kai Chen')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page of users' })).toBeDisabled();
});

test('filtering users starts from the first page', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('button', { name: 'Next page of users' }).click();
  await expect(userRow(page, 'Lily')).toBeVisible();

  await page.getByPlaceholder('Name', { exact: true }).fill('kai');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(userRow(page, 'Kai Chen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page of users' })).toBeDisabled();
});

test('admin deletes users', async ({ page }) => {
  await adminInit(page);
  await expect(page.getByRole('button', { name: 'Next page of users' })).toBeEnabled();

  await userRow(page, 'Joe').getByRole('button', { name: 'Delete' }).click();
  await expect(userRow(page, 'Joe')).not.toBeVisible();
  await expect(userRow(page, 'Kai Chen')).toBeVisible();

  // Deleting a second user leaves 10, so the list refreshes onto a single page
  await userRow(page, 'Betty').getByRole('button', { name: 'Delete' }).click();
  await expect(userRow(page, 'Betty')).not.toBeVisible();
  await expect(userRow(page, 'Lily')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page of users' })).toBeDisabled();
});

test('deleted user cannot log in', async ({ page }) => {
  await adminInit(page);
  await userRow(page, 'Kai Chen').getByRole('button', { name: 'Delete' }).click();
  await expect(userRow(page, 'Kai Chen')).not.toBeVisible();

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, 'd@jwt.com', 'a');
  await expect(page.getByRole('main')).toContainText('unknown user');
});

test('delete user error is shown and the user remains', async ({ page }) => {
  await adminInit(page);
  await page.route(/\/api\/user\/\d+$/, async (route) => {
    expect(route.request().method()).toBe('DELETE');
    await route.fulfill({ status: 500, json: { message: 'unable to delete user' } });
  });

  await userRow(page, 'Joe').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('alert')).toContainText('unable to delete user');
  await expect(userRow(page, 'Joe')).toBeVisible();
});

test('admin tables show their column headers', async ({ page }) => {
  await adminInit(page);

  const headers = page.getByRole('columnheader');
  await expect(headers).toHaveText(['Franchise', 'Franchisee', 'Store', 'Revenue', 'Action', 'Name', 'Email', 'Role', 'Action']);
});
