import { ZodError } from "zod";
import type { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";

interface ValidationSchema {
	body?: ZodType;
	params?: ZodType;
	query?: ZodType;
}

export const validate =
	(schema: ValidationSchema) =>
	(req: Request, res: Response, next: NextFunction) => {
		try {
			const parsedBody = schema.body?.parse(req.body);

			schema.params?.parse(req.params);
			schema.query?.parse(req.query);

			// sanitize the body: drop unknown keys and undefined values
			// so clients can't mass-assign fields they didn't send
			if (parsedBody) {
				req.body = Object.fromEntries(
					Object.entries(parsedBody).filter(([, value]) => value !== undefined),
				);
			}

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				return res.status(400).json({
					error: {
						message: "Validation failed",
						details: error.flatten(),
					},
				});
			}

			next(error);
		}
	};
