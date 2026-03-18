import { defineConfig } from "wxt";

export default defineConfig({
  dev: {
    server: {
      port: 3100,
    },
  },
  manifest: {
    name: "acheilar - Análise de Imóveis com IA",
    description:
      "Analise se um imóvel vale a pena com IA. Abra qualquer anúncio e clique no botão.",
    version: "1.0.0",
    permissions: ["activeTab", "scripting", "cookies"],
    host_permissions: ["http://localhost:3000/*"],
  },
  webExt: {
    startUrls: ["https://www.olx.com.br/imoveis"],
  },
});
