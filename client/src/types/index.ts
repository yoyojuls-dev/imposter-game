export type AppPage = 'home' | 'single-setup' | 'single-game' | 'mp-setup' | 'mp-lobby' | 'mp-game'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface PlayerEntry {
  name: string
}

export interface GameConfig {
  players: string[]
  topic: string
  difficulty: Difficulty
  word: string
  hint: string
  imposterId: number  // index in players array
}

export interface RoomPlayer {
  id: string
  name: string
  isReady: boolean
}

export interface Room {
  code: string
  host: string
  players: RoomPlayer[]
  state: 'lobby' | 'playing' | 'voting' | 'revealed'
  topic: string
  difficulty: string
}

export interface MultiplayerState {
  socket: any
  room: Room
  playerId: string
  playerName: string
  // Game data (only populated when playing)
  isImposter?: boolean
  word?: string | null
  hint?: string | null
}
