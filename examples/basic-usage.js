/**
 * Basic usage example of PLP client
 */

const { PLPClient } = require('@plp/client');

async function main() {
  // Initialize client
  const client = new PLPClient('https://prompts.goreal.ai', {
    apiKey: process.env.PLP_API_KEY, // Optional
  });

  try {
    // Create a new prompt
    console.log('Creating prompt...');
    await client.put('examples/greeting', {
      content: 'Hello {{name}}, welcome to {{product}}!',
      meta: {
        version: '1.0.0',
        author: 'demo',
        description: 'A simple greeting prompt',
      },
    });

    // Retrieve the prompt
    console.log('Retrieving prompt...');
    const prompt = await client.get('examples/greeting');
    console.log('Prompt content:', prompt.content);
    console.log('Prompt version:', prompt.meta.version);

    // Use the prompt with variables
    const message = prompt.content
      .replace('{{name}}', 'Alice')
      .replace('{{product}}', 'PLP');
    console.log('Final message:', message);

    // Clean up
    console.log('Deleting prompt...');
    await client.delete('examples/greeting');

    console.log('✅ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
