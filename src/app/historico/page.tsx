"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface Analysis {
  _id: string;
  title: string;
  price: string;
  location: string;
  score: number;
  verdict: string;
  verdictLabel: string;
  url: string | null;
  createdAt: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 65
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : score >= 35
          ? "bg-orange-50 text-orange-700 border-orange-200"
          : "bg-red-50 text-red-700 border-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-bold ${color}`}
    >
      {score}
    </span>
  );
}

export default function HistoricoPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
      return;
    }

    if (isSignedIn) {
      fetch("/api/history")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setAnalyses(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Histórico de análises
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Todas as análises que você já realizou.
        </p>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        )}

        {!loading && analyses.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="mb-1 text-lg font-medium text-foreground">
              Nenhuma análise ainda
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Analise seu primeiro imóvel e ele aparecerá aqui.
            </p>
            <a
              href="/"
              className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Analisar imóvel
            </a>
          </div>
        )}

        {!loading && analyses.length > 0 && (
          <div className="space-y-3">
            {analyses.map((a) => (
              <div
                key={a._id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <ScoreBadge score={a.score} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {a.title || "Imóvel sem título"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {a.price && <span>{a.price}</span>}
                    {a.location && <span>{a.location}</span>}
                    <span>
                      {new Date(a.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    a.score >= 65
                      ? "bg-emerald-50 text-emerald-700"
                      : a.score >= 50
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {a.verdictLabel}
                </span>
                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-emerald-600 hover:underline"
                  >
                    Ver anúncio
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
