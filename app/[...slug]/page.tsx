import fs from "node:fs";
import Link from "next/link";
import {
  getHikeDir,
  getPathFromSlug,
  compileMdx,
  formatDate,
  getFrontmatter,
  getProjectName,
} from "@/lib/mdx";
import { addDocsKit } from "@/components/docskit";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const hikeDir = getHikeDir();
  const filePath = getPathFromSlug(hikeDir, slug);
  const frontmatter = getFrontmatter(filePath);
  return { title: frontmatter.title || slug.join("/") };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const hikeDir = getHikeDir();
  const filePath = getPathFromSlug(hikeDir, slug);
  const source = fs.readFileSync(filePath, "utf-8");
  const { Content, frontmatter } = await compileMdx(source);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-4"
        >
          &larr; {getProjectName()}
        </Link>
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-8 py-8 sm:px-12 sm:py-10">
          <h1 className="text-2xl font-bold text-neutral-900">
            {frontmatter.title || slug.join("/")}
          </h1>
          {frontmatter.date && (
            <p className="text-neutral-400 text-sm mt-1">
              {formatDate(frontmatter.date)}
            </p>
          )}
          <article className="prose dark:prose-invert mt-6">
            <Content components={addDocsKit({})} />
          </article>
        </div>
      </div>
    </main>
  );
}
