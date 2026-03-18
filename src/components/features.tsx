import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Brain,
  MapPin,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Análise com IA",
    description: "Inteligência artificial analisa dezenas de variáveis para te dar um veredito claro.",
  },
  {
    icon: BarChart3,
    title: "Preço justo",
    description: "Comparamos o preço/m² com a média da região para saber se está caro ou barato.",
  },
  {
    icon: TrendingUp,
    title: "Potencial de valorização",
    description: "Análise de tendência de preços na região nos últimos 12 meses.",
  },
  {
    icon: MapPin,
    title: "Score de localização",
    description: "Avaliação de infraestrutura, transporte, comércio e serviços próximos.",
  },
  {
    icon: Shield,
    title: "Detecção de red flags",
    description: "Identificamos sinais de alerta como preços muito abaixo do mercado.",
  },
  {
    icon: Zap,
    title: "Análise em segundos",
    description: "Cole o link e receba a análise completa em menos de 30 segundos.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Tudo que você precisa para decidir
        </h2>
        <p className="mt-3 text-muted-foreground">
          Dados e inteligência para tomar a melhor decisão na compra do seu imóvel.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <CardContent className="p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500/20">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
