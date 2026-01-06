/**
 * HTTP utilities for PLP Registry API requests
 */

import { ApiError, AuthError, NetworkError } from './errors.js';

export const REGISTRY_URL = 'https://plp-registry.pages.dev';
const DEFAULT_TIMEOUT = 30000;

// Global debug flag
let debugEnabled = false;

export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeout?: number;
  authToken?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * API endpoint builders
 */
export const endpoints = {
  installComplete: () => `${REGISTRY_URL}/api/register/install-complete`,
  activate: (slug: string) => `${REGISTRY_URL}/api/vendors/${encodeURIComponent(slug)}/activate`,
  login: () => `${REGISTRY_URL}/api/auth/login`,
  updateName: (slug: string) => `${REGISTRY_URL}/api/vendors/${encodeURIComponent(slug)}/name`,
  updateDescription: (slug: string) => `${REGISTRY_URL}/api/vendors/${encodeURIComponent(slug)}/description`,
  setVisibility: (slug: string) => `${REGISTRY_URL}/api/vendors/${encodeURIComponent(slug)}/visibility`,
  deleteListing: (slug: string) => `${REGISTRY_URL}/api/vendors/${encodeURIComponent(slug)}`,
} as const;

/**
 * Make an HTTP request to the registry API
 *
 * @throws {NetworkError} On connection/timeout issues
 * @throws {AuthError} On 401 responses
 * @throws {ApiError} On other non-2xx responses
 */
export async function makeRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    timeout = DEFAULT_TIMEOUT,
    authToken,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {};

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Debug: Log request
    if (debugEnabled) {
      console.log('\n[DEBUG] ========== REGISTRY API REQUEST ==========');
      console.log(`[DEBUG] ${method} ${url}`);
      console.log('[DEBUG] Headers:', JSON.stringify(headers, null, 2));
      if (body !== undefined) {
        console.log('[DEBUG] Body:', JSON.stringify(body, null, 2));
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    let data: unknown;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || undefined;
    }

    // Debug: Log response
    if (debugEnabled) {
      console.log('\n[DEBUG] ========== REGISTRY API RESPONSE ==========');
      console.log(`[DEBUG] Status: ${response.status} ${response.statusText}`);
      console.log('[DEBUG] Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
      console.log('[DEBUG] Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      console.log('[DEBUG] ============================================\n');
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = extractErrorMessage(data) ?? `Request failed with status ${response.status}`;

      if (response.status === 401) {
        throw new AuthError(errorMessage);
      }

      throw new ApiError(errorMessage, response.status);
    }

    return {
      success: true,
      data: data as T,
      statusCode: response.status,
    };
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof ApiError || error instanceof AuthError) {
      throw error;
    }

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError(`Request timed out after ${timeout}ms`);
    }

    // Handle fetch errors (network issues)
    if (error instanceof TypeError) {
      throw new NetworkError(`Network error: ${error.message}`);
    }

    // Unknown error
    throw new NetworkError(
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract error message from API response body
 */
function extractErrorMessage(data: unknown): string | undefined {
  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Common error response formats
    if (typeof obj.error === 'string') {
      return obj.error;
    }
    if (typeof obj.message === 'string') {
      return obj.message;
    }
    if (typeof obj.detail === 'string') {
      return obj.detail;
    }
  }

  return undefined;
}
