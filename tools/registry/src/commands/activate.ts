/**
 * Activate command - Activate PLP server with the registry
 */

import { readConfig, updateConfig, validateConfig } from '../lib/config.js';
import { makeRequest, endpoints } from '../lib/http.js';
import { formatSuccess, print } from '../lib/output.js';
import { handleError, ValidationError } from '../lib/errors.js';
import type { CommandOptions, ActivateRequest, ActivateResponse } from '../types.js';

/**
 * Activate a PLP server with the registry
 */
export async function activateCommand(
  serverUrl: string,
  options: CommandOptions
): Promise<void> {
  try {
    // Validate server URL
    const normalizedUrl = validateAndNormalizeUrl(serverUrl);

    // Read and validate config
    const config = await readConfig(options.config);
    validateConfig(config, ['slug', 'installationHash']);

    // Prepare request
    const body: ActivateRequest = {
      serverUrl: normalizedUrl,
    };

    // Make API request
    const response = await makeRequest<ActivateResponse>(
      endpoints.activate(config.slug!),
      {
        method: 'POST',
        body,
        authToken: config.installationHash,
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from registry');
    }

    const { deploymentHash, complianceScore, compliancePassed, complianceStatus } = response.data;

    // Save deployment hash to config
    await updateConfig(
      { deploymentHash },
      options.config
    );

    // Output success
    print(
      formatSuccess(
        'Server activated successfully',
        {
          slug: config.slug!,
          serverUrl: normalizedUrl,
          deploymentHash: maskHash(deploymentHash),
          complianceStatus,
          complianceScore: `${complianceScore}/100`,
          passed: compliancePassed ? 'yes' : 'no',
        },
        { json: options.json, color: options.color }
      )
    );

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Validate and normalize the server URL
 */
function validateAndNormalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationError('Server URL must use http or https protocol');
    }

    // Remove trailing slash
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid server URL format');
  }
}

/**
 * Mask a hash for display (show first/last 4 chars)
 */
function maskHash(hash: string): string {
  if (hash.length <= 12) {
    return hash;
  }
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}
