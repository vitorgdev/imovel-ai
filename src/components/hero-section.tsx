"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Sparkles, ArrowRight, Loader2, ClipboardPaste } from "lucide-react";
import { useState } from "react";

interface HeroSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: () => void;
  onAnalyzeText: (text: string) => void;
  isAnalyzing: boolean;
}

export function HeroSection({ url, setUrl, onAnalyze, onAnalyzeText, isAnalyzing }: HeroSectionProps) {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [pastedText, setPastedText] = useState("");

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.03] blur-3xl" />
        <div className="absolute right-0 top-20 h-[300px] w-[400px] rounded-full bg-blue-500/[0.03] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pt-32">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-600">
            <Sparkles className="h-3.5 w-3.5" />
            Análise inteligente com IA
          </div>
        </div>

        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-[1.1]">
            Descubra se o imóvel{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              vale a pena?
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Cole o link do anúncio ou o texto e nossa IA analisa preço, localização,
            potencial de valorização e te dá um veredito.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => setMode("url")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === "url"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="mr-1.5 inline h-3.5 w-3.5" />
            Link
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === "text"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardPaste className="mr-1.5 inline h-3.5 w-3.5" />
            Colar texto
          </button>
        </div>

        {/* Input area */}
        <div className="mx-auto mt-6 max-w-2xl">
          {mode === "url" ? (
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-blue-500/10 opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-100" />
              <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-lg shadow-black/5 transition-colors group-focus-within:border-emerald-500/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  type="url"
                  placeholder="Cole o link do anúncio (OLX, ZAP, QuintoAndar...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
                  className="h-12 flex-1 border-0 bg-transparent text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
                />
                <Button
                  onClick={onAnalyze}
                  disabled={isAnalyzing || !url.trim()}
                  size="lg"
                  className="h-12 shrink-0 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      Analisar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-blue-500/10 opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-100" />
              <div className="relative rounded-xl border border-border bg-card p-4 shadow-lg shadow-black/5 transition-colors group-focus-within:border-emerald-500/40">
                <Textarea
                  placeholder={"Cole aqui as informações do anúncio...\n\nEx: Apartamento 2 quartos, 65m², Vila Mariana - SP\nPreço: R$ 680.000\nCondomínio: R$ 850\nIPTU: R$ 3.200/ano\n2 vagas de garagem..."}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="min-h-[160px] resize-none border-0 bg-transparent text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => onAnalyzeText(pastedText)}
                    disabled={isAnalyzing || !pastedText.trim()}
                    size="lg"
                    className="h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        Analisar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Example links - only show in URL mode */}
          {mode === "url" && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Tente com:</span>
              {["OLX", "ZAP Imóveis", "QuintoAndar", "ImovelWeb"].map((site) => (
                <button
                  key={site}
                  className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-emerald-500/40 hover:text-emerald-600"
                  onClick={() =>
                    setUrl(`https://www.${site.toLowerCase().replace(" ", "")}.com.br/imovel/exemplo`)
                  }
                >
                  {site}
                </button>
              ))}
            </div>
          )}

          {mode === "text" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Copie todas as informações do anúncio (preço, área, localização, descrição) e cole acima.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
