import { extractPageData } from "@/utils/extractor";
import { checkAuth, analyzeViaBackground, type AnalysisResult } from "@/utils/api";
import { BASE_URL } from "@/utils/constants";
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
    "position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
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
        <div class="vap-brand"><svg viewBox="330 400 1380 1250" fill="#10b981" width="18" height="18"><path d="M 1009.53 439.223 C 1011.95 439.072 1014.37 438.953 1016.79 438.866 C 1030.21 438.514 1043.46 441.91 1055.06 448.672 C 1067.99 456.123 1087.38 472.353 1099.55 481.955 L 1167.7 535.522 L 1267.97 614.707 C 1285.05 628.109 1313.7 649.095 1328.87 663.302 C 1288.99 692.812 1250.4 724.027 1213.2 756.86 C 1194.81 744.423 1169.96 723.097 1151.86 708.952 L 1019.89 604.831 C 1006.73 616.14 990.693 627.759 976.934 638.496 L 906.543 693.749 L 668.981 880.883 L 669.068 1459.53 C 703.77 1457.83 749.582 1459.31 785.357 1459.34 L 1018.51 1459.7 L 1242.82 1459.59 C 1283.08 1459.53 1330.63 1458.25 1370.38 1460.11 C 1369.79 1433.13 1370.39 1403.85 1370.37 1376.64 L 1370.39 1200.26 C 1369.88 1106.02 1369.91 1011.78 1370.48 917.536 C 1408.64 873.573 1448.43 831.056 1489.77 790.074 C 1523.16 813.414 1554.8 842.049 1587.49 866.696 C 1609.97 883.645 1632.69 901.501 1654.53 919.203 C 1660.44 923.676 1665.61 927.72 1671.27 932.499 C 1641.38 971.201 1611.81 1010.14 1582.54 1049.32 L 1493.06 978.336 C 1494.26 1026.04 1493.42 1076.87 1493.44 1124.78 L 1493.73 1363.58 L 1493.67 1486.85 C 1493.7 1505.42 1494.54 1527.92 1493.26 1546.04 C 1491.02 1560.88 1484.91 1574.97 1474.65 1586 C 1461.61 1600.01 1444.61 1608.89 1425.19 1609.04 C 1404.79 1609.19 1384.3 1609.02 1363.85 1608.97 L 1256.93 1609.01 L 900.839 1609.1 L 704.136 1609.14 L 643.726 1609.19 C 613.575 1609.21 591.877 1611.82 568.131 1589.77 C 540.345 1563.96 545.837 1530.31 545.883 1495.96 L 546.033 1392.85 L 546.043 1130.47 C 546.035 1080.56 546.77 1028.21 545.56 978.485 L 489.545 1022.95 C 479.396 1031 466.859 1041.47 456.464 1048.6 C 435.051 1023.92 415.984 991.845 394.527 966.594 C 386.235 956.836 375.768 942.765 368.651 932.264 C 379.995 922.175 394.209 911.422 406.211 901.916 L 485.339 840.061 L 708.301 664.352 L 889.664 521.32 C 919.651 497.609 949.672 472.893 980.29 450.039 C 988.852 443.648 999.171 441.381 1009.53 439.223 z"/><path d="M 1674.93 569.305 L 1675.6 570.136 C 1637.72 592.501 1602.43 614.205 1567.11 640.659 C 1331.27 817.293 1155.68 1075.6 1021.21 1334.25 C 1006.79 1315.18 992.626 1294.86 978.338 1275.53 C 942.945 1228.49 907.963 1181.15 873.397 1133.5 C 852.09 1103.01 827.683 1072.71 806.009 1042.11 C 813.062 1035.57 821.715 1028.71 829.39 1022.89 C 857.299 1001.71 884.561 978.732 912.965 958.32 C 919.097 964.665 937.567 989.53 944.138 997.798 L 1019.09 1093.3 C 1148.35 884.074 1348.28 689.645 1579.86 598.695 C 1610.72 586.578 1642.9 577.585 1674.93 569.305 z"/></svg> achei<span>lar</span></div>
        <button class="vap-close" id="vap-close">&times;</button>
      </div>
      <div class="vap-panel-body" id="vap-body">
        <div class="vap-status">Clique abaixo para analisar este imóvel com inteligência artificial.</div>
        <button class="vap-btn" id="vap-analyze">Analisar este imóvel</button>
      </div>
    </div>

    <button class="vap-fab" id="vap-fab" title="Analisar imóvel">
      <div class="vap-pulse"></div>
      <svg viewBox="330 400 1380 1250" fill="white">
        <path d="M 1009.53 439.223 C 1011.95 439.072 1014.37 438.953 1016.79 438.866 C 1030.21 438.514 1043.46 441.91 1055.06 448.672 C 1067.99 456.123 1087.38 472.353 1099.55 481.955 L 1167.7 535.522 L 1267.97 614.707 C 1285.05 628.109 1313.7 649.095 1328.87 663.302 C 1288.99 692.812 1250.4 724.027 1213.2 756.86 C 1194.81 744.423 1169.96 723.097 1151.86 708.952 L 1019.89 604.831 C 1006.73 616.14 990.693 627.759 976.934 638.496 L 906.543 693.749 L 668.981 880.883 L 669.068 1459.53 C 703.77 1457.83 749.582 1459.31 785.357 1459.34 L 1018.51 1459.7 L 1242.82 1459.59 C 1283.08 1459.53 1330.63 1458.25 1370.38 1460.11 C 1369.79 1433.13 1370.39 1403.85 1370.37 1376.64 L 1370.39 1200.26 C 1369.88 1106.02 1369.91 1011.78 1370.48 917.536 C 1408.64 873.573 1448.43 831.056 1489.77 790.074 C 1523.16 813.414 1554.8 842.049 1587.49 866.696 C 1609.97 883.645 1632.69 901.501 1654.53 919.203 C 1660.44 923.676 1665.61 927.72 1671.27 932.499 C 1641.38 971.201 1611.81 1010.14 1582.54 1049.32 L 1493.06 978.336 C 1494.26 1026.04 1493.42 1076.87 1493.44 1124.78 L 1493.73 1363.58 L 1493.67 1486.85 C 1493.7 1505.42 1494.54 1527.92 1493.26 1546.04 C 1491.02 1560.88 1484.91 1574.97 1474.65 1586 C 1461.61 1600.01 1444.61 1608.89 1425.19 1609.04 C 1404.79 1609.19 1384.3 1609.02 1363.85 1608.97 L 1256.93 1609.01 L 900.839 1609.1 L 704.136 1609.14 L 643.726 1609.19 C 613.575 1609.21 591.877 1611.82 568.131 1589.77 C 540.345 1563.96 545.837 1530.31 545.883 1495.96 L 546.033 1392.85 L 546.043 1130.47 C 546.035 1080.56 546.77 1028.21 545.56 978.485 L 489.545 1022.95 C 479.396 1031 466.859 1041.47 456.464 1048.6 C 435.051 1023.92 415.984 991.845 394.527 966.594 C 386.235 956.836 375.768 942.765 368.651 932.264 C 379.995 922.175 394.209 911.422 406.211 901.916 L 485.339 840.061 L 708.301 664.352 L 889.664 521.32 C 919.651 497.609 949.672 472.893 980.29 450.039 C 988.852 443.648 999.171 441.381 1009.53 439.223 z"/>
        <path d="M 1674.93 569.305 L 1675.6 570.136 C 1637.72 592.501 1602.43 614.205 1567.11 640.659 C 1331.27 817.293 1155.68 1075.6 1021.21 1334.25 C 1006.79 1315.18 992.626 1294.86 978.338 1275.53 C 942.945 1228.49 907.963 1181.15 873.397 1133.5 C 852.09 1103.01 827.683 1072.71 806.009 1042.11 C 813.062 1035.57 821.715 1028.71 829.39 1022.89 C 857.299 1001.71 884.561 978.732 912.965 958.32 C 919.097 964.665 937.567 989.53 944.138 997.798 L 1019.09 1093.3 C 1148.35 884.074 1348.28 689.645 1579.86 598.695 C 1610.72 586.578 1642.9 577.585 1674.93 569.305 z"/>
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

function renderLogin(body: HTMLElement, shadow: ShadowRoot) {
  body.innerHTML = `
    <div class="vap-status">Faça login para analisar imóveis. Você tem <strong>3 análises gratuitas</strong>.</div>
    <button class="vap-btn" id="vap-login">Entrar no acheilar</button>
  `;
  shadow.getElementById("vap-login")?.addEventListener("click", () => {
    window.open(BASE_URL, "_blank");
  });
}

function renderLimitReached(body: HTMLElement) {
  body.innerHTML = `
    <div class="vap-status" style="border-color:rgba(234,179,8,0.3);background:rgba(234,179,8,0.1);color:#eab308;">
      Você usou todas as suas <strong>3 análises gratuitas</strong>. Em breve teremos planos pagos!
    </div>
  `;
}

async function runAnalysis(
  body: HTMLElement,
  fab: HTMLElement,
  shadow: ShadowRoot
) {
  // Check auth first
  try {
    const auth = await checkAuth();
    if (!auth.authenticated) {
      renderLogin(body, shadow);
      return;
    }
    if (auth.remaining <= 0) {
      renderLimitReached(body);
      return;
    }
  } catch {
    // If auth check fails, try to proceed anyway
  }

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
    await analyzeViaBackground(
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
