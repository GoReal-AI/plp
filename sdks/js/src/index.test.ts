import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PLPClient, PLPError } from './index';

// Mock fetch
global.fetch = vi.fn();

describe('PLPClient', () => {
  let client: PLPClient;

  beforeEach(() => {
    client = new PLPClient('https://prompts.example.com');
    vi.clearAllMocks();
  });

  describe('get()', () => {
    it('should fetch a prompt without version', async () => {
      const mockPrompt = {
        id: 'test/prompt',
        content: 'Hello {{name}}',
        meta: { version: '1.0.0' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPrompt,
      });

      const result = await client.get('test/prompt');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://prompts.example.com/v1/prompts/test/prompt',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockPrompt);
    });

    it('should fetch a prompt with specific version', async () => {
      const mockPrompt = {
        id: 'test/prompt',
        content: 'Hello {{name}}',
        meta: { version: '1.0.0' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPrompt,
      });

      const result = await client.get('test/prompt', '1.0.0');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://prompts.example.com/v1/prompts/test/prompt/1.0.0',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockPrompt);
    });

    it('should throw PLPError on 404', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Prompt not found' }),
      });

      await expect(client.get('missing/prompt')).rejects.toThrow(PLPError);

      // Set up mock again for second assertion
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Prompt not found' }),
      });

      await expect(client.get('missing/prompt')).rejects.toThrow(
        'Prompt not found'
      );
    });
  });

  describe('put()', () => {
    it('should create a new prompt', async () => {
      const input = {
        content: 'New prompt',
        meta: { version: '1.0.0' },
      };

      const mockResponse = {
        id: 'test/new',
        ...input,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await client.put('test/new', input);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://prompts.example.com/v1/prompts/test/new',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(input),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete()', () => {
    it('should delete a prompt', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.delete('test/old');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://prompts.example.com/v1/prompts/test/old',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('authentication', () => {
    it('should include Authorization header when apiKey is provided', async () => {
      const authenticatedClient = new PLPClient('https://prompts.example.com', {
        apiKey: 'test-key-123',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'test', content: 'test', meta: {} }),
      });

      await authenticatedClient.get('test/prompt');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key-123',
          }),
        })
      );
    });
  });
});
