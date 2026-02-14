import Link from "next/link";
import { getSortedPosts, formatDate, formatTime } from "@/lib/mdx";
import type { PostInfo } from "@/lib/mdx";

export default function Home() {
  const posts = getSortedPosts();

  // Group posts by day
  const groups: { label: string; posts: PostInfo[] }[] = [];
  let currentLabel = "";

  for (const post of posts) {
    const label = post.date ? formatDate(post.date) : "";
    if (label !== currentLabel) {
      groups.push({ label, posts: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].posts.push(post);
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-16">
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-8 py-8 sm:px-10 sm:py-10">
          <div className="space-y-8">
            {groups.map(({ label, posts }, i) => (
              <section key={label || "undated"}>
                {label && (
                  <div className="flex items-baseline gap-4 mb-1">
                    <span className="w-[5.5rem] shrink-0" />
                    <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                      {label}
                    </h2>
                  </div>
                )}
                <ul>
                  {posts.map(({ file, slug, title, date }) => {
                    const href = "/" + slug.join("/");
                    const time = date ? formatTime(date) : null;
                    return (
                      <li key={file}>
                        <Link
                          href={href}
                          className="group flex items-baseline gap-4 py-2 -mx-3 px-3 transition-colors"
                        >
                          <span className="w-[5.5rem] shrink-0 text-right text-sm tabular-nums text-neutral-400 group-hover:text-neutral-600 transition-colors">
                            {time || ""}
                          </span>
                          <span className="text-neutral-700 group-hover:text-neutral-950 transition-colors">
                            {title || slug.join("/")}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
