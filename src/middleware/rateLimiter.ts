import { rateLimit } from "express-rate-limit";

const createLimiter = (limit: number, message: string) =>
	rateLimit({
		windowMs: 15 * 60 * 1000,
		limit,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: { status: "fail", message },
	});

// stricter limit on auth endpoints to slow down credential stuffing
export const authLimiter = createLimiter(
	20,
	"Too many authentication attempts, please try again later",
);

// general API protection
export const apiLimiter = createLimiter(
	300,
	"Too many requests, please try again later",
);
