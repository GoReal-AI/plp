/**
 * Login command - Generate a temporary login token
 */

import { readConfig, validateConfig } from '../lib/config.js';
import { makeRequest, endpoints } from '../lib/http.js';
import { formatSuccess, formatHighlight, print } from '../lib/output.js';
import { handleError } from '../lib/errors.js';
import type { CommandOptions, LoginResponse } from '../types.js';

/**
 * Generate a temporary login token for registry management
 */
export async function loginCommand(options: CommandOptions): Promise<void> {
  try {
    // Read and validate config
    const config = await readConfig(options.config);
    validateConfig(config, ['deploymentHash']);

    // Make API request
    const response = await makeRequest<LoginResponse>(
      endpoints.login(),
      {
        method: 'POST',
        authToken: config.deploymentHash,
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from registry');
    }

    const { loginHash, expiresAt, expiresIn } = response.data;

    // Format expiry for display
    const expiryDisplay = formatExpiry(expiresAt, expiresIn);

    if (options.json) {
      // JSON output includes the full token
      print(
        formatSuccess(
          'Login token generated',
          {
            loginHash,
            expiresAt,
            expiresIn,
          },
          { json: true }
        )
      );
    } else {
      // Text output with prominent token display
      print(
        formatSuccess(
          'Login token generated',
          { expires: expiryDisplay },
          { json: false, color: options.color }
        )
      );
      print(formatHighlight('Token:', loginHash, { color: options.color }));
    }

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Format expiry time for human-readable display
 */
function formatExpiry(expiresAt: string, expiresIn: number): string {
  // Try to parse and format the expiry time
  try {
    const date = new Date(expiresAt);
    const timeStr = date.toLocaleTimeString();

    // Convert seconds to minutes for display
    const minutes = Math.round(expiresIn / 60);
    return `${timeStr} (${minutes} minutes)`;
  } catch {
    // Fallback if date parsing fails
    return `${Math.round(expiresIn / 60)} minutes`;
  }
}
