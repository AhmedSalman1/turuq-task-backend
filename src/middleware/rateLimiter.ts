import { rateLimit } from "express-rate-limit";
import { RequestHandler } from "express";
import { env } from "../config/env";

const createLimiter = (limit: number, message: string) =>
	rateLimit({
		windowMs: 15 * 60 * 1000,
		limit,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: { status: "fail", message },
	});

// Rate limiting is disabled under test so the integration suite is
// deterministic and never trips a window limit.
const bypass: RequestHandler = (req, res, next) => next();

// stricter limit on auth endpoints to slow down credential stuffing
export const authLimiter = env.NODE_ENV === "test" ? bypass : createLimiter(
	20,
	"Too many authentication attempts, please try again later",
);

// general API protection
export const apiLimiter = env.NODE_ENV === "test" ? bypass : createLimiter(
	300,
	"Too many requests, please try again later",
);
