import dotenv from "dotenv";
import { SignOptions } from "jsonwebtoken";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z.enum(["development", "production", "test"]),
	MONGODB_URI: z.string().min(1, "MongoDB URI required"),
	JWT_SECRET: z.string().min(10, "Secret must be at least 10 characters"),
	JWT_EXPIRES_IN: z.string() as unknown as z.ZodType<SignOptions["expiresIn"]>,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
	console.error("Invalid environment variables");
	console.error(z.treeifyError(result.error));

	process.exit(1);
}

export const env = result.data;
