import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scrapeProperty } from "@/lib/scraper";
import { analyzeProperty, analyzeFromText } from "@/lib/analyzer";
import { getDb } from "@/lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-source",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Faça login para analisar imóveis" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Check free tier limit
    const db = await getDb();
    const usageCount = await db
      .collection("analyses")
      .countDocuments({ userId });

    const FREE_LIMIT = 3;
    if (usageCount >= FREE_LIMIT) {
      return Response.json(
        { error: "Você atingiu o limite de 3 análises gratuitas. Em breve teremos planos pagos!" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { url, text } = body;

    if (!url && !text) {
      return Response.json({ error: "URL ou texto é obrigatório" }, { status: 400 });
    }

    if (url) {
      try {
        new URL(url);
      } catch {
        return Response.json({ error: "URL inválida" }, { status: 400 });
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendStep(step: string) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "step", step })}\n\n`)
          );
        }

        function sendError(error: string) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error })}\n\n`)
          );
        }

        try {
          let analysis;

          if (text) {
            // Direct text analysis - no scraping needed
            sendStep("Analisando texto do anúncio...");
            sendStep("Processando com IA...");

            try {
              analysis = await analyzeFromText(text);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Erro na análise";
              sendError(`Erro na análise da IA: ${msg}`);
              controller.close();
              return;
            }
          } else {
            // URL-based analysis
            sendStep("Extraindo dados do anúncio...");

            let property;
            try {
              property = await scrapeProperty(url);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Erro ao acessar o site";
              sendError(`Não foi possível acessar o anúncio: ${msg}`);
              controller.close();
              return;
            }

            sendStep(`Dados extraídos: ${property.title || "imóvel encontrado"}`);
            sendStep("Enviando para análise da IA...");

            try {
              analysis = await analyzeProperty(property);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Erro na análise";
              sendError(`Erro na análise da IA: ${msg}`);
              controller.close();
              return;
            }
          }

          sendStep("Análise concluída!");

          // Save to MongoDB
          try {
            const db = await getDb();
            await db.collection("analyses").insertOne({
              ...analysis,
              url: url || null,
              source: text ? "text" : "url",
              userId: userId || null,
              createdAt: new Date(),
            });
          } catch (dbErr) {
            console.error("Failed to save analysis:", dbErr);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "result", data: analysis })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return Response.json({ error: `Falha na análise: ${message}` }, { status: 500 });
  }
}
