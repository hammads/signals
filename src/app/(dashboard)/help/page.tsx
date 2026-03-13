import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Radio,
  FileStack,
  UserCircle,
  Wrench,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  USER_HELP_ARTICLES,
  USER_HELP_CATEGORIES,
  getUserArticlesByCategory,
} from "@/lib/user-help-content";
import type { UserHelpCategory } from "@/lib/user-help-content";

const CATEGORY_ICONS: Record<
  UserHelpCategory,
  React.ComponentType<{ className?: string }>
> = {
  "getting-started": HelpCircle,
  dashboard: Radio,
  profile: UserCircle,
  digests: FileStack,
  troubleshooting: Wrench,
  reference: FileText,
};

export default function HelpPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="size-6" />
          Help
        </h1>
        <p className="text-muted-foreground mt-1">
          Guides and how-tos for using AI Signals Radar
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
            {["overview", "signal-feed", "profile-update-matching", "no-matches"].map(
              (slug) => {
                const article = USER_HELP_ARTICLES.find((a) => a.slug === slug);
                if (!article) return null;
                return (
                  <Link
                    key={slug}
                    href={`/help/${slug}`}
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
              {USER_HELP_CATEGORIES.map(([category, label]) => {
                const articles = getUserArticlesByCategory(category);
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
                            href={`/help/${article.slug}`}
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
            {USER_HELP_ARTICLES.length} articles available
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USER_HELP_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/help/${article.slug}`}
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
