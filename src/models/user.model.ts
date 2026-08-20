import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";

const userSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			minlength: 3,
			maxlength: 50,
		},
		email: {
			type: String,
			unique: true,
			required: [true, "Email is required"],
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: 8,
			select: false,
		},
		age: {
			type: Number,
			min: [1, "Age must be at least 1"],
			max: [100, "Age must be at most 100"],
			validate: {
				validator: (v) => v == null || Number.isInteger(v),
				message: "Please enter a valid age",
			},
		},
		role: {
			type: String,
			enum: {
				values: ["admin", "user"],
				message: "Role must be either 'admin' or 'user'",
			},
			default: "user",
		},
	},
	{ timestamps: true },
);

userSchema.index({ age: 1 });

userSchema.pre("save", async function () {
	if (!this.isModified("password") || !this.password) return;

	this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (
	enteredPassword: string,
): Promise<boolean> {
	if (!this.password) return false;
	return await bcrypt.compare(enteredPassword, this.password);
};

export const User = model<IUser>("User", userSchema);
