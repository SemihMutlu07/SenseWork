import { config } from "dotenv";

config({ path: ".env.test" });
config({ path: ".env" });

process.env.DATABASE_URL ??=
  "postgresql://sensework:sensework@localhost:5432/sensework_test?schema=public";
process.env.JWT_SECRET ??= "test-jwt-secret-at-least-16-chars";
