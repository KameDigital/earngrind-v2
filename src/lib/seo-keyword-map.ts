export type KeywordTask = {
  title: string;
  deadlineDays: number | null;
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function taskKeyword(gameName: string, task: KeywordTask) {
  const taskText = task.title
    .replace(/\bwithin\s+\d+\s+days?\b/gi, "")
    .replace(/\bcomplete\b/gi, "")
    .trim();

  if (!taskText) return null;
  const deadline = task.deadlineDays ? ` within ${task.deadlineDays} days` : "";
  return compact(`${gameName} ${taskText}${deadline} guide`);
}

export function generateSeoKeywords({
  gameName,
  platformName,
  tasks = [],
}: {
  gameName?: string | null;
  platformName?: string | null;
  tasks?: KeywordTask[];
}) {
  const keywords = new Set<string>();
  const game = compact(gameName ?? "");
  const platform = compact(platformName ?? "");

  if (game) {
    keywords.add(`${game} offer guide`);
    keywords.add(`${game} offer task list`);
    keywords.add(`${game} worth it offer`);
    keywords.add(`${game} best payout`);

    tasks.slice(0, 12).forEach((task) => {
      const keyword = taskKeyword(game, task);
      if (keyword) keywords.add(keyword);
    });

    const levelTask = tasks.find((task) => /reach\s+level\s+\d+/i.test(task.title));
    if (levelTask) keywords.add(taskKeyword(game, levelTask) ?? `${game} level guide`);

    const shardTask = tasks.find((task) => /shard|rare item|hero|upgrade/i.test(task.title));
    if (shardTask) keywords.add(taskKeyword(game, shardTask) ?? `${game} milestone guide`);
  }

  if (platform) {
    keywords.add(`${platform} review`);
    keywords.add(`${platform} legit`);
    keywords.add(`${platform} payout guide`);
    keywords.add(`${platform} best offers`);
  }

  if (game && platform) {
    keywords.add(`${game} ${platform} offer guide`);
    keywords.add(`${game} best payout on ${platform}`);
  }

  return Array.from(keywords);
}
