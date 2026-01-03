/**
 * Example: Using PLP with OpenAI
 */

const { PLPClient } = require('@plp/client');
const OpenAI = require('openai');

async function main() {
  const plp = new PLPClient('https://prompts.goreal.ai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // First, create a prompt for a code reviewer
  await plp.put('assistant/code-reviewer', {
    content: `You are an expert code reviewer. Review the following code and provide constructive feedback:

{{code}}

Focus on:
- Code quality and best practices
- Potential bugs or issues
- Performance improvements
- Readability and maintainability`,
    meta: {
      version: '1.0.0',
      author: 'demo',
      model_config: {
        temperature: 0.3,
        max_tokens: 1000,
      },
    },
  });

  // Retrieve the prompt
  const prompt = await plp.get('assistant/code-reviewer');

  // Use it with OpenAI
  const codeToReview = `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity;
  }
  return total;
}
  `.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: prompt.content.replace('{{code}}', codeToReview),
      },
    ],
    temperature: prompt.meta.model_config?.temperature || 0.7,
    max_tokens: prompt.meta.model_config?.max_tokens || 500,
  });

  console.log('Code Review:');
  console.log(response.choices[0].message.content);

  // Clean up
  await plp.delete('assistant/code-reviewer');
}

main().catch(console.error);
