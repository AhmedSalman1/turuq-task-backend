import { Document } from "mongoose";

export interface IUser extends Document {
	id: string;
	name: string;
	email: string;
	password?: string;
	age?: number;
	role: "admin" | "user";
	createdAt: Date;
	updatedAt: Date;
	comparePassword(enteredPassword: string): Promise<boolean>;
}
