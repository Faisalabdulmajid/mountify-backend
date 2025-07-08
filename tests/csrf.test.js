const request = require("supertest");
const app = require("../app");

describe("CSRF Protection Tests", () => {
  let agent;
  let csrfToken;
  let jwtToken;

  beforeAll(async () => {
    agent = request.agent(app);
    // Login sebagai superadmin
    const loginRes = await agent.post("/api/auth/login").send({
      email: "administrator@gmail.com",
      password: "admin123",
    });
    jwtToken = loginRes.body.token;
    // Dapatkan CSRF token
    const csrfRes = await agent.get("/api/csrf-token");
    csrfToken = csrfRes.body.csrfToken;
  });

  test("should fail to access protected route from different origin", async () => {
    const response = await agent
      .post("/api/protected-route")
      .set("Origin", "http://evil.com")
      .set("Authorization", `Bearer ${jwtToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({})
      .expect(403);
    expect(response.body.error || response.body.message).toMatch(
      /csrf|forbidden/i
    );
  });

  test("should succeed to access protected route with valid token", async () => {
    const response = await agent
      .post("/api/protected-route")
      .set("Authorization", `Bearer ${jwtToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({})
      .expect(200);
    expect(response.body.success).toBe(true);
  });

  test("should fail to access protected route with missing token", async () => {
    const response = await agent
      .post("/api/protected-route")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({})
      .expect(403);
    expect(response.body.error || response.body.message).toMatch(
      /csrf|forbidden/i
    );
  });

  test("should fail to access protected route with invalid token", async () => {
    const response = await agent
      .post("/api/protected-route")
      .set("Authorization", `Bearer ${jwtToken}`)
      .set("X-CSRF-Token", "invalid-token")
      .send({})
      .expect(403);
    expect(response.body.error || response.body.message).toMatch(
      /csrf|forbidden/i
    );
  });
});
