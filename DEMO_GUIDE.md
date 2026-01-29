# 🚀 Guia Rápido de Demonstração - Participa DF

## ⚡ Início Super Rápido (Windows)

### Opção 1: Script Interativo (Mais Fácil)
```bash
# Execute e escolha no menu:
python scripts\run_demo.py
```

### Opção 2: Batch Script
```bash
# Simplesmente clique duas vezes ou execute:
run_demo.bat
```

### Opção 3: Comandos NPM Diretos
```bash
# Demonstração completa (7 cenários)
npm run demo

# Simulação de 30 requisições
npm run simulate
```

---

## 📋 Pré-requisitos (Primeira Vez Apenas)

```bash
# 1. Instalar dependências Node.js
npm install

# 2. Instalar browsers Playwright
npx playwright install

# Pronto! Agora pode executar as demos
```

---

## 🎬 O Que Cada Demo Faz

### `npm run demo` - Demonstração Completa
**Duração**: ~5 minutos  
**O que mostra**:
- ✅ Detecção automática de CPF
- ✅ Interface de configuração de filtros PII
- ✅ Detecção de múltiplos tipos (CPF + Email, Telefone + Endereço, etc.)
- ✅ Filtragem seletiva (desabilitar tipos específicos)
- ✅ Comparação entre texto público e sigiloso
- ✅ Todos os 15 tipos de PII
- ✅ Dashboard administrativo com gráficos

**Resultado**: Screenshots detalhados em `test-results/`

### `npm run simulate` - Simulação Realista
**Duração**: ~3 minutos  
**O que faz**:
- Submete 30 requisições (15 públicas + 15 sigilosas)
- Preenche o dashboard com dados realistas
- Mostra a diferença entre textos públicos e com PII
- Valida que os dados aparecem corretamente no dashboard

**Resultado**: Dashboard populado + 30 registros visíveis

---

## 🎯 Atalhos Úteis

```bash
# Ver apenas se está funcionando (sem abrir navegador)
npm run demo:headless

# Executar todos os testes
npm run test:all

# Ver relatório HTML bonito dos testes anteriores
npm run show:report

# Interface interativa do Playwright (para desenvolvedores)
npm run test:ui
```

---

## 📸 Onde Ficam os Resultados?

Após executar, você encontrará em `test-results/`:

```
test-results/
├── videos/                        # 🎥 Vídeos de cada teste
│   ├── demo-1-cpf-detection.webm
│   ├── demo-2-settings.webm
│   └── ...
├── screenshots/                   # 📸 Capturas de tela
│   ├── demo-1-cpf-detection.png
│   ├── demo-2-settings-modal.png
│   └── ...
└── index.html                     # 📊 Relatório interativo
```

**💡 Dica**: Execute `npm run show:report` para ver tudo organizado!

---

## 🐛 Troubleshooting

### ❌ "Backend não inicia"
**Solução**: Execute o backend manualmente em outro terminal:
```bash
python backend\main.py
```

### ❌ "Browser não instalado"
**Solução**:
```bash
npx playwright install chromium
```

### ❌ "Timeout nos testes"
**Causa**: Computador lento ou muitos programas abertos  
**Solução**: Feche outros programas e tente novamente

### ❌ "npm não encontrado"
**Solução**: Instale o Node.js de https://nodejs.org/

---

## 📞 Fluxo Recomendado para Apresentação

### Para Jurados/Avaliadores:

1. **Início** (0:00 - 0:30)
   ```bash
   npm run demo
   ```
   Aguarde o navegador abrir automaticamente

2. **Observar** (0:30 - 5:00)
   - O teste executa automaticamente
   - Mostra cada funcionalidade em sequência
   - Tira screenshots de cada cenário

3. **Revisar Resultados** (5:00 - 6:00)
   ```bash
   npm run show:report
   ```
   Mostra relatório HTML com todas as evidências

4. **Dashboard População** (6:00 - 9:00)
   ```bash
   npm run simulate
   ```
   Preenche o dashboard com 30 requisições realistas

### Para Demonstração Rápida (2 min):

```bash
# Apenas execute isso e deixe rolar:
npm run demo:headless & npm run show:report
```
Mostra o relatório enquanto os testes executam em background.

---

## ✅ Checklist de Verificação

Antes de apresentar, certifique-se:

- [ ] `npm install` executado com sucesso
- [ ] `npx playwright install` concluído
- [ ] Backend funcionando (`python backend/main.py`)
- [ ] Navegador Chrome/Edge instalado
- [ ] Porta 8000 livre (sem outros servidores)

---

## 🎓 Entendendo os Logs

Durante a execução, você verá:

```
📱 DEMO 1: Detectando CPF...
   Status: Sigiloso
   ✅ Screenshot salvo: demo-1-cpf-detection.png

⚙️ DEMO 2: Configurando Filtros de Privacidade...
   Modal de configurações aberto
   ✅ Screenshot salvo: demo-2-settings-modal.png
```

Cada `✅` indica sucesso da verificação.

---

## 💪 Próximos Passos

Após executar as demos:

1. Revise os screenshots em `test-results/`
2. Assista os vídeos capturados
3. Explore o código dos testes em `tests/`
4. Personalize os cenários se necessário

---

**Desenvolvido para o Hackathon Participa DF 2026**  
**Edital Item 8.1 - Detecção Automática de PII**
