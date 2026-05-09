import "server-only";

export type EarnLabActivityType = "TASK_CONVERSION" | "WITHDRAWAL" | "UNKNOWN";

export type EarnLabActivity = {
    id: string;
    type: EarnLabActivityType;
    title: string;
    subTitle?: string;
    provider?: string;
    username: string;
    avatarUrl?: string | null;
    amountCents?: number;
    amountUsd?: number;
};

type EarnLabActivityUserResponse = {
    username?: string | null;
    avatar?: string | null;
    xp?: number | null;
};

type EarnLabActivityResponse = {
    id?: string | null;
    type?: string | null;
    title?: string | null;
    subTitle?: string | null;
    amount?: number | string | null;
    user?: EarnLabActivityUserResponse | null;
};

type EarnLabActivitiesPayload = EarnLabActivityResponse[] | {
    success?: boolean;
    data?: EarnLabActivityResponse[] | null;
};

const EARNLAB_ACTIVITIES_URL = "https://api.earnlab.com/activities";
const EARNLAB_ACTIVITIES_REVALIDATE_SECONDS = 60 * 60;
const EARNLAB_ACTIVITIES_TIMEOUT_MS = 8000;

function normalizeActivityType(value: string | null | undefined): EarnLabActivityType {
    if (value === "TASK_CONVERSION" || value === "WITHDRAWAL") {
        return value;
    }

    return "UNKNOWN";
}

function parseAmountCents(value: number | string | null | undefined): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.round(value);
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return Math.round(parsed);
        }
    }

    return undefined;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function normalizeEarnLabActivity(item: EarnLabActivityResponse, index: number): EarnLabActivity | null {
    const type = normalizeActivityType(item.type);
    const amountCents = parseAmountCents(item.amount);
    const rawTitle = isNonEmptyString(item.title) ? item.title.trim() : "";
    const rawSubTitle = isNonEmptyString(item.subTitle) ? item.subTitle.trim() : undefined;
    const username = isNonEmptyString(item.user?.username) ? item.user.username.trim() : "Anonymous";

    let title = rawTitle;
    if (!title) {
        if (type === "WITHDRAWAL") {
            title = "Withdrawal";
        } else if (type === "TASK_CONVERSION") {
            title = "Completed task";
        } else {
            title = "Recent activity";
        }
    }

    if (type === "WITHDRAWAL") {
        title = "Withdrawal";
    }

    return {
        id: isNonEmptyString(item.id) ? item.id.trim() : `earnlab-activity-${index}`,
        type,
        title,
        subTitle: rawSubTitle,
        provider: type === "TASK_CONVERSION" ? rawSubTitle : undefined,
        username,
        avatarUrl: isNonEmptyString(item.user?.avatar) ? item.user.avatar.trim() : null,
        amountCents,
        amountUsd: typeof amountCents === "number" ? amountCents / 100 : undefined,
    };
}

export async function getEarnLabActivities(): Promise<EarnLabActivity[]> {
    try {
        const response = await fetch(EARNLAB_ACTIVITIES_URL, {
            headers: {
                accept: "application/json, text/plain, */*",
                origin: "https://earnlab.com",
                referer: "https://earnlab.com/tasks",
            },
            next: {
                revalidate: EARNLAB_ACTIVITIES_REVALIDATE_SECONDS,
                tags: ["earnlab-activities"],
            },
            signal: AbortSignal.timeout(EARNLAB_ACTIVITIES_TIMEOUT_MS),
        });

        if (!response.ok) {
            console.error("[earnlab-activities] upstream failed", {
                status: response.status,
                statusText: response.statusText,
            });
            return [];
        }

        const payload = await response.json() as EarnLabActivitiesPayload;
        const rows = Array.isArray(payload) ? payload : payload.data;

        if (!Array.isArray(rows)) {
            console.error("[earnlab-activities] unexpected response shape");
            return [];
        }

        return rows
            .map((item, index) => normalizeEarnLabActivity(item as EarnLabActivityResponse, index))
            .filter((item): item is EarnLabActivity => item !== null);
    } catch (error) {
        console.error("[earnlab-activities] fetch failed", {
            message: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
