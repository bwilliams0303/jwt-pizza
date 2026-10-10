import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login } from './mocks';

async function orderPizzas(page: Page, pizzas: string[]) {
  await page.getByRole('link', { name: 'Order' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  await page.getByRole('combobox').selectOption('4');
  for (const pizza of pizzas) {
    await page.getByRole('link', { name: `Image Description ${pizza}` }).click();
  }
  await expect(page.locator('form')).toContainText(`Selected pizzas: ${pizzas.length}`);
  await page.getByRole('button', { name: 'Checkout' }).click();
}

test('purchase a single pizza and verify the JWT', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await orderPizzas(page, ['Veggie']);

  await expect(page.getByRole('main')).toContainText('Send me that pizza right now!');
  await expect(page.locator('tfoot')).toContainText('1 pie');
  await expect(page.locator('tfoot')).toContainText('0.004 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(/order ID:\s*23/);
  await expect(page.getByRole('main')).toContainText(/pie count:\s*1/);
  await expect(page.getByRole('main')).toContainText(/total:\s*0.004 ₿/);
  await expect(page.getByRole('main')).toContainText('eyJpYXQ');

  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { name: 'JWT Pizza - valid', exact: true })).toBeVisible();
  await expect(page.locator('#hs-jwt-modal pre')).toContainText('JWT Pizza Factory');
});

test('verify an invalid JWT', async ({ page }) => {
  await basicInit(page);
  await page.route('*/**/api/order/verify', async (route) => {
    await route.fulfill({ status: 400, json: { message: 'invalid' } });
  });
  await login(page, 'd@jwt.com', 'a');
  await orderPizzas(page, ['Pepperoni']);
  await page.getByRole('button', { name: 'Pay now' }).click();

  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { name: 'JWT Pizza - invalid', exact: true })).toBeVisible();
  await expect(page.locator('#hs-jwt-modal pre')).toContainText('Looks like you have a bad pizza!');
});

test('order more from the delivery page', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await orderPizzas(page, ['Veggie']);
  await page.getByRole('button', { name: 'Pay now' }).click();

  await page.getByRole('button', { name: 'Order more' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  await expect(page.locator('form')).toContainText('What are you waiting for?');
});

test('cancel payment keeps the order', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await orderPizzas(page, ['Veggie', 'Pepperoni']);
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
});

test('failed payment shows the error', async ({ page }) => {
  await basicInit(page);
  await page.route('*/**/api/order', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ status: 500, json: { message: 'Failed to fulfill order at factory' } });
  });
  await login(page, 'd@jwt.com', 'a');
  await orderPizzas(page, ['Veggie']);
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByRole('main')).toContainText('⚠️ Failed to fulfill order at factory');
  await expect(page.getByRole('heading', { name: 'So worth it' })).toBeVisible();
});

test('diner dashboard with no orders', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByRole('main')).toContainText('d@jwt.com');
  await expect(page.getByRole('main')).toContainText('diner');
  await expect(page.getByRole('main')).toContainText('How have you lived this long without having a pizza?');

  await page.getByRole('link', { name: 'Buy one' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
});

test('diner dashboard shows order history', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await orderPizzas(page, ['Veggie', 'Pepperoni']);
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();

  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('main')).toContainText('Here is your history of all the good times.');
  const row = page.locator('tbody tr');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('23');
  await expect(row).toContainText('0.008 ₿');
  await expect(row).toContainText('2026-10-09');
});
