// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load Data
const dataPath = path.join(__dirname, 'data', 'simulation_data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const requests = JSON.parse(rawData);

test('Simulate requests from e-SIC Data', async ({ page }) => {
    console.log(`Starting simulation with ${requests.length} requests from e-SIC sample...`);

    // 1. Navigate to the app
    await page.goto('/');

    // Capture console logs to see app activity
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // Check if loaded
    await expect(page).toHaveTitle(/Participa DF/i);

    // Handle all dialogs globally (auto-dismiss alerts)
    page.on('dialog', async dialog => {
        // console.log(`Dialog appeared: ${dialog.message()}`);
        await dialog.dismiss();
    });

    // 2. Submit Loop
    // Limit to 20 for this test run to save time, or run all? 
    // Let's run the first 15 to verify speed and correctness.
    const subset = requests.slice(0, 15);

    for (const [index, req] of subset.entries()) {
        console.log(`Processing request ${index + 1}/${subset.length}...`);

        // Fill text with typing simulation (Fast typing for speed)
        await page.locator('#text-input').fill(req.text);

        // Wait for debounce/AI logic (1s is enough for local/fast api)
        // If real API is used, might need more, but we want to test the flow.
        await page.waitForTimeout(1500);

        // Check privacy status before submitting (just for logging)
        try {
            const status = await page.locator('#privacy-status').innerText();
            console.log(`  -> Detected Status: ${status}`);
        } catch (e) {
            console.error(`  -> Error checking privacy status: ${e.message}`);
        }

        // Click Submit
        await page.click('#submit-btn');

        // Short pause for dialog/processing
        await page.waitForTimeout(1000);
    }

    console.log('Subset submitted.');

    // 3. Verify in Admin Dashboard
    await page.click('#submissions-btn');
    await expect(page.locator('#submissions-modal')).toBeVisible();

    const items = page.locator('#submissions-list > div');
    const count = await items.count();
    console.log(`Found ${count} submissions in the dashboard.`);

    expect(count).toBeGreaterThanOrEqual(subset.length);

    // Keep browser open briefly
    await page.waitForTimeout(3000);
});
