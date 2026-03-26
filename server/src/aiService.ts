const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateWordAndHint(
  topic: string,
  difficulty: string
): Promise<{ word: string; hint: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set. Add it to server/.env');

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

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Output ONLY raw JSON. No explanation, no markdown, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 100,
      temperature: 1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = (await response.json()) as any;
  let text = (data?.choices?.[0]?.message?.content || '').trim();
  console.log('AI raw response:', text.substring(0, 150));

  // Extract JSON between first { and last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed.word && parsed.hint) return { word: String(parsed.word), hint: String(parsed.hint) };
  } catch {}

  const wordMatch = text.match(/"word"\s*:\s*"([^"]+)"/);
  const hintMatch = text.match(/"hint"\s*:\s*"([^"]+)"/);
  if (wordMatch && hintMatch) return { word: wordMatch[1], hint: hintMatch[1] };

  throw new Error(`Failed to parse AI response: ${text.substring(0, 100)}`);
}