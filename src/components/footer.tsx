import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>acheilar</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Dados para referência. Consulte um especialista antes de comprar.
        </p>
      </div>
    </footer>
  );
}
