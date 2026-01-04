/**
 * @plp/registry - PLP Registry CLI & Library
 *
 * Manage PLP server registration, compliance testing, and listing on plp.pub
 *
 * @license MIT
 */

// =============================================================================
// Compliance Testing (existing)
// =============================================================================

export { runComplianceTests } from './tests/index.js';
export { formatReport, formatText, formatJson } from './reporter.js';

// =============================================================================
// Configuration Management
// =============================================================================

export {
  readConfig,
  writeConfig,
  updateConfig,
  validateConfig,
  getConfigPath,
  getConfigDir,
  configExists,
} from './lib/config.js';

export type { PlpConfig } from './lib/config.js';

// =============================================================================
// HTTP Utilities
// =============================================================================

export {
  makeRequest,
  endpoints,
  REGISTRY_URL,
} from './lib/http.js';

export type { RequestOptions, ApiResponse } from './lib/http.js';

// =============================================================================
// Error Handling
// =============================================================================

export {
  RegistryError,
  ConfigError,
  ApiError,
  AuthError,
  NetworkError,
  ValidationError,
  handleError,
  getErrorMessage,
  getExitCode,
  EXIT_CODES,
} from './lib/errors.js';

// =============================================================================
// Output Formatting
// =============================================================================

export {
  formatSuccess,
  formatInfo,
  formatWarning,
  formatHighlight,
} from './lib/output.js';

export type { OutputOptions, SuccessOutput, ErrorOutput } from './lib/output.js';

// =============================================================================
// Types
// =============================================================================

export type {
  // Compliance types
  TestResult,
  TestGroup,
  ComplianceReport,
  ComplianceOptions,
  PromptEnvelope,
  PLPError,
  TestContext,
  // Registry API types
  Visibility,
  InstallRequest,
  InstallResponse,
  ActivateRequest,
  ActivateResponse,
  LoginResponse,
  UpdateNameRequest,
  UpdateNameResponse,
  UpdateDescriptionRequest,
  UpdateDescriptionResponse,
  SetVisibilityRequest,
  SetVisibilityResponse,
  DeleteListingResponse,
  // CLI types
  CommandOptions,
  TestCommandOptions,
  InstallCommandOptions,
  DeleteCommandOptions,
} from './types.js';
