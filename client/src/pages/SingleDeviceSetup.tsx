import { useState } from 'react'
import { GameConfig, Difficulty } from '../types'

const TOPICS = ['Fruits', 'Animals', 'Countries', 'Sports', 'Food', 'Movies', 'Technology', 'Music', 'Random 🎲']
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']

interface Props {
  initialPlayers?: string[]
  onBack: () => void
  onStart: (config: GameConfig) => void
}

export default function SingleDeviceSetup({ initialPlayers, onBack, onStart }: Props) {
  const [players, setPlayers] = useState<string[]>(initialPlayers && initialPlayers.length >= 3 ? initialPlayers : ['', '', ''])
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addPlayer = () => {
    setPlayers([...players, ''])
  }

  const removePlayer = (i: number) => {
    if (players.length <= 3) return
    setPlayers(players.filter((_, idx) => idx !== i))
  }

  const updatePlayer = (i: number, val: string) => {
    const updated = [...players]
    updated[i] = val
    setPlayers(updated)
  }

  const canStart = players.every(p => p.trim().length > 0) && topic !== ''

  const handleStart = async () => {
    if (!canStart) return
    setLoading(true)
    setError('')
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
      const res = await fetch(`${serverUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      })
      if (!res.ok) throw new Error('Server error')
      const { word, hint } = await res.json()
      const imposterId = Math.floor(Math.random() * players.length)
      onStart({
        players: players.map(p => p.trim()),
        topic,
        difficulty,
        word,
        hint,
        imposterId,
      })
    } catch (e) {
      setError('Failed to generate word. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div className="page-content">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.05em' }}>SINGLE DEVICE</h2>
        </div>

        {/* Players */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex justify-between items-center">
            <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>PLAYERS</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPlayers(p => [...p].sort(() => Math.random() - 0.5))}>🔀 Shuffle</button>
              <span className="text-xs text-muted">{players.length} players</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="player-avatar" style={{ fontSize: '0.8rem' }}>
                  {p.trim() ? p.trim()[0].toUpperCase() : (i + 1)}
                </div>
                <input
                  className="input"
                  placeholder={`Player ${i + 1} name`}
                  value={p}
                  onChange={e => updatePlayer(i, e.target.value)}
                  maxLength={20}
                />
                {players.length > 3 && (
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, padding: '10px 12px' }} onClick={() => removePlayer(i)}>✕</button>
                )}
              </div>
            ))}
          </div>
          {players.length < 10 && (
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addPlayer}>
              + Add Player
            </button>
          )}
        </div>

        {/* Topic */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>TOPIC</p>
          <div className="chip-row">
            {TOPICS.map(t => (
              <button key={t} className={`chip ${topic === t ? 'selected' : ''}`} onClick={() => setTopic(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>HINT DIFFICULTY</p>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>Controls how hard the imposter's hint is to use</p>
          </div>
          <div className="chip-row">
            {DIFFICULTIES.map(d => (
              <button key={d} className={`chip ${difficulty === d ? 'selected' : ''}`} onClick={() => setDifficulty(d)}>
                {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(232,68,68,0.1)', border: '1px solid rgba(232,68,68,0.3)', borderRadius: 12, padding: '12px 16px' }}>
            <p className="text-sm text-red">{error}</p>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg btn-full"
          disabled={!canStart || loading}
          onClick={handleStart}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 20, height: 20 }} /> Generating...</>
          ) : (
            '🎮 Start Game'
          )}
        </button>
      </div>
    </div>
  )
}
