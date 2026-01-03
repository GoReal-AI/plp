/**
 * PLP Compliance Test Types
 */

export interface TestResult {
  name: string;
  description: string;
  passed: boolean;
  error?: string;
  duration: number;
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
