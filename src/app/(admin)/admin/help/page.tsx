import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Database,
  Activity,
  Radio,
  Users,
  Wrench,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  getArticlesByCategory,
  getCategoryLabel,
} from "@/lib/admin-help-content";
import type { HelpCategory } from "@/lib/admin-help-content";

const CATEGORY_ICONS: Record<HelpCategory, React.ComponentType<{ className?: string }>> = {
  "getting-started": HelpCircle,
  "data-sources": Database,
  pipeline: Activity,
  signals: Radio,
  users: Users,
  troubleshooting: Wrench,
  reference: FileText,
};

export default function AdminHelpPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="size-6" />
          Admin Help
        </h1>
        <p className="text-muted-foreground mt-1">
          Articles and how-tos for managing the AI Signals Radar platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick links to popular articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Popular Articles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most commonly needed guides
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {["admin-overview", "add-rss-feed", "trigger-pipeline", "profile-update-matching"].map(
              (slug) => {
                const article = HELP_ARTICLES.find((a) => a.slug === slug);
                if (!article) return null;
                return (
                  <Link
                    key={slug}
                    href={`/admin/help/${slug}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <span className="font-medium text-sm">{article.title}</span>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              }
            )}
          </CardContent>
        </Card>

        {/* All articles by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Articles by Category</CardTitle>
            <p className="text-sm text-muted-foreground">
              Browse the full documentation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
              {HELP_CATEGORIES.map(([category, label]) => {
                const articles = getArticlesByCategory(category);
                if (articles.length === 0) return null;
                const Icon = CATEGORY_ICONS[category];
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                      <Icon className="size-4" />
                      {label}
                    </div>
                    <ul className="space-y-1 pl-6">
                      {articles.map((article) => (
                        <li key={article.slug}>
                          <Link
                            href={`/admin/help/${article.slug}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full article list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Article List</CardTitle>
          <p className="text-sm text-muted-foreground">
            {HELP_ARTICLES.length} articles available
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HELP_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/admin/help/${article.slug}`}
                className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm">{article.title}</span>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {article.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                  Read article
                  <ChevronRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
