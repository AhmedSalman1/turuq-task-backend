import jwt, { JwtPayload } from "jsonwebtoken";
import { RequestHandler } from "express";
import { AppError } from "../utils/AppError";
import { User } from "../models/user.model";
import { env } from "../config/env";

interface TokenPayload extends JwtPayload {
	id: string;
}

export const protect: RequestHandler = async (req, res, next) => {
	//* 1) Getting token and check of it's there
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		token = req.headers.authorization.split(" ")[1];
	} else if (req.cookies?.jwt) {
		token = req.cookies.jwt;
	}

	if (!token)
		throw new AppError(
			"You are not logged in! Please log in to get access.",
			401,
		);

	//* 2) Verification token
	let payload: TokenPayload;
	try {
		payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
	} catch (error) {
		throw new AppError("Invalid or expired token", 401);
	}

	//* 3) Check if user still exists
	const user = await User.findById(payload.id);

	if (!user) {
		throw new AppError("User no longer exists", 401);
	}

	req.user = user;

	next();
};
