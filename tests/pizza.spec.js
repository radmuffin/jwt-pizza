import { test, expect } from 'playwright-test-coverage'

test('home page', async ({ page }) => {
    await page.goto('/');

    expect(await page.title()).toBe('JWT Pizza');
});

test('buy pizza with login', async ({ page }) => {
await page.goto('http://localhost:5173/');
await page.getByRole('button', { name: 'Order now' }).click();
await expect(page.locator('h2')).toContainText('Awesome is a click away');
await page.getByRole('combobox').selectOption('1');
await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
await expect(page.locator('form')).toContainText('Selected pizzas: 2');
await page.getByRole('button', { name: 'Checkout' }).click();
await page.getByRole('textbox', { name: 'Email address' }).click();
await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
await page.getByRole('textbox', { name: 'Password' }).fill('diner');
await page.getByRole('button', { name: 'Login' }).click();
await expect(page.locator('tfoot')).toContainText('0.008 ₿');
await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
await expect(page.locator('tbody')).toContainText('Veggie');
await page.getByRole('button', { name: 'Pay now' }).click();
await expect(page.getByRole('main')).toContainText('0.008 ₿');
await expect(page.locator('h2')).toContainText('Here is your JWT Pizza!');
});

