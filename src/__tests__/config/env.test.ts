/**
 * Tests for centralized config/env.
 */

describe("config/env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("API_URL", () => {
    it("defaults to http://localhost:3000 when API_URL unset", () => {
      delete process.env.API_URL;
      const { API_URL } = require("../../config/env");
      expect(API_URL).toBe("http://localhost:3000");
    });

    it("uses API_URL when set", () => {
      process.env.API_URL = "https://api.example.com";
      jest.resetModules();
      const { API_URL } = require("../../config/env");
      expect(API_URL).toBe("https://api.example.com");
    });
  });

  describe("JWT_SECRET", () => {
    it("defaults to empty string when unset", () => {
      delete process.env.JWT_SECRET;
      jest.resetModules();
      const { JWT_SECRET } = require("../../config/env");
      expect(JWT_SECRET).toBe("");
    });
  });

  describe("numeric env", () => {
    it("TURN_TIMEOUT_MS defaults to 60000", () => {
      delete process.env.TURN_TIMEOUT_MS;
      jest.resetModules();
      const { TURN_TIMEOUT_MS } = require("../../config/env");
      expect(TURN_TIMEOUT_MS).toBe(60_000);
    });

    it("HEARTBEAT_INTERVAL_MS uses env when valid number", () => {
      process.env.HEARTBEAT_INTERVAL_MS = "15000";
      jest.resetModules();
      const { HEARTBEAT_INTERVAL_MS } = require("../../config/env");
      expect(HEARTBEAT_INTERVAL_MS).toBe(15_000);
    });

    it("AUTH_REQUEST_TIMEOUT_MS defaults to 8000", () => {
      delete process.env.AUTH_REQUEST_TIMEOUT_MS;
      jest.resetModules();
      const { AUTH_REQUEST_TIMEOUT_MS } = require("../../config/env");
      expect(AUTH_REQUEST_TIMEOUT_MS).toBe(8_000);
    });
  });

  describe("validateEnv", () => {
    it("returns ok true when DISABLE_ENV_VALIDATION is true", () => {
      process.env.DISABLE_ENV_VALIDATION = "true";
      jest.resetModules();
      const { validateEnv } = require("../../config/env");
      expect(validateEnv()).toEqual({ ok: true, missing: [] });
    });

    it("returns ok true and missing empty in development when JWT_SECRET placeholder", () => {
      process.env.DISABLE_ENV_VALIDATION = "";
      process.env.NODE_ENV = "development";
      process.env.JWT_SECRET = "dev-secret-change-in-production";
      jest.resetModules();
      const { validateEnv } = require("../../config/env");
      expect(validateEnv().ok).toBe(true);
    });
  });
});
