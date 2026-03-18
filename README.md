# vale a pena? - Analise imoveis com IA

Cole o link de um anuncio de imovel e descubra se vale a pena. A IA analisa preco, localizacao, potencial de valorizacao e te da um veredito com score de 0 a 100.

Funciona com OLX, ZAP Imoveis, ImovelWeb, QuintoAndar, VivaReal e qualquer outro site.

## Como funciona

1. Voce acessa um anuncio de imovel no browser
2. A extensao do Chrome extrai os dados da pagina
3. O Claude (IA) analisa o imovel comparando com a regiao
4. Voce recebe: score, veredito, preco/m2, pros, contras e analise completa

## Setup

### Pre-requisitos

- Node.js 18+
- Uma API key da [Anthropic](https://console.anthropic.com/)
- Google Chrome (para a extensao)

### 1. Clonar e instalar

```bash
git clone https://github.com/vitorgdev/imovel-ai.git
cd imovel-ai
npm install
```

### 2. Configurar a API key

```bash
cp .env.example .env.local
```

Edite o `.env.local` e coloque sua API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Instalar o Playwright (para scraping via URL)

```bash
npx playwright install chromium
```

### 4. Rodar o servidor

```bash
npm run dev
```

Acesse http://localhost:3000

### 5. Instalar a extensao do Chrome

1. Abra `chrome://extensions` no Chrome
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactacao**
4. Selecione a pasta `extension/` deste projeto

### 6. Usar

- **Via extensao (recomendado):** Navegue ate um anuncio de imovel. Um botao verde aparece no canto inferior direito. Clique nele e depois em "Analisar este imovel".
- **Via site:** Acesse http://localhost:3000, cole o link do anuncio e clique em "Analisar". Tambem aceita colar o texto do anuncio diretamente.

## Stack

- **Next.js 16** - App Router + API Routes
- **Tailwind CSS + shadcn/ui** - UI
- **Playwright** - Scraping de anuncios
- **Cheerio** - Parsing de HTML
- **Claude API (Anthropic)** - Analise inteligente
- **Chrome Extension (Manifest V3)** - Widget in-page

## Estrutura

```
src/
  app/
    page.tsx          # Frontend principal
    api/analyze/      # API que orquestra scraping + analise
  lib/
    scraper.ts        # Scraper com fetch + Playwright fallback
    analyzer.ts       # Integracao com Claude API
  components/         # Componentes React (header, hero, resultado, etc)
extension/
  manifest.json       # Chrome Extension Manifest V3
  content.js          # Widget flutuante injetado nos sites
  popup.html/js       # Popup da extensao
```
