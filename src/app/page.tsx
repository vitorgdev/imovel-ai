"use client";

import { useState } from "react";
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

export default function Home() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const streamAnalysis = async (body: Record<string, string>) => {
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
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection
          url={url}
          setUrl={setUrl}
          onAnalyze={handleAnalyze}
          onAnalyzeText={handleAnalyzeText}
          isAnalyzing={isAnalyzing}
        />
        {error && (
          <div className="mx-auto max-w-2xl px-6 pb-8">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
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
