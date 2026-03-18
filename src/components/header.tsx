import { Building2 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            vale a pena<span className="text-emerald-500">?</span>
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Preços
          </a>
        </nav>
      </div>
    </header>
  );
}
