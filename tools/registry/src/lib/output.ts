/**
 * Unified output formatting for PLP Registry CLI
 */

export interface OutputOptions {
  json?: boolean;
  color?: boolean;
}

export interface SuccessOutput {
  success: true;
  message: string;
  data?: Record<string, unknown>;
}

export interface ErrorOutput {
  success: false;
  error: string;
  code?: string;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

/**
 * Apply color if enabled
 */
function colorize(text: string, color: keyof typeof colors, useColor: boolean): string {
  if (!useColor) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Format a key-value pair for display
 */
function formatKeyValue(key: string, value: unknown, useColor: boolean): string {
  const formattedKey = colorize(key, 'dim', useColor);
  return `  ${formattedKey}: ${String(value)}`;
}

/**
 * Format success output
 */
export function formatSuccess(
  message: string,
  data?: Record<string, unknown>,
  options: OutputOptions = {}
): string {
  const { json = false, color = true } = options;

  if (json) {
    const output: SuccessOutput = { success: true, message };
    if (data) {
      output.data = data;
    }
    return JSON.stringify(output, null, 2);
  }

  const lines: string[] = [];
  const checkmark = colorize('✓', 'green', color);
  const boldMessage = colorize(message, 'bold', color);

  lines.push(`${checkmark} ${boldMessage}`);

  if (data && Object.keys(data).length > 0) {
    lines.push('');
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        lines.push(formatKeyValue(key, value, color));
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format info message
 */
export function formatInfo(message: string, options: OutputOptions = {}): string {
  const { json = false, color = true } = options;

  if (json) {
    return JSON.stringify({ info: message });
  }

  const icon = colorize('ℹ', 'blue', color);
  return `${icon} ${message}`;
}

/**
 * Format warning message
 */
export function formatWarning(message: string, options: OutputOptions = {}): string {
  const { json = false, color = true } = options;

  if (json) {
    return JSON.stringify({ warning: message });
  }

  const icon = colorize('⚠', 'yellow', color);
  const text = colorize(message, 'yellow', color);
  return `${icon} ${text}`;
}

/**
 * Format a highlighted value (e.g., tokens, hashes)
 */
export function formatHighlight(
  label: string,
  value: string,
  options: OutputOptions = {}
): string {
  const { json = false, color = true } = options;

  if (json) {
    return ''; // Will be included in data object
  }

  const formattedLabel = colorize(label, 'dim', color);
  const formattedValue = colorize(value, 'cyan', color);
  return `\n${formattedLabel}\n${formattedValue}`;
}

/**
 * Print output to stdout
 */
export function print(text: string): void {
  console.log(text);
}

/**
 * Print output to stderr
 */
export function printError(text: string): void {
  console.error(text);
}
