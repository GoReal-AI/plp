import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  plpMiddleware,
  FileStorage,
  validatePromptId,
  parsePromptPath,
  SEMVER_PATTERN,
} from './index';

const TEST_STORAGE_PATH = path.join(__dirname, '../.test-storage');

describe('PLP Express Middleware', () => {
  let app: Express;

  beforeEach(async () => {
    // Clean up test storage
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }

    app = express();
    app.use(express.json());
    app.use('/v1', plpMiddleware({ storage: TEST_STORAGE_PATH }));
  });

  afterEach(async () => {
    // Clean up test storage
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  describe('Discovery Endpoint', () => {
    it('GET /.well-known/plp returns discovery info', async () => {
      const res = await request(app).get('/v1/.well-known/plp');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        plp_version: '1.0',
        capabilities: {
          versioning: true,
          list: false,
          search: false,
        },
      });
    });

    it('discovery endpoint does not require authentication', async () => {
      const authApp = express();
      authApp.use(express.json());
      authApp.use(
        '/v1',
        plpMiddleware({ storage: TEST_STORAGE_PATH, apiKey: 'secret' })
      );

      const res = await request(authApp).get('/v1/.well-known/plp');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /prompts/:id', () => {
    it('returns 404 for non-existent prompt', async () => {
      const res = await request(app).get('/v1/prompts/missing/prompt');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Prompt not found' });
    });

    it('returns 200 with valid envelope for existing prompt', async () => {
      // First create a prompt
      await request(app)
        .put('/v1/prompts/test/prompt')
        .send({ content: 'Hello {{name}}', meta: { version: '1.0.0' } });

      const res = await request(app).get('/v1/prompts/test/prompt');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'test/prompt',
        content: 'Hello {{name}}',
        meta: { version: '1.0.0' },
      });
    });

    it('returns specific version when requested', async () => {
      // Create prompt with version
      await request(app)
        .put('/v1/prompts/test/versioned')
        .send({ content: 'Version 1', meta: { version: '1.0.0' } });

      // Update to new version
      await request(app)
        .put('/v1/prompts/test/versioned')
        .send({ content: 'Version 2', meta: { version: '2.0.0' } });

      // Get specific version
      const res = await request(app).get('/v1/prompts/test/versioned/1.0.0');

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Version 1');
      expect(res.body.meta.version).toBe('1.0.0');
    });

    it('returns 404 for non-existent version', async () => {
      await request(app)
        .put('/v1/prompts/test/prompt')
        .send({ content: 'Hello', meta: { version: '1.0.0' } });

      const res = await request(app).get('/v1/prompts/test/prompt/9.9.9');

      expect(res.status).toBe(404);
    });

    it('supports semver with pre-release tags', async () => {
      await request(app)
        .put('/v1/prompts/test/beta')
        .send({ content: 'Beta version', meta: { version: '1.0.0-beta.1' } });

      const res = await request(app).get('/v1/prompts/test/beta/1.0.0-beta.1');

      expect(res.status).toBe(200);
      expect(res.body.meta.version).toBe('1.0.0-beta.1');
    });

    it('returns 400 for invalid prompt ID', async () => {
      const res = await request(app).get('/v1/prompts/invalid..id');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid prompt ID' });
    });
  });

  describe('PUT /prompts/:id', () => {
    it('returns 201 for new prompt', async () => {
      const res = await request(app)
        .put('/v1/prompts/new/prompt')
        .send({ content: 'Hello {{name}}', meta: { version: '1.0.0' } });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: 'new/prompt',
        content: 'Hello {{name}}',
        meta: { version: '1.0.0' },
      });
    });

    it('returns 200 for existing prompt update', async () => {
      // Create first
      await request(app)
        .put('/v1/prompts/existing/prompt')
        .send({ content: 'Original', meta: {} });

      // Update
      const res = await request(app)
        .put('/v1/prompts/existing/prompt')
        .send({ content: 'Updated', meta: { version: '2.0.0' } });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Updated');
    });

    it('returns 400 for missing content field', async () => {
      const res = await request(app)
        .put('/v1/prompts/test/prompt')
        .send({ meta: {} });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('content');
    });

    it('returns 400 for missing meta field', async () => {
      const res = await request(app)
        .put('/v1/prompts/test/prompt')
        .send({ content: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('meta');
    });

    it('returns 400 for invalid meta field (array)', async () => {
      const res = await request(app)
        .put('/v1/prompts/test/prompt')
        .send({ content: 'Hello', meta: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('meta');
    });

    it('returns 400 for invalid prompt ID', async () => {
      const res = await request(app)
        .put('/v1/prompts//invalid')
        .send({ content: 'Hello', meta: {} });

      expect(res.status).toBe(400);
    });

    it('accepts empty meta object', async () => {
      const res = await request(app)
        .put('/v1/prompts/minimal/prompt')
        .send({ content: 'Minimal prompt', meta: {} });

      expect(res.status).toBe(201);
      expect(res.body.meta).toEqual({});
    });
  });

  describe('DELETE /prompts/:id', () => {
    it('returns 204 on successful deletion', async () => {
      // Create first
      await request(app)
        .put('/v1/prompts/to-delete/prompt')
        .send({ content: 'Delete me', meta: {} });

      const res = await request(app).delete('/v1/prompts/to-delete/prompt');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('returns 404 for non-existent prompt', async () => {
      const res = await request(app).delete('/v1/prompts/non-existent/prompt');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Prompt not found' });
    });

    it('deletes all versions', async () => {
      // Create with versions
      await request(app)
        .put('/v1/prompts/versioned/prompt')
        .send({ content: 'V1', meta: { version: '1.0.0' } });

      await request(app)
        .put('/v1/prompts/versioned/prompt')
        .send({ content: 'V2', meta: { version: '2.0.0' } });

      // Delete
      await request(app).delete('/v1/prompts/versioned/prompt');

      // Verify versions are also deleted
      const v1Res = await request(app).get(
        '/v1/prompts/versioned/prompt/1.0.0'
      );
      const v2Res = await request(app).get(
        '/v1/prompts/versioned/prompt/2.0.0'
      );

      expect(v1Res.status).toBe(404);
      expect(v2Res.status).toBe(404);
    });

    it('returns 400 for invalid prompt ID', async () => {
      const res = await request(app).delete('/v1/prompts/../etc/passwd');

      expect(res.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    let authApp: Express;

    beforeEach(() => {
      authApp = express();
      authApp.use(express.json());
      authApp.use(
        '/v1',
        plpMiddleware({ storage: TEST_STORAGE_PATH, apiKey: 'test-secret-key' })
      );
    });

    it('returns 401 without Authorization header', async () => {
      const res = await request(authApp).get('/v1/prompts/test/prompt');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 with invalid API key', async () => {
      const res = await request(authApp)
        .get('/v1/prompts/test/prompt')
        .set('Authorization', 'Bearer wrong-key');

      expect(res.status).toBe(401);
    });

    it('returns 200 with valid API key', async () => {
      // Create prompt first
      await request(authApp)
        .put('/v1/prompts/test/prompt')
        .set('Authorization', 'Bearer test-secret-key')
        .send({ content: 'Hello', meta: {} });

      const res = await request(authApp)
        .get('/v1/prompts/test/prompt')
        .set('Authorization', 'Bearer test-secret-key');

      expect(res.status).toBe(200);
    });

    it('supports custom API key validator', async () => {
      const customAuthApp = express();
      customAuthApp.use(express.json());
      customAuthApp.use(
        '/v1',
        plpMiddleware({
          storage: TEST_STORAGE_PATH,
          validateApiKey: (key) => key.startsWith('valid-'),
        })
      );

      const validRes = await request(customAuthApp)
        .get('/v1/prompts/test/prompt')
        .set('Authorization', 'Bearer valid-anything');

      // Will be 404 (not found) rather than 401 (unauthorized)
      expect(validRes.status).toBe(404);

      const invalidRes = await request(customAuthApp)
        .get('/v1/prompts/test/prompt')
        .set('Authorization', 'Bearer invalid-key');

      expect(invalidRes.status).toBe(401);
    });
  });

  describe('Security - Path Traversal', () => {
    it('rejects IDs with double dots', async () => {
      const res = await request(app).get('/v1/prompts/../../../etc/passwd');

      expect(res.status).toBe(400);
    });

    it('rejects IDs starting with slash', async () => {
      const res = await request(app)
        .put('/v1/prompts//absolute/path')
        .send({ content: 'Test', meta: {} });

      expect(res.status).toBe(400);
    });

    it('rejects IDs ending with slash', async () => {
      const res = await request(app)
        .put('/v1/prompts/trailing/slash/')
        .send({ content: 'Test', meta: {} });

      expect(res.status).toBe(400);
    });

    it('rejects IDs with consecutive slashes', async () => {
      const res = await request(app)
        .put('/v1/prompts/double//slash')
        .send({ content: 'Test', meta: {} });

      expect(res.status).toBe(400);
    });

    it('rejects IDs exceeding max length', async () => {
      const longId = 'a'.repeat(257);
      const res = await request(app)
        .put(`/v1/prompts/${longId}`)
        .send({ content: 'Test', meta: {} });

      expect(res.status).toBe(400);
    });
  });
});

describe('validatePromptId', () => {
  it('accepts valid IDs', () => {
    expect(validatePromptId('simple')).toBe(true);
    expect(validatePromptId('with/namespace')).toBe(true);
    expect(validatePromptId('with-dash')).toBe(true);
    expect(validatePromptId('with_underscore')).toBe(true);
    expect(validatePromptId('mixed/path-name_123')).toBe(true);
  });

  it('rejects empty ID', () => {
    expect(validatePromptId('')).toBe(false);
  });

  it('rejects IDs with invalid characters', () => {
    expect(validatePromptId('with space')).toBe(false);
    expect(validatePromptId('with@symbol')).toBe(false);
    expect(validatePromptId('with.dot')).toBe(false);
  });

  it('rejects IDs starting/ending with slash', () => {
    expect(validatePromptId('/leading')).toBe(false);
    expect(validatePromptId('trailing/')).toBe(false);
  });

  it('rejects IDs with consecutive slashes', () => {
    expect(validatePromptId('double//slash')).toBe(false);
  });

  it('rejects IDs with directory traversal', () => {
    expect(validatePromptId('../parent')).toBe(false);
    expect(validatePromptId('path/../sibling')).toBe(false);
  });

  it('rejects IDs exceeding max length', () => {
    expect(validatePromptId('a'.repeat(257))).toBe(false);
    expect(validatePromptId('a'.repeat(256))).toBe(true);
  });
});

describe('parsePromptPath', () => {
  it('parses simple ID without version', () => {
    expect(parsePromptPath('simple')).toEqual({ id: 'simple' });
    expect(parsePromptPath('with/namespace')).toEqual({ id: 'with/namespace' });
  });

  it('extracts version from path', () => {
    expect(parsePromptPath('test/prompt/1.0.0')).toEqual({
      id: 'test/prompt',
      version: '1.0.0',
    });
  });

  it('handles semver with pre-release', () => {
    expect(parsePromptPath('test/prompt/1.0.0-beta')).toEqual({
      id: 'test/prompt',
      version: '1.0.0-beta',
    });
    expect(parsePromptPath('test/prompt/1.0.0-rc.1')).toEqual({
      id: 'test/prompt',
      version: '1.0.0-rc.1',
    });
  });

  it('handles semver with build metadata', () => {
    expect(parsePromptPath('test/prompt/1.0.0+build.123')).toEqual({
      id: 'test/prompt',
      version: '1.0.0+build.123',
    });
  });

  it('does not extract non-semver as version', () => {
    expect(parsePromptPath('test/prompt/latest')).toEqual({
      id: 'test/prompt/latest',
    });
    expect(parsePromptPath('test/v1')).toEqual({ id: 'test/v1' });
  });
});

describe('SEMVER_PATTERN', () => {
  it('matches valid semver versions', () => {
    expect(SEMVER_PATTERN.test('1.0.0')).toBe(true);
    expect(SEMVER_PATTERN.test('0.0.1')).toBe(true);
    expect(SEMVER_PATTERN.test('10.20.30')).toBe(true);
  });

  it('matches semver with pre-release', () => {
    expect(SEMVER_PATTERN.test('1.0.0-alpha')).toBe(true);
    expect(SEMVER_PATTERN.test('1.0.0-beta.1')).toBe(true);
    expect(SEMVER_PATTERN.test('1.0.0-rc.1.2.3')).toBe(true);
  });

  it('matches semver with build metadata', () => {
    expect(SEMVER_PATTERN.test('1.0.0+build')).toBe(true);
    expect(SEMVER_PATTERN.test('1.0.0+build.123')).toBe(true);
  });

  it('matches semver with both pre-release and build', () => {
    expect(SEMVER_PATTERN.test('1.0.0-beta+build')).toBe(true);
  });

  it('rejects invalid versions', () => {
    expect(SEMVER_PATTERN.test('1.0')).toBe(false);
    expect(SEMVER_PATTERN.test('1')).toBe(false);
    expect(SEMVER_PATTERN.test('v1.0.0')).toBe(false);
    expect(SEMVER_PATTERN.test('latest')).toBe(false);
  });
});

describe('FileStorage', () => {
  let storage: FileStorage;

  beforeEach(async () => {
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true });
    } catch {
      // Ignore
    }
    storage = new FileStorage(TEST_STORAGE_PATH);
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_STORAGE_PATH, { recursive: true });
    } catch {
      // Ignore
    }
  });

  it('creates storage directory on first put', async () => {
    await storage.put('test', { content: 'Hello', meta: {} });

    const stat = await fs.stat(TEST_STORAGE_PATH);
    expect(stat.isDirectory()).toBe(true);
  });

  it('stores and retrieves prompts', async () => {
    const envelope = await storage.put('test/prompt', {
      content: 'Hello {{name}}',
      meta: { version: '1.0.0' },
    });

    expect(envelope.id).toBe('test/prompt');

    const retrieved = await storage.get('test/prompt');
    expect(retrieved).toEqual(envelope);
  });

  it('stores versioned files', async () => {
    await storage.put('test/prompt', {
      content: 'V1',
      meta: { version: '1.0.0' },
    });

    const versioned = await storage.get('test/prompt', '1.0.0');
    expect(versioned?.content).toBe('V1');
  });

  it('returns null for non-existent prompt', async () => {
    const result = await storage.get('non-existent');
    expect(result).toBeNull();
  });

  it('deletes prompt and all versions', async () => {
    await storage.put('test/prompt', { content: 'V1', meta: { version: '1.0.0' } });
    await storage.put('test/prompt', { content: 'V2', meta: { version: '2.0.0' } });

    const deleted = await storage.delete('test/prompt');
    expect(deleted).toBe(true);

    const main = await storage.get('test/prompt');
    const v1 = await storage.get('test/prompt', '1.0.0');
    const v2 = await storage.get('test/prompt', '2.0.0');

    expect(main).toBeNull();
    expect(v1).toBeNull();
    expect(v2).toBeNull();
  });

  it('returns false when deleting non-existent prompt', async () => {
    const deleted = await storage.delete('non-existent');
    expect(deleted).toBe(false);
  });

  it('sanitizes IDs with slashes', async () => {
    await storage.put('namespace/prompt', { content: 'Test', meta: {} });

    const files = await fs.readdir(TEST_STORAGE_PATH);
    expect(files.some((f) => f.includes('namespace__prompt'))).toBe(true);
  });
});
