import fs from "node:fs";
import Link from "next/link";
import { getHikeDir, getPathFromSlug, compileMdx, formatDate } from "@/lib/mdx";

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
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/" className="text-blue-400 hover:underline text-sm">
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold mt-4">
        {frontmatter.title || slug.join("/")}
      </h1>
      {frontmatter.date && (
        <p className="text-muted-foreground text-sm mt-1">
          {formatDate(frontmatter.date)}
        </p>
      )}
      <article className="prose dark:prose-invert mt-6">
        <Content />
      </article>
    </main>
  );
}
