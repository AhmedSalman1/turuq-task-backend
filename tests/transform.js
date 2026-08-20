const { transformSync } = require("esbuild");
const crypto = require("crypto");

// Custom Jest transformer built on esbuild.
// The project uses TypeScript 7 (the native compiler), which no longer exposes
// the legacy `transpileModule`/`createProgram` APIs that ts-jest relies on, so
// we compile test/source files to CommonJS with esbuild instead.
module.exports = {
	createTransformer() {
		return {
			process(sourceText, sourcePath) {
				const result = transformSync(sourceText, {
					loader: "ts",
					sourcefile: sourcePath,
					format: "cjs",
					target: "es2022",
					sourcemap: "inline",
				});

				return { code: result.code, map: result.map };
			},

			getCacheKey(sourceText, sourcePath) {
				return crypto
					.createHash("sha1")
					.update(sourceText)
					.update(sourcePath)
					.digest("hex");
			},
		};
	},
};
