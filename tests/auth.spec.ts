import { test, expect } from './testSetup';
import { basicInit, login } from './mocks';

test('login', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Login' })).not.toBeVisible();
});

test('login with bad password', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'wrong');

  await expect(page.getByRole('main')).toContainText('unknown user');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'KC' })).not.toBeVisible();
});

test('register', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to the party' })).toBeVisible();

  await page.getByPlaceholder('Full name').fill('Pizza Lover');
  await page.getByPlaceholder('Email address').fill('pl@jwt.com');
  await page.getByPlaceholder('Password').fill('secret');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('link', { name: 'PL' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('abcdef');
});

test('switch between login and register', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  await page.getByRole('main').getByText('Register').click();
  await expect(page.getByRole('heading', { name: 'Welcome to the party' })).toBeVisible();

  await page.getByRole('main').getByText('Login').click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('logout', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();

  await page.getByRole('link', { name: 'Logout' }).click();

  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'KC' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
