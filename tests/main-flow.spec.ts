import { test, expect } from '@playwright/test';

test.describe('StockWave E2E Main Flow', () => {
  // Use the credentials from .env.local (assert they exist)
  const email = process.env.TEST_EMAIL || 'anasalnaser24@gmail.com';
  const password = process.env.TEST_PASSWORD || 'test@test';

  test.beforeEach(async ({ page }) => {
    // Ensure we are not carrying over state if needed, but serial mode usually keeps context? 
    // Actually, distinct tests usually get fresh contexts unless configured otherwise.
    // For serial flow where steps depend on previous, we might want to use a single test or rely on persistent state if we were using a single worker/project.
    // However, "Test 1", "Test 2" implies separate test blocks.
    // Ideally, we should login in beforeEach or reuse auth state.
    // For simplicity in this "Main Flow" script, we can do it all in one Big Test OR use `test.step` inside one test.
    // BUT the user asked for "Test 1", "Test 2" etc.
    // If I make them separate `test(...)` blocks, I need to login in `beforeEach`.
  });

  // Let's use a single test with steps, OR separate tests with login.
  // Separate tests with login is cleaner for reporting "Test 1: Pass", "Test 2: Pass".
  // I'll use separate tests and a helper for login or just repeat login (fast enough).

  test('Test 1: Public & Auth', async ({ page }) => {
    if (!email || !password) throw new Error('TEST_EMAIL and TEST_PASSWORD must be set in .env.local');

    // Visit Landing Page
    await page.goto('/');

    // Click Login
    // Landing page has a "Login" link inside a button
    await page.getByRole('link', { name: 'Login' }).click();

    // Verify we are on login page
    await expect(page).toHaveURL(/\/login/);

    // Fill Email/Password
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Click Sign In
    await page.click('button[type="submit"]'); // Adjust selector if needed

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Summary')).toBeVisible({ timeout: 10000 }); // Wait for dashboard to load
  });

  test('Test 2: Inventory Cycle & Supplier Pre-requisite', async ({ page }) => {
    if (!email || !password) throw new Error('TEST_EMAIL and TEST_PASSWORD must be set');

    // Login first (since tests are isolated by default)
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // --- Supplier Pre-requisite (Ensure a supplier exists) ---
    // User asked for "Test 4: Supplier Flow" later, but we need it here.
    // We'll treat this as part of setup or just do it.
    await page.goto('/suppliers');

    // Check if we need to add a supplier
    // We will just add one to be safe and test the "Create" flow implicitly or explicitly.
    // Or we can try to create item first, see if it fails? No, better to be deterministic.
    // Let's add a "Automated Supplier".
    await page.getByRole('button', { name: 'Add Supplier' }).click();
    await page.fill('input[name="name"]', 'Automated Supplier');
    await page.fill('input[name="phone"]', '0790000000');
    await page.fill('input[name="email"]', 'auto@supplier.com');
    await page.getByRole('button', { name: 'Add Supplier', exact: true }).click();

    // Wait for success toast or dialog verify
    await expect(page.getByText('Supplier Added')).toBeVisible();

    // --- Inventory Cycle ---
    await page.goto('/inventory');

    // Click Create New Item
    await page.getByRole('button', { name: 'Create New Item' }).click();

    // Fill form
    await page.fill('input[name="name"]', 'Automated Test Item');

    // Select Category
    await page.click('button[role="combobox"]:has-text("Select category")'); // Select trigger
    await page.getByRole('option', { name: 'Dry Goods' }).click();

    // Select Supplier (The one we just made)
    await page.click('button[role="combobox"]:has-text("Select supplier")');
    await page.getByRole('option', { name: 'Automated Supplier' }).first().click();

    // Units
    await page.fill('input[name="purchase_unit"]', 'Box');
    await page.fill('input[name="purchase_size"]', '100');

    await page.click('button[role="combobox"]:has-text("Select base unit")');
    await page.getByRole('option', { name: 'Piece' }).click();

    await page.fill('input[name="cost_per_purchase_unit"]', '50'); // Cost

    // Save
    await page.getByRole('button', { name: 'Create Item' }).click();

    // Verify
    await expect(page.getByText('Item Created')).toBeVisible();
    await expect(page.getByText('Automated Test Item')).toBeVisible();
  });

  test('Test 3: Dashboard Logic', async ({ page }) => {
    if (!email || !password) throw new Error('TEST_EMAIL and TEST_PASSWORD must be set');
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Total Items count is visible
    // "Total Items" label and value
    await expect(page.getByText('Total Items')).toBeVisible();
    // Verify Recent Activity
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('Test 4: Supplier Flow', async ({ page }) => {
    if (!email || !password) throw new Error('TEST_EMAIL and TEST_PASSWORD must be set');
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Navigate to Suppliers
    await page.goto('/suppliers');

    // Click a Supplier Card (View Profile)
    // We created "Automated Supplier" in Test 2.
    // Card has a dropdown menu.
    // Find the card with "Automated Supplier"
    const card = page.locator('.rounded-lg', { hasText: 'Automated Supplier' }).first();
    // Within card, find the dropdown trigger button (MoreVertical icon)
    // The code uses `Button` with `MoreVertical`.
    await card.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') }).click();

    // Click "View Profile"
    await page.getByRole('menuitem', { name: 'View Profile' }).click();

    // Verify Profile Page Loads
    // URL should contain /suppliers/ID
    await expect(page).toHaveURL(/\/suppliers\/.+/);
    // Page should show supplier name
    await expect(page.getByRole('heading', { name: 'Automated Supplier' })).toBeVisible({ timeout: 10000 });
  });

});
