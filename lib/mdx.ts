import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

export interface MdxFrontmatter {
  title?: string;
  date?: string;
}

export function getHikeDir(): string {
  const cwd = process.env.HIKE_CWD || process.cwd();
  return path.join(cwd, ".hike");
}

export function findMdxFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findMdxFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or isn't readable
  }
  return files;
}

export function getSlugFromPath(hikeDir: string, filePath: string): string[] {
  const relative = path.relative(hikeDir, filePath);
  const withoutExt = relative.replace(/\.mdx$/, "");
  return withoutExt.split(path.sep);
}

export function getPathFromSlug(hikeDir: string, slug: string[]): string {
  return path.join(hikeDir, ...slug) + ".mdx";
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export function getFrontmatter(filePath: string): MdxFrontmatter {
  try {
    const source = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(source);
    return data as MdxFrontmatter;
  } catch {
    return {};
  }
}

export async function compileMdx(source: string) {
  const { content, data } = matter(source);
  const compiled = await compile(content, { outputFormat: "function-body" });
  const { default: Content } = await run(String(compiled), {
    ...(runtime as any),
    baseUrl: import.meta.url,
  });
  return { Content, frontmatter: data as MdxFrontmatter };
}

export interface PostInfo {
  file: string;
  slug: string[];
  title?: string;
  date?: string;
}

export function getSortedPosts(): PostInfo[] {
  const hikeDir = getHikeDir();
  const mdxFiles = findMdxFiles(hikeDir);

  const posts = mdxFiles.map((file) => {
    const slug = getSlugFromPath(hikeDir, file);
    const frontmatter = getFrontmatter(file);
    return { file, slug, ...frontmatter };
  });

  posts.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return posts;
}
