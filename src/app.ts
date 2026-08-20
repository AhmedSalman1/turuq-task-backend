import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

if (env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

app.route("/").get((req, res) => {
	res.json({ message: "Welcome to API 🚀" });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
