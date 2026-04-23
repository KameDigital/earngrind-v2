import { spawnSync } from "node:child_process";

const token = process.env.VERCEL_TOKEN;
const domains = ["earngrind.com", "www.earngrind.com"];

if (!token) {
  console.error("Missing VERCEL_TOKEN. Set it before running npm run deploy:prod.");
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.status !== 0) {
    process.stderr.write(output);
    process.exit(result.status ?? 1);
  }
  process.stdout.write(output);
  return output;
}

function getDeploymentUrl(output) {
  const explicitMatch = output.match(/Production:\s+(https:\/\/[^\s]+)/i);
  if (explicitMatch?.[1]) return explicitMatch[1];

  const allUrls = [...output.matchAll(/https:\/\/[a-z0-9-]+\.vercel\.app/gi)].map((match) => match[0]);
  return allUrls.at(-1) ?? null;
}

const deployOutput = run("vercel", ["deploy", ".", "--prod", "-y", "--token", token]);
const deploymentUrl = getDeploymentUrl(deployOutput);

if (!deploymentUrl) {
  console.error("Failed to detect the production deployment URL from Vercel output.");
  process.exit(1);
}

for (const domain of domains) {
  run("vercel", ["alias", "set", deploymentUrl, domain, "--token", token]);
}

console.log(`Production deployment promoted to ${domains.join(" and ")} from ${deploymentUrl}`);
