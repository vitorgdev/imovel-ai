import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-1">
          <Image
            src="/logo.png"
            alt="acheilar"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
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
