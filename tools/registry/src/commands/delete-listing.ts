/**
 * Delete listing command - Remove listing from the registry
 */

import { readConfig, validateConfig } from '../lib/config.js';
import { makeRequest, endpoints } from '../lib/http.js';
import { formatSuccess, formatWarning, print } from '../lib/output.js';
import { handleError } from '../lib/errors.js';
import type { DeleteCommandOptions, DeleteListingResponse } from '../types.js';

/**
 * Delete listing from the registry
 */
export async function deleteListingCommand(
  options: DeleteCommandOptions
): Promise<void> {
  try {
    // Read and validate config
    const config = await readConfig(options.config);
    validateConfig(config, ['slug', 'deploymentHash']);

    // Require confirmation (unless in JSON mode or --confirm flag)
    if (!options.json && !options.confirm) {
      print(
        formatWarning(
          'This will permanently delete your listing from the registry.',
          { color: options.color }
        )
      );
      print('');
      print(`Listing slug: ${config.slug}`);
      print('');
      print('To confirm, run with --confirm flag:');
      print(`  plp-registry delete-listing --confirm`);
      process.exit(0);
    }

    // Make API request
    const response = await makeRequest<DeleteListingResponse>(
      endpoints.deleteListing(config.slug!),
      {
        method: 'DELETE',
        authToken: config.deploymentHash,
      }
    );

    // Output success
    const message = response.data?.message ?? 'Listing deleted successfully';

    print(
      formatSuccess(
        message,
        { slug: config.slug },
        { json: options.json, color: options.color }
      )
    );

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}
