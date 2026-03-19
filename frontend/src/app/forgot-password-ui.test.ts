import { describe, it, expect, vi, beforeEach } from "vitest";
import { bindForgotPasswordUi } from "./forgot-password-ui";

describe("forgot-password-ui", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="auth-login-form"></form>
      <div id="forgot-password-block" class="hidden"></div>
      <a id="forgot-password-link" href="#">forgot</a>
      <input id="forgot-password-email" />
      <button id="forgot-password-submit"></button>
      <button id="forgot-password-back"></button>
      <input id="email" />
    `;
  });

  function setup() {
    const request = vi.fn().mockResolvedValue({});
    const setAuthMessage = vi.fn();
    const validateEmail = vi.fn((email: string) => ({ valid: email.includes("@"), error: "invalid" }));
    const log = vi.fn();

    bindForgotPasswordUi({
      refs: {
        authLoginForm: document.querySelector("#auth-login-form"),
        forgotPasswordBlock: document.querySelector("#forgot-password-block"),
        forgotPasswordLink: document.querySelector("#forgot-password-link"),
        forgotPasswordEmail: document.querySelector("#forgot-password-email"),
        forgotPasswordSubmit: document.querySelector("#forgot-password-submit"),
        forgotPasswordBack: document.querySelector("#forgot-password-back"),
        loginEmailInput: document.querySelector("#email"),
      },
      setAuthMessage,
      request,
      validateEmail,
      log,
    });

    return { request, setAuthMessage, validateEmail, log };
  }

  it("toggles login/forgot views and prefills email", () => {
    const { setAuthMessage } = setup();
    (document.querySelector("#email") as HTMLInputElement).value = "ana@test.com";
    (document.querySelector("#forgot-password-link") as HTMLAnchorElement).click();

    expect(document.querySelector("#auth-login-form")?.classList.contains("hidden")).toBe(true);
    expect(document.querySelector("#forgot-password-block")?.classList.contains("hidden")).toBe(false);
    expect((document.querySelector("#forgot-password-email") as HTMLInputElement).value).toBe("ana@test.com");
    expect(setAuthMessage).toHaveBeenCalledWith("", "info");
  });

  it("back button restores login form", () => {
    const { setAuthMessage } = setup();
    (document.querySelector("#forgot-password-back") as HTMLButtonElement).click();
    expect(document.querySelector("#auth-login-form")?.classList.contains("hidden")).toBe(false);
    expect(document.querySelector("#forgot-password-block")?.classList.contains("hidden")).toBe(true);
    expect(setAuthMessage).toHaveBeenCalledWith("", "info");
  });

  it("validates email before request", () => {
    const { request, setAuthMessage } = setup();
    (document.querySelector("#forgot-password-email") as HTMLInputElement).value = "nope";
    (document.querySelector("#forgot-password-submit") as HTMLButtonElement).click();
    expect(request).not.toHaveBeenCalled();
    expect(setAuthMessage).toHaveBeenCalledWith("invalid", "error");
  });

  it("sends forgot password request and shows success", async () => {
    const { request, setAuthMessage } = setup();
    (document.querySelector("#forgot-password-email") as HTMLInputElement).value = "ok@test.com";
    (document.querySelector("#forgot-password-submit") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(request).toHaveBeenCalledWith("/api/auth/forgot-password", { email: "ok@test.com" });
    });
    expect(setAuthMessage).toHaveBeenCalledWith("Enviando enlace...", "info");
    expect(setAuthMessage).toHaveBeenCalledWith(
      "Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada.",
      "success"
    );
  });

  it("logs and shows error when request fails", async () => {
    const request = vi.fn().mockRejectedValue(new Error("network"));
    const setAuthMessage = vi.fn();
    const validateEmail = vi.fn(() => ({ valid: true }));
    const log = vi.fn();
    bindForgotPasswordUi({
      refs: {
        authLoginForm: document.querySelector("#auth-login-form"),
        forgotPasswordBlock: document.querySelector("#forgot-password-block"),
        forgotPasswordLink: document.querySelector("#forgot-password-link"),
        forgotPasswordEmail: document.querySelector("#forgot-password-email"),
        forgotPasswordSubmit: document.querySelector("#forgot-password-submit"),
        forgotPasswordBack: document.querySelector("#forgot-password-back"),
        loginEmailInput: document.querySelector("#email"),
      },
      setAuthMessage,
      request,
      validateEmail,
      log,
    });

    (document.querySelector("#forgot-password-email") as HTMLInputElement).value = "ok@test.com";
    (document.querySelector("#forgot-password-submit") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith(expect.stringContaining("Forgot password error:"));
    });
    expect(setAuthMessage).toHaveBeenCalledWith("No se pudo enviar el enlace. Inténtalo de nuevo más tarde.", "error");
  });
});
