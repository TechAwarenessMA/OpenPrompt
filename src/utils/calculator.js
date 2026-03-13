import { COEFFICIENTS } from '../data/coefficients';
import { countTokens } from './tokenizer';

/**
 * Calculate environmental impact for given input and output token counts.
 * Uses separate coefficients for input vs output tokens per Luccioni et al. 2023.
 * @param {number} inputTokens - Tokens from human/user messages
 * @param {number} outputTokens - Tokens from assistant messages
 * @returns {{ energyKwh: number, waterLiters: number, carbonGrams: number }}
 */
function calcImpact(inputTokens, outputTokens) {
  const rawEnergyWh =
    inputTokens * COEFFICIENTS.energy_per_input_token_wh +
    outputTokens * COEFFICIENTS.energy_per_output_token_wh;
  const energyKwh = (rawEnergyWh * COEFFICIENTS.pue_multiplier) / 1000;
  const waterLiters = energyKwh * COEFFICIENTS.water_per_kwh_liters;
  const carbonGrams = energyKwh * COEFFICIENTS.carbon_per_kwh_gco2e;
  return { energyKwh, waterLiters, carbonGrams };
}

/**
 * Process a Claude conversations.json export.
 * @param {Array} rawConversations - The parsed JSON array
 * @returns {{ totals, conversations, monthlyData, dateRange }}
 */
export function processConversations(rawConversations) {
  // Handle both array and object with array property
  let convos = rawConversations;
  if (!Array.isArray(convos)) {
    convos = convos.conversations || convos.chat_messages || Object.values(convos);
    if (!Array.isArray(convos)) {
      throw new Error('Could not find conversations array in the uploaded file.');
    }
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let earliestDate = null;
  let latestDate = null;
  const monthlyBuckets = {};

  const conversations = convos.map((convo, index) => {
    const messages = convo.chat_messages || convo.messages || [];
    const title = convo.name || convo.title || `Conversation ${index + 1}`;
    const createdAt = convo.created_at || convo.create_time || null;

    let inputTokens = 0;
    let outputTokens = 0;

    for (const msg of messages) {
      const role = msg.sender || msg.role || 'unknown';
      // content may be array of blocks or a string
      let text = '';
      if (typeof msg.content === 'string') {
        text = msg.content;
      } else if (Array.isArray(msg.content)) {
        text = msg.content
          .filter(b => b.type === 'text')
          .map(b => b.text || '')
          .join(' ');
      } else {
        text = msg.text || '';
      }
      const tokens = countTokens(text);
      if (role === 'human' || role === 'user') {
        inputTokens += tokens;
      } else {
        outputTokens += tokens;
      }
    }

    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;

    // Track date range
    if (createdAt) {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        if (!earliestDate || date < earliestDate) earliestDate = date;
        if (!latestDate || date > latestDate) latestDate = date;

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyBuckets[key]) {
          monthlyBuckets[key] = { month: key, tokens: 0, inputTokens: 0, outputTokens: 0, conversations: 0 };
        }
        monthlyBuckets[key].tokens += inputTokens + outputTokens;
        monthlyBuckets[key].inputTokens += inputTokens;
        monthlyBuckets[key].outputTokens += outputTokens;
        monthlyBuckets[key].conversations += 1;
      }
    }

    const impact = calcImpact(inputTokens, outputTokens);

    return {
      title,
      createdAt,
      messageCount: messages.length,
      totalTokens: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      ...impact,
    };
  });

  const totalsImpact = calcImpact(totalInputTokens, totalOutputTokens);
  const totalTokens = totalInputTokens + totalOutputTokens;

  const monthlyData = Object.values(monthlyBuckets)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(bucket => ({
      ...bucket,
      ...calcImpact(bucket.inputTokens, bucket.outputTokens),
    }));

  return {
    totals: {
      totalConversations: conversations.length,
      totalTokens,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      ...totalsImpact,
    },
    conversations: conversations.sort((a, b) => b.totalTokens - a.totalTokens),
    monthlyData,
    dateRange: {
      earliest: earliestDate ? earliestDate.toISOString() : null,
      latest: latestDate ? latestDate.toISOString() : null,
    },
  };
}
