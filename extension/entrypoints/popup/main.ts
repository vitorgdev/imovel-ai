import { API_URL } from "@/utils/constants";
import { extractPageData, type PageData } from "@/utils/extractor";
import { streamAnalysis, type AnalysisResult } from "@/utils/api";

const contentDiv = document.getElementById("content")!;
const analyzeBtn = document.getElementById("analyzeBtn")!;

analyzeBtn.addEventListener("click", async () => {
  (analyzeBtn as HTMLButtonElement).disabled = true;
  analyzeBtn.textContent = "Extraindo dados...";

  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      showError("Não foi possível acessar a aba atual.");
      return;
    }

    // Inject content script if needed
    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["/content-scripts/content.js"],
      });
    } catch {
      // May already be injected
    }

    const response = (await browser.tabs.sendMessage(tab.id, {
      action: "extractData",
    })) as PageData;

    if (!response?.rawText) {
      showError(
        "Não foi possível extrair dados desta página. Você está em um anúncio de imóvel?"
      );
      return;
    }

    analyzeBtn.textContent = "Analisando com IA...";
    const steps = ["Dados extraídos da página"];
    renderSteps(steps, true);

    await streamAnalysis(
      { text: response.rawText, url: response.url },
      {
        onStep(step) {
          steps.push(step);
          renderSteps(steps, true);
        },
        onResult(data) {
          renderResult(data);
        },
        onError(error) {
          showError(error);
        },
      }
    );
  } catch (err: any) {
    showError(err.message || "Erro inesperado");
  }
});

function renderSteps(steps: string[], loading: boolean) {
  const stepsHtml = steps
    .map((s) => `<div class="step"><div class="dot"></div>${s}</div>`)
    .join("");
  const loadingHtml = loading
    ? `<div class="step"><div class="dot loading"></div>Processando...</div>`
    : "";
  contentDiv.innerHTML = stepsHtml + loadingHtml;
}

function renderResult(data: AnalysisResult) {
  const scoreColor =
    data.score >= 65
      ? "#10b981"
      : data.score >= 50
        ? "#eab308"
        : data.score >= 35
          ? "#f97316"
          : "#ef4444";

  const highlightsHtml = data.highlights
    .slice(0, 4)
    .map((h) => {
      const color =
        h.status === "good"
          ? "#10b981"
          : h.status === "bad"
            ? "#ef4444"
            : "#eab308";
      return `<div class="step"><div class="dot" style="background:${color}"></div><strong>${h.label}:</strong>&nbsp;${h.value}</div>`;
    })
    .join("");

  contentDiv.innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:36px;font-weight:800;color:${scoreColor}">${data.score}<span style="font-size:16px;color:#71717a">/100</span></div>
      <div style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${scoreColor}22;color:${scoreColor};border:1px solid ${scoreColor}44;margin-top:4px">${data.verdictLabel}</div>
    </div>
    <div class="status success" style="font-size:12px">
      <strong>${data.title}</strong><br>
      ${data.price} · ${data.area}<br>
      📍 ${data.location}
    </div>
    <div style="margin-bottom:10px">${highlightsHtml}</div>
    <div class="status" style="font-size:12px">${data.analysis}</div>
    <a href="${API_URL.replace("/api/analyze", "")}" target="_blank" class="result-link">Ver análise completa</a>
  `;
}

function showError(message: string) {
  contentDiv.innerHTML = `
    <div class="status error">${message}</div>
    <button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button>
  `;
}
