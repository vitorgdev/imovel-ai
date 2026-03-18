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

interface AuthCheck {
  authenticated: boolean;
  userId?: string;
  used: number;
  limit: number;
  remaining: number;
}

interface StreamCallbacks {
  onStep: (step: string) => void;
  onResult: (data: AnalysisResult) => void;
  onError: (error: string) => void;
}

export async function checkAuth(): Promise<AuthCheck> {
  return browser.runtime.sendMessage({ action: "checkAuth" });
}

export async function analyzeViaBackground(
  payload: { text?: string; url?: string },
  callbacks: StreamCallbacks
): Promise<void> {
  const response = await browser.runtime.sendMessage({
    action: "analyze",
    payload,
  });

  if (response.error) {
    throw new Error(response.error);
  }

  // Process collected events
  for (const event of response.events) {
    switch (event.type) {
      case "step":
        callbacks.onStep(event.step);
        break;
      case "result":
        callbacks.onResult(event.data);
        break;
      case "error":
        callbacks.onError(event.error);
        break;
    }
  }
}
