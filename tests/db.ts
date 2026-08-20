import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer | undefined;

export async function mongoConnect(): Promise<void> {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
}

export async function mongoDisconnect(): Promise<void> {
	await mongoose.disconnect();
	await mongod?.stop();
}
