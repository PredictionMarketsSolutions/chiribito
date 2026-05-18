type AuthMessageType = "success" | "error" | "info";

type ValidationResult = { valid: boolean; error?: string };

type AuthApiResponse = {
  token?: unknown;
  refreshToken?: unknown;
};

export type RegisterFlowDeps = {
  getFormValues: () => { username: string; email: string; password: string };
  validateEmail: (email: string) => ValidationResult;
  validatePassword: (password: string) => ValidationResult;
  validateUsername: (username: string) => ValidationResult;
  setAuthMessage: (message: string, type?: AuthMessageType) => void;
  log: (message: string) => void;
  request: (path: string, body: Record<string, unknown>) => Promise<AuthApiResponse>;
  mapAuthError: (message: string, mode: "register") => string;
  persistTokens: (token: string | null, refreshToken: string | null) => void;
  onAuthSuccess: () => void;
};

export async function registerFlow(deps: RegisterFlowDeps): Promise<void> {
  const { username, email, password } = deps.getFormValues();
  const emailValidation = deps.validateEmail(email);
  if (!emailValidation.valid) {
    deps.setAuthMessage(emailValidation.error ?? "Email no válido", "error");
    return;
  }
  const passwordValidation = deps.validatePassword(password);
  if (!passwordValidation.valid) {
    deps.setAuthMessage(passwordValidation.error ?? "Contraseña no válida", "error");
    return;
  }
  const usernameValidation = deps.validateUsername(username);
  if (!usernameValidation.valid) {
    deps.setAuthMessage(usernameValidation.error ?? "Usuario no válido", "error");
    return;
  }

  deps.log("Registering with secure client...");
  deps.setAuthMessage("Creando cuenta...", "info");
  try {
    const data = await deps.request("/api/auth/register", { username, email, password });
    const token = typeof data.token === "string" ? data.token : null;
    const refreshToken = typeof data.refreshToken === "string" ? data.refreshToken : null;
    deps.persistTokens(token, refreshToken);
    deps.onAuthSuccess();
    deps.log("Registered and token received.");
    deps.setAuthMessage("Registro correcto. Puedes unirte a la mesa.", "success");
  } catch (error) {
    const message = deps.mapAuthError(error instanceof Error ? error.message : String(error), "register");
    deps.setAuthMessage(message, "error");
    deps.log(`Registration error: ${message}`);
  }
}

export type LoginFlowDeps = {
  getLoginValues: () => { email: string; password: string };
  validateEmail: (email: string) => ValidationResult;
  validatePassword: (password: string) => ValidationResult;
  setAuthMessage: (message: string, type?: AuthMessageType) => void;
  log: (message: string) => void;
  request: (path: string, body: Record<string, unknown>) => Promise<AuthApiResponse>;
  mapAuthError: (message: string, mode: "login") => string;
  persistTokens: (token: string | null, refreshToken: string | null) => void;
  /** Single post-login callback: persist tokens are already done by the
   *  time this runs. The caller is responsible for driving recovery
   *  (recoverMesaOrOpenLobby — reconnect → joinById → lobby). We do NOT
   *  expose a separate runAutoRejoin hook any more; routing through one
   *  helper kills the race where openLobby ran first and cleared
   *  lastRoomId before the rejoin attempt could read it. */
  onAuthSuccess: () => void;
};

export async function loginFlow(deps: LoginFlowDeps): Promise<void> {
  const { email, password } = deps.getLoginValues();
  const emailValidation = deps.validateEmail(email);
  if (!emailValidation.valid) {
    deps.setAuthMessage(emailValidation.error ?? "Email no válido", "error");
    return;
  }
  const passwordValidation = deps.validatePassword(password);
  if (!passwordValidation.valid) {
    deps.setAuthMessage(passwordValidation.error ?? "Contraseña no válida", "error");
    return;
  }

  deps.log("Logging in with secure client...");
  deps.setAuthMessage("Verificando credenciales...", "info");
  try {
    const data = await deps.request("/api/auth/login", { email, password });
    const token = typeof data.token === "string" ? data.token : null;
    const refreshToken = typeof data.refreshToken === "string" ? data.refreshToken : null;
    deps.persistTokens(token, refreshToken);
    deps.log("Logged in and token received.");
    deps.onAuthSuccess();
  } catch (error) {
    const message = deps.mapAuthError(error instanceof Error ? error.message : String(error), "login");
    deps.setAuthMessage(message, "error");
    deps.log(`Login error: ${message}`);
  }
}
