import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-white to-secondary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
          >
            <span className="text-primary">Pivot</span>
            <span>2Flow</span>
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <Link href="#services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Services
            </Link>
            <Link href="#signals-radar" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Signals Radar
            </Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              About
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
