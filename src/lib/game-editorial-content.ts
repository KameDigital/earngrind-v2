import "server-only";

import { readFile } from "fs/promises";
import path from "path";

export type GameEditorialContent = {
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  slug: string;
  canonical?: string;
  description?: string;
  primaryKeyword?: string;
  secondaryKeywords: string[];
  image?: string;
  imageAlt?: string;
  schemaType?: string;
  dateModified?: string;
  draft: boolean;
  html: string;
};

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "games");

export async function getGameEditorialContent(slug: string): Promise<GameEditorialContent | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  try {
    const source = await readFile(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
    const parsed = parseGameEditorialMarkdown(source);
    if (parsed.draft || parsed.slug !== slug) return null;
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function parseGameEditorialMarkdown(source: string): GameEditorialContent {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("Game editorial markdown is missing front matter.");

  const frontMatter = parseFrontMatter(match[1]);
  const title = asRequiredString(frontMatter.title, "title");
  const slug = asRequiredString(frontMatter.slug, "slug");

  return {
    title,
    seoTitle: asOptionalString(frontMatter.seoTitle),
    metaDescription: asOptionalString(frontMatter.metaDescription),
    slug,
    canonical: asOptionalString(frontMatter.canonical),
    description: asOptionalString(frontMatter.description),
    primaryKeyword: asOptionalString(frontMatter.primaryKeyword),
    secondaryKeywords: Array.isArray(frontMatter.secondaryKeywords)
      ? frontMatter.secondaryKeywords.filter((value): value is string => typeof value === "string")
      : [],
    image: asOptionalString(frontMatter.image),
    imageAlt: asOptionalString(frontMatter.imageAlt),
    schemaType: asOptionalString(frontMatter.schemaType),
    dateModified: asOptionalString(frontMatter.dateModified),
    draft: frontMatter.draft === true,
    html: match[2].trim(),
  };
}

function parseFrontMatter(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;

    const listMatch = line.match(/^([A-Za-z0-9_]+):\s*$/);
    if (listMatch) {
      const values: string[] = [];
      while (index + 1 < lines.length && /^\s+-\s+/.test(lines[index + 1])) {
        index += 1;
        values.push(unquote(lines[index].replace(/^\s+-\s+/, "")));
      }
      result[listMatch[1]] = values;
      continue;
    }

    const pairMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pairMatch) continue;

    const rawValue = pairMatch[2].trim();
    result[pairMatch[1]] = rawValue === "true" ? true : rawValue === "false" ? false : unquote(rawValue);
  }

  return result;
}

function unquote(value: string): string {
  return value.replace(/^"(.*)"$/, "$1");
}

function asRequiredString(value: unknown, key: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`Game editorial front matter is missing ${key}.`);
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
