import { spawnSync } from "node:child_process";

if (process.env.SUPABASE_DB_PUSH_APPROVED !== "YES") {
  console.error("Database push blocked. Review the migration and receive explicit user approval first, then set SUPABASE_DB_PUSH_APPROVED=YES for this command only.");
  process.exit(1);
}

const command = process.platform === "win32" ? "supabase.cmd" : "supabase";
const result = spawnSync(command, ["db", "push"], { stdio: "inherit", shell: false });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
