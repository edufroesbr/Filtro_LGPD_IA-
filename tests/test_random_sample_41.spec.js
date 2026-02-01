/**
 * Live Random Sample Test - 41 Cases
 * 
 * This test randomly selects 41 cases from repositório 300.xlsx
 * and processes them through the system with a VISIBLE browser
 * so you can watch the system in action in real-time.
 * 
 * Run with: npx playwright test tests/test_random_sample_41.spec.js --headed
 */

const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configure test to run in headed mode with slower execution
test.use({
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,
});

test.describe('Live Random Sample - 41 Cases', () => {
    test('should process 41 randomly selected cases with visible browser', async ({ page }) => {
        console.log('\n' + '='.repeat(80));
        console.log('🎬 TESTE AO VIVO - 41 CASOS ALEATÓRIOS');
        console.log('='.repeat(80) + '\n');

        // Listen for console logs and errors
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('Download the React DevTools')) {
                console.log(`   🌐 BROWSER: ${text}`);
            }
        });
        page.on('pageerror', err => console.log(`   ❌ ERROR: ${err}`));

        // Auto-accept all dialogs (privacy analysis alerts, etc.)
        page.on('dialog', async dialog => {
            console.log(`   ⚠️  Alerta auto-aceito: ${dialog.message().substring(0, 50)}...`);
            await dialog.accept();
        });

        // 1. Read Excel file
        const excelPath = path.join(__dirname, '..', 'docs', 'repositório 300.xlsx');
        console.log(`📂 Lendo arquivo: ${excelPath}`);

        if (!fs.existsSync(excelPath)) {
            console.log(`❌ ERRO: Arquivo não encontrado: ${excelPath}`);
            throw new Error(`Excel file not found: ${excelPath}`);
        }

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const allData = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${allData.length} registros encontrados no arquivo\n`);

        // 2. Randomly select 41 cases
        const SAMPLE_SIZE = 41;
        const shuffled = [...allData].sort(() => Math.random() - 0.5);
        const selectedCases = shuffled.slice(0, SAMPLE_SIZE);

        console.log(`🎲 ${SAMPLE_SIZE} casos selecionados aleatoriamente\n`);

        // 3. Navigate to application
        const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
        console.log(`🌐 Abrindo aplicação em: ${BASE_URL}\n`);

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('✅ Aplicação carregada\n');

        // 4. Clear existing CSV to start fresh
        const csvPath = path.join(__dirname, '..', 'data', 'classifications.csv');
        if (fs.existsSync(csvPath)) {
            fs.unlinkSync(csvPath);
            console.log('🗑️  CSV anterior removido - começando do zero\n');
        }

        // 5. Process each selected case
        console.log('='.repeat(80));
        console.log('📊 INICIANDO PROCESSAMENTO DOS CASOS');
        console.log('='.repeat(80) + '\n');

        let publicCount = 0;
        let sensitiveCount = 0;

        for (let i = 0; i < selectedCases.length; i++) {
            const record = selectedCases[i];
            const caseNum = i + 1;

            console.log(`\n${'─'.repeat(80)}`);
            console.log(`📝 CASO ${caseNum}/${SAMPLE_SIZE}`);
            console.log(`${'─'.repeat(80)}`);

            // Extract text from record
            const text = record['Descrição'] || record['Texto'] || record['Manifestação'] ||
                record['manifestacao'] || record['Solicitação'] ||
                JSON.stringify(record).substring(0, 200);

            console.log(`📄 Texto (primeiros 100 chars): ${text.substring(0, 100)}...`);

            // Fill the form
            await page.fill('#text-input', text);
            console.log('   ✍️  Texto preenchido no formulário');

            // Wait a bit for user to see the text
            await page.waitForTimeout(800);

            // Wait for AI classification
            const categoryPill = page.locator('#ai-category');
            await expect(categoryPill).not.toContainText('Detectando...', { timeout: 15000 }).catch(() => {
                console.log('   ⚠️  Timeout aguardando classificação AI');
            });

            // Get classification result
            try {
                const category = await categoryPill.textContent();
                console.log(`   🏷️  Categoria: ${category}`);
            } catch (e) {
                console.log('   ⚠️  Não foi possível obter categoria');
            }

            // Get privacy status
            try {
                const privacyStatus = await page.locator('#privacy-status').textContent();
                console.log(`   🛡️  Status de Privacidade: ${privacyStatus}`);

                if (privacyStatus.includes('Público')) {
                    publicCount++;
                } else if (privacyStatus.includes('Sigiloso')) {
                    sensitiveCount++;
                }
            } catch (e) {
                console.log('   ⚠️  Não foi possível obter status de privacidade');
            }

            // Submit the form
            await page.click('#submit-btn');
            console.log('   ✅ Formulário enviado!');

            // Wait for confirmation modal
            await page.waitForTimeout(1500);

            // Extract protocol number
            try {
                const protocolElement = page.locator('p').filter({ hasText: /#[\w-]+/ }).first();
                await protocolElement.waitFor({ state: 'attached', timeout: 5000 });
                const protocolText = await protocolElement.textContent();
                console.log(`   🎫 ${protocolText}`);
            } catch (e) {
                console.log('   ⚠️  Protocolo não encontrado');
            }

            // Close modal
            const okButton = page.locator('button:has-text("OK, Entendi")');
            await okButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
            if (await okButton.isVisible()) {
                await okButton.click();
                await page.waitForTimeout(500);
            }

            // Show CSV growth
            if (fs.existsSync(csvPath)) {
                const csvContent = fs.readFileSync(csvPath, 'utf-8');
                const lines = csvContent.split('\n').filter(l => l.trim());
                console.log(`   📊 Registros no CSV: ${lines.length - 1}`);
            }

            // Progress summary
            console.log(`\n   📈 Progresso: ${caseNum}/${SAMPLE_SIZE} casos processados`);
            console.log(`   📊 Público: ${publicCount} | Sigiloso: ${sensitiveCount}`);

            // Delay between submissions for visibility
            await page.waitForTimeout(1000);
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ TODOS OS 41 CASOS PROCESSADOS!');
        console.log('='.repeat(80) + '\n');

        // 6. Navigate to dashboard (/admin_final.html)
        console.log('📊 Abrindo dashboard para visualização...\n');
        await page.goto(`${BASE_URL}/admin_final.html`);
        await page.waitForLoadState('networkidle');

        // Handle login
        const passwordInput = page.locator('#admin-password');
        if (await passwordInput.isVisible()) {
            await passwordInput.fill('admin123');
            await page.click('.login-btn');
            await page.waitForTimeout(2000);
        }

        // Get dashboard statistics
        try {
            const totalCount = await page.locator('#total-count').textContent();
            console.log('='.repeat(80));
            console.log('📈 ESTATÍSTICAS FINAIS NO DASHBOARD');
            console.log('='.repeat(80));
            console.log(`   Total de Manifestações: ${totalCount}`);
            console.log(`   Público: ${publicCount}`);
            console.log(`   Sigiloso: ${sensitiveCount}`);
            console.log('='.repeat(80) + '\n');
        } catch (e) {
            console.log('⚠️  Não foi possível obter estatísticas do dashboard');
        }

        // 7. Keep dashboard open for user to review
        console.log('⏸️  Dashboard permanecerá aberto por 30 segundos para você revisar...\n');
        console.log('   💡 Você pode ver os gráficos e estatísticas no navegador\n');
        await page.waitForTimeout(30000);

        console.log('='.repeat(80));
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
        console.log('='.repeat(80) + '\n');

        // Verify we processed all cases
        expect(publicCount + sensitiveCount).toBe(SAMPLE_SIZE);
    });
});
