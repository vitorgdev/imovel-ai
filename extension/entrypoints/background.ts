import { BASE_URL, API_URL } from "@/utils/constants";

export default defineBackground(() => {
  // Get all cookies for our domain and format as header
  async function getCookieHeader(): Promise<string> {
    const cookies = await browser.cookies.getAll({ url: BASE_URL });
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  }

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "checkAuth") {
      (async () => {
        try {
          const cookie = await getCookieHeader();
          const res = await fetch(`${BASE_URL}/api/auth/check`, {
            headers: { Cookie: cookie },
          });
          sendResponse(await res.json());
        } catch {
          sendResponse({ authenticated: false, remaining: 0 });
        }
      })();
      return true;
    }

    if (message.action === "analyze") {
      (async () => {
        try {
          const cookie = await getCookieHeader();
          const res = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
            },
            body: JSON.stringify(message.payload),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Erro no servidor" }));
            sendResponse({ error: err.error || `Erro ${res.status}` });
            return;
          }

          // Read SSE stream and collect events
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          const events: { type: string; data?: unknown; step?: string; error?: string }[] = [];

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
                events.push(JSON.parse(data));
              } catch {
                // skip
              }
            }
          }

          sendResponse({ events });
        } catch (err: any) {
          sendResponse({ error: err.message || "Erro inesperado" });
        }
      })();
      return true;
    }
  });
});
