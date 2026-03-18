const API_URL = "http://localhost:3000/api/analyze";

const contentDiv = document.getElementById("content");
const analyzeBtn = document.getElementById("analyzeBtn");

analyzeBtn.addEventListener("click", async () => {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Extraindo dados...";

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      showError("Não foi possível acessar a aba atual.");
      return;
    }

    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch {
      // Content script might already be injected
    }

    // Extract data from the page
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extractData",
    });

    if (!response || !response.rawText) {
      showError("Não foi possível extrair dados desta página. Você está em um anúncio de imóvel?");
      return;
    }

    analyzeBtn.textContent = "Analisando com IA...";
    showSteps(["Dados extraídos da página"]);

    // Send to our API
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: response.rawText, url: response.url }),
    });

    if (!apiResponse.ok) {
      const err = await apiResponse.json();
      throw new Error(err.error || "Erro na API");
    }

    // Read SSE stream
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const steps = ["Dados extraídos da página"];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const data = line.replace("data: ", "");
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "step") {
            steps.push(parsed.step);
            showSteps(steps);
          } else if (parsed.type === "result") {
            showResult(parsed.data, tab.url);
          } else if (parsed.type === "error") {
            showError(parsed.error);
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }
  } catch (err) {
    showError(err.message || "Erro inesperado");
  }
});

function showSteps(steps) {
  const stepsHtml = steps
    .map((s) => `<div class="step"><div class="dot"></div>${s}</div>`)
    .join("");

  contentDiv.innerHTML = `
    <div class="steps">
      ${stepsHtml}
      <div class="step"><div class="dot loading"></div>Processando...</div>
    </div>
  `;
}

function showResult(data, pageUrl) {
  const scoreColor =
    data.score >= 65 ? "#10b981" : data.score >= 50 ? "#eab308" : data.score >= 35 ? "#f97316" : "#ef4444";

  const highlightsHtml = data.highlights
    .slice(0, 4)
    .map((h) => {
      const color = h.status === "good" ? "#10b981" : h.status === "bad" ? "#ef4444" : "#eab308";
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
      ${data.location}
    </div>
    <div class="steps">${highlightsHtml}</div>
    <div class="status" style="font-size:12px">${data.analysis}</div>
    <a href="http://localhost:3000" target="_blank" class="result-link">Ver análise completa no site</a>
  `;
}

function showError(message) {
  contentDiv.innerHTML = `
    <div class="status error">${message}</div>
    <button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button>
  `;
}
