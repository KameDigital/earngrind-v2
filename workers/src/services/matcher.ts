import { GameRecord } from "../models/offer";
import { inferGameSlug, titleToAliases, toSlug } from "./normalize";

export function findMatchingGame(rawTitle: string, games: GameRecord[]): GameRecord | null {
    const inferredSlug = inferGameSlug(rawTitle);
    if (inferredSlug) {
        const slugMatch = games.find((game) => game.slug === inferredSlug);
        if (slugMatch) return slugMatch;
    }

    const candidates = new Set(titleToAliases(rawTitle));
    const slugCandidate = toSlug(rawTitle);
    if (slugCandidate) candidates.add(slugCandidate);

    for (const game of games) {
        if (candidates.has(game.slug)) return game;

        const names = [game.name, ...(game.aliases ?? [])]
            .map((value) => value?.toLowerCase().trim())
            .filter((value): value is string => Boolean(value));

        for (const name of names) {
            if (candidates.has(name) || candidates.has(toSlug(name))) {
                return game;
            }
        }
    }

    return null;
}
