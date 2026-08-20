import mongoose from "mongoose";
import { User } from "../models/user.model";
import { connectDB } from "./db";
import { env } from "./env";

const users = Array.from({ length: 50 }, (_, i) => ({
	name: `User ${i + 1}`,
	email: `user${i + 1}@example.com`,
	password: "password123",
	age: (i % 60) + 18,
		role: i === 0 ? ("admin" as const) : ("user" as const),
}));

const seed = async () => {
	try {
		await connectDB();

		await User.deleteMany({});
		await User.create(...users);

		console.log(`Seeded ${users.length} users ✅`);
	} catch (error) {
		console.error("Seeding failed ❌");
		console.error(error);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
};

seed();
