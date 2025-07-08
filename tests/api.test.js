// Comprehensive API tests for Mountify backend
// File: tests/api.test.js

const request = require("supertest");
const { TestingEnvironment } = require("./utils/testEnvironment");

describe("Mountify API Comprehensive Tests", () => {
  let testEnv;
  let app;

  beforeAll(async () => {
    testEnv = new TestingEnvironment();
    app = await testEnv.init();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // Add your tests here, for example:
  it("should return 200 OK for the health check endpoint", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
  });

  // ...other tests from the original file...
});
