import { RequestHandler, Response } from "express";
import { User } from "../models/user.model";
import { generateAccessToken } from "../utils/jwt";
import { sanitizeUser } from "../utils/sanitizeData";
import { AppError } from "../utils/AppError";

const setCookieWithToken = (res: Response, token: string) => {
	const cookieOptions = {
		expires: new Date(
			Date.now() +
				Number(process.env.JWT_COOKIE_EXPIRES_IN ?? 1) * 24 * 60 * 60 * 1000,
		),
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict" as const,
	};

	res.cookie("jwt", token, cookieOptions);
};

export const register: RequestHandler = async (req, res) => {
	const { name, email, password, age } = req.body;

	const newUser = await User.create({
		name,
		email,
		password,
		age,
	});

	const accessToken = generateAccessToken(newUser.id);

	setCookieWithToken(res, accessToken);

	res.status(201).json({
		status: "success",
		data: {
			accessToken,
			user: sanitizeUser(newUser),
		},
	});
};

export const login: RequestHandler = async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email }).select("+password");

	if (!user || !(await user.comparePassword(password))) {
		throw new AppError("Incorrect email or password", 401);
	}

	const accessToken = generateAccessToken(user.id);

	setCookieWithToken(res, accessToken);

	res.status(200).json({
		status: "success",
		data: {
			accessToken,
			user: sanitizeUser(user),
		},
	});
};

export const getMe: RequestHandler = async (req, res) => {
	const user = await User.findById(req.user.id);

	if (!user) {
		throw new AppError("User not found", 404);
	}

	res.status(200).json({
		status: "success",
		data: { user: sanitizeUser(user) },
	});
};

export const logout: RequestHandler = (req, res) => {
	res.clearCookie("jwt", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	res.status(200).json({
		status: "success",
	});
};
