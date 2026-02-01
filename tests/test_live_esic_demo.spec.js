/**
 * Live e-SIC Data Simulation Test
 * 
 * This test reads real data from AMOSTRA_e-SIC.xlsx and simulates
 * live submissions to populate the dashboard and generate CSV files.
 * 
 * Watch in real-time as:
 * - Manifestations are submitted one by one
 * - CSV file grows with each submission
 * - Dashboard updates dynamically
 */

const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

test.describe('Live e-SIC Data Simulation', () => {
    test('should simulate live submissions from e-SIC data', async ({ page }) => {
        console.log('\n' + '='.repeat(70));
        console.log('🎬 INICIANDO SIMULAÇÃO AO VIVO COM DADOS e-SIC');
        console.log('='.repeat(70) + '\n');

        // Listen for console logs and errors
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

        // 1. Read e-SIC Excel file
        const excelPath = path.join(__dirname, '..', 'docs', 'repositório 300.xlsx');
        console.log(`📂 Lendo arquivo: ${excelPath}`);

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} registros encontrados no e-SIC\n`);

        // 2. Navigate to application
        const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        console.log('🌐 Aplicação carregada\n');

        // 3. Take initial screenshot
        await page.screenshot({
            path: 'test-results/live-demo/00-initial-state.png',
            fullPage: true
        });

        // 4. Clear existing CSV to start fresh
        const csvPath = path.join(__dirname, '..', 'data', 'classifications.csv');
        if (fs.existsSync(csvPath)) {
            fs.unlinkSync(csvPath);
            console.log('🗑️  CSV anterior removido - começando do zero\n');
        }

        // 5. Process first 300 records (as requested)
        const recordsToProcess = Math.min(300, data.length);
        console.log(`📊 Processando ${recordsToProcess} manifestações...\n`);

        for (let i = 0; i < recordsToProcess; i++) {
            const record = data[i];
            const recordNum = i + 1;

            console.log(`\n${'─'.repeat(70)}`);
            console.log(`📝 MANIFESTAÇÃO ${recordNum}/${recordsToProcess}`);
            console.log(`${'─'.repeat(70)}`);

            // Extract text from record (adjust field names based on Excel structure)
            const text = record['Descrição'] || record['Texto'] || record['Manifestação'] || record['manifestacao'] ||
                record['Solicitação'] || JSON.stringify(record).substring(0, 200);

            console.log(`📄 Texto: ${text.substring(0, 80)}...`);

            // Listen for any dialogs (alerts)
            page.on('dialog', async dialog => {
                console.log(`⚠️  ALERTA DETECTADO: ${dialog.message()}`);
                await dialog.accept();
            });

            // Fill the form
            await page.fill('#text-input', text);
            console.log('✍️  Texto preenchido');

            // Wait for AI classification to complete (wait for 'Detectando...' to disappear)
            const categoryPill = page.locator('#ai-category');
            await expect(categoryPill).not.toContainText('Detectando...', { timeout: 10000 }).catch(() => {
                console.log('⚠️  Timeout aguardando classificação');
            });

            // Get privacy status
            const privacyStatus = await page.locator('#privacy-status').textContent();
            console.log(`🛡️  Status: ${privacyStatus}`);

            // Take screenshot before submission
            await page.screenshot({
                path: `test-results/live-demo/${String(recordNum).padStart(2, '0')}-before-submit.png`,
                fullPage: true
            });

            // Submit
            await page.click('#submit-btn');
            console.log('✅ Enviado!');

            // Wait for confirmation modal
            await page.waitForTimeout(1500);

            // Take screenshot of confirmation
            await page.screenshot({
                path: `test-results/live-demo/${String(recordNum).padStart(2, '0')}-confirmation.png`,
                fullPage: true
            });

            // Extract protocol number from modal
            try {
                // Wait for the confirmation modal specific element with shorter timeout
                const protocolElement = page.locator('p').filter({ hasText: /#[\w-]+/ }).first();
                await protocolElement.waitFor({ state: 'attached', timeout: 5000 });

                const protocolText = await protocolElement.textContent();
                console.log(`🎫 Protocolo: ${protocolText}`);
            } catch (e) {
                console.log('⚠️ Protocolo não encontrado (Modal não apareceu ou timeout)');
            }

            // Close modal
            // Close modal - Wait for button to be ready and click
            const okButton = page.locator('button:has-text("OK, Entendi")');
            await okButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
            if (await okButton.isVisible()) {
                await okButton.click();
                await page.waitForTimeout(500); // Animation wait
            }

            // Check CSV file growth
            if (fs.existsSync(csvPath)) {
                const csvContent = fs.readFileSync(csvPath, 'utf-8');
                const lines = csvContent.split('\n').filter(l => l.trim());
                console.log(`📊 CSV atualizado: ${lines.length - 1} registros`);
            }

            // Small delay between submissions for visibility
            await page.waitForTimeout(500);
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log('📊 ABRINDO DASHBOARD PARA VISUALIZAÇÃO');
        console.log('='.repeat(70) + '\n');

        // 6. Navigate to dashboard (/admin_final.html)
        await page.goto(`${BASE_URL}/admin_final.html`);
        await page.waitForLoadState('networkidle');

        // Handle login overlay
        const passwordInput = page.locator('#admin-password');
        if (await passwordInput.isVisible()) {
            await passwordInput.fill('admin123');
            await page.click('.login-btn');
            await page.waitForTimeout(1000);
        }

        // Take dashboard screenshot
        await page.screenshot({
            path: 'test-results/live-demo/final-dashboard.png',
            fullPage: true
        });
        console.log('📸 Screenshot do dashboard capturado');

        // 7. Verify dashboard data
        const totalCount = await page.locator('#total-count').textContent();
        console.log(`\n📈 ESTATÍSTICAS FINAIS:`);
        console.log(`   Total de Manifestações: ${totalCount}`);

        // 8. Check CSV file
        if (fs.existsSync(csvPath)) {
            const csvContent = fs.readFileSync(csvPath, 'utf-8');
            const lines = csvContent.split('\n').filter(l => l.trim());
            console.log(`   Registros no CSV: ${lines.length - 1}`);

            // Show first few lines
            console.log(`\n📄 PRIMEIRAS LINHAS DO CSV:`);
            lines.slice(0, 3).forEach((line, idx) => {
                console.log(`   ${idx === 0 ? 'HEADER' : `ROW ${idx}`}: ${line.substring(0, 100)}...`);
            });
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log('✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log(`${'='.repeat(70)}\n`);

        // 9. Keep dashboard open for viewing
        console.log('⏸️  Dashboard permanecerá aberto por 10 segundos para visualização...\n');
        await page.waitForTimeout(10000);

        // Final verification
        expect(parseInt(totalCount)).toBeGreaterThan(0);
    });

    test('should display CSV file location and contents', async ({ page }) => {
        console.log('\n' + '='.repeat(70));
        console.log('📁 VERIFICAÇÃO DE ARQUIVOS GERADOS');
        console.log('='.repeat(70) + '\n');

        const csvPath = path.join(__dirname, '..', 'data', 'classifications.csv');

        if (fs.existsSync(csvPath)) {
            const stats = fs.statSync(csvPath);
            const csvContent = fs.readFileSync(csvPath, 'utf-8');
            const lines = csvContent.split('\n').filter(l => l.trim());

            console.log('📊 ARQUIVO CSV GERADO:');
            console.log(`   Localização: ${csvPath}`);
            console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   Total de linhas: ${lines.length}`);
            console.log(`   Registros (excluindo header): ${lines.length - 1}`);
            console.log(`   Última modificação: ${stats.mtime.toLocaleString('pt-BR')}`);

            console.log(`\n📋 ESTRUTURA DO CSV:`);
            if (lines.length > 0) {
                console.log(`   ${lines[0]}`);
            }

            console.log(`\n📄 ÚLTIMOS 5 REGISTROS:`);
            lines.slice(-5).forEach((line, idx) => {
                const fields = line.split(',');
                console.log(`   ${idx + 1}. ID: ${fields[0]?.substring(0, 8)}... | Privacy: ${fields[4]}`);
            });

            // Navigate to application and show dashboard
            await page.goto(BASE_URL);
            await page.waitForLoadState('networkidle');

            // Navigate to dashboard (/admin_final.html)
            await page.goto(`${BASE_URL}/admin_final.html`);
            await page.waitForLoadState('networkidle');

            // Handle login overlay
            const passwordInput = page.locator('#admin-password');
            if (await passwordInput.isVisible()) {
                await passwordInput.fill('admin123');
                await page.click('.login-btn');
                await page.waitForTimeout(2000);
            }

            // Take final screenshot
            await page.screenshot({
                path: 'test-results/live-demo/csv-verification-dashboard.png',
                fullPage: true
            });

            console.log(`\n✅ Verificação concluída!`);
            console.log(`📸 Screenshots salvos em: test-results/live-demo/`);
            console.log(`📊 CSV disponível em: ${csvPath}\n`);

        } else {
            console.log('❌ Arquivo CSV não encontrado!');
            console.log(`   Esperado em: ${csvPath}\n`);
        }

        console.log('='.repeat(70) + '\n');
    });
});
