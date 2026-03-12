import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getUserArticleBySlug,
  getUserCategoryLabel,
  getUserArticlesByCategory,
} from "@/lib/user-help-content";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function HelpArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getUserArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getUserArticlesByCategory(article.category).filter(
    (a) => a.slug !== article.slug
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/help" className="gap-1">
            <ChevronLeft className="size-4" />
            Back to Help
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {getUserCategoryLabel(article.category)}
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                {article.title}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                {article.description}
              </p>
            </div>
            <BookOpen className="size-8 text-muted-foreground/50 shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-6 prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-4 prose-li:my-1 prose-table:my-4 prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-pre:rounded-lg prose-pre:border prose-pre:bg-muted prose-pre:text-sm prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content.trim()}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>

      {relatedArticles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-sm font-semibold">Related Articles</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {relatedArticles.slice(0, 4).map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/help/${a.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
