import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login } from './mocks';

async function registerDiner(page: Page, email: string) {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
}

async function editUser(page: Page, fields: { name?: string; email?: string; password?: string }) {
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  const dialog = page.getByRole('dialog');
  if (fields.name !== undefined) await dialog.getByLabel('Name').fill(fields.name);
  if (fields.email !== undefined) await dialog.getByLabel('Email').fill(fields.email);
  if (fields.password !== undefined) await dialog.getByLabel('Password').fill(fields.password);
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
}

test('updateUser', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('update email and password', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  const newEmail = `new${email}`;
  await registerDiner(page, email);

  await editUser(page, { email: newEmail, password: 'newpass' });
  await expect(page.getByRole('main')).toContainText(newEmail);

  await page.getByRole('link', { name: 'Logout' }).click();

  // The old credentials no longer work
  await login(page, email, 'diner');
  await expect(page.getByRole('main')).toContainText('unknown user');

  // The new credentials do
  await page.getByRole('textbox', { name: 'Email address' }).fill(newEmail);
  await page.getByRole('textbox', { name: 'Password' }).fill('newpass');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');
  await expect(page.getByRole('main')).toContainText(newEmail);
});

test('leaving password blank keeps the old password', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await editUser(page, { name: 'pizza dinery' });
  await page.getByRole('link', { name: 'Logout' }).click();

  await login(page, email, 'diner');
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('pizza dinery');
});

test('closing the edit dialog does not update the user', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('not saved');
  // Let preline finish opening the dialog before asking it to close
  await page.waitForSelector('[role="dialog"].opened');
  await page.getByRole('dialog').locator('[data-hs-overlay="#hs-jwt-modal"]').click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza diner');
  await expect(page.getByRole('main')).not.toContainText('not saved');
});

test('franchisee updates their name and keeps their roles', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await page.getByRole('link', { name: 'PF' }).click();

  await editUser(page, { name: 'Franchise Boss' });
  await expect(page.getByRole('main')).toContainText('Franchise Boss');
  await expect(page.getByRole('main')).toContainText('Franchisee on 2');

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, 'f@jwt.com', 'franchisee');
  await page.getByRole('link', { name: 'FB' }).click();
  await expect(page.getByRole('main')).toContainText('Franchise Boss');
  await expect(page.getByRole('main')).toContainText('Franchisee on 2');
});

test('admin updates their name and keeps admin access', async ({ page }) => {
  await basicInit(page);
  await login(page, 'a@jwt.com', 'admin');
  await page.getByRole('link', { name: 'PA' }).click();

  await editUser(page, { name: 'Mama Ricci' });
  await expect(page.getByRole('main')).toContainText('Mama Ricci');
  await expect(page.getByRole('main')).toContainText('admin');

  await page.getByLabel('Global').getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
});

test('edit dialog masks the password', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog').getByLabel('Password')).toHaveAttribute('type', 'password');
});
