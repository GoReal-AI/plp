/**
 * PLP Compliance Test Suite
 */

import type { TestContext, TestResult, TestGroup, PromptEnvelope, PLPError } from '../types.js';

type TestFn = (ctx: TestContext) => Promise<void>;

interface TestDefinition {
  name: string;
  description: string;
  fn: TestFn;
}

// Track last request/response for error reporting
let lastRequestDetails: { url: string; method: string; headers: Record<string, string> } | null = null;
let lastResponseStatus: number | null = null;
let debugMode = false;

/**
 * Make an HTTP request with timeout
 */
async function request(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, method = 'GET', headers, body, ...fetchOptions } = options;

  // Track this request for error reporting
  lastRequestDetails = {
    url,
    method: method as string,
    headers: { ...(headers as Record<string, string> || {}) },
  };

  if (debugMode) {
    console.log('\n[DEBUG] ========== REQUEST ==========');
    console.log(`[DEBUG] ${method} ${url}`);
    console.log('[DEBUG] Headers:', JSON.stringify(headers, null, 2));
    if (body) {
      console.log('[DEBUG] Body:', body);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      ...fetchOptions,
      signal: controller.signal,
    });

    lastResponseStatus = response.status;

    if (debugMode) {
      console.log('\n[DEBUG] ========== RESPONSE ==========');
      console.log(`[DEBUG] Status: ${response.status} ${response.statusText}`);
      console.log('[DEBUG] Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      // Clone response to read body without consuming it
      const clonedResponse = response.clone();
      const contentType = response.headers.get('content-type');

      try {
        if (contentType?.includes('application/json')) {
          const jsonBody = await clonedResponse.json();
          console.log('[DEBUG] Body:', JSON.stringify(jsonBody, null, 2));
        } else {
          const textBody = await clonedResponse.text();
          if (textBody) {
            console.log('[DEBUG] Body:', textBody.substring(0, 500));
          }
        }
      } catch (e) {
        console.log('[DEBUG] Body: (unable to parse)');
      }
      console.log('[DEBUG] ================================\n');
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build headers for requests
 */
function buildHeaders(ctx: TestContext, contentType = false): Record<string, string> {
  const headers: Record<string, string> = {};

  if (ctx.authToken) {
    headers['Authorization'] = `Bearer ${ctx.authToken}`;
  }

  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Validate content part structure
 */
function isValidContentPart(part: unknown): boolean {
  if (!part || typeof part !== 'object') return false;
  const obj = part as Record<string, unknown>;

  if (obj.type === 'text') {
    return typeof obj.text === 'string';
  }

  if (obj.type === 'image_url') {
    const imageUrl = obj.image_url as Record<string, unknown> | undefined;
    return imageUrl !== null && typeof imageUrl === 'object' && typeof imageUrl.url === 'string';
  }

  return false;
}

/**
 * Validate content: string or array of ContentParts
 */
function isValidContent(content: unknown): boolean {
  if (typeof content === 'string') {
    return true;
  }

  if (Array.isArray(content)) {
    return content.length > 0 && content.every(isValidContentPart);
  }

  return false;
}

/**
 * Validate envelope structure
 */
function isValidEnvelope(data: unknown): data is PromptEnvelope {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    isValidContent(obj.content) &&
    obj.meta !== null &&
    typeof obj.meta === 'object' &&
    !Array.isArray(obj.meta)
  );
}

/**
 * Validate error format
 */
function isValidError(data: unknown): data is PLPError {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.error === 'string';
}

/**
 * Generate unique test prompt ID
 */
function generateTestId(): string {
  return `__plp_compliance_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Test Definitions
// =============================================================================

const putTests: TestDefinition[] = [
  {
    name: 'PUT creates new prompt with 201',
    description: 'PUT /v1/prompts/{id} returns 201 for new prompt',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}`;
      const body = {
        content: 'Test prompt content',
        meta: { version: '1.0.0' },
      };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 201) {
        throw new Error(`Expected 201, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidEnvelope(data)) {
        throw new Error('Response is not a valid envelope');
      }

      if (data.id !== ctx.testPromptId) {
        throw new Error(`Envelope id mismatch: expected ${ctx.testPromptId}, got ${data.id}`);
      }
    },
  },
  {
    name: 'PUT updates existing prompt with 200',
    description: 'PUT /v1/prompts/{id} returns 200 for existing prompt',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}`;
      const body = {
        content: 'Updated prompt content',
        meta: { version: '1.0.1' },
      };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidEnvelope(data)) {
        throw new Error('Response is not a valid envelope');
      }
    },
  },
  {
    name: 'PUT rejects missing content',
    description: 'PUT /v1/prompts/{id} returns 400 for missing content',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}`;
      const body = { meta: {} };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
  {
    name: 'PUT rejects missing meta',
    description: 'PUT /v1/prompts/{id} returns 400 for missing meta',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}`;
      const body = { content: 'Test content' };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
];

