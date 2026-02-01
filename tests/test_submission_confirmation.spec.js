/**
 * Test: Submission Confirmation Modal
 * 
 * This test verifies that when a user submits a manifestation,
 * they receive a proper confirmation modal with:
 * - Success message
 * - Protocol number
 * - Privacy status
 */

const { test, expect } = require('@playwright/test');

test.describe('Submission Confirmation Flow', () => {
    test('should display confirmation modal after successful submission', async ({ page }) => {
        // 1. Navigate to the application
        const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
        await page.goto(BASE_URL);
        console.log('✓ Navigated to application');

        // 2. Wait for page to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 3. Fill in the text input
        const testText = 'Meu CPF é 123.456.789-00 e preciso relatar um problema urgente na minha rua.';
        await page.fill('#text-input', testText);
        console.log('✓ Filled text input with test data');

        // 4. Wait for AI classification to complete
        await page.waitForTimeout(3000);
        console.log('✓ Waited for AI classification');

        // 5. Take screenshot before submission
        await page.screenshot({ path: 'test-results/before-submit.png', fullPage: true });
        console.log('✓ Screenshot taken: before-submit.png');

        // 6. Verify privacy status is displayed
        const privacyStatus = await page.locator('#privacy-status').textContent();
        console.log(`✓ Privacy status detected: ${privacyStatus}`);

        // 7. Click the submit button
        await page.click('#submit-btn');
        console.log('✓ Clicked submit button');

        // 8. Wait for confirmation modal to appear
        await page.waitForTimeout(2000);

        // 9. Take screenshot of confirmation modal
        await page.screenshot({ path: 'test-results/confirmation-modal.png', fullPage: true });
        console.log('✓ Screenshot taken: confirmation-modal.png');

        // 10. Verify modal elements exist
        const modalExists = await page.locator('div:has-text("Manifestação Enviada!")').isVisible();
        expect(modalExists).toBeTruthy();
        console.log('✓ Confirmation modal is visible');

        // 11. Extract protocol number
        const protocolElement = await page.locator('p:has-text("#")').first();
        const protocolText = await protocolElement.textContent();
        console.log(`✓ Protocol number: ${protocolText}`);

        // 12. Verify privacy status in modal
        const modalPrivacyElement = await page.locator('strong').filter({ hasText: /Público|Sigiloso/ });
        const modalPrivacyStatus = await modalPrivacyElement.textContent();
        console.log(`✓ Privacy status in modal: ${modalPrivacyStatus}`);

        // 13. Verify OK button exists
        const okButton = await page.locator('button:has-text("OK, Entendi")');
        expect(await okButton.isVisible()).toBeTruthy();
        console.log('✓ OK button is visible');

        // 14. Take final screenshot
        await page.screenshot({ path: 'test-results/confirmation-modal-final.png', fullPage: true });
        console.log('✓ Final screenshot taken');

        // 15. Click OK button to close modal
        await okButton.click();
        console.log('✓ Clicked OK button');

        // 16. Wait for page reload
        await page.waitForTimeout(2000);

        // 17. Verify form was reset
        const textInputValue = await page.inputValue('#text-input');
        expect(textInputValue).toBe('');
        console.log('✓ Form was reset after confirmation');

        console.log('\n========================================');
        console.log('✅ SUBMISSION CONFIRMATION TEST PASSED');
        console.log('========================================\n');
    });

    test('should show correct privacy status for sensitive data', async ({ page }) => {
        const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Test with PII data
        const sensitiveText = 'Meu CPF é 987.654.321-00 e meu email é usuario@teste.com';
        await page.fill('#text-input', sensitiveText);
        await page.waitForTimeout(3000);

        // Verify privacy status is "Sigiloso"
        const privacyStatus = await page.locator('#privacy-status').textContent();
        expect(privacyStatus).toBe('Sigiloso');
        console.log('✓ Privacy status correctly identified as Sigiloso');

        // Submit
        await page.click('#submit-btn');
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/sensitive-confirmation.png', fullPage: true });

        // Verify modal shows "Sigiloso"
        const modalPrivacy = await page.locator('strong').filter({ hasText: 'Sigiloso' });
        expect(await modalPrivacy.isVisible()).toBeTruthy();
        console.log('✓ Modal correctly shows Sigiloso status');
    });

    test('should show correct privacy status for public data', async ({ page }) => {
        const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Test with non-PII data
        const publicText = 'Gostaria de solicitar informações sobre o horário de funcionamento da biblioteca pública.';
        await page.fill('#text-input', publicText);
        await page.waitForTimeout(3000);

        // Verify privacy status is "Público"
        const privacyStatus = await page.locator('#privacy-status').textContent();
        expect(privacyStatus).toBe('Público');
        console.log('✓ Privacy status correctly identified as Público');

        // Submit
        await page.click('#submit-btn');
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'test-results/public-confirmation.png', fullPage: true });

        // Verify modal shows "Público"
        const modalPrivacy = await page.locator('strong').filter({ hasText: 'Público' });
        expect(await modalPrivacy.isVisible()).toBeTruthy();
        console.log('✓ Modal correctly shows Público status');
    });
});
