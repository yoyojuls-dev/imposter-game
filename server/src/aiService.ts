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
    Hard: 'very cryptic and abstract word, making it hard to guess',
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
- The hint MUST be exactly ONE single word. No phrases. No sentences. No punctuation. Just one word.

Output ONLY this exact JSON format with no other text: {"word":"WORD","hint":"HINT"}`;

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
      messages: [
        { 
          role: 'system', 
          content: 'You are a JSON API. You ONLY output raw JSON. Never explain, never think out loud, never add any text before or after the JSON object.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = (await response.json()) as any;
  
  // Handle both regular and reasoning model response formats
  const choice = data?.choices?.[0];
  const text = (
    choice?.message?.content ||
    choice?.message?.reasoning ||
    choice?.text ||
    ''
  ).trim();

  console.log('AI raw response:', text.substring(0, 200));

  if (!text) throw new Error('Empty response from AI');

  // Extract JSON from anywhere in the response
  const jsonMatch = text.match(/\{[\s\S]*?"word"[\s\S]*?"hint"[\s\S]*?\}|\{[\s\S]*?"hint"[\s\S]*?"word"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.word && parsed.hint) return { word: String(parsed.word), hint: String(parsed.hint) };
    } catch {}
  }

  // Fallback regex
  const wordMatch = text.match(/"word"\s*:\s*"([^"]+)"/);
  const hintMatch = text.match(/"hint"\s*:\s*"([^"]+)"/);
  if (wordMatch && hintMatch) return { word: wordMatch[1], hint: hintMatch[1] };

  console.error('Could not parse AI response:', text.substring(0, 300));
  throw new Error(`Failed to parse AI response: ${text.substring(0, 100)}`);
}
