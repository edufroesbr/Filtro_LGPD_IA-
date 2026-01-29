# Participa DF - Filtro de Privacidade com IA (Edital 8.1) 🛡️🗣️

**Hackathon Desafio Participa DF 2026 - Solução de Anonimização Inteligente**

Uma solução focada no **Item 8.1 do Edital**, utilizando Inteligência Artificial para identificar automaticamente manifestações que contenham dados pessoais (PII) e garantir a conformidade com a Lei de Acesso à Informação (LAI) e LGPD.

---

## 📋 Sobre o Projeto

O **Participa DF - Privacy Filter** é uma solução avançada de detecção e proteção de dados pessoais (PII) para sistemas de ouvidoria governamental. O sistema foi desenvolvido especificamente para o **Item 8.1 do Edital**, utilizando Inteligência Artificial e Machine Learning para identificar automaticamente manifestações que contenham informações sensíveis.

### 🆕 Funcionalidades Expandidas (v2.0)

#### ✅ 15 Tipos de PII Detectados Automaticamente:

**Documentos de Identidade (6 tipos):**
- CPF (Cadastro de Pessoa Física)
- RG (Registro Geral)
- CNH (Carteira Nacional de Habilitação)
- Passaporte
- Título de Eleitor
- Certidão de Nascimento

**Informações de Contato (4 tipos):**
- Email
- Telefone/Celular
- Endereço Residencial Completo
- CEP (Código de Endereçamento Postal)

**Dados Financeiros (3 tipos):**
- Conta Bancária (Agência + Conta)
- Cartão de Crédito
- Chave PIX (UUID, email, telefone, CPF)

**Veículos (2 tipos):**
- Placa de Veículo (formato antigo ABC-1234)
- Placa Mercosul (formato ABC1D23)

**Dados Contextuais Detectados por IA:**
- Nomes de Pessoas Físicas
- Dados de Saúde
- Relatos de Conflitos Familiares

#### 🎛️ Configuração de Filtros pelo Usuário

O sistema permite que os usuários escolham quais tipos de PII desejam filtrar através de uma interface intuitiva nas configurações. As preferências são salvas localmente e respeitadas tanto no modo online (IA) quanto offline (regex).

O **Participa DF - Privacy Filter** tem como objetivo principal atuar como uma barreira de proteção para dados sensíveis. O sistema processa pedidos de acesso à informação e manifestações, classificando-os rigorosamente em:

1.  **Público**: Manifestações sem dados pessoais, prontas para disponibilidade no Portal da Transparência (Item 8.1.1).
2.  **Sigiloso (Sensitive)**: Manifestações contendo dados pessoais (CPF, RG, e-mail, nomes, relatos pessoais), que devem ter acesso restrito.

### 🔐 Classificação Inteligente

O sistema processa pedidos de acesso à informação e manifestações, classificando-os rigorosamente em:

1.  **Público**: Manifestações sem dados pessoais, prontas para disponibilidade no Portal da Transparência (Item 8.1.1).
2.  **Sigiloso (Sensitive)**: Manifestações contendo dados pessoais identificados, que devem ter acesso restrito.

### 🤖 Dois Modos de Operação

**Modo Online (Com API Gemini):**
- Detecção contextual avançada usando IA
- Identifica nomes, situações pessoais e dados de saúde
- Adapta-se ao contexto da mensagem
- Respeita configurações do usuário sobre tipos de PII

**Modo Offline (Sem API):**
- Detecção por regex pattern matching
- Funciona sem internet
- Alta precisão para padrãos estruturados (CPF, Email, etc.)
- Filtra apenas os tipos habilitados pelo usuário

### Arquitetura do Projeto

A solução é composta por:
*   **Frontend (`/frontend`)**: Interface PWA construída com HTML5, CSS3 e JavaScript. Funciona offline e é responsiva.
*   **Backend (`/backend`)**: API leve em Python (FastAPI) que interage com o Google Gemini para processamento de linguagem natural.
*   **Scripts (`/scripts`)**: Utilitários de automação e validação.

---

## 🛠️ Tecnologias e Pré-requisitos

Para executar este projeto, você precisará de:

*   **Python 3.9+** (Linguagem principal do backend)
*   **Navegador Moderno** (Chrome/Edge para suporte total a Web Speech API)
*   **Chave de API do Google Gemini** (Opcional, para classificação real. O sistema possui um modo de simulação "mock" caso não haja chave).

---

## 🚀 Instalação e Configuração

Siga os passos abaixo para preparar o ambiente:

