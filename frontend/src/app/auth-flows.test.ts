import { describe, it, expect, vi } from "vitest";
import { registerFlow, loginFlow } from "./auth-flows";

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

  it("loginFlow persists tokens and triggers auto rejoin on success", async () => {
    const persistTokens = vi.fn();
    const onAuthSuccess = vi.fn();
    const runAutoRejoin = vi.fn();
    const joinRoom = vi.fn().mockResolvedValue(undefined);
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
      runAutoRejoin,
      joinRoom,
    });
    expect(persistTokens).toHaveBeenCalledWith("t", "r");
    expect(onAuthSuccess).toHaveBeenCalled();
    expect(runAutoRejoin).toHaveBeenCalledWith(joinRoom);
  });
});
