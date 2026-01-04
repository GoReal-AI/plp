/**
 * Install command - Complete installation with plp.pub registry
 */

import { makeRequest, endpoints } from '../lib/http.js';
import { updateConfig } from '../lib/config.js';
import { formatSuccess, print } from '../lib/output.js';
import { handleError, ValidationError } from '../lib/errors.js';
import type {
  InstallCommandOptions,
  InstallRequest,
  InstallResponse,
} from '../types.js';

/**
 * Complete installation by registering with plp.pub
 */
export async function installCommand(
  hash: string,
  options: InstallCommandOptions
): Promise<void> {
  try {
    // Validate inputs
    validateInputs(hash, options.vendorName);

    // Prepare request body
    const body: InstallRequest = {
      installationHash: hash,
      vendorName: options.vendorName.trim(),
    };

    if (options.vendorSlug) {
      body.vendorSlug = options.vendorSlug.trim();
    }

    if (options.email) {
      body.email = options.email.trim();
    }

    // Make API request
    const response = await makeRequest<InstallResponse>(
      endpoints.installComplete(),
      { method: 'POST', body }
    );

    if (!response.data || !response.data.vendor) {
      throw new Error('Invalid response from registry');
    }

    const { vendor } = response.data;

    // Validate we got the required fields
    if (!vendor.slug) {
      throw new Error('Registry did not return a vendor slug');
    }

    // Save to config
    await updateConfig(
      {
        slug: vendor.slug,
        installationHash: hash,
      },
      options.config
    );

    // Output success with important details
    const outputData: Record<string, string> = {
      installationHash: hash,
      slug: vendor.slug,
      complianceStatus: vendor.complianceStatus,
    };

    if (vendor.name) {
      outputData.vendorName = vendor.name;
    }

    print(
      formatSuccess(
        'Installation completed successfully',
        outputData,
        { json: options.json, color: options.color }
      )
    );

    process.exit(0);
  } catch (error) {
    handleError(error, { json: options.json, color: options.color });
  }
}

/**
 * Validate install command inputs
 */
function validateInputs(hash: string, vendorName: string): void {
  if (!hash || hash.trim().length === 0) {
    throw new ValidationError('Installation hash is required');
  }

  if (!vendorName || vendorName.trim().length === 0) {
    throw new ValidationError('Vendor name is required (use --vendor-name)');
  }

  // Basic hash format validation (should be alphanumeric)
  if (!/^[a-zA-Z0-9_-]+$/.test(hash.trim())) {
    throw new ValidationError('Invalid installation hash format');
  }
}
