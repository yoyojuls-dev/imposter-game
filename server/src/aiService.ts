import { getRandomWord } from './wordBank';

export async function generateWordAndHint(
  topic: string,
  difficulty: string
): Promise<{ word: string; hint: string }> {
  return getRandomWord(topic, difficulty as 'Easy' | 'Medium' | 'Hard');
}
