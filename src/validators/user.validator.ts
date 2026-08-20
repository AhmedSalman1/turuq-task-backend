import { z } from "zod";

const objectId = z
	.string()
	.regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format");

const nameField = z
	.string()
	.trim()
	.min(3, "Name must be at least 3 characters")
	.max(50, "Name must be at most 50 characters");

const emailField = z.email("Invalid email address");

const ageField = z
	.number()
	.int("Please enter a valid age")
	.min(1, "Age must be at least 1")
	.max(100, "Age must be at most 100");

const roleField = z.enum(["admin", "user"]);

export const userIdParamsSchema = {
	params: z.object({ id: objectId }),
};

export const createUserSchema = {
	body: z.object({
		name: nameField,
		email: emailField,
		password: z.string().min(8, "Password must be at least 8 characters"),
		age: ageField.optional(),
		role: roleField.optional(),
	}),
};

export const updateUserSchema = {
	params: z.object({ id: objectId }),
	body: z
		.object({
			name: nameField,
			email: emailField,
			age: ageField,
			role: roleField,
		})
		.partial(),
};

export const getUsersSchema = {
	query: z.object({
		page: z.coerce.number().int().min(1).optional(),
		limit: z.coerce.number().int().min(1).max(100).optional(),
		age: z.coerce.number().int().min(1).max(100).optional(),
		minAge: z.coerce.number().int().min(1).max(100).optional(),
		maxAge: z.coerce.number().int().min(1).max(100).optional(),
	}),
};

export type CreateUserInput = z.infer<typeof createUserSchema.body>;
export type UpdateUserInput = z.infer<typeof updateUserSchema.body>;
export type GetUsersQuery = z.infer<typeof getUsersSchema.query>;
