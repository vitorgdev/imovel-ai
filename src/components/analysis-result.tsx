"use client";

import type { AnalysisData } from "@/app/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  MapPin,
  Ruler,
  DollarSign,
  Loader2,
} from "lucide-react";

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const colorMap: Record<string, string> = {
    otimo: "text-emerald-600 stroke-emerald-500",
    bom: "text-emerald-600 stroke-emerald-500",
    neutro: "text-amber-500 stroke-amber-500",
    caro: "text-orange-500 stroke-orange-500",
    muito_caro: "text-red-500 stroke-red-500",
  };

  const colors = colorMap[verdict] || colorMap.neutro;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-1000 ease-out ${colors}`}
        />
      </svg>
      <div className="text-center">
        <span className={`text-3xl font-bold ${colors.split(" ")[0]}`}>{score}</span>
        <span className="block text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function LoadingSkeleton({ steps }: { steps: string[] }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <div className="text-center">
          <p className="text-lg font-medium">Analisando o imóvel...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {steps.length > 0 ? steps[steps.length - 1] : "Conectando ao servidor..."}
          </p>
        </div>
        <div className="mt-6 w-full max-w-md space-y-3">
          {steps.map((step, i) => (
            <div
              key={`${step}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {step}
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Aguardando...</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: "good" | "neutral" | "bad" }) {
  const styles = {
    good: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
    neutral: "border-amber-500/30 bg-amber-50 text-amber-700",
    bad: "border-red-500/30 bg-red-50 text-red-700",
  };
  return styles[status];
}

export function AnalysisResult({
  data,
  isLoading,
  steps = [],
}: {
  data: AnalysisData | null;
  isLoading: boolean;
  steps?: string[];
}) {
  if (isLoading) return <LoadingSkeleton steps={steps} />;
  if (!data) return null;

  const verdictStyles: Record<string, string> = {
    otimo: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
    bom: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
    neutro: "border-amber-500/30 bg-amber-50 text-amber-700",
    caro: "border-orange-500/30 bg-orange-50 text-orange-700",
    muito_caro: "border-red-500/30 bg-red-50 text-red-700",
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      {/* Top summary */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col items-center gap-8 p-8 md:flex-row">
            {/* Score */}
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={data.score} verdict={data.verdict} />
              <Badge
                variant="outline"
                className={`text-sm font-semibold ${verdictStyles[data.verdict]}`}
              >
                {data.verdictLabel}
              </Badge>
            </div>

            <Separator orientation="vertical" className="hidden h-32 md:block" />

            {/* Property info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{data.title}</h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {data.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ruler className="h-4 w-4" /> {data.area}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="text-2xl font-bold text-foreground">{data.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preço/m²</p>
                  <p className="text-xl font-semibold text-foreground">{data.pricePerM2}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média da região</p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {data.avgPricePerM2}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {data.highlights.map((item) => (
          <Card
            key={item.label}
            className="border-border bg-card shadow-sm transition-colors hover:border-emerald-500/30"
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-sm font-semibold`}>
                <Badge variant="outline" className={`font-medium ${StatusBadge({ status: item.status })}`}>
                  {item.value}
                </Badge>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analysis + Pros/Cons */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* AI Analysis */}
        <Card className="border-border bg-card shadow-sm md:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold">Análise da IA</h3>
            </div>
            <p className="leading-relaxed text-muted-foreground">{data.analysis}</p>
          </CardContent>
        </Card>

        {/* Pros and Cons */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold">Pontos positivos</h3>
                </div>
                <ul className="space-y-2">
                  {data.pros.map((pro) => (
                    <li key={pro} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold">Pontos de atenção</h3>
                </div>
                <ul className="space-y-2">
                  {data.cons.map((con) => (
                    <li key={con} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
