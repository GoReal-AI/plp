/**
 * Error classes and handling utilities for PLP Registry CLI
 */

export type ExitCode = 0 | 1 | 2 | 3;

export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  CONFIG_ERROR: 2,
  AUTH_ERROR: 3,
} as const;

/**
 * Base error class for PLP Registry operations
 */
export class RegistryError extends Error {
  readonly code: string;
  readonly statusCode?: number;

  constructor(message: string, code = 'REGISTRY_ERROR', statusCode?: number) {
    super(message);
    this.name = 'RegistryError';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Configuration-related errors (missing config, invalid format)
 */
export class ConfigError extends RegistryError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

/**
 * API request errors (non-2xx responses)
 */
export class ApiError extends RegistryError {
  constructor(message: string, statusCode?: number) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'ApiError';
  }
}

/**
 * Authentication errors (401, invalid credentials)
 */
export class AuthError extends RegistryError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

/**
 * Network errors (timeout, connection refused)
 */
export class NetworkError extends RegistryError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends RegistryError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Get appropriate exit code for an error
 */
export function getExitCode(error: unknown): ExitCode {
  if (error instanceof ConfigError) {
    return EXIT_CODES.CONFIG_ERROR;
  }
  if (error instanceof AuthError) {
    return EXIT_CODES.AUTH_ERROR;
  }
  return EXIT_CODES.GENERAL_ERROR;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Format error for JSON output
 */
export function formatErrorJson(error: unknown): string {
  const message = getErrorMessage(error);
  const code = error instanceof RegistryError ? error.code : undefined;

  return JSON.stringify({ success: false, error: message, code }, null, 2);
}

/**
 * Format error for text output
 */
export function formatErrorText(error: unknown, useColor = true): string {
  const message = getErrorMessage(error);
  const red = (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);
  return `${red('Error:')} ${message}`;
}

/**
 * Handle error and exit process with appropriate code
 */
export function handleError(
  error: unknown,
  options: { json?: boolean; color?: boolean } = {}
): never {
  const output = options.json
    ? formatErrorJson(error)
    : formatErrorText(error, options.color !== false);

  console.error(output);
  process.exit(getExitCode(error));
}
