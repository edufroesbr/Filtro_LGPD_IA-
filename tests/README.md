# 🎭 Testes Playwright - Participa DF

Este diretório contém testes automatizados end-to-end usando Playwright para demonstrar e validar o sistema de detecção de PII do Participa DF.

## 📋 Estrutura dos Testes

### `demo_pii_system.spec.js`
Demonstração completa e visual do sistema com 7 cenários diferentes:

1. **Demo 1**: Detecção de CPF
2. **Demo 2**: Interface de Configurações
3. **Demo 3**: Múltiplos Tipos de PII
4. **Demo 4**: Filtragem Seletiva (habilitar/desabilitar tipos)
5. **Demo 5**: Comparação Público vs Sigiloso
6. **Demo 6**: Todos os 15 Tipos de PII
7. **Demo 7**: Dashboard de Manifestações

### `simulation.spec.js`
Simulação realista com 30 requisições (15 públicas + 15 sigilosas) para popular o sistema e validar o dashboard administrativo.

### `simulation_esic.spec.js`
Simulação baseada em dados reais do repositório e-SIC.

## 🚀 Como Executar

### Pré-requisitos

```bash
# Instalar dependências do Node.js
npm install

# Instalar browsers do Playwright (somente primeira vez)
npx playwright install
```

### Scripts Disponíveis

```bash
# 🎬 DEMONSTRAÇÃO COMPLETA (Com interface visual)
npm run demo

# 🎬 Demonstração em modo headless (sem interface)
npm run demo:headless

# 🔄 SIMULAÇÃO DE 30 REQUISIÇÕES (Com interface)
npm run simulate

# 🔄 Simulação em modo headless
npm run simulate:headless

# 🧪 Executar TODOS os testes (com interface)
npm run test:all

# 🧪 Executar todos os testes (headless)
npm test

# 📊 Ver relatório de testes anteriores
npm run show:report

# 🎨 Interface UI interativa do Playwright
npm run test:ui
```

## 📸 Screenshots

Todos os testes geram screenshots automáticos salvos em `test-results/`:

- `demo-1-cpf-detection.png` - Detecção de CPF
- `demo-2-settings-modal.png` - Modal de configurações
- `demo-3-multiple-pii-*.png` - Múltiplos tipos de PII
- `demo-4-*.png` - Filtragem seletiva
- `demo-5-*.png` - Público vs Sigiloso
- `demo-6-all-pii-types.png` - Todos os tipos
- `demo-7-*.png` - Dashboard

## 🎥 Vídeos

O Playwright grava vídeos automaticamente de todos os testes executados. Os vídeos são salvos em `test-results/`.

## ⚙️ Configuração

A configuração dos testes está em `playwright.config.js` na raiz do projeto:

- **Timeout**: 5 minutos por teste
- **Workers**: 1 (execução sequencial)
- **Base URL**: http://localhost:8000
- **Web Server**: Backend Python é iniciado automaticamente
- **Vídeo**: Gravação habilitada para todos os testes
- **Viewport**: 1280x720

## 🎯 Executar Teste Específico

```bash
# Executar apenas um arquivo de teste
npx playwright test tests/demo_pii_system.spec.js --headed

# Executar apenas um teste específico (por nome)
npx playwright test --headed -g "Demo 1"

# Executar com depuração
npx playwright test --debug
```

## 🔍 Modo Debug

Para executar em modo de depuração passo a passo:

```bash
npx playwright test --debug
```

Isso abrirá o Playwright Inspector onde você pode:
- Executar linha por linha
- Ver seletores destacados
- Pausar e inspecionar o estado da página

## 📊 Relatórios

Após a execução, visualize o relatório HTML interativo:

```bash
npm run show:report
```

## 🐛 Troubleshooting

### Backend não inicia automaticamente

Se o backend não iniciar, execute manualmente em outro terminal:

```bash
cd backend
python main.py
```

Depois execute os testes sem o web server automático:

```bash
npx playwright test --headed
```

### Timeout nos testes

Se os testes estão dando timeout, aumente o tempo em `playwright.config.js`:

```javascript
timeout: 600 * 1000, // 10 minutos
```

### Browser não instalado

```bash
npx playwright install chromium
```

## 📝 Estrutura de um Teste

Exemplo básico de como os testes estão estruturados:

```javascript
test('Meu teste', async ({ page }) => {
    // 1. Navegar para a página
    await page.goto('/');
    
    // 2. Interagir com elementos
    await page.fill('#text-input', 'Texto de teste');
    
    // 3. Aguardar processamento
    await page.waitForTimeout(2000);
    
    // 4. Verificar resultado
    const status = await page.locator('#privacy-status').textContent();
    
    // 5. Tirar screenshot
    await page.screenshot({ path: 'resultado.png' });
});
```

## 🎓 Recursos Adicionais

- [Documentação Playwright](https://playwright.dev)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Seletores](https://playwright.dev/docs/selectors)
- [Asserções](https://playwright.dev/docs/test-assertions)

## ✅ Checklist de Demonstração

Ao executar `npm run demo`, você verá:

- ✅ Detecção automática de CPF
- ✅ Interface de configuração de filtros
- ✅ Detecção de múltiplos tipos de PII
- ✅ Filtragem seletiva funcionando
- ✅ Diferenciação entre público e sigiloso
- ✅ Todos os 15 tipos de PII detectados
- ✅ Dashboard funcional com estatísticas

---

**Última atualização**: 2026-01-28
