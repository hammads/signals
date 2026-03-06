import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Eye, Settings, ScanSearch, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--color-primary),transparent)] opacity-[0.08]" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            Know Who&apos;s Ready to Buy{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Before You Reach Out
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            The intelligent market platform for EdTech leaders. We scan public district data for
            funding, priority, and timing signals—identifying the districts
            ready to buy so you can reach them at the right moment.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="h-14 px-10 text-base shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
              <Link href="/signup">
                Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-10 text-base border-primary/20 hover:bg-primary/5 transition-colors">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <div className="mt-16 flex justify-center">
            <Image
              src="/illustrations/hero-radar.png"
              alt="AI Signals Radar - Market intelligence dashboard"
              width={640}
              height={400}
              className="max-w-2xl w-full h-auto opacity-90"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-white/40 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Intelligence That Moves the Needle
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-muted-foreground text-lg">
            Strategic market intelligence designed specifically for K-12 sales and marketing teams.
          </p>
          <div className="mx-auto mt-12 max-w-3xl">
            <Image
              src="/illustrations/features-intel.png"
              alt="Funding signals, RFP activity, and competitor intelligence"
              width={800}
              height={400}
              className="w-full h-auto rounded-xl"
            />
          </div>
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <CardContent className="pt-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <DollarSign className="size-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Funding Signals
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Track ESSER, Title I, and district budget cycles. Know when
                  funding is allocated and when districts are actively seeking
                  solutions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <CardContent className="pt-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-foreground">
                  <FileText className="size-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  RFP & Board Activity
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Monitor board meetings, RFPs, and procurement timelines. Catch
                  opportunities before your competitors even see them.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <CardContent className="pt-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
                  <Eye className="size-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Competitor Intel
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  See which districts are evaluating similar solutions. Understand
                  competitive landscapes and position your pitch accordingly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            From setup to insights in three simple steps
          </p>
          <div className="mx-auto mt-12 max-w-2xl">
            <Image
              src="/illustrations/how-it-works-flow.png"
              alt="Configure, scan, and get insights"
              width={600}
              height={300}
              className="w-full h-auto rounded-xl"
            />
          </div>
          <div className="mt-20 grid gap-12 sm:grid-cols-3">
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20">
                <Settings className="size-8" />
              </div>
              <div className="mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Step 1</span>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  Configure Profile
                </h3>
                <p className="mt-3 text-muted-foreground">
                  Tell us your focus areas, target segments, and key signals you
                  care about.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/20">
                <ScanSearch className="size-8" />
              </div>
              <div className="mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/70">Step 2</span>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  Signals Scan
                </h3>
                <p className="mt-3 text-muted-foreground">
                  Our AI continuously scans public sources and surfaces relevant
                  signals in real time.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-secondary/80 text-white shadow-lg shadow-primary/20">
                <Sparkles className="size-8" />
              </div>
              <div className="mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Step 3</span>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  Get Insights
                </h3>
                <p className="mt-3 text-muted-foreground">
                  Receive actionable insights and alerts so you can reach the
                  right buyers at the right time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-gradient-to-br from-primary to-secondary px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl leading-tight">
            Ready to See Who&apos;s Ready to Buy?
          </h2>
          <p className="mt-6 text-xl text-white/90 leading-relaxed font-medium">
            Join forward-thinking founders who use AI Signals Radar to win more deals in the K-12
            market.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-10 h-16 bg-white px-12 text-lg font-bold text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-xl shadow-black/10"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
