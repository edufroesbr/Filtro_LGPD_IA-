# Guia de Acesso Administrativo - Participa DF

## 🔐 Acesso ao Painel Administrativo

### Opção 1: Página Dedicada (Recomendado)

Acesse diretamente o painel administrativo através da URL:

```
http://localhost:8000/admin_final.html
```

> [!IMPORTANT]
> A senha padrão de acesso é: **admin123**

**Funcionalidades disponíveis:**
- ✅ Dashboard em tempo real com auto-atualização (30s)
- ✅ Estatísticas completas (Total, Público, Sigiloso, Taxa de Detecção)
- ✅ Gráficos interativos (Pizza e Barras)
- ✅ Tabela com últimos 50 registros
- ✅ Download do arquivo CSV
- ✅ Interface dark mode profissional

### Opção 2: Botões na Aplicação Principal

Na página principal (`http://localhost:8000`), procure pelos botões no canto superior direito:

- 📂 **Minhas Manifestações** - Histórico local do usuário
- 📊 **Dashboard** - Dashboard administrativo (página dedicada em /admin_final.html)
- ⚙️ **Configurações** - Filtros de PII e API Key (modal local)

> **Nota**: Os botões agora têm melhor visibilidade com fundo destacado e efeito hover.

---

## 📥 Download do CSV

### Método 1: Pelo Painel Admin
1. Acesse `http://localhost:8000/admin_final.html`
2. Clique no botão "📥 Baixar CSV"

### Método 2: Acesso Direto
```
http://localhost:8000/data/classifications.csv
```

### Método 3: Arquivo Local
O arquivo está salvo em:
```
participa_df/data/classifications.csv
```

---

## 🧪 Testes para Administrador

### 1. Teste de Envio com Confirmação

Execute o seguinte teste manual:

```bash
# Abra o navegador em http://localhost:8000
# Digite um texto com PII:
"Meu CPF é 123.456.789-00 e meu email é teste@email.com"

# Clique em "Enviar Registro"
# Você verá:
# ✅ Modal de confirmação com protocolo
# ✅ Status de privacidade (Sigiloso)
# ✅ Botão verde "Enviado com sucesso!"
```

### 2. Verificar Dashboard

```bash
# Acesse `http://localhost:8000/admin_final.html`
# Verifique:
# - Total de manifestações aumentou
# - Gráfico de pizza atualizado
# - Novo registro na tabela
```

### 3. Teste Automatizado

```bash
cd participa_df
python tests/verify_dashboard.py
```

**Resultado esperado:**
```
Testing CSV Logging and Dashboard...
[OK] Classification successful.
[OK] CSV logging successful.
[OK] Dashboard API successful.

All tests passed!
```

---

## 🎯 Melhorias Implementadas

### ✅ Confirmação de Envio
- Modal visual com protocolo destacado
- Feedback de status (Público/Sigiloso)
- Botão verde "Enviado com sucesso!"
- Auto-limpeza do formulário

### ✅ Visibilidade dos Botões
- Fundo destacado nos botões do header
- Efeito hover com escala e sombra
- Bordas visíveis
- Tooltips informativos

### ✅ Painel Administrativo
- Interface dark mode profissional
- Auto-atualização a cada 30 segundos
- Download direto do CSV
- Estatísticas em tempo real

---

## 📊 Estrutura de Dados do CSV

```csv
id,timestamp,type,category,privacy,privacy_reason,text_snippet
uuid,2026-01-29T14:29:26,Texto,Geral,Sigiloso,"Dados sensíveis detectados: CPF","Meu CPF é 123.456.789-00..."
```

**Campos:**
- `id` - UUID único da classificação
- `timestamp` - Data/hora ISO 8601
- `type` - Tipo de manifestação (Texto/Áudio/Vídeo)
- `category` - Categoria detectada pela IA
- `privacy` - Público ou Sigiloso
- `privacy_reason` - Motivo da classificação
- `text_snippet` - Primeiros 100 caracteres

---

## 🚀 Próximos Passos

- ✅ Filtros por Macros (Dados Pessoais, Bancários, Veiculares, Saúde, Sensíveis)
- ✅ Auto-atualização em tempo real
- ✅ Interface profissional simplificada

---

## 📞 Suporte

Se os botões ainda não estiverem visíveis:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Verifique se o servidor está rodando (`python backend/main.py`)
4. Use a página admin dedicada: `http://localhost:8000/admin_final.html`
