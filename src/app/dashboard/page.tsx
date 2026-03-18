"use client";

import { Suspense, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface Usage {
  plan: string;
  planName: string;
  used: number;
  limit: number;
  remaining: number;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const showSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
      return;
    }
    if (isSignedIn) {
      fetch("/api/usage")
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isSignedIn, isLoaded, router]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    } finally {
      setPortalLoading(false);
    }
  };

  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;
  const barColor =
    usagePercent >= 90
      ? "bg-red-500"
      : usagePercent >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Acompanhe seu uso e gerencie seu plano.
        </p>

        {showSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Assinatura ativada com sucesso! Seu plano já está atualizado.
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          </div>
        ) : usage ? (
          <div className="space-y-6">
            {/* Usage card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Uso mensal
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Análises realizadas este mês
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    usage.plan === "pro"
                      ? "bg-emerald-100 text-emerald-700"
                      : usage.plan === "basic"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {usage.planName}
                </span>
              </div>

              <div className="mb-2 flex items-end justify-between">
                <span className="text-3xl font-bold text-foreground">
                  {usage.used}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{usage.limit}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {usage.remaining} restantes
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Plan actions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-1 text-lg font-semibold text-foreground">
                Plano {usage.planName}
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {usage.plan === "free"
                  ? "Faça upgrade para analisar mais imóveis por mês."
                  : "Gerencie sua assinatura ou altere o plano."}
              </p>

              <div className="flex gap-3">
                {usage.plan === "free" ? (
                  <Link
                    href="/precos"
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    Ver planos
                  </Link>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    {portalLoading ? "Abrindo..." : "Gerenciar assinatura"}
                  </button>
                )}
                <Link
                  href="/historico"
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-50"
                >
                  Ver histórico
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
