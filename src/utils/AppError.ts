export class AppError extends Error {
	public readonly statusCode: number;
	public readonly status: string;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number) {
		super(message);

		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
		this.isOperational = true;

		// cleaner stack trace starting from the point where the error was instantiated
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
