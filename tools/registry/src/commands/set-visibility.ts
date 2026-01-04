/**
 * Set visibility command - Set listing visibility in the registry
 */

import { readConfig, validateConfig } from '../lib/config.js';
import { makeRequest, endpoints } from '../lib/http.js';
import { formatSuccess, print } from '../lib/output.js';
import { handleError, ValidationError } from '../lib/errors.js';
import type {
  CommandOptions,
  Visibility,
  SetVisibilityRequest,
  SetVisibilityResponse,
} from '../types.js';

const VALID_VISIBILITIES: readonly Visibility[] = ['public', 'private'];

/**
 * Set listing visibility in the registry
 */
export async function setVisibilityCommand(
  visibility: string,
  options: CommandOptions
): Promise<void> {
  try {
    // Validate input
    const validVisibility = validateVisibility(visibility);

    // Read and validate config
    const config = await readConfig(options.config);
    validateConfig(config, ['slug', 'deploymentHash']);

    // Prepare request
    const body: SetVisibilityRequest = {
      visibility: validVisibility,
    };

    // Make API request
    const response = await makeRequest<SetVisibilityResponse>(
      endpoints.setVisibility(config.slug!),
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
        'Visibility updated',
        { visibility: response.data.visibility },
        { json: options.json, color: options.color }
      )
    );

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Validate visibility value
 */
function validateVisibility(visibility: string): Visibility {
  const normalized = visibility?.toLowerCase().trim();

  if (!VALID_VISIBILITIES.includes(normalized as Visibility)) {
    throw new ValidationError(
      `Invalid visibility "${visibility}". Must be one of: ${VALID_VISIBILITIES.join(', ')}`
    );
  }

  return normalized as Visibility;
}
