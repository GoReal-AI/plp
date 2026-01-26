import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLPClient,
  PLPError,
  isMultiModal,
  normalizeContent,
  getTextContent,
  type ContentPart,
  type PromptEnvelope,
} from './index';

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

  describe('multi-modal content', () => {
    it('should handle multi-modal prompt in get()', async () => {
      const mockPrompt: PromptEnvelope = {
        id: 'vision/test',
        content: [
          { type: 'text', text: 'Analyze this image:' },
          { type: 'image_url', image_url: { url: 'https://example.com/img.png', detail: 'high' } },
        ],
        meta: { version: '1.0.0' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPrompt,
      });

      const result = await client.get('vision/test');

      expect(result.content).toEqual(mockPrompt.content);
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should handle multi-modal prompt in put()', async () => {
      const input = {
        content: [
          { type: 'text' as const, text: 'Describe this:' },
          { type: 'image_url' as const, image_url: { url: 'https://example.com/img.png' } },
        ],
        meta: { version: '1.0.0' },
      };

      const mockResponse = {
        id: 'vision/new',
        ...input,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await client.put('vision/new', input);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(input),
        })
      );
      expect(result.content).toEqual(input.content);
    });
  });
});

describe('Helper Functions', () => {
  describe('isMultiModal()', () => {
    it('should return false for string content', () => {
      expect(isMultiModal('Hello {{name}}')).toBe(false);
    });

    it('should return false for text-only array content', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'First part' },
        { type: 'text', text: 'Second part' },
      ];
      expect(isMultiModal(content)).toBe(false);
    });

    it('should return true for content with images', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'Look at this:' },
        { type: 'image_url', image_url: { url: 'https://example.com/img.png' } },
      ];
      expect(isMultiModal(content)).toBe(true);
    });

    it('should work with PromptEnvelope', () => {
      const textPrompt: PromptEnvelope = {
        id: 'test',
        content: 'Simple text',
        meta: {},
      };
      expect(isMultiModal(textPrompt)).toBe(false);

      const multiModalPrompt: PromptEnvelope = {
        id: 'test',
        content: [
          { type: 'text', text: 'With image' },
          { type: 'image_url', image_url: { url: 'https://example.com/img.png' } },
        ],
        meta: {},
      };
      expect(isMultiModal(multiModalPrompt)).toBe(true);
    });
  });

  describe('normalizeContent()', () => {
    it('should wrap string in TextContent array', () => {
      const result = normalizeContent('Hello {{name}}');
      expect(result).toEqual([{ type: 'text', text: 'Hello {{name}}' }]);
    });

    it('should return array content as-is', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'Part 1' },
        { type: 'image_url', image_url: { url: 'https://example.com/img.png' } },
      ];
      const result = normalizeContent(content);
      expect(result).toBe(content); // Same reference
    });
  });

  describe('getTextContent()', () => {
    it('should return string content as-is', () => {
      expect(getTextContent('Hello {{name}}')).toBe('Hello {{name}}');
    });

    it('should extract and join text from ContentPart array', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'First' },
        { type: 'image_url', image_url: { url: 'https://example.com/img.png' } },
        { type: 'text', text: 'Second' },
      ];
      expect(getTextContent(content)).toBe('First\nSecond');
    });

    it('should handle array with no text parts', () => {
      const content: ContentPart[] = [
        { type: 'image_url', image_url: { url: 'https://example.com/img.png' } },
      ];
      expect(getTextContent(content)).toBe('');
    });
  });
});
