// Test environment utilities for Mountify system
// File: tests/utils/testEnvironment.js

const request = require("supertest");
let app;
try {
  app = require("../../app");
} catch (e) {
  app = null;
}

class TestingEnvironment {
  constructor() {
    this.testData = {};
    this.mockServers = [];
    this.testUsers = [];
  }

  async setupTestDatabase() {
    console.log("Setting up test database...");

    // Mock database setup for testing
    this.testData.mountains = [
      {
        id: 1,
        name: "Mount Test",
        height: 2000,
        difficulty: "medium",
        location: "Test Province",
      },
      {
        id: 2,
        name: "Test Peak",
        height: 1500,
        difficulty: "easy",
        location: "Another Province",
      },
    ];

    this.testData.users = [
      {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        role: "user",
      },
      {
        id: 2,
        username: "admin",
        email: "admin@example.com",
        role: "admin",
      },
    ];

    this.testData.trails = [
      {
        id: 1,
        mountain_id: 1,
        name: "Main Trail",
        difficulty: "medium",
        duration: "6 hours",
      },
    ];

    console.log("✅ Test database setup completed");
  }

  async createTestUser(userData = {}) {
    const defaultUser = {
      username: "testuser" + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: "testpass123",
      role: "user",
    };

    const user = { ...defaultUser, ...userData };
    this.testUsers.push(user);

    return user;
  }

  async createTestMountain(mountainData = {}) {
    const defaultMountain = {
      name: "Test Mountain",
      height: 2000,
      difficulty: "medium",
      location: "Test Location",
      description: "A test mountain for testing purposes",
    };

    const mountain = { ...defaultMountain, ...mountainData };
    this.testData.mountains.push(mountain);

    return mountain;
  }

  getTestUser(role = "user") {
    return (
      this.testData.users.find((user) => user.role === role) ||
      this.testData.users[0]
    );
  }

  getTestMountain(id = 1) {
    return (
      this.testData.mountains.find((mountain) => mountain.id === id) ||
      this.testData.mountains[0]
    );
  }

  async mockApiResponse(endpoint, response) {
    // Mock API responses for testing
    return {
      endpoint,
      response,
      timestamp: new Date().toISOString(),
    };
  }

  async cleanup() {
    console.log("Cleaning up test environment...");

    // Clean up test data
    this.testData = {};
    this.testUsers = [];

    // Stop any mock servers
    for (const server of this.mockServers) {
      if (server && server.close) {
        server.close();
      }
    }
    this.mockServers = [];

    console.log("✅ Test environment cleanup completed");
  }

  async init() {
    if (!app) {
      app = require("../../app");
    }
    await this.setupTestDatabase();
    return app;
  }

  // Helper methods for common test scenarios
  async simulateUserLogin(credentials = {}) {
    if (!app) throw new Error("Express app instance not found for login test");
    // Gunakan kredensial user yang sudah ada di database
    const defaultCreds = {
      email: "administrator@gmail.com",
      password: "admin123",
    };
    const creds = { ...defaultCreds, ...credentials };
    const response = await request(app).post("/api/auth/login").send(creds);
    if (!response.body || !response.body.token) {
      throw new Error(
        "Login failed or token not returned: " +
          (response.body && response.body.message)
      );
    }
    return {
      token: response.body.token,
      user: response.body.user,
    };
  }

  async simulateRecommendationRequest(preferences = {}) {
    const defaultPreferences = {
      difficulty: "medium",
      height_preference: "1500-2500",
      location: "any",
      experience_level: "intermediate",
    };

    const finalPreferences = { ...defaultPreferences, ...preferences };

    return {
      preferences: finalPreferences,
      recommendations: this.testData.mountains.filter(
        (mountain) => mountain.difficulty === finalPreferences.difficulty
      ),
    };
  }

  async simulateFuzzyEngineResponse(input) {
    // Simulate fuzzy engine calculation
    return {
      input,
      recommendations: [
        {
          mountain_id: 1,
          score: 0.85,
          reasoning: "High match based on difficulty and experience level",
        },
        {
          mountain_id: 2,
          score: 0.72,
          reasoning: "Good match based on location preference",
        },
      ],
      calculation_time: "45ms",
    };
  }
}

module.exports = { TestingEnvironment };
