type SetAuthMessageFn = (message: string, type?: "success" | "error" | "info") => void;
type RequestFn = (path: string, body: Record<string, unknown>) => Promise<unknown>;
type ValidateEmailFn = (email: string) => { valid: boolean; error?: string };
type LogFn = (message: string) => void;

export type ForgotPasswordUiRefs = {
  authLoginForm: HTMLElement | null;
  forgotPasswordBlock: HTMLElement | null;
  forgotPasswordLink: HTMLAnchorElement | null;
  forgotPasswordEmail: HTMLInputElement | null;
  forgotPasswordSubmit: HTMLButtonElement | null;
  forgotPasswordBack: HTMLButtonElement | null;
  loginEmailInput: HTMLInputElement | null;
};

export type ForgotPasswordDeps = {
  refs: ForgotPasswordUiRefs;
  setAuthMessage: SetAuthMessageFn;
  request: RequestFn;
  validateEmail: ValidateEmailFn;
  log: LogFn;
};

export function bindForgotPasswordUi(deps: ForgotPasswordDeps): void {
  const {
    authLoginForm,
    forgotPasswordBlock,
    forgotPasswordLink,
    forgotPasswordEmail,
    forgotPasswordSubmit,
    forgotPasswordBack,
    loginEmailInput,
  } = deps.refs;

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      authLoginForm?.classList.add("hidden");
      forgotPasswordBlock?.classList.remove("hidden");
      const existingEmail = (loginEmailInput?.value ?? "").trim();
      if (forgotPasswordEmail && !forgotPasswordEmail.value.trim() && existingEmail) {
        forgotPasswordEmail.value = existingEmail;
      }
      deps.setAuthMessage("", "info");
    });
  }

  if (forgotPasswordBack) {
    forgotPasswordBack.addEventListener("click", () => {
      authLoginForm?.classList.remove("hidden");
      forgotPasswordBlock?.classList.add("hidden");
      deps.setAuthMessage("", "info");
    });
  }

  if (forgotPasswordSubmit) {
    forgotPasswordSubmit.addEventListener("click", async () => {
      const email = forgotPasswordEmail?.value?.trim() ?? "";
      const validation = deps.validateEmail(email);
      if (!validation.valid) {
        deps.setAuthMessage(validation.error ?? "Email no válido", "error");
        return;
      }

      deps.setAuthMessage("Enviando enlace...", "info");
      try {
        await deps.request("/api/auth/forgot-password", { email });
        deps.setAuthMessage(
          "Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada.",
          "success"
        );
      } catch (error) {
        deps.setAuthMessage("No se pudo enviar el enlace. Inténtalo de nuevo más tarde.", "error");
        deps.log(`Forgot password error: ${error}`);
      }
    });
  }
}
