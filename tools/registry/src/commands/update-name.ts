/**
 * Update name command - Update vendor name in the registry
 */

import { readConfig, validateConfig } from '../lib/config.js';
import { makeRequest, endpoints } from '../lib/http.js';
import { formatSuccess, print } from '../lib/output.js';
import { handleError, ValidationError } from '../lib/errors.js';
import type {
  CommandOptions,
  UpdateNameRequest,
  UpdateNameResponse,
} from '../types.js';

/**
 * Update vendor name in the registry
 */
export async function updateNameCommand(
  name: string,
  options: CommandOptions
): Promise<void> {
  try {
    // Validate input
    const trimmedName = validateName(name);

    // Read and validate config
    const config = await readConfig(options.config);
    validateConfig(config, ['slug', 'deploymentHash']);

    // Prepare request
    const body: UpdateNameRequest = {
      name: trimmedName,
    };

    // Make API request
    const response = await makeRequest<UpdateNameResponse>(
      endpoints.updateName(config.slug!),
      {
        method: 'POST',
        body,
        authToken: config.deploymentHash,
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from registry');
    }

    // Output success
    print(
      formatSuccess(
        'Vendor name updated',
        { name: response.data.vendorName },
        { json: options.json, color: options.color }
      )
    );

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Validate vendor name
 */
function validateName(name: string): string {
  const trimmed = name?.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new ValidationError('Vendor name cannot be empty');
  }

  if (trimmed.length > 100) {
    throw new ValidationError('Vendor name must be 100 characters or less');
  }

  return trimmed;
}
