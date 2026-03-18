import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedProperty } from "./scraper";

const client = new Anthropic();

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

const SYSTEM_PROMPT = `Você é um especialista em mercado imobiliário brasileiro. Sua função é analisar anúncios de imóveis e determinar se o negócio vale a pena.

Você deve retornar APENAS um JSON válido (sem markdown, sem \`\`\`) com a seguinte estrutura:

{
  "title": "título resumido do imóvel",
  "price": "R$ X.XXX.XXX",
  "location": "bairro, cidade - UF",
  "area": "XXm²",
  "pricePerM2": "R$ X.XXX/m²",
  "avgPricePerM2": "R$ X.XXX/m²",
  "verdict": "otimo" | "bom" | "neutro" | "caro" | "muito_caro",
  "verdictLabel": "texto do veredito em português",
  "score": 0-100,
  "highlights": [
    { "label": "nome da métrica", "value": "valor", "status": "good" | "neutral" | "bad" }
  ],
  "analysis": "parágrafo com análise detalhada",
  "pros": ["ponto positivo 1", "ponto positivo 2"],
  "cons": ["ponto negativo 1", "ponto negativo 2"]
}

Regras:
- IMPORTANTE: O "Texto bruto da página" contém TODO o conteúdo visível do anúncio. Use-o para extrair preço, área, quartos, localização e qualquer outra informação mesmo que os campos estruturados estejam como "Não informado" ou "Preço não encontrado". Procure por padrões como "R$", "m²", "quartos", "suítes", "vagas", endereços, bairros, etc.
- O score vai de 0 (péssimo) a 100 (excelente negócio)
- "otimo" = score >= 80, "bom" = 65-79, "neutro" = 50-64, "caro" = 35-49, "muito_caro" = < 35
- Sempre inclua pelo menos 4-6 highlights (preço/m², valorização, condomínio, IPTU, yield aluguel, idade do prédio, etc)
- Use seu conhecimento do mercado imobiliário brasileiro para estimar valores médios da região
- Se dados estiverem faltando mesmo no texto bruto, faça estimativas razoáveis baseadas na região e tipo de imóvel
- Seja honesto e direto na análise
- A análise deve ter 3-5 frases
- Inclua pelo menos 3 prós e 3 contras`;

export async function analyzeProperty(
  property: ScrapedProperty
): Promise<AnalysisResult> {
  const userMessage = `Analise este imóvel:

URL: ${property.url}
Fonte: ${property.source}
Título: ${property.title}
Preço: ${property.price}
Localização: ${property.location}
Área: ${property.area}
Quartos: ${property.bedrooms}
Banheiros: ${property.bathrooms}
Vagas: ${property.parking}
Condomínio: ${property.condominium}
IPTU: ${property.iptu}
Descrição: ${property.description}

Texto bruto da página (para contexto extra):
${property.rawText.slice(0, 5000)}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  // Strip markdown code fences if present
  let text = content.text.trim();
  text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

  const parsed = JSON.parse(text);
  return parsed as AnalysisResult;
}

export async function analyzeFromText(rawText: string): Promise<AnalysisResult> {
  const userMessage = `Analise este imóvel com base no texto do anúncio abaixo. Extraia todas as informações possíveis (preço, área, quartos, localização, etc).

Texto do anúncio:
${rawText.slice(0, 6000)}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  let text = content.text.trim();
  text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

  const parsed = JSON.parse(text);
  return parsed as AnalysisResult;
}
