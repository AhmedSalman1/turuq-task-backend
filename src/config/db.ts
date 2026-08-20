import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
	try {
		await mongoose.connect(env.MONGODB_URI);

		console.log("Connected to MongoDB 🌍");
	} catch (error) {
		console.error("Error connecting to MongoDB ❌");
		console.error(error);

		process.exit(1);
	}
};
