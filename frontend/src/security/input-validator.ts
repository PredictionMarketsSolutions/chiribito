/**
 * Input validation for frontend security
 * Validates user inputs before sending to server
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string | number | any;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check length
  if (trimmed.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }

  // Check for common weak patterns
  if (password === 'password' || password === '12345678') {
    return { valid: false, error: 'Password is too common' };
  }

  return { valid: true, sanitized: password };
}

/**
 * Username validation
 */
export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  // Check length
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Username must be at most 50 characters' };
  }

  // Allow alphanumeric, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Bet amount validation (for poker)
 */
export function validateBetAmount(
  amount: any,
  minBet: number = 1,
  maxBet: number = 1000000
): ValidationResult {
  // Try to parse as number
  let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Bet amount must be a valid number' };
  }

  if (numAmount < 0) {
    return { valid: false, error: 'Bet amount cannot be negative' };
  }

  // Don't allow very large numbers
  if (!Number.isFinite(numAmount)) {
    return { valid: false, error: 'Invalid bet amount' };
  }

  if (numAmount < minBet) {
    return {
      valid: false,
      error: `Bet must be at least ${minBet}`,
    };
  }

  if (numAmount > maxBet) {
    return {
      valid: false,
      error: `Bet cannot exceed ${maxBet}`,
    };
  }

  return { valid: true, sanitized: numAmount };
}

/**
 * Player stack validation
 */
export function validatePlayerStack(
  stack: any,
  max: number = 10000000
): ValidationResult {
  let numStack = typeof stack === 'string' ? parseFloat(stack) : stack;

  if (isNaN(numStack)) {
    return { valid: false, error: 'Stack must be a valid number' };
  }

  if (numStack < 0) {
    return { valid: false, error: 'Stack cannot be negative' };
  }

  if (numStack > max) {
    return { valid: false, error: `Stack exceeds maximum of ${max}` };
  }

  return { valid: true, sanitized: numStack };
}

/**
 * Action validation (fold, check, call, raise, all-in)
 */
export function validatePokerAction(
  action: string
): ValidationResult {
  if (!action) {
    return { valid: false, error: 'Action is required' };
  }

  const validActions = ['fold', 'check', 'call', 'raise', 'all-in', 'bet'];
  const lowerAction = action.toLowerCase().trim();

  if (!validActions.includes(lowerAction)) {
    return {
      valid: false,
      error: `Invalid action. Valid actions: ${validActions.join(', ')}`,
    };
  }

  return { valid: true, sanitized: lowerAction };
}

/**
 * String sanitization (XSS prevention)
 */
export function sanitizeString(str: string, maxLength: number = 255): ValidationResult {
  if (typeof str !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  const trimmed = str.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
  }

  // Remove potentially harmful characters
  const sanitized = trimmed
    .replace(/[<>\"'&]/g, '') // Remove HTML special characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return { valid: true, sanitized };
}

/**
 * Simple UUID validation (v4)
 */
export function validateUUID(uuid: string): ValidationResult {
  if (!uuid) {
    return { valid: false, error: 'UUID is required' };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true, sanitized: uuid };
}

/**
 * Validate form data object
 */
export function validateFormData(
  data: Record<string, any>,
  schema: Record<string, (value: any) => ValidationResult>
): {
  valid: boolean;
  errors?: Record<string, string>;
  sanitized?: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const value = data[key];
    const result = validator(value);

    if (!result.valid) {
      errors[key] = result.error || 'Invalid value';
    } else {
      sanitized[key] = result.sanitized !== undefined ? result.sanitized : value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    sanitized,
  };
}

/**
 * Validate login form
 */
export function validateLoginForm(
  email: string,
  password: string
): {
  valid: boolean;
  errors?: Record<string, string>;
  sanitized?: { email: string; password: string };
} {
  return validateFormData(
    { email, password },
    {
      email: validateEmail,
      password: validatePassword,
    }
  ) as any;
}

/**
 * Validate register form
 */
export function validateRegisterForm(
  email: string,
  username: string,
  password: string,
  confirmPassword: string
): {
  valid: boolean;
  errors?: Record<string, string>;
  sanitized?: any;
} {
  const errors: Record<string, string> = {};

  // Validate email
  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.error!;
  }

  // Validate username
  const usernameResult = validateUsername(username);
  if (!usernameResult.valid) {
    errors.username = usernameResult.error!;
  }

  // Validate password
  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.error!;
  }

  // Check password match
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    sanitized:
      Object.keys(errors).length === 0
        ? {
            email: emailResult.sanitized,
            username: usernameResult.sanitized,
            password: passwordResult.sanitized,
          }
        : undefined,
  };
}

/**
 * Validate bet action with amount
 */
export function validateBetAction(
  action: string,
  amount: any,
  currentStack: number,
  minBet: number = 1
): ValidationResult {
  // Validate action
  const actionResult = validatePokerAction(action);
  if (!actionResult.valid) {
    return actionResult;
  }

  const lowerAction = (actionResult.sanitized as string).toLowerCase();

  // Actions that don't require amount
  if (['fold', 'check', 'call', 'all-in'].includes(lowerAction)) {
    return { valid: true, sanitized: lowerAction };
  }

  // Actions requiring amount (raise, bet)
  if (['raise', 'bet'].includes(lowerAction)) {
    const amountResult = validateBetAmount(amount, minBet, currentStack);
    if (!amountResult.valid) {
      return amountResult;
    }

    return {
      valid: true,
      sanitized: {
        action: lowerAction,
        amount: amountResult.sanitized,
      },
    };
  }

  return { valid: true, sanitized: lowerAction };
}

/**
 * Input validation helper - batch validate multiple fields
 */
export const inputValidators = {
  email: validateEmail,
  password: validatePassword,
  username: validateUsername,
  betAmount: validateBetAmount,
  playerStack: validatePlayerStack,
  pokerAction: validatePokerAction,
  string: sanitizeString,
  uuid: validateUUID,
};
