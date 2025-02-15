import "dotenv/config";
import { z } from "zod";
import { getZodErrorMessage } from "./utils/zod-message.ts";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  DB_ENDPOINT: z.string().nonempty(),
  GOOGLE_CLIENT_ID: z.string().nonempty(),
  GOOGLE_CLIENT_SECRET: z.string().nonempty(),
  GOOGLE_REDIRECT_URI: z.string().nonempty(),
  S3_ENDPOINT: z.string().nonempty(),
  S3_BUCKET: z.string().nonempty(),
  S3_ACCESS_KEY_ID: z.string().nonempty(),
  S3_SECRET_ACCESS_KEY: z.string().nonempty(),
  TOKEN_SECRET: z.string().nonempty().min(32),
});

function loadEnvs() {
  try {
    return envSchema.parse(process.env);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(
        `Invalid environment variables:\n${getZodErrorMessage(e)}`,
      );
    }

    throw new Error(
      "Invalid environment variables. Check .env file for errors",
    );
  }
}

export const envs = loadEnvs();
