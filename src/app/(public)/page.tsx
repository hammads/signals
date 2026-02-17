import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Eye, Settings, ScanSearch, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Know Who&apos;s Ready to Buy{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Before You Reach Out
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            AI Signals Radar continuously scans public K-12 data sources for
            funding, priority, and timing signals—so you can identify districts
            ready to buy and reach them at the right moment.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/signup">
                Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-200/80 bg-white/50 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Intelligence That Moves the Needle
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Three pillars of market intelligence, powered by AI
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <DollarSign className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Funding Signals
                </h3>
                <p className="mt-2 text-slate-600">
                  Track ESSER, Title I, and district budget cycles. Know when
                  funding is allocated and when districts are actively seeking
                  solutions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FileText className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  RFP & Board Activity
                </h3>
                <p className="mt-2 text-slate-600">
                  Monitor board meetings, RFPs, and procurement timelines. Catch
                  opportunities before your competitors even see them.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Eye className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Competitor Intel
                </h3>
                <p className="mt-2 text-slate-600">
                  See which districts are evaluating similar solutions. Understand
                  competitive landscapes and position your pitch accordingly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-200/80 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            From setup to insights in three simple steps
          </p>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <Settings className="size-7" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-indigo-600">Step 1</span>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Configure Profile
                </h3>
                <p className="mt-2 text-slate-600">
                  Tell us your focus areas, target segments, and key signals you
                  care about.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                <ScanSearch className="size-7" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-blue-600">Step 2</span>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Signals Scan
                </h3>
                <p className="mt-2 text-slate-600">
                  Our AI continuously scans public sources and surfaces relevant
                  signals in real time.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                <Sparkles className="size-7" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-violet-600">Step 3</span>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Get Insights
                </h3>
                <p className="mt-2 text-slate-600">
                  Receive actionable insights and alerts so you can reach the
                  right buyers at the right time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-200/80 bg-gradient-to-br from-indigo-600 to-blue-700 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to See Who&apos;s Ready to Buy?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join founders who use AI Signals Radar to win more deals in the K-12
            market.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-8 h-12 bg-white px-8 text-base font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
