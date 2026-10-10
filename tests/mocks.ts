import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';
import { Order, Role, User } from '../src/service/pizzaService';

export const diner: User = { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] };

export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { [diner.email!]: diner };

  // Login (PUT), register (POST), and logout (DELETE)
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ json: { message: 'logout successful' } });
      return;
    }

    const authReq = route.request().postDataJSON();
    if (method === 'POST') {
      const newUser: User = { id: '10', name: authReq.name, email: authReq.email, password: authReq.password, roles: [{ role: Role.Diner }] };
      validUsers[authReq.email] = newUser;
      loggedInUser = newUser;
      await route.fulfill({ json: { user: newUser, token: 'abcdef' } });
      return;
    }

    expect(method).toBe('PUT');
    const user = validUsers[authReq.email];
    if (!user || user.password !== authReq.password) {
      await route.fulfill({ status: 404, json: { message: 'unknown user' } });
      return;
    }
    loggedInUser = user;
    await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  // Order history (GET) and placing an order (POST)
  const orders: Order[] = [];
  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { id: '1', dinerId: loggedInUser?.id, orders } });
      return;
    }

    expect(route.request().method()).toBe('POST');
    const orderReq = route.request().postDataJSON();
    const order = { ...orderReq, id: String(23 + orders.length), date: '2026-10-09T12:00:00.000Z' };
    orders.push(order);
    await route.fulfill({ json: { order, jwt: 'eyJpYXQ' } });
  });

  // Verify an order's JWT with the pizza factory
  await page.route('*/**/api/order/verify', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject({ jwt: 'eyJpYXQ' });
    await route.fulfill({
      json: {
        message: 'valid',
        payload: { vendor: { id: 'jwt-pizza', name: 'JWT Pizza Factory' }, diner: { id: 3, name: 'Kai Chen', email: 'd@jwt.com' }, order: { id: 23 } },
      },
    });
  });

  await page.goto('/');
}

export async function login(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}
