import { describe, it, expect, vi } from "vitest";
import { registerFlow, loginFlow, guestFlow } from "./auth-flows";

describe("auth-flows", () => {
  it("registerFlow validates inputs before request", async () => {
    const setAuthMessage = vi.fn();
    const request = vi.fn();
    await registerFlow({
      getFormValues: () => ({ username: "u", email: "bad", password: "12345678" }),
      validateEmail: () => ({ valid: false, error: "bad email" }),
      validatePassword: () => ({ valid: true }),
      validateUsername: () => ({ valid: true }),
      setAuthMessage,
      log: vi.fn(),
      request,
      mapAuthError: (m) => m,
      persistTokens: vi.fn(),
      onAuthSuccess: vi.fn(),
    });
    expect(request).not.toHaveBeenCalled();
    expect(setAuthMessage).toHaveBeenCalledWith("bad email", "error");
  });

  it("loginFlow persists tokens and fires single onAuthSuccess on success", async () => {
    const persistTokens = vi.fn();
    const onAuthSuccess = vi.fn();
    await loginFlow({
      getLoginValues: () => ({ email: "ok@test.com", password: "Password123!" }),
      validateEmail: () => ({ valid: true }),
      validatePassword: () => ({ valid: true }),
      setAuthMessage: vi.fn(),
      log: vi.fn(),
      request: vi.fn().mockResolvedValue({ token: "t", refreshToken: "r" }),
      mapAuthError: (m) => m,
      persistTokens,
      onAuthSuccess,
    });
    expect(persistTokens).toHaveBeenCalledWith("t", "r");
    expect(onAuthSuccess).toHaveBeenCalledTimes(1);
  });

  it("loginFlow does NOT call onAuthSuccess when request rejects", async () => {
    const onAuthSuccess = vi.fn();
    const setAuthMessage = vi.fn();
    await loginFlow({
      getLoginValues: () => ({ email: "ok@test.com", password: "Password123!" }),
      validateEmail: () => ({ valid: true }),
      validatePassword: () => ({ valid: true }),
      setAuthMessage,
      log: vi.fn(),
      request: vi.fn().mockRejectedValue(new Error("Invalid credentials")),
      mapAuthError: (m) => m,
      persistTokens: vi.fn(),
      onAuthSuccess,
    });
    expect(onAuthSuccess).not.toHaveBeenCalled();
    expect(setAuthMessage).toHaveBeenCalledWith("Invalid credentials", "error");
  });

  it("guestFlow POSTs generated credentials to /api/auth/register and persists tokens", async () => {
    const persistTokens = vi.fn();
    const onAuthSuccess = vi.fn();
    const request = vi.fn().mockResolvedValue({ token: "t", refreshToken: "r" });
    const creds = {
      username: "invitado_abcd1234",
      email: "invitado_abcd1234@chiribito.guest",
      password: "deadbeef-cafe-1234-5678-abcdef012345",
    };
    await guestFlow({
      generateCredentials: () => creds,
      setAuthMessage: vi.fn(),
      log: vi.fn(),
      request,
      mapAuthError: (m) => m,
      persistTokens,
      onAuthSuccess,
    });
    expect(request).toHaveBeenCalledWith("/api/auth/register", creds);
    expect(persistTokens).toHaveBeenCalledWith("t", "r");
    expect(onAuthSuccess).toHaveBeenCalledTimes(1);
  });

  it("guestFlow does NOT call onAuthSuccess when register rejects (e.g. username collision)", async () => {
    const onAuthSuccess = vi.fn();
    const setAuthMessage = vi.fn();
    await guestFlow({
      generateCredentials: () => ({
        username: "invitado_collide",
        email: "invitado_collide@chiribito.guest",
        password: "deadbeef-cafe-1234-5678-abcdef012345",
      }),
      setAuthMessage,
      log: vi.fn(),
      request: vi.fn().mockRejectedValue(new Error("Username already exists")),
      mapAuthError: (m) => m,
      persistTokens: vi.fn(),
      onAuthSuccess,
    });
    expect(onAuthSuccess).not.toHaveBeenCalled();
    expect(setAuthMessage).toHaveBeenCalledWith("Username already exists", "error");
  });
});
