import request from "supertest";
import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach,
} from "@jest/globals";
import app from "../src/app";
import { User } from "../src/models/user.model";
import { mongoConnect, mongoDisconnect } from "./db";
import { DEFAULT_PASSWORD, randomEmail, expectNoPassword } from "./utils";

const register = (body: object) =>
	request(app).post("/api/v1/auth/register").send(body);
const login = (email: string, password: string) =>
	request(app).post("/api/v1/auth/login").send({ email, password });

const validUser = () => ({
	name: "Alice Johnson",
	email: randomEmail("alice"),
	password: DEFAULT_PASSWORD,
	age: 30,
});

beforeAll(async () => await mongoConnect());
afterAll(async () => await mongoDisconnect());
afterEach(async () => await User.deleteMany({}));

describe("POST /api/v1/auth/register", () => {
	it("should create a user and return a JWT + sanitized user", async () => {
		const payload = validUser();
		const res = await register(payload);

		expect(res.status).toBe(201);
		expect(res.body.status).toBe("success");
		expect(res.body.data.accessToken).toEqual(expect.any(String));
		expect(res.body.data.user.name).toBe(payload.name);
		expect(res.body.data.user.email).toBe(payload.email);
		expect(res.body.data.user.age).toBe(payload.age);
		expectNoPassword(res.body, payload.password);
	});

	it("should set an httpOnly jwt cookie", async () => {
		const res = await register(validUser());

		expect(res.status).toBe(201);
		const cookies = res.headers["set-cookie"] as unknown as string[];
		expect(
			cookies.some((c) => c.startsWith("jwt=") && c.includes("HttpOnly")),
		).toBe(true);
	});

	it("should reject a duplicate email with 409", async () => {
		const payload = validUser();
		await register(payload);

		const res = await register(payload);

		expect(res.status).toBe(409);
		expect(res.body.message).toContain("Duplicate value for email");
		expectNoPassword(res.body, payload.password);
	});

	it.each([
		["name too short", { name: "ab" }],
		["invalid email", { email: "not-an-email" }],
		["password too short", { password: "short" }],
		["age out of range", { age: 101 }],
		["invalid role", { role: "superadmin" }],
	])("should reject %s with 400", async (_label, patch) => {
		const res = await register({ ...validUser(), ...patch });

		expect(res.status).toBe(400);
		expect(res.body.error.message).toBe("Validation failed");
	});

	it("should reject missing required fields with 400", async () => {
		const res = await register({ email: randomEmail() });

		expect(res.status).toBe(400);
		expect(res.body.error.message).toBe("Validation failed");
	});
});

describe("POST /api/v1/auth/login", () => {
	it("should log in with valid credentials and return a JWT", async () => {
		const payload = validUser();
		await register(payload);

		const res = await login(payload.email, payload.password);

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("success");
		expect(res.body.data.accessToken).toEqual(expect.any(String));
		expect(res.body.data.user.email).toBe(payload.email);
		expectNoPassword(res.body, payload.password);
	});

	it("should reject a wrong password with 401", async () => {
		const payload = validUser();
		await register(payload);

		const res = await login(payload.email, "WrongPass123!");

		expect(res.status).toBe(401);
		expect(res.body.message).toContain("Incorrect email or password");
	});

	it("should reject a non-existent email with 401", async () => {
		const res = await login(randomEmail("ghost"), DEFAULT_PASSWORD);

		expect(res.status).toBe(401);
		expect(res.body.message).toContain("Incorrect email or password");
	});

	it("should reject invalid email format with 400", async () => {
		const res = await login("not-an-email", DEFAULT_PASSWORD);

		expect(res.status).toBe(400);
		expect(res.body.error.message).toBe("Validation failed");
	});
});

describe("GET /api/v1/auth/me", () => {
	it("should return the current user when authenticated", async () => {
		const payload = validUser();
		const reg = await register(payload);

		const res = await request(app)
			.get("/api/v1/auth/me")
			.set("Authorization", `Bearer ${reg.body.data.accessToken}`);

		expect(res.status).toBe(200);
		expect(res.body.data.user.email).toBe(payload.email);
		expect(res.body.data.user.name).toBe(payload.name);
		expectNoPassword(res.body, payload.password);
	});

	it("should reject a request without a token with 401", async () => {
		const res = await request(app).get("/api/v1/auth/me");

		expect(res.status).toBe(401);
		expect(res.body.message).toContain("not logged in");
	});

	it("should reject an invalid token with 401", async () => {
		const res = await request(app)
			.get("/api/v1/auth/me")
			.set("Authorization", "Bearer garbage.token.value");

		expect(res.status).toBe(401);
		expect(res.body.message).toContain("Invalid or expired token");
	});
});

describe("POST /api/v1/auth/logout", () => {
	it("should clear the jwt cookie", async () => {
		const res = await request(app).post("/api/v1/auth/logout");

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("success");
		expect(
			(res.headers["set-cookie"] as unknown as string[]).some((c) =>
				c.startsWith("jwt="),
			),
		).toBe(true);
	});
});
