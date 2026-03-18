import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Vale a Pena? - Análise de Imóveis com IA",
    description:
      "Analise se um imóvel vale a pena com IA. Abra qualquer anúncio e clique no botão.",
    version: "1.0.0",
    permissions: ["activeTab", "scripting"],
  },
  webExt: {
    startUrls: ["https://www.olx.com.br/imoveis"],
  },
});
