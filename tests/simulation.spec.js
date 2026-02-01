// @ts-check
const { test, expect } = require('@playwright/test');

// Mock Data
const sensitiveData = [
    "Meu CPF é 123.456.789-00 e fui mal atendido na UPA.",
    "Denúncia contra o servidor João do e-mail joao@email.com.",
    "Meu telefone 61 99999-9999 foi vazado pelo departamento.",
    "Gostaria de solicitar sigilo sobre meu processo de divórcio.",
    "Minha vizinha Maria, CPF 111.222.333-44, joga lixo na rua.",
    "Sofri assédio e quero denunciar anonimamente. Meu contato: den@mail.com.",
    "O médico Dr. Silva expôs meu prontuário médico indevidamente.",
    "Solicito revisão da minha aposentadoria, matrícula 987654.",
    "Quero saber quem acessou meus dados no sistema ABC.",
    "Vazamento de água na minha casa, sou idoso e vulnerável.",
    "Cobrança indevida no meu cartão final 1234.",
    "Preciso de remédio de alto custo para minha doença rara.",
    "Violência doméstica no endereço Rua X, Casa Y.",
    "Discriminação sofrida no atendimento do órgão Z.",
    "Perdi meus documentos, RG 1234567, preciso de ajuda."
];

const publicData = [
    "Buraco na rua 10 de Taguatinga.",
    "Lâmpada queimada na praça central.",
    "Falta de ônibus na linha 102 pela manhã.",
    "Elogio ao atendimento do Na Hora.",
    "Sugestão de mais lixeiras no parque.",
    "Árvore caída na W3 Norte.",
    "Semáforo quebrado no cruzamento da Av. Brasil.",
    "Solicito poda de árvore na quadra 302.",
    "Calçada quebrada dificultando acessibilidade.",
    "Parada de ônibus sem cobertura.",
    "Lixo acumulado na esquina da escola.",
    "Placa de pare derrubada na rua 5.",
    "Faixa de pedestre apagada na frente do hospital.",
    "Sugestão de melhoria no site do governo.",
    "Reclamação sobre barulho em obra noturna."
];

test('Simulate 30 requests and verify admin dashboard', async ({ page }) => {
    // Combined list of 30 requests
    const requests = [...sensitiveData, ...publicData];

    // Interleave
    const mixedRequests = [];
    for (let i = 0; i < 15; i++) {
        mixedRequests.push({ text: sensitiveData[i], type: 'sensitive' });
        mixedRequests.push({ text: publicData[i], type: 'public' });
    }

    console.log(`Starting simulation with ${mixedRequests.length} requests...`);

    // 1. Navigate to the app
    await page.goto('/');

    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // Check if loaded
    await expect(page).toHaveTitle(/Participa DF/i);

    // Handle all dialogs globally
    page.on('dialog', async dialog => {
        console.log(`Dialog appeared: ${dialog.message()}`);
        await dialog.dismiss();
    });

    // 2. Submit Loop
    for (const [index, req] of mixedRequests.entries()) {
        console.log(`Processing request ${index + 1}/${mixedRequests.length}: ${req.type}`);

        // Fill text with typing simulation (Slower)
        await page.type('#text-input', req.text, { delay: 50 });

        // Wait for debounce/AI logic (2s to be safe)
        await page.waitForTimeout(2000);

        // Verify PII detection visually (non-blocking)
        try {
            const status = await page.locator('#privacy-status').innerText();
            if (req.type === 'sensitive' && status !== 'Sigiloso') {
                console.warn(`[WARN] Failed to detect sensitive data for: "${req.text}". Found: ${status}`);
            } else if (req.type !== 'sensitive' && status !== 'Público') {
                console.warn(`[WARN] False positive for: "${req.text}". Found: ${status}`);
            }
        } catch (e) {
            console.error(`Error checking privacy status: ${e.message}`);
        }

        // Click Submit (JS Force using ID)
        await page.evaluate(() => document.getElementById('submit-btn').click());

        // Pause for visual confirmation (1.5s)
        await page.waitForTimeout(1500);
    }

    console.log('All requests submitted.');

    // 3. Verify in Admin Dashboard / Submissions List
    await page.click('#submissions-btn');

    // Wait for modal to appear
    await expect(page.locator('#submissions-modal')).toBeVisible();

    // Verify count
    const items = page.locator('#submissions-list > div');
    const count = await items.count();
    console.log(`Found ${count} submissions in the dashboard.`);

    expect(count).toBeGreaterThanOrEqual(30);

    // Verify content of top item
    const lastRequest = mixedRequests[mixedRequests.length - 1];
    const firstItemText = await items.first().locator('.submission-body').innerText();

    console.log(`Last submitted (Original): "${lastRequest.text}"`);
    console.log(`First in list (DB): "${firstItemText}"`);

    // Check for redaction
    if (lastRequest.type === 'sensitive') {
        if (firstItemText === lastRequest.text) {
            console.warn("[WARN] Sensitive text was NOT redacted in DB!");
        } else {
            console.log("[SUCCESS] Sensitive text appears redacted in DB.");
            // If we really want to verify, we can check for "[CPF]" etc.
        }
    } else {
        expect(firstItemText).toContain(lastRequest.text);
    }

    // Keep browser open for inspection
    console.log("Keeping browser open for inspection...");
    await page.waitForTimeout(600000);
});
