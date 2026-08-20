import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const notFound = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
};
