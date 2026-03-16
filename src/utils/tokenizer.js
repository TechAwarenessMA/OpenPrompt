import { encode } from 'gpt-tokenizer';

/**
 * Count tokens in a text string using GPT-4 BPE encoding.
 * Claude's tokenizer is not publicly available; GPT-4 tiktoken produces
 * counts within ~5% for typical English text (disclosed to users).
 *
 * @param {string} text - Plain text to tokenize
 * @returns {number} Token count
 */
export function countTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  try {
    return encode(text).length;
  } catch {
    // Fallback: rough estimate of ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Extract plain text from a single message's content field.
 * Claude exports use content: [ { type: 'text', text: '...' }, ... ]
 * We only count text blocks — skip images, tool_use, etc.
 *
 * @param {string|Array} content - message.content value
 * @returns {string} Extracted plain text
 */
export function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(block => block && block.type === 'text')
      .map(block => block.text || '')
      .join(' ');
  }
  return '';
}
