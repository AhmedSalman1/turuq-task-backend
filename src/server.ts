import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const PORT = env.PORT || 3000;
const server = http.createServer(app);

(async function startServer() {
	await connectDB();

	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT} ✅`);
	});
})();

/*     Handle Promise Rejection (handle errors outside express)     */
process.on("unhandledRejection", (err: Error) => {
	console.log("Unhandled Rejection! 💥 Shutting down...");
	console.log(err.name, err.message);

	server.close(() => {
		process.exit(1);
	});
});
