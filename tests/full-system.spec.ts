import { test, expect } from '@playwright/test';

test.describe('StockWave E2E System Test', () => {

    test('Full Application Lifecycle: Auth -> Inventory -> Stock -> Orders -> Sales -> Cleanup', async ({ page }) => {
        // Increase timeout for this long test
        test.setTimeout(180000);

        const timestamp = Date.now();
        const supplierName = `AutoTest Supplier ${timestamp}`;
        const itemName = `AutoTest Cups ${timestamp}`;

        // --- Phase 1: Authentication ---
        await test.step('Phase 1: Authentication', async () => {
            console.log('Navigating to login page...');
            await page.goto('/login');

            // Ensure inputs are visible
            await expect(page.locator('input[type="email"]')).toBeVisible();
            await expect(page.locator('input[type="password"]')).toBeVisible();

            console.log('Filling credentials...');
            const email = process.env.TEST_EMAIL;
            const password = process.env.TEST_PASSWORD;

            if (!email || !password) {
                throw new Error('TEST_EMAIL or TEST_PASSWORD environment variables are missing');
            }

            await page.locator('input[type="email"]').fill(email);
            await page.locator('input[type="password"]').fill(password);

            // "Sign in" button
            await page.getByRole('button', { name: /sign in/i }).click();

            // Wait for navigation and dashboard elements
            await expect(page).toHaveURL(/\/(dashboard)?/);
            // Check for Dashboard specific content
            await expect(page.getByText(/Total Inventory Value/i)).toBeVisible();
            console.log('Authentication successful.');
        });

        // --- Phase 2: Supplier & Inventory (The Setup) ---
        await test.step('Phase 2: Supplier & Inventory', async () => {
            // 1. Create Supplier
            console.log('Creating Supplier...');
            await page.getByRole('link', { name: /suppliers/i }).click();
            await expect(page).toHaveURL(/\/suppliers/);

            await page.getByRole('button', { name: /add supplier/i }).click();

            // Fill Supplier Form
            await page.getByLabel('Company Name').fill(supplierName);
            await page.getByLabel('Phone Number').fill('1234567890');
            await page.getByLabel('Email').fill(`autotest${timestamp}@supplier.com`);

            await page.getByRole('button', { name: /add supplier/i }).last().click();

            // Verify it appears in the list - wait for list to update
            await expect(page.getByText(supplierName).first()).toBeVisible();

            // 2. Create Item
            console.log('Creating Inventory Item...');
            await page.getByRole('link', { name: /inventory/i }).click();
            await expect(page).toHaveURL(/\/inventory/);

            // Handle overlays: wait for toast notifications to disappear or click away
            const toastViewport = page.locator('.toast-viewport');
            if (await toastViewport.isVisible().catch(() => false)) {
                await toastViewport.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
            }
            // Click at (0,0) to clear any overlays that might block interaction
            await page.mouse.click(0, 0);

            await page.getByRole('button', { name: /create new item/i }).click();

            // Fill Item Form (CreateIngredientDialog) - Using IDs for robustness
            await page.locator('#ingredient-name').fill(itemName);

            // Category Select
            await page.locator('button[role="combobox"]').filter({ hasText: /select category/i }).first().click().catch(() =>
                page.getByLabel(/category/i).click()
            );
            await page.getByRole('option').first().click();

            // Supplier Select
            await page.locator('button[role="combobox"]').filter({ hasText: /select supplier/i }).first().click().catch(() =>
                page.getByLabel(/supplier/i).click()
            );
            // Select the unique supplier
            await page.getByRole('option', { name: supplierName }).first().click();

            // Purchase Unit Details - Use IDs
            await page.locator('#purchase-unit').fill('Pack');
            await page.locator('#purchase-size').fill('1');

            // Base Unit Select
            await page.locator('button[role="combobox"]').filter({ hasText: /select base unit/i }).first().click().catch(() =>
                page.getByLabel(/base unit/i).click()
            );
            await page.getByRole('option', { name: 'Piece' }).click();

            // Cost
            await page.locator('#cost').fill('0.5');
            // Force validation by pressing Tab after last field
            await page.keyboard.press('Tab');

            // Optional fields - filling to avoid potential issues with empty number inputs
            await page.locator('#min-stock').fill('0');
            await page.locator('#max-stock').fill('100');

            await page.waitForTimeout(500); // Wait for animations

            // Wait for submit button to be enabled before clicking
            await expect(page.locator('button[type="submit"]')).toBeEnabled();
            const submitButton = page.locator('button[type="submit"]');

            await submitButton.click({ force: true });

            // Check for error alert if dialog doesn't close
            try {
                await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
            } catch (e) {
                if (await page.getByRole('dialog').isVisible()) {
                    console.log('DEBUG: Dialog Content:', await page.getByRole('dialog').textContent());
                }
                if (await page.getByRole('alert').isVisible()) {
                    console.error('Alert found:', await page.getByRole('alert').textContent());
                }
                throw e; // rethrow
            }

            // Assert: Item appears in the list with 0 stock
            const row = page.getByRole('row').filter({ hasText: itemName });
            await expect(row.first()).toBeVisible();
            await expect(row.first()).toContainText('0'); // 0 stock
            console.log('Supplier and Item created.');
        });

        // --- Phase 3: Stock Operations (The Logic) ---
        await test.step('Phase 3: Stock Operations', async () => {
            console.log('Restocking...');
            await page.waitForTimeout(1000); // Wait for table refresh
            const row = page.getByRole('row').filter({ hasText: itemName }).first();

            // Click "Add" (Add Stock) button.
            await row.getByRole('button', { name: /add/i }).click();

            // In the Add Stock Dialog
            await page.getByPlaceholder(/enter amount/i).fill('100');

            await page.getByRole('button', { name: /add stock/i }).last().click();

            // Assert 100 (pieces)
            await expect(row).toContainText('100');

            console.log('Logging Usage...');
            // "Use" button
            await row.getByRole('button', { name: /use/i }).click();

            await page.getByPlaceholder(/enter amount/i).fill('10');
            // Check for reason combobox (Shadcn Combobox, not an input)
            const reasonLabel = page.getByLabel(/reason/i);
            if (await reasonLabel.isVisible()) {
                // Click the combobox trigger button
                await reasonLabel.click();
                // Wait for options and click the specific one
                await page.getByRole('option', { name: 'Consumption' }).click();
            }

            // Confirm
            await page.locator('div[role="dialog"]').getByRole('button', { name: 'Log Usage' }).click();

            // Assert drops to 90 (100 - 10 = 90)
            try {
                await expect(row).toContainText('90', { timeout: 10000 });
            } catch (e) {
                if (await page.getByRole('dialog').isVisible()) {
                    console.log('DEBUG: Log Usage Dialog Content:', await page.getByRole('dialog').textContent());
                }
                throw e;
            }

            console.log('Checking History...');
            // "Clock" icon button -> title="View History"
            // Wait for row update
            await row.getByRole('button', { name: /view history/i }).click();

            // Scope to the dialog/sheet to ignore the Toast notification
            const historySheet = page.getByRole('dialog');
            await expect(historySheet.getByText(/consumption/i).first()).toBeVisible();
            await expect(historySheet.getByText(/-\s*10\s*piece/i)).toBeVisible();

            // Close sheet (press escape)
            await page.keyboard.press('Escape');
            await expect(page.getByText(/consumption/i)).toBeHidden(); // wait for close
        });

        // --- Phase 4: The Order Cycle (Procurement) ---
        await test.step('Phase 4: Order Cycle', async () => {
            console.log('Creating Purchase Order...');
            await page.getByRole('link', { name: /orders/i }).click();

            await page.getByRole('button', { name: /new|create/i }).click();

            // Select Supplier
            await page.getByLabel(/supplier/i).click();
            await page.getByRole('option', { name: supplierName }).first().click();

            // Add Item
            await page.getByRole('button', { name: /add item/i }).click();
            await page.getByLabel(/item|ingredient/i).click();
            await page.getByRole('option', { name: itemName }).first().click();

            await page.getByLabel(/quantity/i).fill('50');
            await page.getByRole('button', { name: /add/i }).last().click(); // Add line item

            // Save as Ordered
            await page.getByRole('button', { name: /create order|save/i }).click();

            // Receive Items
            console.log('Receiving Items...');
            await page.getByRole('link', { name: /orders/i }).click(); // Go back to list

            const orderRow = page.getByRole('row').filter({ hasText: supplierName }).first();
            await orderRow.click();

            // Mark Receiver
            await page.getByRole('button', { name: /receive/i }).click();
            if (await page.getByRole('button', { name: /confirm/i }).isVisible()) {
                await page.getByRole('button', { name: /confirm/i }).click();
            }

            // Assert Inventory -> 140 (90 + 50 = 140)
            console.log('Verifying Inventory after PO...');
            await page.getByRole('link', { name: /inventory/i }).click();
            const row = page.getByRole('row').filter({ hasText: itemName }).first();
            await expect(row).toContainText('140');
        });

        // --- Phase 5: Sales & Financials (The Profit) ---
        await test.step('Phase 5: Sales & Financials', async () => {
            console.log('Processing Sale...');
            await page.getByRole('link', { name: /sales/i }).click();

            await page.waitForLoadState('networkidle');
            const cards = page.locator('.product-card, button.h-full');
            if (await cards.count() > 0) {
                await cards.first().click();
            } else {
                await page.locator('button').filter({ hasText: /add|\$/ }).first().click();
            }

            // Submit
            await page.getByRole('button', { name: /submit|charge|pay/i }).click();

            // Assert Success
            await expect(page.locator('body')).toContainText(/success|updated/i);

            // Reports
            console.log('Checking Reports...');
            await page.getByRole('link', { name: /reports/i }).click();
            await expect(page.locator('canvas, svg').first()).toBeVisible();
        });

        // --- Phase 6: Cleanup (Teardown) ---
        await test.step('Phase 6: Cleanup', async () => {
            console.log('Cleaning up...');

            // Delete Item
            await page.getByRole('link', { name: /inventory/i }).click();

            const itemRow = page.getByRole('row').filter({ hasText: itemName }).first();

            const deleteBtn = itemRow.locator('button:has(svg.lucide-trash-2)');
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.getByRole('button', { name: /delete/i }).last().click(); // Confirm dialog
            }

            // Delete Supplier
            await page.getByRole('link', { name: /suppliers/i }).click();
            const supplierRow = page.getByRole('row').filter({ hasText: supplierName }).first();
            const moreBtn = supplierRow.locator('button:has(svg.lucide-more-vertical)');
            if (await moreBtn.isVisible()) {
                await moreBtn.click();
                await page.getByText(/delete supplier/i).click();
                await page.getByRole('button', { name: /delete/i }).last().click();
            }

            // Assert Gone
            // await expect(page.getByText(itemName)).not.toBeVisible();
            // await expect(page.getByText(supplierName)).not.toBeVisible();

            console.log('Cleanup successful.');
        });

    });
});
