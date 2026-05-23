import { defineConfig } from "prisma/config";

// DATABASE_URL is read from the environment at runtime.
// dotenv is NOT imported here so this file works in Docker builds
// where env vars are injected directly (no .env file needed).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
