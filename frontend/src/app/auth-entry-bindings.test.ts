import { describe, it, expect, vi, beforeEach } from "vitest";
import { bindAuthEntryButtons } from "./auth-entry-bindings";

describe("auth-entry-bindings", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="register"></button>
      <button id="login"></button>
      <button id="join"></button>
    `;
  });

  function setup() {
    const register = vi.fn().mockResolvedValue(undefined);
    const login = vi.fn().mockResolvedValue(undefined);
    const openLobby = vi.fn().mockResolvedValue(undefined);
    const mapAuthError = vi.fn((msg: string) => `mapped:${msg}`);
    const setAuthMessage = vi.fn();
    const log = vi.fn();

    bindAuthEntryButtons({
      refs: {
        registerButton: document.querySelector("#register") as HTMLButtonElement,
        loginButton: document.querySelector("#login") as HTMLButtonElement,
        joinButton: document.querySelector("#join") as HTMLButtonElement,
      },
      register,
      login,
      openLobby,
      mapAuthError,
      setAuthMessage,
      log,
    });

    return { register, login, openLobby, mapAuthError, setAuthMessage, log };
  }

  it("binds clicks to register/login/join handlers", () => {
    const { register, login, openLobby } = setup();
    (document.querySelector("#register") as HTMLButtonElement).click();
    (document.querySelector("#login") as HTMLButtonElement).click();
    (document.querySelector("#join") as HTMLButtonElement).click();
    expect(register).toHaveBeenCalled();
    expect(login).toHaveBeenCalled();
    expect(openLobby).toHaveBeenCalled();
  });

  it("maps and shows error when register rejects", async () => {
    const { register, mapAuthError, setAuthMessage, log } = setup();
    register.mockRejectedValueOnce(new Error("r-fail"));
    (document.querySelector("#register") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(mapAuthError).toHaveBeenCalledWith("r-fail", "register");
    });
    expect(setAuthMessage).toHaveBeenCalledWith("mapped:r-fail", "error");
    expect(log).toHaveBeenCalledWith("Register error: r-fail");
  });

  it("maps and shows error when login rejects", async () => {
    const { login, mapAuthError, setAuthMessage, log } = setup();
    login.mockRejectedValueOnce(new Error("l-fail"));
    (document.querySelector("#login") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(mapAuthError).toHaveBeenCalledWith("l-fail", "login");
    });
    expect(setAuthMessage).toHaveBeenCalledWith("mapped:l-fail", "error");
    expect(log).toHaveBeenCalledWith("Login error: l-fail");
  });

  it("logs lobby error when openLobby rejects", async () => {
    const { openLobby, log } = setup();
    openLobby.mockRejectedValueOnce(new Error("join-fail"));
    (document.querySelector("#join") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith("Lobby error: join-fail");
    });
  });
});
