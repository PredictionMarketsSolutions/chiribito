/**
 * Auth API and overlay helpers (request, form values, error mapping, overlay visibility).
 */
import { API_URL } from "./config";
import { dom } from "./dom-refs";

export async function request(path: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let maybeJson: unknown = null;
  if (text) {
    try {
      maybeJson = JSON.parse(text);
    } catch {
      maybeJson = null;
    }
  }

  if (!response.ok) {
    if (maybeJson && typeof maybeJson === "object") {
      const record = maybeJson as Record<string, unknown>;
      const apiError = typeof record.error === "string" ? record.error : undefined;
      const apiMessage = typeof record.message === "string" ? record.message : undefined;
      throw new Error((apiError || apiMessage || response.statusText) as string);
    }
    throw new Error(text || response.statusText);
  }

  if (!text) return {};
  if (maybeJson && typeof maybeJson === "object") return maybeJson as Record<string, unknown>;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Respuesta invalida del servidor.");
  }
}

export function getFormValues(): { username: string; email: string; password: string } {
  const username = (document.querySelector("#username") as HTMLInputElement)?.value?.trim() ?? "";
  const email = (document.querySelector("#email") as HTMLInputElement)?.value?.trim() ?? "";
  const password = (document.querySelector("#password") as HTMLInputElement)?.value ?? "";

  if (!username || !email || !password) {
    const missing = [
      !username ? "username" : "",
      !email ? "email" : "",
      !password ? "password" : ""
    ].filter(Boolean).join(", ");
    throw new Error(`Missing required fields: ${missing}`);
  }

  return { username, email, password };
}

export function getLoginValues(): { email: string; password: string } {
  const email = (document.querySelector("#email") as HTMLInputElement)?.value?.trim() ?? "";
  const password = (document.querySelector("#password") as HTMLInputElement)?.value ?? "";

  if (!email || !password) {
    const missing = [!email ? "email" : "", !password ? "password" : ""].filter(Boolean).join(", ");
    throw new Error(`Missing required fields: ${missing}`);
  }

  return { email, password };
}

export function mapAuthError(message: string, context: "login" | "register"): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "No se pudo conectar al servidor. Verifica la conexion.";
  }
  if (normalized.includes("missing required fields")) return "Completa todos los campos requeridos.";
  if (normalized.includes("invalid credentials")) return "Correo o contrasena incorrectos.";
  if (normalized.includes("email and password are required")) {
    return "Correo y contrasena son obligatorios.";
  }
  if (normalized.includes("username, email, and password are required")) {
    return "Usuario, correo y contrasena son obligatorios.";
  }
  if (normalized.includes("password must be at least 6")) {
    return "La contrasena debe tener al menos 6 caracteres.";
  }
  if (normalized.includes("user with this email or username already exists")) {
    return "Ese usuario o correo ya existe.";
  }
  if (normalized.includes("internal server error")) return "Error del servidor. Intenta de nuevo.";
  if (normalized.includes("auth_timeout") || normalized.includes("session expired")) {
    return "Sesion expirada. Vuelve a iniciar sesion.";
  }
  if (normalized.includes("auth_unavailable")) {
    return "Servicio no disponible. Intenta mas tarde.";
  }
  if (context === "login") return "No pudimos iniciar sesion. Verifica tus datos.";
  return "No pudimos registrar la cuenta. Verifica tus datos.";
}

export function setAuthOverlayVisible(visible: boolean): void {
  const el = dom.authOverlay;
  if (el) el.classList.toggle("hidden", !visible);
}

export function setAuthMessage(message: string, type: "success" | "error" | "info" = "info"): void {
  const el = dom.authMessage;
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("visible", Boolean(message));
  el.classList.toggle("success", type === "success");
  el.classList.toggle("error", type === "error");
}
