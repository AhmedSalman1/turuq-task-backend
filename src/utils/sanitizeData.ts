import { IUser } from "../types";

export const sanitizeUser = (user: IUser) => ({
	_id: user._id,
	name: user.name,
	email: user.email,
	age: user.age,
});
