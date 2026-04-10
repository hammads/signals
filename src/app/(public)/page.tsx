import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  DollarSign,
  Eye,
  FileText,
  Lightbulb,
  MapPin,
  MessageSquare,
  ScanSearch,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const SERVICES = [
  {
    icon: Target,
    title: "Go-to-Market Strategy",
    description:
      "Define your ideal customer profile, map the buying process, and build a step-by-step plan to break into—or expand within—the K-12 market.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Messaging & Positioning",
    description:
      "Craft messaging that speaks directly to district decision-makers. Translate your solution's value into language that resonates with administrators, curriculum leads, and board members.",
    color: "bg-secondary/20 text-secondary-foreground",
  },
  {
    icon: BarChart3,
    title: "Competitive Intelligence",
    description:
      "Know what your competitors are doing before it impacts your pipeline. Track contracts, partnerships, and market moves across the district landscape.",
    color: "bg-accent/30 text-accent-foreground",
  },
  {
    icon: Users,
    title: "Sales Enablement",
    description:
      "Equip your team with the playbooks, talk tracks, and district-specific research they need to close deals faster and reduce sales cycles.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: TrendingUp,
    title: "Content Strategy",
    description:
      "Build a content engine that earns trust in the K-12 space—thought leadership, case studies, and data-driven narratives that drive inbound and support outbound.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Building2,
    title: "District Targeting",
    description:
      "Identify your best-fit districts using look-alike modeling, funding signals, and board activity data—so your team reaches out with precision, not guesswork.",
    color: "bg-rose-100 text-rose-700",
  },
];

