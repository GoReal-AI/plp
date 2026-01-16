/**
 * @goreal-ai/plp-express-middleware - Express middleware for building PLP-compliant servers
 * @license MIT
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PromptEnvelope {
  id: string;
  content: string;
  meta: Record<string, unknown>;
}

export interface PLPMiddlewareOptions {
  storage: string; // Path to storage directory
  apiKey?: string; // Optional API key for authentication
  validateApiKey?: (key: string) => boolean | Promise<boolean>; // Custom API key validator
}

export interface Storage {
  get(id: string, version?: string): Promise<PromptEnvelope | null>;
  put(id: string, envelope: Omit<PromptEnvelope, 'id'>): Promise<PromptEnvelope>;
  delete(id: string): Promise<boolean>;
}

/**
 * Simple file-based storage implementation
 */
class FileStorage implements Storage {
  private resolvedBasePath: string;

  constructor(private basePath: string) {
    this.resolvedBasePath = path.resolve(basePath);
  }

  private getFilePath(id: string, version?: string): string {
    // Sanitize: replace path separators and remove dangerous patterns
    const sanitized = id
      .replace(/\.\./g, '__')  // Prevent directory traversal
      .replace(/[/\\]+/g, '__');  // Replace all slashes and backslashes

    const filename = version
      ? `${sanitized}@${version}.json`
      : `${sanitized}.json`;

    const filePath = path.join(this.basePath, filename);
    const resolvedPath = path.resolve(filePath);

    // Security check: ensure resolved path is within basePath
    if (!resolvedPath.startsWith(this.resolvedBasePath)) {
      throw new Error('Invalid prompt ID: path traversal detected');
    }

    return resolvedPath;
  }

  async get(id: string, version?: string): Promise<PromptEnvelope | null> {
    try {
      const filePath = this.getFilePath(id, version);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as PromptEnvelope;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async put(
    id: string,
    envelope: Omit<PromptEnvelope, 'id'>
  ): Promise<PromptEnvelope> {
    // Ensure directory exists
    await fs.mkdir(this.resolvedBasePath, { recursive: true });

    const fullEnvelope: PromptEnvelope = {
      id,
      ...envelope,
    };

    // Save main file
    const filePath = this.getFilePath(id);
    await fs.writeFile(filePath, JSON.stringify(fullEnvelope, null, 2), 'utf-8');

    // Optionally save versioned file if version is specified
    const version = envelope.meta?.version;
    if (typeof version === 'string') {
      const versionedPath = this.getFilePath(id, version);
      await fs.writeFile(
        versionedPath,
        JSON.stringify(fullEnvelope, null, 2),
        'utf-8'
      );
    }

    return fullEnvelope;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(id);
      await fs.unlink(filePath);

      // Also delete versioned files
      const sanitized = id
        .replace(/\.\./g, '__')
        .replace(/[/\\]+/g, '__');

      const files = await fs.readdir(this.resolvedBasePath);
      const versionedFiles = files.filter((f) => f.startsWith(`${sanitized}@`));

      for (const file of versionedFiles) {
        const versionedPath = path.join(this.resolvedBasePath, file);
        try {
          await fs.unlink(versionedPath);
        } catch {
          // Ignore errors for individual versioned files (may have been deleted)
        }
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Authentication middleware
 */
function authMiddleware(
  apiKey?: string,
  validateApiKey?: (key: string) => boolean | Promise<boolean>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // If no API key configured, skip authentication
    if (!apiKey && !validateApiKey) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace(/^Bearer\s+/, '');

    // Use custom validator if provided
    if (validateApiKey) {
      const isValid = await validateApiKey(token);
      if (!isValid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return next();
    }

    // Simple API key check
    if (token !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
  };
}

/**
 * Validate prompt ID
 * - Must contain only alphanumeric, /, _, -
 * - Cannot start or end with /
 * - Cannot contain consecutive slashes
 * - Cannot contain .. (directory traversal)
 * - Max length 256 characters
 */
function validatePromptId(id: string): boolean {
  if (!id || id.length > 256) {
    return false;
  }
  // Must not start or end with /
  if (id.startsWith('/') || id.endsWith('/')) {
    return false;
  }
  // Must not contain consecutive slashes
  if (id.includes('//')) {
    return false;
  }
  // Must not contain directory traversal
  if (id.includes('..')) {
    return false;
  }
  // Must only contain valid characters
  return /^[a-zA-Z0-9/_-]+$/.test(id);
}

/**
 * Semver regex pattern - matches versions like:
 * 1.0.0, 1.2.3, 1.0.0-beta, 1.0.0-rc.1, 1.0.0+build.123
 */
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

/**
 * Parse a prompt path to extract ID and optional version
 * @param fullPath - The full path from the URL (e.g., "marketing/welcome-email/1.0.0")
 * @returns Object with id and optional version
 */
function parsePromptPath(fullPath: string): { id: string; version?: string } {
  const parts = fullPath.split('/');

  // Check if last part looks like a semver version
  if (parts.length > 1 && SEMVER_PATTERN.test(parts[parts.length - 1])) {
    const version = parts.pop();
    return { id: parts.join('/'), version };
  }

  return { id: fullPath };
}

/**
 * Error handler middleware for PLP routes
 */
function plpErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('PLP Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
}

/**
 * Create PLP-compliant Express middleware
 */
export function plpMiddleware(options: PLPMiddlewareOptions): Router {
  const router = Router();
  const storage: Storage = new FileStorage(options.storage);
  const auth = authMiddleware(options.apiKey, options.validateApiKey);

  // Discovery endpoint - no auth required
  router.get('/.well-known/plp', (_req: Request, res: Response) => {
    res.json({
      plp_version: '1.0',
      capabilities: {
        versioning: true,
        list: false,
        search: false,
      },
    });
  });

  // Apply authentication to prompt routes
  router.use('/prompts', auth);

  // GET /prompts/:id
  // GET /prompts/:id/:version
  router.get('/prompts/:id(*)', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, version } = parsePromptPath(req.params.id);

      if (!validatePromptId(id)) {
        return res.status(400).json({ error: 'Invalid prompt ID' });
      }

      const prompt = await storage.get(id, version);

      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      res.json(prompt);
    } catch (error) {
      next(error);
    }
  });

  // PUT /prompts/:id
  router.put('/prompts/:id(*)', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;

      if (!validatePromptId(id)) {
        return res.status(400).json({ error: 'Invalid prompt ID' });
      }

      const { content, meta } = req.body as { content?: unknown; meta?: unknown };

      if (typeof content !== 'string') {
        return res
          .status(400)
          .json({ error: 'Invalid request - content field is required' });
      }

      if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
        return res
          .status(400)
          .json({ error: 'Invalid request - meta field is required' });
      }

      // Check if prompt exists to determine status code
      const exists = await storage.get(id);
      const statusCode = exists ? 200 : 201;

      const envelope = await storage.put(id, { content, meta: meta as Record<string, unknown> });

      res.status(statusCode).json(envelope);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /prompts/:id
  router.delete('/prompts/:id(*)', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;

      if (!validatePromptId(id)) {
        return res.status(400).json({ error: 'Invalid prompt ID' });
      }

      const deleted = await storage.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Apply error handler
  router.use(plpErrorHandler);

  return router;
}

// Export types and utilities
export { FileStorage, validatePromptId, parsePromptPath, SEMVER_PATTERN };
