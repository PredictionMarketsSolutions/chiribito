type AuthAction = () => Promise<void>;
type MapAuthErrorFn = (message: string, mode: "register" | "login") => string;
type SetAuthMessageFn = (message: string, type?: "success" | "error" | "info") => void;
type LogFn = (message: string) => void;

export type AuthEntryBindingRefs = {
  registerButton: HTMLButtonElement;
  loginButton: HTMLButtonElement;
  joinButton: HTMLButtonElement;
};

export type AuthEntryBindingDeps = {
  refs: AuthEntryBindingRefs;
  register: AuthAction;
  login: AuthAction;
  joinAsGuest: AuthAction;
  mapAuthError: MapAuthErrorFn;
  setAuthMessage: SetAuthMessageFn;
  log: LogFn;
};

export function bindAuthEntryButtons(deps: AuthEntryBindingDeps): void {
  deps.refs.registerButton.addEventListener("click", () => {
    deps.register().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const mapped = deps.mapAuthError(message, "register");
      deps.setAuthMessage(mapped, "error");
      deps.log(`Register error: ${message}`);
    });
  });

  deps.refs.loginButton.addEventListener("click", () => {
    deps.login().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const mapped = deps.mapAuthError(message, "login");
      deps.setAuthMessage(mapped, "error");
      deps.log(`Login error: ${message}`);
    });
  });

  deps.refs.joinButton.addEventListener("click", () => {
    deps.joinAsGuest().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      deps.log(`Guest entry error: ${message}`);
    });
  });
}
