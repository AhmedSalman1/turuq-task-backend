import { z } from "zod";

export const registerSchema = {
	body: z.object({
		name: z
			.string()
			.trim()
			.min(3, "Name must be at least 3 characters")
			.max(50),

		email: z.email("Invalid email address"),

		password: z.string().min(8, "Password must be at least 8 characters"),

		age: z.number().int("Age must be an integer").min(1).max(100).optional(),
	}),
};

export const loginSchema = {
	body: z.object({
		email: z.email("Invalid email address"),

		password: z.string().min(1, "Password is required"),
	}),
};

export type RegisterInput = z.infer<typeof registerSchema.body>;
export type LoginInput = z.infer<typeof loginSchema.body>;
