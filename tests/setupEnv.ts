// Runs before each test file is loaded so the app's config/env.ts (validated
// at import time) sees a valid test configuration.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-key-123456789";
process.env.JWT_EXPIRES_IN = "1d";
process.env.JWT_COOKIE_EXPIRES_IN = "1";
