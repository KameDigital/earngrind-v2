import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export function canonicalAlternates(path: string): Metadata["alternates"] {
  return {
    canonical: absoluteUrl(path),
  };
}

export function indexFollowRobots(): Metadata["robots"] {
  return {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  };
}

export function noindexFollowRobots(): Metadata["robots"] {
  return {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  };
}

export function robotsForIndexability(indexable: boolean): Metadata["robots"] {
  return indexable ? indexFollowRobots() : noindexFollowRobots();
}
