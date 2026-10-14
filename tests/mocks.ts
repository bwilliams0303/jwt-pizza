import { Page } from '@playwright/test';
import { expect } from 'playwright-test-coverage';
import { Franchise, Order, Role, User } from '../src/service/pizzaService';

export const diner: User = { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] };
export const franchisee: User = {
  id: '4',
  name: 'Pizza Franchisee',
  email: 'f@jwt.com',
  password: 'franchisee',
  roles: [{ role: Role.Diner }, { role: Role.Franchisee, objectId: '2' }],
};
export const admin: User = { id: '1', name: 'Pizza Admin', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] };

export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { [diner.email!]: diner, [franchisee.email!]: franchisee, [admin.email!]: admin };

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

  // Update a user (PUT /api/user/:userId). Updates the stored credentials so later logins see the change.
  await page.route(/\/api\/user\/\d+$/, async (route) => {
    expect(route.request().method()).toBe('PUT');
    const userId = new URL(route.request().url()).pathname.split('/').pop();
    const { name, email, password } = route.request().postDataJSON();
    const [oldEmail, oldUser] = Object.entries(validUsers).find(([, u]) => u.id === userId)!;
    const user: User = { ...oldUser, name, email, password: password || oldUser.password };
    delete validUsers[oldEmail];
    validUsers[email] = user;
    loggedInUser = user;
    await route.fulfill({ json: { user: { ...user, password: undefined }, token: 'abcdef' } });
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

  // Franchises and their stores. The mock keeps state so that creating and closing stores is reflected in later requests.
  let nextFranchiseId = 100;
  let nextStoreId = 100;
  const franchises: Franchise[] = [
    {
      id: '2',
      name: 'LotaPizza',
      admins: [{ id: franchisee.id, name: franchisee.name!, email: franchisee.email! }],
      stores: [
        { id: '4', name: 'Lehi', totalRevenue: 0.05 },
        { id: '5', name: 'Springville', totalRevenue: 0.25 },
        { id: '6', name: 'American Fork', totalRevenue: 1.5 },
      ],
    },
    { id: '3', name: 'PizzaCorp', stores: [{ id: '7', name: 'Spanish Fork', totalRevenue: 0 }] },
    { id: '4', name: 'topSpot', stores: [] },
    { id: '5', name: 'SliceOfLife', stores: [] },
  ];

  await page.route(/\/api\/franchise(\/.*)?(\?.*)?$/, async (route) => {
    const request = route.request();
    const method = request.method();
    const [, , , franchiseId, store, storeId] = new URL(request.url()).pathname.split('/');

    // POST /api/franchise
    if (!franchiseId && method === 'POST') {
      const franchiseReq = request.postDataJSON();
      const admins = franchiseReq.admins.map((a: { email: string }) => ({ ...a, name: validUsers[a.email]?.name }));
      const newFranchise: Franchise = { ...franchiseReq, id: String(nextFranchiseId++), admins, stores: [] };
      franchises.push(newFranchise);
      await route.fulfill({ json: newFranchise });
      return;
    }

    // GET /api/franchise?page&limit&name, where name may be wrapped in * wildcards
    if (!franchiseId) {
      expect(method).toBe('GET');
      const params = new URL(request.url()).searchParams;
      const page = Number(params.get('page') ?? 0);
      const limit = Number(params.get('limit') ?? 10);
      const nameFilter = (params.get('name') ?? '*').replace(/\*/g, '').toLowerCase();
      const matching = franchises.filter((f) => f.name.toLowerCase().includes(nameFilter));
      const pageOfFranchises = matching.slice(page * limit, (page + 1) * limit);
      await route.fulfill({ json: { franchises: pageOfFranchises, more: matching.length > (page + 1) * limit } });
      return;
    }

    // DELETE /api/franchise/:franchiseId
    if (!store && method === 'DELETE') {
      const index = franchises.findIndex((f) => f.id === franchiseId);
      franchises.splice(index, 1);
      await route.fulfill({ json: { message: 'franchise deleted' } });
      return;
    }

    // GET /api/franchise/:userId
    if (!store) {
      expect(method).toBe('GET');
      const userId = franchiseId;
      await route.fulfill({ json: franchises.filter((f) => f.admins?.some((a) => a.id === userId)) });
      return;
    }

    const franchise = franchises.find((f) => f.id === franchiseId)!;

    // POST /api/franchise/:franchiseId/store
    if (method === 'POST') {
      const newStore = { ...request.postDataJSON(), id: String(nextStoreId++), totalRevenue: 0 };
      franchise.stores.push(newStore);
      await route.fulfill({ json: newStore });
      return;
    }

    // DELETE /api/franchise/:franchiseId/store/:storeId
    expect(method).toBe('DELETE');
    franchise.stores = franchise.stores.filter((s) => s.id !== storeId);
    await route.fulfill({ json: { message: 'store deleted' } });
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
  await page.getByLabel('Global').getByRole('link', { name: 'Login' }).click();
  await submitLogin(page, email, password);
}

export async function submitLogin(page: Page, email: string, password: string) {
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}
