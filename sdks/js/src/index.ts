/**
 * @goreal-ai/plp-client - Official JavaScript/TypeScript client for PLP (Prompt Library Protocol)
 * @license MIT
 */

// =============================================================================
// Multi-modal Content Types
// =============================================================================

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageUrl {
  url: string;
  detail?: 'auto' | 'low' | 'high';
}

export interface ImageContent {
  type: 'image_url';
  image_url: ImageUrl;
}

export type ContentPart = TextContent | ImageContent;

/**
 * Prompt content - either a simple string (backwards compatible)
 * or an array of content parts for multi-modal prompts.
 */
export type PromptContent = string | ContentPart[];

// =============================================================================
// Prompt Envelope Types
// =============================================================================

export interface PromptEnvelope {
  id: string;
  content: PromptContent;
  meta: {
    version?: string;
    author?: string;
    description?: string;
    model_config?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface PromptInput {
  content: PromptContent;
  meta?: Record<string, unknown>;
}

// =============================================================================
// Context Store Types
// =============================================================================

export interface ContextStoreAsset {
  id: number;
  assetId: string;
  mimeType: string;
  fileSize: number;
  plpReference: string;
  projectId: number | null;
  createdAt: string;
}

export interface AssetContent {
  assetId: string;
  mimeType: string;
  dataUrl: string;
}

export interface StorageUsage {
  bytesUsed: number;
  assetCount: number;
}

// =============================================================================
// Prompt Context Types
// =============================================================================

export interface ContextMapping {
  id: number;
  contextName: string;
  assetId: string;
  mimeType: string;
  plpReference: string;
  createdAt: string;
}

export interface AddContextMappingInput {
  contextName: string;
  assetId: string;
}

export interface ResolveContextInput {
  contextNames?: string[] | null;
}

export interface ResolvedContext {
  contextName: string;
  assetId: string;
  mimeType: string;
  dataUrl: string | null;
}

// =============================================================================
// Deploy Types
// =============================================================================

export interface DeployRequest {
  versionNo: number;
  environment: string;
}

export interface DeployResponse {
  promptId: string;
  versionNo: number;
  environment: string;
  deployedAt: string;
}

// =============================================================================
// Evaluation Types
// =============================================================================

export interface RunEvalRequest {
  evalContent: string;
  versionNo?: number;
  datasetId?: string;
}

export interface EvalSuiteResult {
  suiteName: string;
  status: 'pass' | 'fail' | 'error';
  tests: EvalTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
  };
}

export interface EvalTestResult {
  name: string;
  status: 'pass' | 'fail' | 'error';
  assertions: AssertionResult[];
  durationMs?: number;
  error?: string;
}

export interface AssertionResult {
  operator: string;
  status: 'pass' | 'fail' | 'error';
  expected?: string;
  actual?: string;
  message?: string;
}

export interface EvalDatasetCase {
  name: string;
  input: Record<string, unknown>;
  expected?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface EvalDataset {
  id: string;
  description?: string;
  cases: EvalDatasetCase[];
}

// =============================================================================
// Discovery Types
// =============================================================================

export interface Discovery {
  plp_version: string;
  server?: string;
  capabilities: {
    versioning: boolean;
    list: boolean;
    search: boolean;
    contextStore?: boolean;
    deploy?: boolean;
    evaluation?: boolean;
  };
}

// =============================================================================
// Prompt List Types
// =============================================================================

export interface PromptSummary {
  id: string;
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  createdAt?: string;
}

export interface PromptListResponse {
  content: PromptSummary[];
  page: number;
  totalElements: number;
  totalPages: number;
}

export interface ListPromptsOptions {
  page?: number;
  size?: number;
  projectId?: number;
  visibility?: 'public' | 'private';
}

// =============================================================================
// Publish Types
// =============================================================================

export interface PublishRequest {
  versionNo: number;
}

export interface PublishResponse {
  promptId: string;
  versionId?: number;
  versionNo: number;
}

// =============================================================================
// Client Configuration
// =============================================================================

export interface PLPClientOptions {
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number; // in milliseconds
}

export class PLPError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'PLPError';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a prompt has multi-modal content (images)
 * @param prompt - The prompt envelope or content
 * @returns true if content contains image parts
 */
export function isMultiModal(prompt: PromptEnvelope | PromptContent): boolean {
  const content = typeof prompt === 'object' && prompt !== null && 'content' in prompt
    ? (prompt as PromptEnvelope).content
    : prompt;

  if (typeof content === 'string') {
    return false;
  }

  return content.some((part) => part.type === 'image_url');
}

/**
 * Normalize content to ContentPart[] format
 * @param content - String or ContentPart array
 * @returns ContentPart[] (string is wrapped as single TextContent)
 */
export function normalizeContent(content: PromptContent): ContentPart[] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }
  return content;
}

/**
 * Get text-only content from a prompt (useful for token counting)
 * @param content - String or ContentPart array
 * @returns Combined text from all text parts
 */
