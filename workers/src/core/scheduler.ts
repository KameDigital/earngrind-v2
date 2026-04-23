import "dotenv/config";
import { logger } from "./logger";
import { runImportJob } from "../jobs/runImport";

const HOURS_TO_MS = 60 * 60 * 1000;

async function start(): Promise<void> {
    const intervalHours = Number(process.env.INGEST_INTERVAL_HOURS ?? "12");
    const sourceKey = process.env.INGEST_SOURCE ?? "gain-gg";
    const intervalMs = intervalHours * HOURS_TO_MS;

    const run = async () => {
        try {
            await runImportJob(sourceKey);
        } catch (error) {
            logger.error("Scheduled import failed", {
                sourceKey,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };

    logger.info("Starting scheduler", { sourceKey, intervalHours });
    await run();
    setInterval(run, intervalMs);
}

start().catch((error) => {
    logger.error("Scheduler crashed", {
        error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
});
