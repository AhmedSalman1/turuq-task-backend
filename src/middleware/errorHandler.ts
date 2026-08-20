import { ErrorRequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const globalErrorHandler: ErrorRequestHandler = (
	err,
	req,
	res,
	next,
) => {
	let statusCode = err instanceof AppError ? err.statusCode : 500;
	let status = err instanceof AppError ? err.status : "error";
	let message = err instanceof AppError ? err.message : "Internal Server Error";

	// 1. JWT Errors
	if (err.name === "JsonWebTokenError") {
		statusCode = 401;
		message = "Invalid token. Please log in again.";
	}
	if (err.name === "TokenExpiredError") {
		statusCode = 401;
		message = "Your token has expired! Please log in again.";
	}

	// 2. Mongoose Invalid ID (CastError)
	if (err.name === "CastError") {
		statusCode = 400;
		message = `Invalid format for ${err.path}: ${err.value}`;
	}

	// 3. Mongoose Duplicate Field Key
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
		statusCode = 409;
		message = `Duplicate value for ${field}: '${err.keyValue?.[field]}' already exists.`;
	}

	// 4. Mongoose Schema Validation
	if (err.name === "ValidationError") {
		statusCode = 400;
		message = Object.values(err.errors as Record<string, { message: string }>)
			.map((e) => e.message)
			.join(", ");
	}

	if (env.NODE_ENV === "development") {
		console.error("ERROR 💥", err);
	}

	const isOperational = err instanceof AppError || statusCode < 500;
	const finalMessage =
		env.NODE_ENV === "production" && !isOperational
			? "Something went wrong!"
			: message;

	res.status(statusCode).json({
		status,
		message: finalMessage,
		...(env.NODE_ENV === "development" && {
			error: err,
			stack: err.stack,
		}),
	});
};
