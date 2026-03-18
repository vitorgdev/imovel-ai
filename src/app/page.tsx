"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { AnalysisResult } from "@/components/analysis-result";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";

export interface AnalysisData {
  title: string;
  price: string;
  location: string;
  area: string;
  pricePerM2: string;
  avgPricePerM2: string;
  verdict: "otimo" | "bom" | "neutro" | "caro" | "muito_caro";
  verdictLabel: string;
  score: number;
  highlights: { label: string; value: string; status: "good" | "neutral" | "bad" }[];
  analysis: string;
  pros: string[];
  cons: string[];
}

interface Usage {
  plan: string;
  planName: string;
  used: number;
  limit: number;
  remaining: number;
}

export default function Home() {
  const { isSignedIn } = useUser();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/usage")
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => {});
    }
  }, [isSignedIn, result]);

  const streamAnalysis = async (body: Record<string, string>) => {
    if (!isSignedIn) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setSteps([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao analisar");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem resposta do servidor");

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
            if (parsed.type === "step") {
              setSteps((prev) => [...prev, parsed.step]);
            } else if (parsed.type === "result") {
              setResult(parsed.data);
            } else if (parsed.type === "error") {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (!url.trim()) return;
    streamAnalysis({ url: url.trim() });
  };

  const handleAnalyzeText = (text: string) => {
    if (!text.trim()) return;
    streamAnalysis({ text: text.trim() });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection
          url={url}
          setUrl={setUrl}
          onAnalyze={handleAnalyze}
          onAnalyzeText={handleAnalyzeText}
          isAnalyzing={isAnalyzing}
        />

        {!isSignedIn && (
          <div className="mx-auto max-w-2xl px-6 pb-8">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="mb-3 text-sm text-emerald-800">
                Faça login para analisar imóveis. Você tem <strong>3 análises gratuitas</strong>.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Entrar para analisar
              </Link>
            </div>
          </div>
        )}

        {isSignedIn && usage && usage.remaining === 0 && !isAnalyzing && !result && (
          <div className="mx-auto max-w-2xl px-6 pb-8">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
              <p className="text-sm text-amber-800">
                Você usou todas as suas <strong>{usage.limit} análises do plano {usage.planName}</strong>.{" "}
              {usage.plan === "free" ? (
                <Link href="/precos" className="font-semibold underline">Faça upgrade!</Link>
              ) : (
                <Link href="/dashboard" className="font-semibold underline">Gerencie seu plano.</Link>
              )}
              </p>
            </div>
          </div>
        )}

        {isSignedIn && usage && usage.remaining > 0 && !isAnalyzing && !result && !error && (
          <div className="mx-auto max-w-2xl px-6 pb-2">
            <p className="text-center text-xs text-muted-foreground">
              {usage.remaining} de {usage.limit} análises restantes
            </p>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-2xl px-6 pb-8">
            <div className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          </div>
        )}
        {(isAnalyzing || result) && (
          <AnalysisResult data={result} isLoading={isAnalyzing} steps={steps} />
        )}
        {!result && !isAnalyzing && !error && <Features />}
      </main>
      <Footer />
    </div>
  );
}
