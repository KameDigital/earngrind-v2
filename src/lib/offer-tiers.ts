export interface OfferTierStep {
    id: string;
    sortOrder: number;
    title: string;
    rewardAmount: number;
    rewardDisplay: string;
    taskType: string;
    timeLimitText: string | null;
    notes: string | null;
}

export function generateStructuredTiers(
    gameTitle: string,
    totalPayout: number,
    description?: string | null
): OfferTierStep[] {
    const payout = Math.max(0.1, Number(totalPayout) || 0);

    if (payout >= 1000) {
        const t1 = 5.0;
        const t2 = 25.0;
        const t3 = 100.0;
        const t4 = 350.0;
        const t5 = 600.0;
        const t6 = Number((payout - (t1 + t2 + t3 + t4 + t5)).toFixed(2));
        return [
            {
                id: "tier-1",
                sortOrder: 1,
                title: `Install ${gameTitle} & Complete Tutorial`,
                rewardAmount: t1,
                rewardDisplay: `$${t1.toFixed(2)}`,
                taskType: "install",
                timeLimitText: "Day 1",
                notes: "Install from tracked link and finish initial onboarding.",
            },
            {
                id: "tier-2",
                sortOrder: 2,
                title: "Reach Level / Stage 20",
                rewardAmount: t2,
                rewardDisplay: `$${t2.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 5 days",
                notes: "Progress through early game stages.",
            },
            {
                id: "tier-3",
                sortOrder: 3,
                title: "Reach Level / Stage 50",
                rewardAmount: t3,
                rewardDisplay: `$${t3.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 10 days",
                notes: "Reach mid-game milestone.",
            },
            {
                id: "tier-4",
                sortOrder: 4,
                title: "Reach Level / Stage 100",
                rewardAmount: t4,
                rewardDisplay: `$${t4.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 20 days",
                notes: "Reach advanced tier achievement.",
            },
            {
                id: "tier-5",
                sortOrder: 5,
                title: "Reach Level / Stage 150 & In-App Event",
                rewardAmount: t5,
                rewardDisplay: `$${t5.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 25 days",
                notes: "High-tier gameplay objective.",
            },
            {
                id: "tier-6",
                sortOrder: 6,
                title: "Complete Final Stage / Master Achievement",
                rewardAmount: t6,
                rewardDisplay: `$${t6.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 30 days",
                notes: "Final tier completion bonus.",
            },
        ];
    }

    if (payout >= 250) {
        const t1 = 3.0;
        const t2 = 15.0;
        const t3 = 45.0;
        const t4 = 85.0;
        const t5 = Number((payout - (t1 + t2 + t3 + t4)).toFixed(2));
        return [
            {
                id: "tier-1",
                sortOrder: 1,
                title: `Install ${gameTitle} & Complete First Quest`,
                rewardAmount: t1,
                rewardDisplay: `$${t1.toFixed(2)}`,
                taskType: "install",
                timeLimitText: "Day 1",
                notes: "Install from tracked link and start playing.",
            },
            {
                id: "tier-2",
                sortOrder: 2,
                title: "Reach Level / Milestone 15",
                rewardAmount: t2,
                rewardDisplay: `$${t2.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 7 days",
                notes: "Early progression milestone.",
            },
            {
                id: "tier-3",
                sortOrder: 3,
                title: "Reach Level / Milestone 35",
                rewardAmount: t3,
                rewardDisplay: `$${t3.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 14 days",
                notes: "Mid-tier progression milestone.",
            },
            {
                id: "tier-4",
                sortOrder: 4,
                title: "Reach Level / Milestone 70",
                rewardAmount: t4,
                rewardDisplay: `$${t4.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 21 days",
                notes: "Advanced stage completion.",
            },
            {
                id: "tier-5",
                sortOrder: 5,
                title: "Complete Final Stage / Max Level Goal",
                rewardAmount: t5,
                rewardDisplay: `$${t5.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 30 days",
                notes: "Final completion reward.",
            },
        ];
    }

    if (payout >= 50) {
        const t1 = 1.0;
        const t2 = 6.0;
        const t3 = 15.0;
        const t4 = Number((payout - (t1 + t2 + t3)).toFixed(2));
        return [
            {
                id: "tier-1",
                sortOrder: 1,
                title: `Install ${gameTitle} & Open Game`,
                rewardAmount: t1,
                rewardDisplay: `$${t1.toFixed(2)}`,
                taskType: "install",
                timeLimitText: "Day 1",
                notes: "Download and launch through tracked link.",
            },
            {
                id: "tier-2",
                sortOrder: 2,
                title: "Reach Level / Stage 10",
                rewardAmount: t2,
                rewardDisplay: `$${t2.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 5 days",
                notes: "Complete starter milestones.",
            },
            {
                id: "tier-3",
                sortOrder: 3,
                title: "Reach Level / Stage 25",
                rewardAmount: t3,
                rewardDisplay: `$${t3.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 15 days",
                notes: "Reach main gameplay milestone.",
            },
            {
                id: "tier-4",
                sortOrder: 4,
                title: "Complete Level / Stage 50",
                rewardAmount: t4,
                rewardDisplay: `$${t4.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 30 days",
                notes: "Final stage reward.",
            },
        ];
    }

    if (payout >= 10) {
        const t1 = 0.5;
        const t2 = 2.5;
        const t3 = Number((payout - (t1 + t2)).toFixed(2));
        return [
            {
                id: "tier-1",
                sortOrder: 1,
                title: `Install & Register in ${gameTitle}`,
                rewardAmount: t1,
                rewardDisplay: `$${t1.toFixed(2)}`,
                taskType: "install",
                timeLimitText: "Day 1",
                notes: "Download and create account.",
            },
            {
                id: "tier-2",
                sortOrder: 2,
                title: "Complete Level / Step 5",
                rewardAmount: t2,
                rewardDisplay: `$${t2.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 7 days",
                notes: "Reach first milestone.",
            },
            {
                id: "tier-3",
                sortOrder: 3,
                title: "Complete Main Objective",
                rewardAmount: t3,
                rewardDisplay: `$${t3.toFixed(2)}`,
                taskType: "milestone",
                timeLimitText: "Within 21 days",
                notes: "Finish remaining tasks.",
            },
        ];
    }

    const t1 = Number((payout * 0.2).toFixed(2)) || 0.1;
    const t2 = Number((payout - t1).toFixed(2));
    return [
        {
            id: "tier-1",
            sortOrder: 1,
            title: `Install ${gameTitle} & Open`,
            rewardAmount: t1,
            rewardDisplay: `$${t1.toFixed(2)}`,
            taskType: "install",
            timeLimitText: "Day 1",
            notes: "Download and launch app.",
        },
        {
            id: "tier-2",
            sortOrder: 2,
            title: "Complete Required Task / Level",
            rewardAmount: t2,
            rewardDisplay: `$${t2.toFixed(2)}`,
            taskType: "milestone",
            timeLimitText: "Within 14 days",
            notes: "Complete required action to claim total prize.",
        },
    ];
}
