/**
 * Update description command - Update listing description in the registry
 */

import { readConfig, validateConfig } from '../lib/config.js';
import { makeRequest, endpoints } from '../lib/http.js';
import { formatSuccess, print } from '../lib/output.js';
import { handleError, ValidationError } from '../lib/errors.js';
import type {
  CommandOptions,
  UpdateDescriptionRequest,
  UpdateDescriptionResponse,
} from '../types.js';

/**
 * Update listing description in the registry
 */
export async function updateDescriptionCommand(
  description: string,
  options: CommandOptions
): Promise<void> {
  try {
    // Validate input
    const trimmedDescription = validateDescription(description);

    // Read and validate config
    const config = await readConfig(options.config);
    validateConfig(config, ['slug', 'deploymentHash']);

    // Prepare request
    const body: UpdateDescriptionRequest = {
      description: trimmedDescription,
    };

    // Make API request
    const response = await makeRequest<UpdateDescriptionResponse>(
      endpoints.updateDescription(config.slug!),
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
        'Description updated',
        { description: truncateForDisplay(response.data.description) },
        { json: options.json, color: options.color }
      )
    );

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Validate description
 */
function validateDescription(description: string): string {
  const trimmed = description?.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new ValidationError('Description cannot be empty');
  }

  if (trimmed.length > 1000) {
    throw new ValidationError('Description must be 1000 characters or less');
  }

  return trimmed;
}

/**
 * Truncate long description for display
 */
function truncateForDisplay(text: string, maxLength = 80): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
