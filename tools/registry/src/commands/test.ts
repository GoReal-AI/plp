/**
 * Test command - Run PLP server compliance tests
 */

import { runComplianceTests } from '../tests/index.js';
import { formatReport, formatText, formatJson } from '../reporter.js';
import { handleError, ValidationError } from '../lib/errors.js';
import type { TestCommandOptions } from '../types.js';

/**
 * Execute compliance tests against a PLP server
 */
export async function testCommand(
  url: string,
  options: TestCommandOptions
): Promise<void> {
  try {
    // Validate and normalize URL
    const baseUrl = validateAndNormalizeUrl(url);

    // Parse timeout
    const timeout = parseTimeout(options.timeout);

    // Run compliance tests
    const groups = await runComplianceTests(baseUrl, {
      authToken: options.token,
      timeout,
      debug: options.debug,
    });

    // Generate and output report
    const report = formatReport(baseUrl, groups);

    if (options.json) {
      console.log(formatJson(report));
    } else {
      console.log(formatText(report, options.color !== false));
    }

    // Exit with appropriate code (0 = passed, 1 = failed)
    process.exit(report.passed ? 0 : 1);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Validate URL format and normalize it
 */
function validateAndNormalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationError('URL must use http or https protocol');
    }

    // Remove trailing slash for consistency
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL format');
  }
}

/**
 * Parse and validate timeout value
 */
function parseTimeout(value?: string): number {
  const DEFAULT_TIMEOUT = 10000;
  const MIN_TIMEOUT = 1000;
  const MAX_TIMEOUT = 300000;

  if (!value) {
    return DEFAULT_TIMEOUT;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed < MIN_TIMEOUT || parsed > MAX_TIMEOUT) {
    throw new ValidationError(
      `Timeout must be between ${MIN_TIMEOUT}ms and ${MAX_TIMEOUT}ms`
    );
  }

  return parsed;
}
