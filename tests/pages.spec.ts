import { test, expect } from './testSetup';
import { basicInit } from './mocks';

test('about page', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('our amazing employees are the secret behind our delicious pizzas');
});

test('history page', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('contentinfo').getByRole('link', { name: 'History' }).click();

  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText("It all started in Mama Ricci's kitchen.");
});

test('unknown pages show not found and the breadcrumb leads home', async ({ page }) => {
  await basicInit(page);
  await page.goto('/no-such-page');

  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'no-such-page' })).toBeVisible();

  await page.getByRole('link', { name: 'home' }).click();
  await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
});

test.describe('API docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/docs', async (route) => {
      expect(route.request().method()).toBe('GET');
      const fromFactory = route.request().url().startsWith('https://pizza-factory.cs329.click');
      const endpoints = fromFactory
        ? [{ requiresAuth: true, method: 'POST', path: '/api/order', description: 'Create a JWT pizza', example: 'curl -X POST $host/api/order', response: { jwt: 'JWT here' } }]
        : [
            { requiresAuth: false, method: 'PUT', path: '/api/auth', description: 'Login existing user', example: 'curl -X PUT localhost:3000/api/auth', response: { token: 'tttttt' } },
            { requiresAuth: true, method: 'GET', path: '/api/user/me', description: 'Get authenticated user', example: 'curl localhost:3000/api/user/me', response: { id: 1 } },
          ];
      await route.fulfill({ json: { endpoints } });
    });
  });

  test('service docs', async ({ page }) => {
    await basicInit(page);
    await page.goto('/docs');

    await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '[PUT] /api/auth' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '🔐 [GET] /api/user/me' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Login existing user');
    await expect(page.getByRole('main')).toContainText('"token": "tttttt"');
    await expect(page.getByRole('link', { name: 'http://localhost:3000' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'https://pizza-factory.cs329.click' })).toBeVisible();
  });

  test('factory docs', async ({ page }) => {
    await basicInit(page);
    await page.goto('/docs/factory');

    await expect(page.getByRole('heading', { name: '🔐 [POST] /api/order' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Create a JWT pizza');
    await expect(page.getByRole('heading', { name: '[PUT] /api/auth' })).not.toBeVisible();
  });
});
