/**
 * PLP Registry Types
 */

// =============================================================================
// Compliance Test Types (existing)
// =============================================================================

export interface TestResult {
  name: string;
  description: string;
  passed: boolean;
  error?: string;
  duration: number;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
  response?: {
    status: number;
  };
}

export interface TestGroup {
  name: string;
  tests: TestResult[];
}

export interface ComplianceReport {
  serverUrl: string;
  timestamp: string;
  duration: number;
  passed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  groups: TestGroup[];
}

export interface TestContext {
  baseUrl: string;
  authToken?: string;
  testPromptId: string;
  timeout: number;
}

export interface PromptEnvelope {
  id: string;
  content: string;
  meta: Record<string, unknown>;
}

export interface PLPError {
  error: string;
}

export interface ComplianceOptions {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
  verbose?: boolean;
}

// =============================================================================
// Registry API Types
// =============================================================================

/**
 * Visibility options for listings
 */
export type Visibility = 'public' | 'private';

// Install API ----------------------------------------------------------------

export interface InstallRequest {
  installationHash: string;
  vendorName: string;
  vendorSlug?: string;
  email?: string;
}

export interface InstallResponse {
  success: boolean;
  vendor: {
    name: string;
    slug: string;
    complianceStatus: string;
    installationHash: string;
  };
}

// Activate API ---------------------------------------------------------------

export interface ActivateRequest {
  serverUrl: string;
}

export interface ActivateResponse {
  success: boolean;
  deploymentHash: string;
  complianceScore: number;
  compliancePassed: boolean;
  complianceStatus: string;
  complianceReport: ComplianceReport;
}

// Login API ------------------------------------------------------------------

export interface LoginResponse {
  loginHash: string;
  expiresAt: string;
  expiresIn: number;
  message?: string;
}

// Update Name API ------------------------------------------------------------

export interface UpdateNameRequest {
  name: string;
}

export interface UpdateNameResponse {
  vendorName: string;
  message?: string;
}

// Update Description API -----------------------------------------------------

export interface UpdateDescriptionRequest {
  description: string;
}

export interface UpdateDescriptionResponse {
  description: string;
  message?: string;
}

// Set Visibility API ---------------------------------------------------------

export interface SetVisibilityRequest {
  visibility: Visibility;
}

export interface SetVisibilityResponse {
  visibility: Visibility;
  message?: string;
}

// Delete Listing API ---------------------------------------------------------

export interface DeleteListingResponse {
  message?: string;
}

// =============================================================================
// CLI Types
// =============================================================================

/**
 * Common options available to all commands
 */
export interface CommandOptions {
  json?: boolean;
  color?: boolean;
  config?: string;
}

/**
 * Options for the test command
 */
export interface TestCommandOptions extends CommandOptions {
  token?: string;
  timeout?: string;
}

/**
 * Options for the install command
 */
export interface InstallCommandOptions extends CommandOptions {
  vendorName: string;
  vendorSlug?: string;
  email?: string;
}

/**
 * Options for the delete-listing command
 */
export interface DeleteCommandOptions extends CommandOptions {
  confirm?: boolean;
}
