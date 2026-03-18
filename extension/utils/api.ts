import { API_URL } from "./constants";

export interface AnalysisResult {
  title: string;
  price: string;
  location: string;
  area: string;
  pricePerM2: string;
  avgPricePerM2: string;
  verdict: "otimo" | "bom" | "neutro" | "caro" | "muito_caro";
  verdictLabel: string;
  score: number;
  highlights: {
    label: string;
    value: string;
    status: "good" | "neutral" | "bad";
  }[];
  analysis: string;
  pros: string[];
  cons: string[];
}

interface StreamCallbacks {
  onStep: (step: string) => void;
  onResult: (data: AnalysisResult) => void;
  onError: (error: string) => void;
}

export async function streamAnalysis(
  payload: { text?: string; url?: string },
  callbacks: StreamCallbacks
): Promise<void> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Erro no servidor" }));
    throw new Error(err.error || `Erro ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
        switch (parsed.type) {
          case "step":
            callbacks.onStep(parsed.step);
            break;
          case "result":
            callbacks.onResult(parsed.data);
            break;
          case "error":
            callbacks.onError(parsed.error);
            break;
        }
      } catch (e) {
        if (!(e instanceof SyntaxError)) throw e;
      }
    }
  }
}
