require("dotenv").config({ path: ".env.test" });

// Set environment to test
process.env.NODE_ENV = "test";

// Suppress console.log in tests unless explicitly needed
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(10000);
