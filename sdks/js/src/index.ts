/**
 * @plp/client - Official JavaScript/TypeScript client for PLP (Prompt Library Protocol)
 * @license MIT
 */

export interface PromptEnvelope {
  id: string;
  content: string;
  meta: {
    version?: string;
    author?: string;
    description?: string;
    model_config?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface PromptInput {
  content: string;
  meta?: Record<string, unknown>;
}

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
}

// Export default for convenience
export default PLPClient;
