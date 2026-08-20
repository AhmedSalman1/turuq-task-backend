/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	transform: {
		"^.+\\.tsx?$": "<rootDir>/tests/transform.js",
	},
	setupFiles: ["<rootDir>/tests/setupEnv.ts"],
	maxWorkers: 1,
	testTimeout: 60000,
	verbose: true,
};
