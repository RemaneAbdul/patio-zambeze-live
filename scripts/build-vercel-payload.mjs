import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const allowed = ["api", "client", "server", "shared", "drizzle", "patches", "package.json", "pnpm-lock.yaml", "tsconfig.json", "tsconfig.node.json", "vite.config.ts", "drizzle.config.ts", "vercel.json", "components.json", "README.md", ".gitignore", ".prettierrc", ".prettierignore", "template.json"];
const blocked = new Set(["node_modules", ".git", "dist", ".manus-logs", ".project-config.json", ".env", ".env.local"]);
const files = [];
function walk(relative) { const absolute = path.join(root, relative); const stat = fs.statSync(absolute); if (stat.isDirectory()) { for (const entry of fs.readdirSync(absolute)) if (!blocked.has(entry)) walk(path.join(relative, entry)); return; } if (!blocked.has(path.basename(relative))) files.push({ file: relative.split(path.sep).join("/"), encoding: "base64", data: fs.readFileSync(absolute).toString("base64") }); }
for (const entry of allowed) if (fs.existsSync(path.join(root, entry))) walk(entry);
fs.writeFileSync(path.join(root, "vercel-live-project-input.json"), JSON.stringify({ name: "patio-zambeze-live", target: "preview", teamId: "team_3VhltQoJMTKg0PdxzmXdxsLe", files }, null, 2));
console.log(`Prepared ${files.length} source files`);
