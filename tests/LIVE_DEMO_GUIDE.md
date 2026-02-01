# 🎬 Live e-SIC Data Simulation - Guia de Execução

Este teste demonstra o sistema Participa DF em ação, usando dados reais do arquivo **AMOSTRA_e-SIC.xlsx**.

## 📋 O que o teste faz

1. **Lê dados reais** do arquivo Excel e-SIC
2. **Simula 20 submissões** ao vivo, uma por uma
3. **Gera arquivo CSV** dinamicamente em `data/classifications.csv`
4. **Atualiza o dashboard** em tempo real
5. **Captura screenshots** de cada etapa

## 🚀 Como Executar

### Opção 1: Script Batch (Recomendado)

```batch
run_live_demo.bat
```

Basta dar duplo clique no arquivo `run_live_demo.bat` ou executar no terminal.

### Opção 2: Comando Direto

```bash
node node_modules\playwright\cli.js test tests/test_live_esic_demo.spec.js --headed --workers=1
```

## 📊 O que você verá

Durante a execução, você verá:

- ✅ Navegador abrindo automaticamente
- ✅ Formulário sendo preenchido com dados reais
- ✅ Status de privacidade sendo detectado (Público/Sigiloso)
- ✅ Modal de confirmação com protocolo
- ✅ Dashboard sendo atualizado
- ✅ Contadores aumentando em tempo real

### Console Output

```
📂 Lendo arquivo: docs/AMOSTRA_e-SIC.xlsx
✅ 50 registros encontrados no e-SIC

🌐 Aplicação carregada

📊 Processando 20 manifestações...

──────────────────────────────────────────────────────────────────────
📝 MANIFESTAÇÃO 1/20
──────────────────────────────────────────────────────────────────────
📄 Texto: Solicito informações sobre...
✍️  Texto preenchido
🛡️  Status: Público
✅ Enviado!
🎫 Protocolo: #123456
📊 CSV atualizado: 1 registros
```

## 📁 Arquivos Gerados

### 1. CSV de Classificações

**Localização:** `data/classifications.csv`

**Estrutura:**
```csv
id,timestamp,type,category,privacy,reason,text
uuid-1234,2026-01-29T14:53:00,Texto,Geral,Público,"Nenhum dado sensível",Solicito informações...
uuid-5678,2026-01-29T14:53:05,Texto,Geral,Sigiloso,"CPF detectado",Meu CPF é 123.456...
```

### 2. Screenshots

**Localização:** `test-results/live-demo/`

- `00-initial-state.png` - Estado inicial
- `01-before-submit.png` - Antes da 1ª submissão
- `01-confirmation.png` - Confirmação da 1ª submissão
- `02-before-submit.png` - Antes da 2ª submissão
- `02-confirmation.png` - Confirmação da 2ª submissão
- ... (até 20)
- `final-dashboard.png` - Dashboard final
- `csv-verification-dashboard.png` - Verificação do CSV

## 📈 Dashboard em Tempo Real

O dashboard mostra:

- **Total de Manifestações:** Contador crescendo
- **Gráfico de Privacidade:** Público vs Sigiloso
- **Gráfico de Categorias:** Distribuição por tipo
- **Tabela de Registros:** Últimos 50 registros

## 🔍 Verificação dos Resultados

Após a execução, você pode:

1. **Ver o CSV gerado:**
   ```bash
   type data\classifications.csv
   ```

2. **Contar registros:**
   ```bash
   find /c /v "" data\classifications.csv
   ```

3. **Abrir o dashboard manualmente:**
   - Acesse: http://localhost:8000
   - Clique no ícone 📊 (Dashboard)

4. **Ver screenshots:**
   - Abra a pasta `test-results/live-demo/`

## ⚙️ Configurações

### Alterar quantidade de registros

Edite `tests/test_live_esic_demo.spec.js`:

```javascript
// Linha 56
const recordsToProcess = Math.min(20, data.length); // Altere 20 para o número desejado
```

### Velocidade da simulação

Edite os delays no arquivo:

```javascript
// Linha 91 - Delay entre classificação e submissão
await page.waitForTimeout(2000); // 2 segundos

// Linha 126 - Delay entre submissões
await page.waitForTimeout(500); // 0.5 segundos
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'xlsx'"

```bash
cmd /c npm install xlsx
```

### Erro: "Backend not running"

Certifique-se de que o backend está rodando:

```bash
cd backend
python main.py
```

### Erro: "Playwright not installed"

```bash
cmd /c npx playwright install chromium
```

## 📝 Notas

- O teste usa o **modo headed** para você ver tudo acontecendo
- Cada submissão leva ~3-4 segundos (classificação + confirmação)
- 20 registros = ~1-2 minutos de execução
- O dashboard fica aberto por 10 segundos no final para visualização

## ✅ Checklist de Verificação

Após executar, verifique:

- [ ] Arquivo CSV foi criado em `data/classifications.csv`
- [ ] CSV contém 20+ registros (header + dados)
- [ ] Screenshots foram salvos em `test-results/live-demo/`
- [ ] Dashboard mostra contadores corretos
- [ ] Gráficos estão populados
- [ ] Tabela mostra registros recentes

---

**Última atualização:** 2026-01-29  
**Versão:** 1.0