const idValidationTests: TestDefinition[] = [
  {
    name: 'PUT rejects directory traversal in ID',
    description: 'PUT /v1/prompts/{id} returns 400 for ID containing ..',
    fn: async (ctx) => {
      // Use encodeURIComponent to prevent URL normalization
      const dangerousId = 'foo..bar';
      const url = `${ctx.baseUrl}/prompts/${encodeURIComponent(dangerousId)}`;
      const body = { content: 'Test content', meta: {} };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400 for directory traversal pattern, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
  {
    name: 'PUT rejects ID starting with slash',
    description: 'PUT /v1/prompts/{id} returns 400 for ID starting with /',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts//foo/bar`;
      const body = { content: 'Test content', meta: {} };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400 for leading slash, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
  {
    name: 'PUT rejects ID ending with slash',
    description: 'PUT /v1/prompts/{id} returns 400 for ID ending with /',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/foo/bar/`;
      const body = { content: 'Test content', meta: {} };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400 for trailing slash, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
  {
    name: 'PUT rejects consecutive slashes in ID',
    description: 'PUT /v1/prompts/{id} returns 400 for ID containing //',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/foo//bar`;
      const body = { content: 'Test content', meta: {} };

      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify(body),
        timeout: ctx.timeout,
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400 for consecutive slashes, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
];

const getTests: TestDefinition[] = [
  {
    name: 'GET retrieves prompt with 200',
    description: 'GET /v1/prompts/{id} returns 200 with valid envelope',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}`;

      const response = await request(url, {
        method: 'GET',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidEnvelope(data)) {
        throw new Error('Response is not a valid envelope');
      }

      if (data.id !== ctx.testPromptId) {
        throw new Error(`Envelope id mismatch: expected ${ctx.testPromptId}, got ${data.id}`);
      }
    },
  },
  {
    name: 'GET returns 404 for missing prompt',
    description: 'GET /v1/prompts/{id} returns 404 for missing prompt',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/__nonexistent_prompt_${Date.now()}`;

      const response = await request(url, {
        method: 'GET',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
  {
    name: 'GET retrieves specific version',
    description: 'GET /v1/prompts/{id}/{version} returns specific version',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}/1.0.0`;

      const response = await request(url, {
        method: 'GET',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidEnvelope(data)) {
        throw new Error('Response is not a valid envelope');
      }
    },
  },
  {
    name: 'GET returns 404 for missing version',
    description: 'GET /v1/prompts/{id}/{version} returns 404 for missing version',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}/99.99.99`;

      const response = await request(url, {
        method: 'GET',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
];

const deleteTests: TestDefinition[] = [
  {
    name: 'DELETE removes prompt with 204',
    description: 'DELETE /v1/prompts/{id} returns 204 on success',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/${ctx.testPromptId}`;

      const response = await request(url, {
        method: 'DELETE',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      if (response.status !== 204) {
        throw new Error(`Expected 204, got ${response.status}`);
      }
    },
  },
  {
    name: 'DELETE returns 404 for missing prompt',
    description: 'DELETE /v1/prompts/{id} returns 404 for missing prompt',
    fn: async (ctx) => {
      const url = `${ctx.baseUrl}/prompts/__nonexistent_prompt_${Date.now()}`;

      const response = await request(url, {
        method: 'DELETE',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isValidError(data)) {
        throw new Error('Error response is not in valid format');
      }
    },
  },
];

const envelopeTests: TestDefinition[] = [
  {
    name: 'Envelope has required fields',
    description: 'Envelope includes id, content, and meta fields',
    fn: async (ctx) => {
      // First create a prompt to test
      const testId = `__plp_envelope_test_${Date.now()}`;
      const createUrl = `${ctx.baseUrl}/prompts/${testId}`;

      await request(createUrl, {
        method: 'PUT',
        headers: buildHeaders(ctx, true),
        body: JSON.stringify({ content: 'Test', meta: {} }),
        timeout: ctx.timeout,
      });

      // Now get it
      const response = await request(createUrl, {
        method: 'GET',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });

      const data: unknown = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Response is not an object');
      }

      const envelope = data as Record<string, unknown>;

      if (!('id' in envelope)) {
        throw new Error('Envelope missing required field: id');
      }
      if (!('content' in envelope)) {
        throw new Error('Envelope missing required field: content');
      }
      if (!('meta' in envelope)) {
        throw new Error('Envelope missing required field: meta');
      }

      if (typeof envelope.id !== 'string') {
        throw new Error('Envelope field "id" must be a string');
      }
      if (!isValidContent(envelope.content)) {
        throw new Error('Envelope field "content" must be a string or array of ContentParts');
      }
      if (typeof envelope.meta !== 'object' || envelope.meta === null || Array.isArray(envelope.meta)) {
        throw new Error('Envelope field "meta" must be an object');
      }

      // Cleanup
      await request(createUrl, {
        method: 'DELETE',
        headers: buildHeaders(ctx),
        timeout: ctx.timeout,
      });
    },
  },
];

const discoveryTests: TestDefinition[] = [
  {
    name: 'Discovery endpoint responds',
    description: 'GET /.well-known/plp returns server capabilities (RECOMMENDED)',
    fn: async (ctx) => {
      // Remove /v1 suffix if present to get base URL for discovery
      const baseUrl = ctx.baseUrl.replace(/\/v1\/?$/, '');
      const url = `${baseUrl}/.well-known/plp`;

      const response = await request(url, {
        method: 'GET',
        timeout: ctx.timeout,
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status} (Note: Discovery endpoint is RECOMMENDED, not required)`);
      }

      const data: unknown = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Response is not an object');
      }

      const discovery = data as Record<string, unknown>;

      if (!('plp_version' in discovery)) {
        throw new Error('Discovery response missing plp_version');
      }

      if (!('capabilities' in discovery)) {
        throw new Error('Discovery response missing capabilities');
      }

      const capabilities = discovery.capabilities;
      if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
        throw new Error('Discovery capabilities must be an object');
      }

      const caps = capabilities as Record<string, unknown>;
      if (typeof caps.versioning !== 'boolean') {
        throw new Error('Discovery capabilities.versioning must be a boolean');
      }
      if (typeof caps.list !== 'boolean') {
        throw new Error('Discovery capabilities.list must be a boolean');
      }
      if (typeof caps.search !== 'boolean') {
        throw new Error('Discovery capabilities.search must be a boolean');
      }
    },
  },
];

// =============================================================================
// Test Runner
// =============================================================================

async function runTest(test: TestDefinition, ctx: TestContext): Promise<TestResult> {
  const startTime = performance.now();

  // Reset tracking before each test
  lastRequestDetails = null;
  lastResponseStatus = null;

  try {
    await test.fn(ctx);
    return {
      name: test.name,
      description: test.description,
      passed: true,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: test.name,
      description: test.description,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: performance.now() - startTime,
      request: lastRequestDetails || undefined,
      response: lastResponseStatus !== null ? { status: lastResponseStatus } : undefined,
    };
  }
}

async function runTestGroup(
  name: string,
  tests: TestDefinition[],
  ctx: TestContext
): Promise<TestGroup> {
  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await runTest(test, ctx);
    results.push(result);
  }

  return { name, tests: results };
}

/**
 * Run all compliance tests against a PLP server
 */
export async function runComplianceTests(
  baseUrl: string,
  options: { authToken?: string; timeout?: number; debug?: boolean } = {}
): Promise<TestGroup[]> {
  // Set debug mode globally
  debugMode = options.debug ?? false;

  const ctx: TestContext = {
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
    authToken: options.authToken,
    testPromptId: generateTestId(),
    timeout: options.timeout ?? 10000,
    debug: options.debug,
  };

  if (debugMode) {
    console.log('[DEBUG] Starting compliance tests');
    console.log('[DEBUG] Base URL:', ctx.baseUrl);
    console.log('[DEBUG] Auth Token:', ctx.authToken ? 'Present' : 'None');
    console.log('[DEBUG] Test Prompt ID:', ctx.testPromptId);
    console.log('[DEBUG] Timeout:', ctx.timeout, 'ms\n');
  }

  const groups: TestGroup[] = [];

  // Run tests in order: PUT first (creates test data), then GET, then DELETE
  groups.push(await runTestGroup('PUT Operations', putTests, ctx));
  groups.push(await runTestGroup('ID Validation', idValidationTests, ctx));
  groups.push(await runTestGroup('GET Operations', getTests, ctx));
  groups.push(await runTestGroup('DELETE Operations', deleteTests, ctx));
  groups.push(await runTestGroup('Envelope Format', envelopeTests, ctx));
  groups.push(await runTestGroup('Discovery (RECOMMENDED)', discoveryTests, ctx));

  // Cleanup: ensure test prompt is deleted
  try {
    await request(`${ctx.baseUrl}/prompts/${ctx.testPromptId}`, {
      method: 'DELETE',
      headers: buildHeaders(ctx),
      timeout: ctx.timeout,
    });
  } catch {
    // Ignore cleanup errors
  }

  return groups;
}

export { generateTestId };
