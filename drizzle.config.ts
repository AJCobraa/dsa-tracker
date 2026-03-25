import { defineConfig } from "drizzle-kit";
import path from "path";

const dbDir = process.env.DB_PATH || ".";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(dbDir, "data.db"),
  },
});