const SIGNALS_FEATURES = [
  {
    icon: DollarSign,
    title: "Funding Signals",
    description:
      "Track ESSER, Title I, and state grants in real time. Know when districts have budget and what they're prioritizing.",
  },
  {
    icon: FileText,
    title: "RFP & Procurement",
    description:
      "Surface active RFPs, vendor contract renewals, and board-approved technology budgets before your competitors see them.",
  },
  {
    icon: Eye,
    title: "Board Activity",
    description:
      "Monitor board meeting minutes and strategic plans. Catch buying intent signals the moment they appear in public records.",
  },
  {
    icon: MapPin,
    title: "District-Level Matching",
    description:
      "Every signal is resolved to a specific NCES district. See exactly which districts are generating buying signals—not just regions.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--color-primary),transparent)] opacity-[0.08]" />
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary">
            K-12 Marketing Strategy Consulting
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            Win More Deals in{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              K-12 Education
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Strategic marketing consulting for EdTech companies—backed by AI-powered market
            intelligence that tracks the funding, procurement, and board activity signals that
            matter most.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-14 px-10 text-base shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
            >
              <Link href="mailto:margot@pivot2flow.com">
                Work With Me
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-14 px-10 text-base border-primary/20 hover:bg-primary/5 transition-colors"
            >
              <Link href="/signup">Try Signals Radar Free</Link>
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

      {/* ------------------------------------------------------------------ */}
      {/* About / Positioning                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section id="about" className="border-t border-border bg-white/60 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-secondary/40 bg-secondary/10">
                About Pivot2Flow
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                K-12 Market Expertise, Built Into Every Engagement
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                I&apos;m Margot Toppen—an independent marketing strategist who has spent years
                helping EdTech companies navigate the complex, slow-moving K-12 purchasing
                landscape. I know what works (and what doesn&apos;t) when it comes to reaching
                district administrators, winning RFPs, and building durable pipeline.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                To give my clients an edge, I built{" "}
                <span className="font-semibold text-foreground">AI Signals Radar</span>—a
                proprietary intelligence tool that monitors public district data, grants, RFPs,
                and board activity in real time. Every engagement combines strategic consulting
                expertise with live market data.
              </p>
              <div className="mt-8">
                <Button asChild>
                  <Link href="mailto:margot@pivot2flow.com">
                    Get in Touch
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: Lightbulb, text: "10+ years in K-12 EdTech marketing" },
                { icon: Target, text: "Specializes in go-to-market for early-stage and growth-stage companies" },
                { icon: BarChart3, text: "Backed by AI-powered district-level market intelligence" },
                { icon: BookOpen, text: "Deep relationships with district leaders across the US" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Services                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="services" className="border-t border-border px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
              Services
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Full-Stack K-12 Marketing Support
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg">
              Whether you need a complete go-to-market overhaul or targeted help with messaging,
              competitive positioning, or district targeting, I meet you where you are.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description, color }) => (
              <Card
                key={title}
                className="border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="pt-8">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                    <Icon className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="mailto:margot@pivot2flow.com">
                Discuss Your Project
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* AI Signals Radar Feature Section                                     */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="signals-radar"
        className="border-t border-border bg-white/40 px-4 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 border-secondary/40 bg-secondary/10">
              Proprietary Intelligence Tool
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              AI Signals Radar
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg">
              Know who&apos;s ready to buy before you reach out. An always-on intelligence layer
              that monitors public district data, grants, RFPs, board meetings, and competitor
              activity—matched to your exact solution profile.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <Image
              src="/illustrations/features-intel.png"
              alt="Funding signals, RFP activity, and competitor intelligence"
              width={800}
              height={400}
              className="w-full h-auto rounded-xl"
            />
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SIGNALS_FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 sm:p-10">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  Try It for Your Company
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Set up a free account, configure your signal profile (keywords, regions,
                  funding sources, target districts), and start seeing personalized market
                  intelligence in minutes.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Personalized signal feed matched to your profile",
                  "District-level matching using NCES LEA data",
                  "AI-generated insights: why it matters + suggested action",
                  "Weekly digest summaries in your inbox",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Sparkles className="size-3" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How It Works (Engagement)                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
              How We Work Together
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From Strategy to Signals to Sales
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              A structured engagement model that connects market intelligence to real revenue outcomes.
            </p>
          </div>
          <div className="mt-20 grid gap-12 sm:grid-cols-3">
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20">
                <Settings className="size-8" />
              </div>
              <div className="mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
                  Step 1
                </span>
                <h3 className="mt-2 text-xl font-bold text-foreground">Strategy & Alignment</h3>
                <p className="mt-3 text-muted-foreground">
                  We start with a deep-dive into your ICP, competitive landscape, and current
                  go-to-market approach. Together we define what winning looks like.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/20">
                <ScanSearch className="size-8" />
              </div>
              <div className="mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/70">
                  Step 2
                </span>
                <h3 className="mt-2 text-xl font-bold text-foreground">Intelligence Layer</h3>
                <p className="mt-3 text-muted-foreground">
                  Your custom Signals Radar profile monitors grants, RFPs, board activity, and
                  competitor moves—surfacing the districts and moments that matter most to your
                  pipeline.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-secondary/80 text-white shadow-lg shadow-primary/20">
                <Sparkles className="size-8" />
              </div>
              <div className="mt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
                  Step 3
                </span>
                <h3 className="mt-2 text-xl font-bold text-foreground">Activate & Iterate</h3>
                <p className="mt-3 text-muted-foreground">
                  Translate signals into action—personalized outreach, timely content, and
                  sales plays that reach the right districts at exactly the right moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border bg-gradient-to-br from-primary to-secondary px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl leading-tight">
            Ready to Grow Your K-12 Pipeline?
          </h2>
          <p className="mt-6 text-xl text-white/90 leading-relaxed font-medium">
            Whether you need strategic consulting, intelligence tooling, or both—let&apos;s
            figure out the right fit for where you are right now.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-16 bg-white px-12 text-lg font-bold text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-xl shadow-black/10"
            >
              <Link href="mailto:margot@pivot2flow.com">Work With Me</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-16 border-white/40 bg-transparent px-12 text-lg font-bold text-white hover:bg-white/10 hover:scale-105 transition-all"
            >
              <Link href="/signup">Try Signals Radar Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
