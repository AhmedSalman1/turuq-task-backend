import { QueryFilter } from "mongoose";
import { RequestHandler } from "express";
import { AppError } from "../utils/AppError";
import { User } from "../models/user.model";
import { IUser } from "../types";
import { GetUsersQuery } from "../validators/user.validator";
import { sanitizeUser } from "../utils/sanitizeData";

/*  1. POST    /users        - create a user profile 			       (done)*/
/*  2. GET     /users        - list with pagination + age filter (done)*/
/*  3. GET     /users/:id    - fetch one profile by id           (done)*/
/*  4. PUT     /users/:id    - update an existing profile        (done)*/
/*  5. DELETE  /users/:id    - delete a profile                  (done)*/
/*  All routes are protected and only admins can access them.          */

export const createUser: RequestHandler = async (req, res) => {
	const user = await User.create(req.body);

	res.status(201).json({
		status: "success",
		data: { user: sanitizeUser(user) },
	});
};

export const getUsers: RequestHandler = async (req, res) => {
	const {
		page = 1,
		limit = 10,
		age,
		minAge,
		maxAge,
	} = req.query as unknown as GetUsersQuery;

	const filter: QueryFilter<IUser> = {};

	if (age !== undefined) {
		filter.age = age;
	} else if (minAge !== undefined || maxAge !== undefined) {
		const ageFilter: { $gte?: number; $lte?: number } = {};

		if (minAge !== undefined) ageFilter.$gte = minAge;
		if (maxAge !== undefined) ageFilter.$lte = maxAge;

		filter.age = ageFilter;
	}

	const skip = (page - 1) * limit;

	const [users, total] = await Promise.all([
		User.find(filter)
			.select("name email age role createdAt")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		User.countDocuments(filter),
	]);

	res.status(200).json({
		status: "success",
		results: users.length,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
		data: users,
	});
};

export const getUserById: RequestHandler = async (req, res) => {
	const user = await User.findById(req.params.id)
		.select("name email age")
		.lean();

	if (!user) {
		throw new AppError("User not found", 404);
	}

	res.status(200).json({
		status: "success",
		data: user,
	});
};

export const updateUser: RequestHandler = async (req, res) => {
	console.log(req.body);
	const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
		returnDocument: "after",
		runValidators: true,
	});

	if (!updatedUser) {
		throw new AppError("User not found", 404);
	}

	res.status(200).json({
		status: "success",
		data: {
			user: sanitizeUser(updatedUser),
		},
	});
};

export const deleteUser: RequestHandler = async (req, res) => {
	const user = await User.findByIdAndDelete(req.params.id);

	if (!user) {
		throw new AppError("User not found", 404);
	}

	res.status(204).json({
		status: "success",
		data: null,
	});
};
