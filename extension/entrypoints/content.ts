import { extractPageData } from "@/utils/extractor";
import { streamAnalysis, type AnalysisResult } from "@/utils/api";
import widgetStyles from "@/assets/widget.css?raw";

export default defineContentScript({
  matches: [
    "*://*.olx.com.br/*",
    "*://*.zapimoveis.com.br/*",
    "*://*.vivareal.com.br/*",
    "*://*.quintoandar.com.br/*",
    "*://*.imovelweb.com.br/*",
    "*://*.chaves-na-mao.com.br/*",
  ],
  runAt: "document_idle",

  main() {
    injectWidget();

    // Listen for messages from popup
    browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === "extractData") {
        sendResponse(extractPageData());
      }
      return true;
    });
  },
});

function injectWidget() {
  if (document.getElementById("vap-widget")) return;

  // Create shadow host for style isolation
  const host = document.createElement("div");
  host.id = "vap-widget";
  host.style.cssText =
    "position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Inject styles
  const style = document.createElement("style");
  style.textContent = widgetStyles;
  shadow.appendChild(style);

  // Inject HTML
  const container = document.createElement("div");
  container.classList.add("vap-container");
  container.innerHTML = `
    <div class="vap-tooltip" id="vap-tooltip">Analisar este imóvel com IA</div>

    <div class="vap-panel" id="vap-panel">
      <div class="vap-panel-header">
        <div class="vap-brand">🏠 achei<span>lar</span></div>
        <button class="vap-close" id="vap-close">&times;</button>
      </div>
      <div class="vap-panel-body" id="vap-body">
        <div class="vap-status">Clique abaixo para analisar este imóvel com inteligência artificial.</div>
        <button class="vap-btn" id="vap-analyze">Analisar este imóvel</button>
      </div>
    </div>

    <button class="vap-fab" id="vap-fab" title="Analisar imóvel">
      <div class="vap-pulse"></div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </button>
  `;
  shadow.appendChild(container);

  // Elements
  const fab = shadow.getElementById("vap-fab")!;
  const panel = shadow.getElementById("vap-panel")!;
  const tooltip = shadow.getElementById("vap-tooltip")!;
  const closeBtn = shadow.getElementById("vap-close")!;
  const analyzeBtn = shadow.getElementById("vap-analyze")!;
  const body = shadow.getElementById("vap-body")!;
  const pulse = shadow.querySelector(".vap-pulse") as HTMLElement;

  let panelOpen = false;

  fab.addEventListener("click", () => {
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? "block" : "none";
    tooltip.style.display = "none";
    if (panelOpen) pulse.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    panelOpen = false;
    panel.style.display = "none";
  });

  setTimeout(() => {
    tooltip.style.display = "none";
  }, 6000);

  analyzeBtn.addEventListener("click", () => runAnalysis(body, fab, shadow));
}

async function runAnalysis(
  body: HTMLElement,
  fab: HTMLElement,
  shadow: ShadowRoot
) {
  const data = extractPageData();

  if (!data.rawText || data.rawText.length < 50) {
    body.innerHTML = `
      <div class="vap-status vap-error">Não foi possível extrair dados desta página.</div>
      <button class="vap-btn" id="vap-retry">Tentar novamente</button>
    `;
    shadow.getElementById("vap-retry")?.addEventListener("click", () => location.reload());
    return;
  }

  const steps = ["Dados extraídos da página"];
  renderSteps(body, steps, true);

  try {
    await streamAnalysis(
      { text: data.rawText, url: data.url },
      {
        onStep(step) {
          steps.push(step);
          renderSteps(body, steps, true);
        },
        onResult(result) {
          renderResult(body, fab, result);
        },
        onError(error) {
          body.innerHTML = `
            <div class="vap-status vap-error">${error}</div>
            <button class="vap-btn" id="vap-retry">Tentar novamente</button>
          `;
        },
      }
    );
  } catch (err: any) {
    body.innerHTML = `
      <div class="vap-status vap-error">${err.message || "Erro inesperado"}</div>
    `;
  }
}

function renderSteps(body: HTMLElement, steps: string[], loading: boolean) {
  body.innerHTML =
    steps
      .map((s) => `<div class="vap-step"><div class="vap-dot"></div>${s}</div>`)
      .join("") +
    (loading
      ? `<div class="vap-step"><div class="vap-dot vap-loading"></div>Processando...</div>`
      : "");
}

function renderResult(
  body: HTMLElement,
  fab: HTMLElement,
  data: AnalysisResult
) {
  const scoreColor =
    data.score >= 65
      ? "#10b981"
      : data.score >= 50
        ? "#eab308"
        : data.score >= 35
          ? "#f97316"
          : "#ef4444";

  const highlightsHtml = data.highlights
    .map((h) => {
      const cls =
        h.status === "good"
          ? "vap-good"
          : h.status === "bad"
            ? "vap-bad"
            : "vap-neutral";
      return `<div class="vap-step"><div class="vap-dot ${cls}"></div><strong>${h.label}:</strong>&nbsp;${h.value}</div>`;
    })
    .join("");

  const prosHtml = data.pros.map((p) => `<li>${p}</li>`).join("");
  const consHtml = data.cons.map((c) => `<li>${c}</li>`).join("");

  body.innerHTML = `
    <div class="vap-score">
      <div class="vap-score-number" style="color:${scoreColor}">${data.score}<span style="font-size:18px;color:#71717a">/100</span></div>
      <div class="vap-score-label" style="background:${scoreColor}22;color:${scoreColor};border:1px solid ${scoreColor}44">${data.verdictLabel}</div>
    </div>
    <div class="vap-info">
      <strong>${data.title}</strong><br>
      ${data.price} · ${data.area}<br>
      📍 ${data.location}<br><br>
      Preço/m²: <strong>${data.pricePerM2}</strong> · Média: ${data.avgPricePerM2}
    </div>
    <div class="vap-highlights">${highlightsHtml}</div>
    <div class="vap-info">${data.analysis}</div>
    <div class="vap-pros-cons">
      <div class="vap-pros">
        <span class="vap-list-title">Pontos positivos</span>
        <ul>${prosHtml}</ul>
      </div>
      <div class="vap-cons">
        <span class="vap-list-title">Pontos de atenção</span>
        <ul>${consHtml}</ul>
      </div>
    </div>
  `;

  // Update FAB with score
  fab.innerHTML = `<span style="color:white;font-weight:800;font-size:18px">${data.score}</span>`;
  fab.style.background = scoreColor;
}
