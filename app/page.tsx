import Link from "next/link";
import { getSortedPosts, formatDate } from "@/lib/mdx";

export default function Home() {
  const posts = getSortedPosts();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold mb-6">Hike</h1>
      <ul className="space-y-4">
        {posts.map(({ file, slug, title, date }) => {
          const href = "/" + slug.join("/");
          return (
            <li key={file}>
              <Link href={href} className="group block">
                <span className="text-foreground group-hover:text-blue-400">
                  {title || slug.join("/")}
                </span>
                {date && (
                  <span className="text-muted-foreground text-sm ml-3">
                    {formatDate(date)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
