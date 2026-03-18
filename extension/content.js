// Content script - runs on real estate listing pages
const API_URL = "http://localhost:3000/api/analyze";

// Extract page data from the rendered DOM
function extractPageData() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style, noscript, svg, path, link, meta, iframe").forEach((el) =>
    el.remove()
  );
  const rawText = clone.textContent.replace(/\s+/g, " ").trim().slice(0, 8000);

  return {
    url: window.location.href,
    title: document.querySelector("h1")?.textContent?.trim() || document.title,
    rawText,
  };
}

// Inject the floating widget
function injectWidget() {
  // Don't inject twice
  if (document.getElementById("vap-widget")) return;

  const widget = document.createElement("div");
  widget.id = "vap-widget";
  widget.innerHTML = `
    <style>
      #vap-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #vap-fab {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }
      #vap-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 28px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0,0,0,0.25);
      }
      #vap-fab:active { transform: scale(0.95); }

      #vap-fab svg {
        width: 28px;
        height: 28px;
        color: white;
      }

      #vap-pulse {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 2px solid #10b981;
        animation: vap-pulse-anim 2s ease-out infinite;
      }
      @keyframes vap-pulse-anim {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.4); opacity: 0; }
      }

      #vap-tooltip {
        position: absolute;
        bottom: 72px;
        right: 0;
        background: #0a0a0a;
        color: #fafafa;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        border: 1px solid #262626;
        opacity: 0;
        transform: translateY(8px);
        animation: vap-tooltip-in 0.4s ease-out 1s forwards;
        pointer-events: none;
      }
      #vap-tooltip::after {
        content: '';
        position: absolute;
        bottom: -6px;
        right: 24px;
        width: 12px;
        height: 12px;
        background: #0a0a0a;
        border-right: 1px solid #262626;
        border-bottom: 1px solid #262626;
        transform: rotate(45deg);
      }
      @keyframes vap-tooltip-in {
        to { opacity: 1; transform: translateY(0); }
      }

      #vap-panel {
        position: absolute;
        bottom: 72px;
        right: 0;
        width: 360px;
        background: #0a0a0a;
        border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.4);
        border: 1px solid #262626;
        overflow: hidden;
        display: none;
        animation: vap-panel-in 0.3s ease-out;
      }
      @keyframes vap-panel-in {
        from { opacity: 0; transform: translateY(12px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      #vap-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #1a1a1a;
      }
      #vap-panel-header .vap-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        color: #fafafa;
      }
      #vap-panel-header .vap-brand span { color: #10b981; }
      #vap-panel-close {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: none;
        background: #1a1a1a;
        color: #71717a;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s;
      }
      #vap-panel-close:hover { background: #262626; color: #fafafa; }

      #vap-panel-body {
        padding: 16px;
        max-height: 450px;
        overflow-y: auto;
      }

      .vap-btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        transition: all 0.2s;
      }
      .vap-btn:hover { opacity: 0.9; }
      .vap-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .vap-status {
        padding: 12px;
        border-radius: 10px;
        border: 1px solid #262626;
        background: #171717;
        margin-bottom: 12px;
        font-size: 13px;
        line-height: 1.6;
        color: #a1a1aa;
      }
      .vap-status.error {
        border-color: rgba(239,68,68,0.3);
        background: rgba(239,68,68,0.1);
        color: #f87171;
      }

      .vap-step {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        font-size: 12px;
        color: #a1a1aa;
      }
      .vap-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        flex-shrink: 0;
      }
      .vap-dot.loading { animation: vap-pulse-dot 1s infinite; }
      .vap-dot.good { background: #10b981; }
      .vap-dot.bad { background: #ef4444; }
      .vap-dot.neutral { background: #eab308; }
      @keyframes vap-pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      .vap-score {
        text-align: center;
        padding: 16px 0;
      }
      .vap-score-number {
        font-size: 48px;
        font-weight: 800;
        line-height: 1;
      }
      .vap-score-label {
        display: inline-block;
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 8px;
      }

      .vap-info {
        padding: 10px 12px;
        border-radius: 10px;
        background: #171717;
        border: 1px solid #262626;
        margin-bottom: 10px;
        font-size: 12px;
        color: #d4d4d8;
        line-height: 1.5;
      }
      .vap-info strong { color: #fafafa; }

      .vap-highlights {
        margin-bottom: 10px;
      }

      .vap-pros-cons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
      }
      .vap-pros, .vap-cons {
        padding: 10px;
        border-radius: 10px;
        font-size: 11px;
        line-height: 1.5;
      }
      .vap-pros {
        background: rgba(16,185,129,0.08);
        border: 1px solid rgba(16,185,129,0.2);
        color: #6ee7b7;
      }
      .vap-cons {
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.2);
        color: #fca5a5;
      }
      .vap-pros-title, .vap-cons-title {
        font-weight: 700;
        font-size: 11px;
        margin-bottom: 6px;
        display: block;
      }
      .vap-pros ul, .vap-cons ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .vap-pros li::before { content: '+ '; font-weight: 700; }
      .vap-cons li::before { content: '- '; font-weight: 700; }
    </style>

    <!-- Tooltip -->
    <div id="vap-tooltip">Analisar este imóvel com IA</div>

    <!-- Panel -->
    <div id="vap-panel">
      <div id="vap-panel-header">
        <div class="vap-brand">🏠 vale a pena<span>?</span></div>
        <button id="vap-panel-close">&times;</button>
      </div>
      <div id="vap-panel-body">
        <div class="vap-status">Clique abaixo para analisar este imóvel com inteligência artificial.</div>
        <button class="vap-btn" id="vap-analyze-btn">Analisar este imóvel</button>
      </div>
    </div>

    <!-- FAB Button -->
    <button id="vap-fab" title="Analisar imóvel">
      <div id="vap-pulse"></div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </button>
  `;

  document.body.appendChild(widget);

  // State
  let panelOpen = false;

  const fab = document.getElementById("vap-fab");
  const panel = document.getElementById("vap-panel");
  const tooltip = document.getElementById("vap-tooltip");
  const closeBtn = document.getElementById("vap-panel-close");
  const analyzeBtn = document.getElementById("vap-analyze-btn");
  const panelBody = document.getElementById("vap-panel-body");
  const pulseRing = document.getElementById("vap-pulse");

  fab.addEventListener("click", () => {
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? "block" : "none";
    tooltip.style.display = "none";
    if (panelOpen) pulseRing.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    panelOpen = false;
    panel.style.display = "none";
  });

  // Auto-hide tooltip after 5s
  setTimeout(() => {
    if (tooltip) tooltip.style.display = "none";
  }, 6000);

  analyzeBtn.addEventListener("click", () => runAnalysis());

  async function runAnalysis() {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Extraindo dados...";

    const data = extractPageData();

    if (!data.rawText || data.rawText.length < 50) {
      panelBody.innerHTML = `
        <div class="vap-status error">Não foi possível extrair dados desta página. Verifique se você está em um anúncio de imóvel.</div>
        <button class="vap-btn" onclick="location.reload()">Tentar novamente</button>
      `;
      return;
    }

    // Show loading steps
    const steps = ["Dados extraídos da página"];
    renderSteps(steps, true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.rawText, url: data.url }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro no servidor" }));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const jsonStr = line.replace("data: ", "");
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "step") {
              steps.push(parsed.step);
              renderSteps(steps, true);
            } else if (parsed.type === "result") {
              renderResult(parsed.data);
            } else if (parsed.type === "error") {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
          }
        }
      }
    } catch (err) {
      panelBody.innerHTML = `
        <div class="vap-status error">${err.message}</div>
        <button class="vap-btn" id="vap-retry-btn">Tentar novamente</button>
      `;
      document.getElementById("vap-retry-btn")?.addEventListener("click", () => {
        panelBody.innerHTML = `
          <div class="vap-status">Clique abaixo para analisar este imóvel.</div>
          <button class="vap-btn" id="vap-analyze-btn">Analisar este imóvel</button>
        `;
        document.getElementById("vap-analyze-btn")?.addEventListener("click", () => runAnalysis());
      });
    }
  }

  function renderSteps(steps, loading) {
    const stepsHtml = steps
      .map((s) => `<div class="vap-step"><div class="vap-dot"></div>${s}</div>`)
      .join("");
    const loadingHtml = loading
      ? `<div class="vap-step"><div class="vap-dot loading"></div>Processando...</div>`
      : "";
    panelBody.innerHTML = stepsHtml + loadingHtml;
  }

  function renderResult(data) {
    const scoreColor =
      data.score >= 65 ? "#10b981" : data.score >= 50 ? "#eab308" : data.score >= 35 ? "#f97316" : "#ef4444";

    const highlightsHtml = data.highlights
      .map((h) => {
        const cls = h.status === "good" ? "good" : h.status === "bad" ? "bad" : "neutral";
        return `<div class="vap-step"><div class="vap-dot ${cls}"></div><strong>${h.label}:</strong>&nbsp;${h.value}</div>`;
      })
      .join("");

    const prosHtml = data.pros.map((p) => `<li>${p}</li>`).join("");
    const consHtml = data.cons.map((c) => `<li>${c}</li>`).join("");

    panelBody.innerHTML = `
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
          <span class="vap-pros-title">Pontos positivos</span>
          <ul>${prosHtml}</ul>
        </div>
        <div class="vap-cons">
          <span class="vap-cons-title">Pontos de atenção</span>
          <ul>${consHtml}</ul>
        </div>
      </div>
    `;

    // Change FAB to show score
    fab.innerHTML = `<span style="color:white;font-weight:800;font-size:18px">${data.score}</span>`;
    fab.style.background = scoreColor;
  }
}

// Listen for messages from popup (backwards compat)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "extractData") {
    sendResponse(extractPageData());
  }
  return true;
});

// Auto-inject when page loads
injectWidget();