### 1. Clonar o Repositório e Navegar para a Pasta
(Assumindo que você já extraiu ou clonou o projeto)
```bash
cd participa_df
```

### 2. Criar um Ambiente Virtual (Recomendado)
Isso isola as dependências do projeto.

**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar Dependências
Instale todas as bibliotecas necessárias listadas em `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## ▶️ Instruções de Execução

### 1. Iniciar o Servidor Local (Simulação GDF)
Este passo é fundamental para "sincronizar" a aplicação com os serviços do GDF. O backend Python atua como o servidor oficial, provendo a API de inteligência artificial e servindo os arquivos da aplicação.

Execute o comando abaixo na raiz do projeto:
```bash
python backend/main.py
```
*O servidor iniciará em `http://localhost:8000`*

### 2. Acessar a Aplicação
Abra seu navegador e acesse:
[http://localhost:8000](http://localhost:8000)

### 3. Configurar API Key (Opcional)
Para usar a IA real:
1.  Clique no ícone de engrenagem (⚙️) no canto superior direito.
2.  Insira sua chave de API do Google Gemini.
3.  Clique em "Salvar".

### 4. Verificando a Sincronização
Com o servidor rodando na porta 8000, o PWA "sincroniza" automaticamente as requisições. 
- **Modo Online**: Quando o servidor `backend/main.py` está rodando, as classificações de IA e redação de PII são processadas via API.
- **Modo Offline**: Se o servidor cair, o PWA continua funcionando para coleta de dados, mas utiliza classificações locais simplificadas até que a conexão (sincronização) seja restabelecida.

---

## 🎭 Demonstrações Automatizadas (Playwright)

O projeto inclui um conjunto completo de testes automatizados end-to-end usando Playwright para demonstrar todas as funcionalidades do sistema de detecção de PII.

### 🚀 Início Rápido

```bash
# Instalar dependências (primeira vez apenas)
npm install
npx playwright install

# Executar demonstração completa com interface visual
npm run demo

# Ou use o script interativo Python
python scripts/run_demo.py
```

### 📋 Scripts Disponíveis

```bash
# 🎬 Demonstração completa dos 7 cenários (com interface)
npm run demo

# 🎬 Demonstração em modo headless (sem interface)
npm run demo:headless

# 🔄 Simulação de 30 requisições (preenche o dashboard)
npm run simulate

# 🔄 Simulação em modo headless
npm run simulate:headless

# 🧪 Executar todos os testes
npm run test:all

# 📊 Ver relatório HTML dos testes
npm run show:report
```

### 🎯 O Que É Demonstrado

1. **Detecção de CPF** - Captura automática de documentos
2. **Interface de Configurações** - Filtros personalizáveis
3. **Múltiplos Tipos de PII** - Detecção de CPF, Email, Telefone, Endereço, PIX, etc.
4. **Filtragem Seletiva** - Habilitar/desabilitar tipos específicos
5. **Público vs Sigiloso** - Classificação precisa
6. **15 Tipos de PII** - Cobertura completa
7. **Dashboard Administrativo** - Visualização de estatísticas

### 📸 Screenshots e Vídeos

Todos os testes geram automaticamente:
- **Screenshots** em alta resolução de cada cenário
- **Vídeos** da execução completa
- **Relatórios HTML** interativos

Tudo salvo em: `test-results/`

### 📚 Documentação Completa

Para informações detalhadas sobre os testes, consulte:
[tests/README.md](tests/README.md)



## 📥 Entradas e Saídas de Dados

### Classificação de Texto
*   **Entrada (Input):** Texto em linguagem natural (ex: "Tem um buraco na rua 10").
*   **Saída (Output):** Objeto JSON contendo a Categoria e Subcategoria sugeridas (ex: `{"id": "solicitacao", "subcategory": "tapa-buraco"}`).

### Transcrição de Áudio
*   **Entrada:** Áudio do microfone do usuário (Web Speech API).
*   **Saída:** Texto transcrito exibido na tela em tempo real.

---

## 📂 Estrutura de Arquivos

```
participa_df/
├── backend/            # Código do servidor (API)
│   ├── main.py         # Ponto de entrada da aplicação (FastAPI)
│   └── ai_service.py   # Lógica de integração com Gemini
├── frontend/           # Código da interface (PWA)
│   ├── index.html      # Página principal
│   ├── js/app.js       # Lógica do cliente (Frontend)
│   └── css/            # Estilos
├── docs/               # Documentação e arquivos do edital
├── scripts/            # Scripts auxiliares
├── requirements.txt    # Lista de dependências Python
└── README.md           # Este arquivo
```

---
**Equipe Participa DF**
