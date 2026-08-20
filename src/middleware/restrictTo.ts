import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const restrictTo =
	(...roles: string[]) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return next(
				new AppError("You do not have permission to perform this action", 403),
			);
		}
		next();
	};
