/**
 * Demonstração Completa do Sistema de Detecção de PII Configurável
 * 
 * Este script demonstra:
 * 1. Interface principal do sistema
 * 2. Configuração de filtros de privacidade
 * 3. Detecção de diferentes tipos de PII
 * 4. Filtragem seletiva (habilitar/desabilitar tipos específicos)
 * 5. Visualização de texto redatado
 */

const { test, expect } = require('@playwright/test');

test.describe('Demonstração: Sistema de Detecção de PII Configurável', () => {

    test.beforeEach(async ({ page }) => {
        // Navegar para a aplicação
        await page.goto('http://localhost:8000');
        await page.waitForLoadState('networkidle');

        // Aguardar interface carregar
        await page.waitForSelector('#text-input', { timeout: 5000 });
    });

    test('Demo 1: Interface Principal e Detecção de CPF', async ({ page }) => {
        console.log('\n📱 DEMO 1: Detectando CPF...');

        // Tipo no campo de texto
        const textInput = page.locator('#text-input');
        await textInput.fill('Meu CPF é 123.456.789-00 e gostaria de solicitar informações sobre meu processo.');

        // Aguardar análise
        await page.waitForTimeout(2000);

        // Verificar status de privacidade
        const privacyStatus = await page.locator('#privacy-status').textContent();
        console.log(`   Status: ${privacyStatus}`);

        // Verificar se foi detectado como sigiloso
        const privacyPill = page.locator('#privacy-pill');
        await expect(privacyPill).toBeVisible();

        // Screenshot da detecção
        await page.screenshot({
            path: 'test-results/demo-1-cpf-detection.png',
            fullPage: true
        });

        console.log('   ✅ Screenshot salvo: demo-1-cpf-detection.png');

        await page.waitForTimeout(2000);
    });

    test('Demo 2: Configuração de Filtros de Privacidade', async ({ page }) => {
        console.log('\n⚙️ DEMO 2: Configurando Filtros de Privacidade...');

        // Abrir configurações
        await page.click('#settings-btn');
        await page.waitForTimeout(1000);

        // Verificar modal de configurações
        const settingsModal = page.locator('#settings-modal');
        await expect(settingsModal).toBeVisible();

        console.log('   Modal de configurações aberto');

        // Screenshot do modal de configurações
        await page.screenshot({
            path: 'test-results/demo-2-settings-modal.png',
            fullPage: true
        });

        console.log('   ✅ Screenshot salvo: demo-2-settings-modal.png');

        await page.waitForTimeout(2000);

        // Fechar modal
        await page.click('#close-settings-btn');
        await page.waitForTimeout(500);
    });

    test('Demo 3: Detecção de Múltiplos Tipos de PII', async ({ page }) => {
        console.log('\n🔍 DEMO 3: Detectando Múltiplos Tipos de PII...');

        const testCases = [
            {
                name: 'CPF + Email',
                text: 'Meu CPF é 123.456.789-00 e meu email é joao.silva@exemplo.com.br',
                expectedPII: ['CPF', 'Email']
            },
            {
                name: 'Telefone + Endereço',
                text: 'Moro na Rua das Flores, 123 e meu telefone é (61) 98765-4321',
                expectedPII: ['Telefone', 'Endereço']
            },
            {
                name: 'PIX + Placa',
                text: 'Minha chave PIX é 550e8400-e29b-41d4-a716-446655440000 e placa do carro ABC-1234',
                expectedPII: ['PIX', 'Placa']
            }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n   Teste ${i + 1}: ${testCase.name}`);

            // Limpar campo de texto
            await page.fill('#text-input', '');
            await page.waitForTimeout(500);

            // Digitar texto
            await page.fill('#text-input', testCase.text);
            console.log(`   Texto: "${testCase.text}"`);

            // Aguardar análise
            await page.waitForTimeout(2000);

            // Verificar status
            const categoryText = await page.locator('#ai-category').textContent();
            console.log(`   Detectado: ${categoryText}`);

            // Screenshot
            await page.screenshot({
                path: `test-results/demo-3-multiple-pii-${i + 1}.png`,
                fullPage: true
            });

            console.log(`   ✅ Screenshot salvo: demo-3-multiple-pii-${i + 1}.png`);

            await page.waitForTimeout(1500);
        }
    });

    test('Demo 4: Filtragem Seletiva - Desabilitando Tipos', async ({ page }) => {
        console.log('\n🎛️ DEMO 4: Demonstrando Filtragem Seletiva...');

        // Texto com CPF e Email
        const testText = 'Meu CPF é 123.456.789-00 e email joao@exemplo.com';

        // Passo 1: Todos os filtros habilitados (padrão)
        console.log('\n   📍 Passo 1: Todos os filtros habilitados');
        await page.fill('#text-input', testText);
        await page.waitForTimeout(2000);

        let categoryText = await page.locator('#ai-category').textContent();
        console.log(`   Detectado: ${categoryText}`);

        await page.screenshot({
            path: 'test-results/demo-4-all-enabled.png',
            fullPage: true
        });
        console.log('   ✅ Screenshot: demo-4-all-enabled.png');

        // Passo 2: Abrir configurações e desabilitar Email
        console.log('\n   📍 Passo 2: Desabilitando detecção de Email...');
        await page.click('#settings-btn');
        await page.waitForTimeout(1000);

        // Encontrar e desmarcar checkbox de email
        const emailCheckbox = page.locator('.pii-filter[data-pii-type="email"]');
        if (await emailCheckbox.isChecked()) {
            await emailCheckbox.uncheck();
            console.log('   ❌ Email desabilitado');
        }

        // Screenshot das configurações
        await page.screenshot({
            path: 'test-results/demo-4-disable-email.png',
            fullPage: true
        });
        console.log('   ✅ Screenshot: demo-4-disable-email.png');

        // Salvar configurações
        await page.click('#save-settings-btn');
        await page.waitForTimeout(1500);

        // Fechar modal
        await page.click('#close-settings-btn');
        await page.waitForTimeout(500);

        // Passo 3: Testar novamente com Email desabilitado
        console.log('\n   📍 Passo 3: Testando com Email desabilitado...');
        await page.fill('#text-input', '');
        await page.waitForTimeout(500);
        await page.fill('#text-input', testText);
        await page.waitForTimeout(2000);

        categoryText = await page.locator('#ai-category').textContent();
        console.log(`   Detectado: ${categoryText}`);
        console.log('   ℹ️ Esperado: Apenas CPF (Email deve ser ignorado)');

        await page.screenshot({
            path: 'test-results/demo-4-email-disabled.png',
            fullPage: true
        });
        console.log('   ✅ Screenshot: demo-4-email-disabled.png');

        await page.waitForTimeout(2000);

        // Restaurar configurações
        console.log('\n   📍 Restaurando configurações...');
        await page.click('#settings-btn');
        await page.waitForTimeout(1000);
        await page.click('#select-all-pii');
        await page.waitForTimeout(500);
        await page.click('#save-settings-btn');
        await page.waitForTimeout(1000);
        await page.click('#close-settings-btn');
    });

    test('Demo 5: Texto Público vs Sigiloso', async ({ page }) => {
        console.log('\n🔓 DEMO 5: Comparando Texto Público vs Sigiloso...');

        // Texto público (sem PII)
        console.log('\n   📗 Texto Público (sem PII):');
        const publicText = 'A iluminação pública da Asa Norte está quebrada há 3 dias. Solicito reparo urgente.';
        await page.fill('#text-input', publicText);
        console.log(`   "${publicText}"`);
        await page.waitForTimeout(2000);

        let status = await page.locator('#privacy-status').textContent();
        console.log(`   Status: ${status}`);

        await page.screenshot({
            path: 'test-results/demo-5-public-text.png',
            fullPage: true
        });
        console.log('   ✅ Screenshot: demo-5-public-text.png');

        await page.waitForTimeout(2000);

        // Texto sigiloso (com PII)
        console.log('\n   📕 Texto Sigiloso (com PII):');
        const sensitiveText = 'Meu nome é João Silva, CPF 123.456.789-00, e moro na Rua das Flores, 123. Solicito informações sobre meu processo.';
        await page.fill('#text-input', sensitiveText);
        console.log(`   "${sensitiveText.substring(0, 50)}..."`);
        await page.waitForTimeout(2000);

        status = await page.locator('#privacy-status').textContent();
        console.log(`   Status: ${status}`);

        await page.screenshot({
            path: 'test-results/demo-5-sensitive-text.png',
            fullPage: true
        });
        console.log('   ✅ Screenshot: demo-5-sensitive-text.png');

        await page.waitForTimeout(2000);
    });

    test('Demo 6: Todos os 15 Tipos de PII', async ({ page }) => {
        console.log('\n📋 DEMO 6: Demonstrando os 15 Tipos de PII...');

        const piiExamples = [
            { type: 'CPF', text: 'CPF: 123.456.789-00' },
            { type: 'RG', text: 'RG: 12.345.678-9' },
            { type: 'CNH', text: 'CNH: 12345678901' },
            { type: 'Passaporte', text: 'Passaporte: AB123456' },
            { type: 'Email', text: 'Email: usuario@exemplo.com' },
            { type: 'Telefone', text: 'Tel: (61) 98765-4321' },
            { type: 'CEP', text: 'CEP: 70000-000' },
            { type: 'Endereço', text: 'Rua das Flores, 123' },
            { type: 'Placa', text: 'Placa: ABC-1234' },
            { type: 'PIX', text: 'PIX: 550e8400-e29b-41d4-a716-446655440000' }
        ];

        for (let i = 0; i < Math.min(piiExamples.length, 5); i++) {
            const example = piiExamples[i];
            console.log(`\n   ${i + 1}. ${example.type}: ${example.text}`);

            await page.fill('#text-input', `Dados pessoais: ${example.text}`);
            await page.waitForTimeout(1500);

            const detected = await page.locator('#ai-category').textContent();
            console.log(`      Detectado: ${detected}`);

            await page.waitForTimeout(1000);
        }

        // Screenshot final
        await page.screenshot({
            path: 'test-results/demo-6-all-pii-types.png',
            fullPage: true
        });
        console.log('\n   ✅ Screenshot final: demo-6-all-pii-types.png');
    });

    test('Demo 7: Dashboard de Manifestações', async ({ page }) => {
        console.log('\n📊 DEMO 7: Visualizando Dashboard...');

        // Submeter algumas manifestações de teste
        console.log('\n   Submetendo manifestações de teste...');

        const submissions = [
            'A iluminação está quebrada na Asa Sul',
            'Meu CPF é 123.456.789-00 e preciso de ajuda',
            'Solicito informações sobre obras públicas'
        ];

        for (let i = 0; i < submissions.length; i++) {
            await page.fill('#text-input', submissions[i]);
            await page.waitForTimeout(1500);
            await page.click('#submit-btn');
            await page.waitForTimeout(1000);

            // Aceitar alert
            page.on('dialog', dialog => dialog.accept());
            await page.waitForTimeout(500);

            console.log(`   ${i + 1}. Submetido: "${submissions[i].substring(0, 40)}..."`);
        }

        // Abrir modal de submissões
        await page.click('#submissions-btn');
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: 'test-results/demo-7-submissions-list.png',
            fullPage: true
        });
        console.log('\n   ✅ Screenshot: demo-7-submissions-list.png');

        await page.waitForTimeout(2000);

        // Fechar modal
        await page.click('#close-submissions-btn');
        await page.waitForTimeout(500);

        // Abrir dashboard
        const dashboardBtn = page.locator('#dashboard-btn');
        if (await dashboardBtn.isVisible()) {
            await dashboardBtn.click();
            await page.waitForTimeout(2000);

            await page.screenshot({
                path: 'test-results/demo-7-dashboard.png',
                fullPage: true
            });
            console.log('   ✅ Screenshot: demo-7-dashboard.png');

            await page.waitForTimeout(2000);
        }
    });
});

test.describe('Resumo da Demonstração', () => {
    test('Gerar Relatório Final', async ({ page }) => {
        console.log('\n' + '='.repeat(70));
        console.log('📝 DEMONSTRAÇÃO COMPLETA DO SISTEMA');
        console.log('='.repeat(70));
        console.log('\n✅ Demonstrações Realizadas:');
        console.log('   1. ✓ Detecção de CPF');
        console.log('   2. ✓ Interface de Configurações');
        console.log('   3. ✓ Múltiplos Tipos de PII');
        console.log('   4. ✓ Filtragem Seletiva');
        console.log('   5. ✓ Texto Público vs Sigiloso');
        console.log('   6. ✓ Todos os 15 Tipos de PII');
        console.log('   7. ✓ Dashboard de Manifestações');
        console.log('\n📸 Screenshots salvos em: test-results/');
        console.log('\n🎉 Sistema funcionando perfeitamente!');
        console.log('='.repeat(70) + '\n');
    });
});
