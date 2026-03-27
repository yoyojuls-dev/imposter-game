export interface Player {
  id: string;
  name: string;
  isReady: boolean;
}

export type GameState = 'lobby' | 'playing' | 'revealed';

export interface Room {
  code: string;
  host: string;
  players: Player[];
  state: GameState;
  topic: string;
  difficulty: string;
  word: string;
  hint: string;
  imposterId: string;
  usedWords: string[];
}
