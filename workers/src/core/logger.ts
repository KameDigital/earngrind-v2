export const logger = {
    info(message: string, meta?: Record<string, unknown>) {
        console.log(format("INFO", message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
        console.warn(format("WARN", message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
        console.error(format("ERROR", message, meta));
    },
};

function format(level: string, message: string, meta?: Record<string, unknown>): string {
    const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${level}] ${message}${suffix}`;
}