export function getTextContent(content: PromptContent): string {
  if (typeof content === 'string') {
    return content;
  }

  return content
    .filter((part): part is TextContent => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

// =============================================================================
// PLP Client
// =============================================================================

export class PLPClient {
  private baseUrl: string;
  private apiKey?: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(baseUrl: string, options: PLPClientOptions = {}) {
    // Remove trailing slash from baseUrl
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.headers = options.headers || {};
    this.timeout = options.timeout || 10000; // 10 seconds default
  }

  private async request<T>(
    method: string,
    path: string,
    body?: PromptInput
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new PLPError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof PLPError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new PLPError(`Request timeout after ${this.timeout}ms`);
        }
        throw new PLPError(`Network error: ${error.message}`);
      }

      throw new PLPError('Unknown error occurred');
    }
  }

  /**
   * Retrieve a prompt by ID and optional version
   * @param promptId - The unique prompt identifier
   * @param version - Optional version string (e.g., "1.2.0"). If omitted, returns latest.
   * @returns The prompt envelope
   */
  async get(promptId: string, version?: string): Promise<PromptEnvelope> {
    const path = version
      ? `/v1/prompts/${promptId}/${version}`
      : `/v1/prompts/${promptId}`;

    return this.request<PromptEnvelope>('GET', path);
  }

  /**
   * Create or update a prompt (idempotent upsert)
   * @param promptId - The unique prompt identifier
   * @param input - The prompt content and metadata
   * @returns The saved prompt envelope
   */
  async put(promptId: string, input: PromptInput): Promise<PromptEnvelope> {
    const path = `/v1/prompts/${promptId}`;
    return this.request<PromptEnvelope>('PUT', path, input);
  }

  /**
   * Delete a prompt and all its versions
   * @param promptId - The unique prompt identifier
   * @returns void (204 No Content on success)
   */
  async delete(promptId: string): Promise<void> {
    const path = `/v1/prompts/${promptId}`;
    return this.request<void>('DELETE', path);
  }

  /**
   * Alias for get() - more intuitive naming
   */
  async fetch(promptId: string, version?: string): Promise<PromptEnvelope> {
    return this.get(promptId, version);
  }

  /**
   * Alias for put() - more intuitive naming
   */
  async save(promptId: string, input: PromptInput): Promise<PromptEnvelope> {
    return this.put(promptId, input);
  }

  // ===========================================================================
  // Discovery Methods
  // ===========================================================================

  /**
   * Get server discovery information and capabilities
   * @returns Discovery information including PLP version and capabilities
   */
  async getDiscovery(): Promise<Discovery> {
    return this.request<Discovery>('GET', '/.well-known/plp');
  }

  // ===========================================================================
  // Prompt List & Publish Methods
  // ===========================================================================

  /**
   * List prompts with optional filtering and pagination
   * @param options - Optional filtering and pagination options
   * @returns Paginated list of prompt summaries
   */
  async listPrompts(options?: ListPromptsOptions): Promise<PromptListResponse> {
    const params = new URLSearchParams();
    if (options?.page != null) params.set('page', String(options.page));
    if (options?.size != null) params.set('size', String(options.size));
    if (options?.projectId != null) params.set('projectId', String(options.projectId));
    if (options?.visibility) params.set('visibility', options.visibility);

    const queryString = params.toString();
    const path = queryString ? `/v1/prompts?${queryString}` : '/v1/prompts';

    return this.request<PromptListResponse>('GET', path);
  }

  /**
   * Publish a specific version of a prompt
   * @param promptId - The prompt identifier
   * @param versionNo - The version number to publish
   * @returns Publish response with promptId and versionNo
   */
  async publish(promptId: string, versionNo: number): Promise<PublishResponse> {
    const body: PublishRequest = { versionNo };
    return this.requestJson<PublishResponse>('POST', `/v1/prompts/${promptId}/publish`, body);
  }

  // ===========================================================================
  // Deploy Methods
  // ===========================================================================

  /**
   * Deploy a prompt version to a named environment
   * @param promptId - The prompt identifier
   * @param versionNo - The version number to deploy
   * @param environment - Target environment (e.g., "staging", "production")
   * @returns Deploy response with timestamp
   */
  async deploy(
    promptId: string,
    versionNo: number,
    environment: string
  ): Promise<DeployResponse> {
    const body: DeployRequest = { versionNo, environment };
    return this.requestJson<DeployResponse>(
      'POST',
      `/v1/prompts/${promptId}/deploy`,
      body
    );
  }

  // ===========================================================================
  // Evaluation Methods
  // ===========================================================================

  /**
   * Run an evaluation suite against a prompt
   * @param promptId - The prompt identifier
   * @param evalContent - The .eval file content (YAML format)
   * @param options - Optional version and dataset references
   * @returns Evaluation suite results
   */
  async runEval(
    promptId: string,
    evalContent: string,
    options?: { versionNo?: number; datasetId?: string }
  ): Promise<EvalSuiteResult> {
    const body: RunEvalRequest = {
      evalContent,
      ...options,
    };
    return this.requestJson<EvalSuiteResult>(
      'POST',
      `/v1/prompts/${promptId}/eval`,
      body
    );
  }

  /**
   * Save or update an eval dataset
   * @param promptId - The prompt identifier
   * @param datasetId - The dataset identifier
   * @param dataset - The dataset content
   * @returns The saved dataset
   */
  async saveDataset(
    promptId: string,
    datasetId: string,
    dataset: EvalDataset
  ): Promise<EvalDataset> {
    return this.requestJson<EvalDataset>(
      'PUT',
      `/v1/prompts/${promptId}/eval/datasets/${datasetId}`,
      dataset
    );
  }

  /**
   * Retrieve an eval dataset
   * @param promptId - The prompt identifier
   * @param datasetId - The dataset identifier
   * @returns The dataset
   */
  async getDataset(
    promptId: string,
    datasetId: string
  ): Promise<EvalDataset> {
    return this.request<EvalDataset>(
      'GET',
      `/v1/prompts/${promptId}/eval/datasets/${datasetId}`
    );
  }

  // ===========================================================================
  // Context Store Methods
  // ===========================================================================

  /**
   * List all assets in the user's Context Store
   * @param projectId - Optional project ID to filter by
   * @returns Array of context store assets
   */
  async listContextStore(projectId?: number): Promise<ContextStoreAsset[]> {
    const params = projectId != null ? `?projectId=${projectId}` : '';
    return this.request<ContextStoreAsset[]>('GET', `/v1/context-store${params}`);
  }

  /**
   * Upload an asset to the Context Store (multipart form)
   * @param assetId - Unique asset identifier (1-64 alphanumeric, hyphens, underscores)
   * @param file - The file to upload (Blob or File)
   * @param projectId - Optional project ID to scope the asset
   * @returns The created context store asset
   */
  async uploadContextStoreAsset(
    assetId: string,
    file: Blob,
    projectId?: number
  ): Promise<ContextStoreAsset> {
    const url = `${this.baseUrl}/v1/context-store`;
    const headers: Record<string, string> = { ...this.headers };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('file', file);
    if (projectId != null) {
      formData.append('projectId', String(projectId));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers, // Note: Don't set Content-Type for FormData - browser handles it
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new PLPError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data as ContextStoreAsset;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof PLPError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new PLPError(`Request timeout after ${this.timeout}ms`);
        }
        throw new PLPError(`Network error: ${error.message}`);
      }

      throw new PLPError('Unknown error occurred');
    }
  }

  /**
   * Get asset content as base64 data URL
   * @param assetId - The asset identifier
   * @returns Asset content with data URL
   */
  async getContextStoreAsset(assetId: string): Promise<AssetContent> {
    return this.request<AssetContent>('GET', `/v1/context-store/${assetId}`);
  }

  /**
   * Delete an asset from Context Store
   * @param assetId - The asset identifier
   */
  async deleteContextStoreAsset(assetId: string): Promise<void> {
    return this.request<void>('DELETE', `/v1/context-store/${assetId}`);
  }

  /**
   * Get storage usage statistics
   * @returns Storage usage info
   */
  async getContextStoreUsage(): Promise<StorageUsage> {
    return this.request<StorageUsage>('GET', '/v1/context-store/usage');
  }

  // ===========================================================================
  // Prompt Context Methods
  // ===========================================================================

  /**
   * List context mappings for a prompt
   * @param promptId - The prompt identifier
   * @returns Array of context mappings
   */
  async listPromptContext(promptId: string): Promise<ContextMapping[]> {
    return this.request<ContextMapping[]>('GET', `/v1/prompts/${promptId}/context`);
  }

  /**
   * Add or update a context mapping for a prompt
   * @param promptId - The prompt identifier
   * @param input - The context mapping input
   * @returns The created/updated context mapping
   */
  async addPromptContext(promptId: string, input: AddContextMappingInput): Promise<ContextMapping> {
    return this.requestJson<ContextMapping>('POST', `/v1/prompts/${promptId}/context`, input);
  }

  /**
   * Remove a context mapping from a prompt
   * @param promptId - The prompt identifier
   * @param contextName - The context name to remove
   */
  async removePromptContext(promptId: string, contextName: string): Promise<void> {
    return this.request<void>('DELETE', `/v1/prompts/${promptId}/context/${contextName}`);
  }

  /**
   * Resolve context mappings to actual content (base64 data URLs)
   * @param promptId - The prompt identifier
   * @param contextNames - Optional specific context names to resolve (null = all)
   * @returns Map of context name to resolved content
   */
  async resolvePromptContext(
    promptId: string,
    contextNames?: string[] | null
  ): Promise<Record<string, ResolvedContext>> {
    const input: ResolveContextInput = contextNames ? { contextNames } : {};
    return this.requestJson<Record<string, ResolvedContext>>(
      'POST',
      `/v1/prompts/${promptId}/context/_resolve`,
      input
    );
  }

  // Helper for JSON body requests (context uses different body type than prompts)
  private async requestJson<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 204) {
        return undefined as T;
      }

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new PLPError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof PLPError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new PLPError(`Request timeout after ${this.timeout}ms`);
        }
        throw new PLPError(`Network error: ${error.message}`);
      }

      throw new PLPError('Unknown error occurred');
    }
  }
}

// Export default for convenience
export default PLPClient;
