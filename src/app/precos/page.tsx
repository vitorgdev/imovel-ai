"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "R$0",
    period: "",
    analyses: "3 análises/mês",
    features: [
      "3 análises por mês",
      "Score de 0 a 100",
      "Prós e contras",
      "Análise de preço/m²",
    ],
    popular: false,
  },
  {
    key: "basic",
    name: "Basic",
    price: "R$19,90",
    period: "/mês",
    analyses: "20 análises/mês",
    features: [
      "20 análises por mês",
      "Score de 0 a 100",
      "Prós e contras",
      "Análise de preço/m²",
      "Histórico completo",
      "Extensão do navegador",
    ],
    popular: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: "R$49,90",
    period: "/mês",
    analyses: "100 análises/mês",
    features: [
      "100 análises por mês",
      "Score de 0 a 100",
      "Prós e contras",
      "Análise de preço/m²",
      "Histórico completo",
      "Extensão do navegador",
      "Suporte prioritário",
    ],
    popular: true,
  },
];

export default function PrecosPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch("/api/usage")
        .then((r) => r.json())
        .then((data) => setCurrentPlan(data.plan))
        .catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  const handleSubscribe = async (plan: string) => {
    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    if (plan === currentPlan || plan === "free") return;

    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonLabel = (planKey: string) => {
    if (loadingPlan === planKey) return "Redirecionando...";
    if (currentPlan === planKey) return "Plano atual";
    if (planKey === "free") return "Plano gratuito";
    return `Assinar ${planKey === "basic" ? "Basic" : "Pro"}`;
  };

  const isButtonDisabled = (planKey: string) => {
    return currentPlan === planKey || planKey === "free" || loadingPlan === planKey;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto max-w-5xl flex-1 px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Planos e preços
          </h1>
          <p className="text-muted-foreground">
            Escolha o plano ideal para suas análises de imóveis.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border bg-card p-6 ${
                plan.popular
                  ? "border-emerald-300 shadow-lg shadow-emerald-100"
                  : currentPlan === plan.key
                    ? "border-emerald-500 ring-2 ring-emerald-200"
                    : "border-border"
              }`}
            >
              {plan.popular && currentPlan !== plan.key && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Mais popular
                </span>
              )}
              {currentPlan === plan.key && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Seu plano
                </span>
              )}

              <div className="mb-6">
                <h2 className="mb-1 text-lg font-semibold text-foreground">
                  {plan.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {plan.analyses}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={isButtonDisabled(plan.key)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  currentPlan === plan.key
                    ? "border border-emerald-500 bg-emerald-50 text-emerald-700"
                    : plan.popular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : plan.key === "free"
                        ? "border border-border bg-gray-50 text-muted-foreground"
                        : "border border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {getButtonLabel(plan.key)}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
