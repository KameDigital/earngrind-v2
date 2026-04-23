import "dotenv/config";
import { logger } from "../core/logger";
import { runImportJob, SOURCES, type ImportJobResult } from "./runImport";

async function main(): Promise<void> {
    const sourceKeys = Object.keys(SOURCES);
    const successes: ImportJobResult[] = [];
    const failures: Array<{ sourceKey: string; sourceName: string; error: string }> = [];

    for (const sourceKey of sourceKeys) {
        const source = SOURCES[sourceKey];
        try {
            logger.info("Full refresh source start", {
                source: source.key,
                name: source.name,
            });
            const result = await runImportJob(sourceKey);
            successes.push(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            failures.push({
                sourceKey: source.key,
                sourceName: source.name,
                error: message,
            });
            logger.error("Full refresh source failed", {
                source: source.key,
                name: source.name,
                error: message,
            });
        }
    }

    const totals = successes.reduce(
        (acc, result) => {
            acc.found += result.stats.found;
            acc.normalized += result.stats.normalized;
            acc.matched += result.stats.matched;
            acc.created += result.stats.created;
            acc.updated += result.stats.updated;
            acc.inactivated += result.stats.inactivated;
            acc.skipped += result.stats.skipped;
            acc.failed += result.stats.failed;
            return acc;
        },
        {
            found: 0,
            normalized: 0,
            matched: 0,
            created: 0,
            updated: 0,
            inactivated: 0,
            skipped: 0,
            failed: 0,
        },
    );

    console.log("[FULL REFRESH SUMMARY]");
    console.log(JSON.stringify({
        successes: successes.map((result) => ({
            sourceKey: result.sourceKey,
            sourceName: result.sourceName,
            ...result.stats,
        })),
        failures,
        totals,
    }, null, 2));

    if (failures.length > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    logger.error("Full refresh crashed", {
        error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
});
