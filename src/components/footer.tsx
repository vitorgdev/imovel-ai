import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-1">
          <Image
            src="/logo.png"
            alt="acheilar"
            width={100}
            height={25}
            className="h-5 w-auto opacity-60"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Dados para referência. Consulte um especialista antes de comprar.
        </p>
      </div>
    </footer>
  );
}
