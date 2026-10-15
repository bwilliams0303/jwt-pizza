import { Page, Route } from '@playwright/test';
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

  await expect(page.getByRole('dialog')).toBeHidden();
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

  await expect(page.getByRole('dialog')).toBeHidden();

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
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

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

async function failUserUpdates(page: Page) {
  const handler = async (route: Route) => {
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ status: 500, json: { message: 'unable to update user' } });
  };
  await page.route(/\/api\/user\/\d+$/, handler);
  return () => page.unroute(/\/api\/user\/\d+$/, handler);
}

test('update error is shown and the user is unchanged', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);
  await failUserUpdates(page);

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('bad name');
  await page.getByRole('button', { name: 'Update' }).click();

  await expect(page.getByRole('dialog')).toContainText('unable to update user');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('main')).toContainText('pizza diner');
  await expect(page.getByRole('main')).not.toContainText('bad name');

  // Reopening the dialog starts without the old error
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog')).not.toContainText('unable to update user');
});

test('retrying a failed update succeeds', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);
  const restoreUserUpdates = await failUserUpdates(page);

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('pizza dinerz');
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByRole('dialog')).toContainText('unable to update user');

  await restoreUserUpdates();
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('main')).toContainText('pizza dinerz');
});

test('escape closes the edit dialog without updating', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('not saved');
  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('main')).not.toContainText('not saved');
});

test('update requires a name and email', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await page.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  const update = dialog.getByRole('button', { name: 'Update' });
  await expect(update).toBeEnabled();

  await dialog.getByLabel('Name').fill('');
  await expect(update).toBeDisabled();
  await expect(dialog).toContainText('Name is required');
  await dialog.getByLabel('Name').fill('pizza diner');
  await dialog.getByLabel('Email').fill('  ');
  await expect(update).toBeDisabled();
  await expect(dialog).toContainText('Email is required');
  await dialog.getByLabel('Email').fill(email);
  await expect(update).toBeEnabled();
  await expect(dialog).not.toContainText('required');
});

test('update requires a valid email address', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await page.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email').fill('not-an-email');
  await expect(dialog.getByRole('button', { name: 'Update' })).toBeDisabled();
  await expect(dialog).toContainText('Email must be a valid address');
});

test('reopening the edit dialog shows the current user', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('not saved');
  await page.getByRole('dialog').getByLabel('Password').fill('secret');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog').getByLabel('Name')).toHaveValue('pizza diner');
  await expect(page.getByRole('dialog').getByLabel('Email')).toHaveValue(email);
  await expect(page.getByRole('dialog').getByLabel('Password')).toHaveValue('');
});

// Count localStorage writes of the auth token so tests can tell whether an update rewrote it
async function countTokenWrites(page: Page) {
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    (window as any).tokenWrites = 0;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'token') (window as any).tokenWrites++;
      return setItem.call(this, key, value);
    };
  });
  return () => page.evaluate(() => (window as any).tokenWrites as number);
}

test('updating with an unchanged token does not rewrite it', async ({ page }) => {
  const tokenWrites = await countTokenWrites(page);
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);
  const writesAfterRegister = await tokenWrites();

  await editUser(page, { name: 'pizza dinerq' });
  await expect(page.getByRole('main')).toContainText('pizza dinerq');
  expect(await tokenWrites()).toBe(writesAfterRegister);
});

test('updating with a new token stores it', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await registerDiner(page, email);
  await page.route(/\/api\/user\/\d+$/, async (route) => {
    const { name, email } = route.request().postDataJSON();
    await route.fulfill({ json: { user: { id: '10', name, email, roles: [{ role: 'diner' }] }, token: 'newtoken' } });
  });

  await editUser(page, { email: `new${email}` });
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('newtoken');
});
