import request from "supertest";
import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach,
	beforeEach,
} from "@jest/globals";
import app from "../src/app";
import { User } from "../src/models/user.model";
import { mongoConnect, mongoDisconnect } from "./db";
import {
	DEFAULT_PASSWORD,
	randomEmail,
	seedAndLogin,
	expectNoPassword,
} from "./utils";

const NON_EXISTENT_ID = "000000000000000000000000";
const INVALID_OBJECT_ID = "not-a-valid-object-id";

const newUserPayload = () => ({
	name: "Bob Builder",
	email: randomEmail("bob"),
	password: DEFAULT_PASSWORD,
	age: 42,
});

beforeAll(async () => await mongoConnect());
afterAll(async () => await mongoDisconnect());
afterEach(async () => await User.deleteMany({}));

describe("User endpoints for admin roles", () => {
	let adminToken: string;

	beforeEach(async () => {
		adminToken = await seedAndLogin("admin");
	});

	const auth = (
		path: string,
		method: "get" | "post" | "put" | "delete",
		body?: object,
	) => {
		const req = request(app)
			[method](path)
			.set("Authorization", `Bearer ${adminToken}`);
		return body ? req.send(body) : req;
	};

	describe("GET /api/v1/users", () => {
		it("should return all users for admin", async () => {
			const initialCount = await User.countDocuments();

			await User.create(newUserPayload());
			await User.create(newUserPayload());

			const res = await auth("/api/v1/users", "get");

			expect(res.status).toBe(200);
			expect(res.body.status).toBe("success");
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.total).toBe(initialCount + 2);
			expectNoPassword(res.body, DEFAULT_PASSWORD);
		});
	});

	describe("POST /api/v1/users", () => {
		it("should create a new user", async () => {
			const payload = newUserPayload();
			const res = await auth("/api/v1/users", "post", payload);

			expect(res.status).toBe(201);
			expect(res.body.status).toBe("success");
			expect(res.body.data.user).toHaveProperty("_id");
			expect(res.body.data.user.name).toBe(payload.name);
			expectNoPassword(res.body, payload.password);
		});

		it("should reject a duplicate email with 409", async () => {
			const payload = newUserPayload();
			await auth("/api/v1/users", "post", payload);

			const res = await auth("/api/v1/users", "post", payload);

			expect(res.status).toBe(409);
			expect(res.body.message).toContain("Duplicate value for email");
		});

		it("should reject invalid input with 400", async () => {
			const res = await auth("/api/v1/users", "post", {
				name: "ab",
				email: "not-an-email",
				password: "short",
			});

			expect(res.status).toBe(400);
			expect(res.body.error.message).toBe("Validation failed");
		});
	});

	describe("GET /api/v1/users/:id", () => {
		it("should fetch a user by id", async () => {
			const created = await auth("/api/v1/users", "post", newUserPayload());
			const id = created.body.data.user._id;

			const res = await auth(`/api/v1/users/${id}`, "get");

			expect(res.status).toBe(200);
			expect(res.body.data._id).toBe(id);
			expect(res.body.data.name).toBeDefined();
			expectNoPassword(res.body, DEFAULT_PASSWORD);
		});

		it("should return 404 for a non-existent id", async () => {
			const res = await auth(`/api/v1/users/${NON_EXISTENT_ID}`, "get");

			expect(res.status).toBe(404);
			expect(res.body.message).toBe("User not found");
		});

		it("should return 400 for an invalid ObjectId", async () => {
			const res = await auth(`/api/v1/users/${INVALID_OBJECT_ID}`, "get");

			expect(res.status).toBe(400);
			expect(res.body.error.message).toBe("Validation failed");
		});
	});

	describe("PUT /api/v1/users/:id", () => {
		it("should update a user partially", async () => {
			const created = await auth("/api/v1/users", "post", newUserPayload());
			const id = created.body.data.user._id;

			const res = await auth(`/api/v1/users/${id}`, "put", { age: 33 });

			expect(res.status).toBe(200);
			expect(res.body.data.user.age).toBe(33);
			expect(res.body.data.user.name).toBe(created.body.data.user.name);
			expectNoPassword(res.body, DEFAULT_PASSWORD);
		});

		it("should return 404 for a non-existent id", async () => {
			const res = await auth(`/api/v1/users/${NON_EXISTENT_ID}`, "put", {
				age: 20,
			});

			expect(res.status).toBe(404);
			expect(res.body.message).toBe("User not found");
		});

		it("should reject invalid input with 400", async () => {
			const created = await auth("/api/v1/users", "post", newUserPayload());
			const id = created.body.data.user._id;

			const res = await auth(`/api/v1/users/${id}`, "put", { role: "root" });

			expect(res.status).toBe(400);
			expect(res.body.error.message).toBe("Validation failed");
		});
	});

	describe("DELETE /api/v1/users/:id", () => {
		it("should delete a user by id", async () => {
			const created = await auth("/api/v1/users", "post", newUserPayload());
			const id = created.body.data.user._id;

			const res = await auth(`/api/v1/users/${id}`, "delete");

			expect(res.status).toBe(204);

			const after = await auth(`/api/v1/users/${id}`, "get");
			expect(after.status).toBe(404);
		});

		it("should return 404 for a non-existent id", async () => {
			const res = await auth(`/api/v1/users/${NON_EXISTENT_ID}`, "delete");

			expect(res.status).toBe(404);
			expect(res.body.message).toBe("User not found");
		});
	});
});

describe("User endpoints for user roles", () => {
	let userToken: string;

	beforeEach(async () => {
		userToken = await seedAndLogin("user");
	});

	it("should allow a regular user to fetch their own profile via /auth/me", async () => {
		const res = await request(app)
			.get("/api/v1/auth/me")
			.set("Authorization", `Bearer ${userToken}`);

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("success");
		expect(res.body.data.user.email).toEqual(expect.any(String));
	});

	it("should reject admin-only user endpoints with 403", async () => {
		const res = await request(app)
			.get("/api/v1/users")
			.set("Authorization", `Bearer ${userToken}`);

		expect(res.status).toBe(403);
		expect(res.body.message).toContain("do not have permission");
	});

	it("should reject admin-only writes with 403", async () => {
		const res = await request(app)
			.post("/api/v1/users")
			.set("Authorization", `Bearer ${userToken}`)
			.send(newUserPayload());

		expect(res.status).toBe(403);
	});
});

describe("Authorization (no token)", () => {
	it.each([
		["GET", "/api/v1/users"],
		["POST", "/api/v1/users"],
		["PUT", `/api/v1/users/${NON_EXISTENT_ID}`],
		["DELETE", `/api/v1/users/${NON_EXISTENT_ID}`],
	])("should reject %s %s without a token with 401", async (method, path) => {
		const req =
			method === "GET"
				? request(app).get(path)
				: method === "POST"
					? request(app).post(path)
					: method === "PUT"
						? request(app).put(path)
						: request(app).delete(path);
		const res = method === "POST" ? await req.send({}) : await req;

		expect(res.status).toBe(401);
	});
});
