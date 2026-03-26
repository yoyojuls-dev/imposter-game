const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function generateWordAndHint(
  topic: string,
  difficulty: string
): Promise<{ word: string; hint: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to server/.env');
  }

  const difficultyGuide: Record<string, string> = {
    Easy: 'very obvious and directly related to the word',
    Medium: 'somewhat vague, mentioning a characteristic but not the word itself',
    Hard: 'very cryptic and abstract, making it hard to guess',
  };

  const guide = difficultyGuide[difficulty] || difficultyGuide['Medium'];

  const wordInstruction = topic === 'Random 🎲'
    ? 'One unexpected, surprising everyday object or concept — must NOT be a food, animal, or country. Be creative and pick something different every time'
    : `One specific well-known word/item related to the topic "${topic}"`;

  const prompt = `You are a game master for a party game called "Imposter".
Generate:
1. ${wordInstruction}
2. One ${difficulty} difficulty hint for the imposter (${guide})

Rules:
- Single common noun only
- Hint must NOT contain the word itself
- Hint must be a single word only, no phrases, no sentences

Respond ONLY with valid JSON, no markdown, no explanation: {"word":"<word>","hint":"<hint>"}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Imposter Game',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = (await response.json()) as any;
  const text = data?.choices?.[0]?.message?.content?.trim() || '';
  console.log('AI raw response:', text);
  const clean = text.replace(/```json|```/g, '').trim();

  // Try to find JSON object anywhere in the response
  const jsonMatch = clean.match(/\{[^}]*"word"[^}]*"hint"[^}]*\}|\{[^}]*"hint"[^}]*"word"[^}]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.word && parsed.hint) return { word: parsed.word, hint: parsed.hint };
    } catch {}
  }

  try {
    const parsed = JSON.parse(clean);
    if (parsed.word && parsed.hint) return { word: parsed.word, hint: parsed.hint };
  } catch {}

  const wordMatch = clean.match(/"word"\s*:\s*"([^"]+)"/);
  const hintMatch = clean.match(/"hint"\s*:\s*"([^"]+)"/);
  if (wordMatch && hintMatch) return { word: wordMatch[1], hint: hintMatch[1] };

  console.error('Could not parse AI response:', clean);
  throw new Error(`Failed to parse AI response: ${clean.substring(0, 100)}`);
}
