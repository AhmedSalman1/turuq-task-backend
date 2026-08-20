import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

if (env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

app.route("/health").get((req, res) => {
	res.json({ message: "API is running ✅" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
