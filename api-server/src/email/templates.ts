/**
 * Plantillas de email en español para Chiribito.
 * Diseño responsive y accesible para clientes de correo.
 */

const currentYear = new Date().getFullYear();

const baseStyles = {
  fontFamily: '"Segoe UI", Arial, sans-serif',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '24px',
  color: '#333',
  lineHeight: '1.5',
};

const footerHtml = `
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 28px 0 16px;">
  <p style="color: #888; font-size: 12px; text-align: center;">
    © ${currentYear} Chiribito. Todos los derechos reservados.
  </p>
`;

function wrapBody(content: string): string {
  return `
<div style="font-family: ${baseStyles.fontFamily}; max-width: ${baseStyles.maxWidth}; margin: ${baseStyles.margin}; padding: ${baseStyles.padding}; color: ${baseStyles.color}; line-height: ${baseStyles.lineHeight};">
  ${content}
  ${footerHtml}
</div>`;
}

/**
 * Plantilla: restablecimiento de contraseña
 */
export function passwordResetTemplate(resetLink: string): string {
  const content = `
    <h2 style="color: #1a1a1a; margin-top: 0;">Restablecer contraseña</h2>
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p>Haz clic en el enlace de abajo para elegir una nueva contraseña (válido 30 minutos):</p>
    <p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Restablecer contraseña
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">O copia este enlace en tu navegador:</p>
    <p style="word-break: break-all; font-size: 13px; color: #555;">${resetLink}</p>
    <p style="color: #666; font-size: 13px;">
      Si no solicitaste este cambio, ignora este correo. El enlace caducará en 30 minutos.
    </p>
  `;
  return wrapBody(content);
}

/**
 * Plantilla: verificación de email
 */
export function verificationTemplate(verificationLink: string, verificationCode: string): string {
  const content = `
    <h2 style="color: #1a1a1a; margin-top: 0;">Verifica tu correo electrónico</h2>
    <p>¡Gracias por registrarte! Verifica tu correo para activar tu cuenta.</p>
    <p>Haz clic en el enlace de abajo (válido 24 horas):</p>
    <p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Verificar correo
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">O introduce este código en la aplicación: <strong>${verificationCode}</strong></p>
    <p style="color: #666; font-size: 13px;">
      Si no creaste esta cuenta, ignora este correo. El enlace caduca en 24 horas.
    </p>
  `;
  return wrapBody(content);
}

/**
 * Plantilla: bienvenida tras registro
 */
export function welcomeTemplate(username: string, appUrl: string): string {
  const content = `
    <h2 style="color: #1a1a1a; margin-top: 0;">¡Hola, ${escapeHtml(username)}!</h2>
    <p>Tu cuenta se ha creado correctamente. Ya puedes empezar a jugar al póker.</p>
    <p>
      <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Ir a Chiribito
      </a>
    </p>
    <p style="color: #666; font-size: 13px;">
      Si tienes alguna duda, contacta con nuestro equipo de soporte.
    </p>
  `;
  return wrapBody(content);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c] ?? c);
}
