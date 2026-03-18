# vale a pena? - Analise imoveis com IA

Cole o link de um anuncio de imovel e descubra se vale a pena. A IA analisa preco, localizacao, potencial de valorizacao e te da um veredito com score de 0 a 100.

Funciona com OLX, ZAP Imoveis, ImovelWeb, QuintoAndar, VivaReal e qualquer outro site.

## Como funciona

1. Voce acessa um anuncio de imovel no browser
2. A extensao extrai os dados da pagina (bypassa Cloudflare porque roda no seu browser)
3. O Claude (IA) analisa o imovel comparando com a regiao
4. Voce recebe: score, veredito, preco/m2, pros, contras e analise completa

## Setup

### Pre-requisitos

- Node.js 18+
- Uma API key da [Anthropic](https://console.anthropic.com/)
- Chrome, Edge, Brave ou Firefox

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

### 5. Buildar a extensao

```bash
cd extension
npm install
npm run build
```

Isso gera a extensao em `extension/.output/chrome-mv3/`.

Para Firefox:

```bash
npm run build:firefox
```

### 6. Instalar a extensao

**Chrome / Edge / Brave:**

1. Abra `chrome://extensions` (ou `edge://extensions`, `brave://extensions`)
2. Ative o **Modo do desenvolvedor**
3. Clique em **Carregar sem compactacao**
4. Selecione a pasta `extension/.output/chrome-mv3/`

**Firefox:**

1. Abra `about:debugging#/runtime/this-firefox`
2. Clique em **Carregar extensao temporaria**
3. Selecione o arquivo `extension/.output/firefox-mv2/manifest.json`

### 7. Usar

- **Via extensao (recomendado):** Navegue ate um anuncio de imovel. Um botao verde aparece no canto inferior direito. Clique nele e depois em "Analisar este imovel".
- **Via site:** Acesse http://localhost:3000, cole o link ou o texto do anuncio e clique em "Analisar".

## Desenvolvimento da extensao

```bash
cd extension
npm run dev          # Chrome com hot reload
npm run dev:firefox  # Firefox com hot reload
```

O WXT abre o browser automaticamente com a extensao carregada e faz hot reload a cada mudanca.

## Stack

- **Next.js 16** - App Router + API Routes
- **Tailwind CSS + shadcn/ui** - UI
- **Playwright** - Scraping de anuncios
- **Cheerio** - Parsing de HTML
- **Claude API (Anthropic)** - Analise inteligente
- **WXT** - Framework da extensao (Vite + Manifest V3)

## Estrutura

```
src/                          # App Next.js (backend + frontend)
  app/
    page.tsx                  # Frontend principal
    api/analyze/route.ts      # API SSE (scraping + analise)
  lib/
    scraper.ts                # Scraper (fetch + Playwright fallback)
    analyzer.ts               # Integracao com Claude API
  components/                 # Componentes React

extension/                    # Extensao do browser (WXT)
  wxt.config.ts               # Config do WXT (manifest, opcoes)
  entrypoints/
    content.ts                # Widget flutuante injetado nos sites
    popup/                    # Popup da extensao
      index.html
      main.ts
      style.css
  utils/
    api.ts                    # Client SSE compartilhado
    extractor.ts              # Extrator de dados da pagina
    constants.ts              # URL da API
  assets/
    widget.css                # Estilos do widget (Shadow DOM)
  public/                     # Icones
```

## Browsers suportados

| Browser | Suporte | Loja |
|---------|---------|------|
| Chrome | Manifest V3 | Chrome Web Store |
| Edge | Manifest V3 | Edge Add-ons |
| Brave | Manifest V3 | Chrome Web Store |
| Firefox | Manifest V2 (auto) | Firefox Add-ons |
| Opera | Manifest V3 | Opera Addons |
