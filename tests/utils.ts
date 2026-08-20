import request from "supertest";
import { expect } from "@jest/globals";
import app from "../src/app";
import { User } from "../src/models/user.model";

export const DEFAULT_PASSWORD = "StrongPass123!";

export const randomEmail = (prefix = "user"): string =>
	`${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

// Seeds a user directly in the DB (so the password is hashed), then logs in
// through the API to get a real JWT for that role.
export async function seedAndLogin(
	role: "admin" | "user" = "user",
): Promise<string> {
	const email = randomEmail(role);
	await User.create({
		name: role === "admin" ? "Admin" : "Regular User",
		email,
		password: DEFAULT_PASSWORD,
		role,
	});

	const res = await request(app)
		.post("/api/v1/auth/login")
		.send({ email, password: DEFAULT_PASSWORD });

	if (res.status !== 200) {
		throw new Error(`login failed in helper: ${JSON.stringify(res.body)}`);
	}

	return res.body.data.accessToken as string;
}

// Ensures the plaintext password is never present, and that no response field
// is named "password" (which would leak a hash).
export function expectNoPassword(body: unknown, password: string): void {
	expect(JSON.stringify(body)).not.toContain(password);

	const stack: unknown[] = [body];
	while (stack.length > 0) {
		const node = stack.pop();
		if (node === null || typeof node !== "object") continue;
		for (const [key, value] of Object.entries(node)) {
			expect(key.toLowerCase()).not.toBe("password");
			stack.push(value);
		}
	}
}
