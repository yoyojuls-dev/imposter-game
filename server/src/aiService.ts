const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FREE_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-4b-it:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'openchat/openchat-7b:free',
];

async function tryModel(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Imposter Game',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Output ONLY raw JSON. No thinking, no explanation, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${response.status}: ${err}`);
  }

  const data = (await response.json()) as any;
  const text = (data?.choices?.[0]?.message?.content || '').trim();
  return text;
}

function parseResponse(text: string): { word: string; hint: string } | null {
  // Strip thinking tags
  let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Extract JSON between first { and last }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(clean);
    if (parsed.word && parsed.hint) return { word: String(parsed.word), hint: String(parsed.hint) };
  } catch {}

  const wordMatch = clean.match(/"word"\s*:\s*"([^"]+)"/);
  const hintMatch = clean.match(/"hint"\s*:\s*"([^"]+)"/);
  if (wordMatch && hintMatch) return { word: wordMatch[1], hint: hintMatch[1] };

  return null;
}

export async function generateWordAndHint(
  topic: string,
  difficulty: string
): Promise<{ word: string; hint: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set. Add it to server/.env');

  const difficultyGuide: Record<string, string> = {
    Easy: 'very obvious and directly related to the word',
    Medium: 'somewhat vague, mentioning a characteristic but not the word itself',
    Hard: 'very cryptic and abstract, making it hard to guess',
  };

  const wordInstruction = topic === 'Random 🎲'
    ? 'One unexpected surprising everyday object — NOT a food, animal, or country'
    : `One specific well-known word related to the topic "${topic}"`;

  const prompt = `Game: Imposter. Generate:
1. ${wordInstruction}
2. One ${difficulty} hint (${difficultyGuide[difficulty]})

Rules: single noun only, hint must NOT contain the word, hint is ONE word only.

Output ONLY: {"word":"WORD","hint":"HINT"}`;

  const errors: string[] = [];

  for (const model of FREE_MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      const text = await tryModel(model, prompt, apiKey);
      console.log(`Response from ${model}:`, text.substring(0, 150));

      if (!text) { errors.push(`${model}: empty response`); continue; }

      const result = parseResponse(text);
      if (result) {
        console.log(`Success with ${model}:`, result);
        return result;
      }
      errors.push(`${model}: could not parse response`);
    } catch (err: any) {
      console.log(`Failed ${model}:`, err.message);
      errors.push(`${model}: ${err.message}`);
    }
  }

  throw new Error(`All models failed:\n${errors.join('\n')}`);
}