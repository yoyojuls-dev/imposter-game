import { useState, useEffect } from 'react'
import { MultiplayerState } from '../types'

const TOPICS = ['Fruits', 'Animals', 'Countries', 'Sports', 'Food', 'Movies', 'Technology', 'Music', 'Random 🎲']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

interface Props {
  initialState: MultiplayerState
  onBack: () => void
  onGameStart: (state: MultiplayerState) => void
}

export default function MultiplayerLobby({ initialState, onBack, onGameStart }: Props) {
  const { socket, playerId } = initialState
  const [room, setRoom] = useState(initialState.room)
  const [topic, setTopic] = useState(room.topic || '')
  const [difficulty, setDifficulty] = useState(room.difficulty || 'Medium')
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  const isHost = room.host === playerId

  useEffect(() => {
    socket.on('room_updated', ({ room: updatedRoom }: any) => {
      setRoom(updatedRoom)
      setTopic(updatedRoom.topic || '')
      setDifficulty(updatedRoom.difficulty || 'Medium')
    })

    socket.on('game_started', ({ isImposter, word, hint, topic: t, players }: any) => {
      setStarting(false)
      onGameStart({
        ...initialState,
        room: { ...room, state: 'playing', players },
        isImposter,
        word,
        hint,
      })
    })

    socket.on('error', ({ message }: any) => {
      setStarting(false)
      setError(message)
    })

    socket.on('player_left', () => {})

    return () => {
      socket.off('room_updated')
      socket.off('game_started')
      socket.off('error')
      socket.off('player_left')
    }
  }, [socket, room])

  const updateSettings = (newTopic: string, newDiff: string) => {
    socket.emit('update_settings', { roomCode: room.code, topic: newTopic, difficulty: newDiff })
  }

  const handleTopicChange = (t: string) => {
    setTopic(t)
    updateSettings(t, difficulty)
  }

  const handleDifficultyChange = (d: string) => {
    setDifficulty(d)
    updateSettings(topic, d)
  }

  const handleStart = () => {
    if (!topic) { setError('Please select a topic'); return }
    if (room.players.length < 3) { setError('Need at least 3 players'); return }
    setStarting(true)
    setError('')
    socket.emit('start_game', { roomCode: room.code })
  }

  const copyCode = () => {
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="page-center">
      <div className="page-content">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Leave</button>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.05em' }}>LOBBY</h2>
        </div>

        {/* Room code */}
        <div className="panel animate-fade" style={{ textAlign: 'center', padding: '24px' }}>
          <p className="text-muted text-sm" style={{ marginBottom: 6 }}>Room Code</p>
          <div className="room-code" style={{ marginBottom: 12 }}>{room.code}</div>
          <button className="btn btn-secondary btn-sm" onClick={copyCode}>
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <p className="text-xs text-muted" style={{ marginTop: 8 }}>Share this code with friends to join</p>
        </div>

        {/* Players */}
        <div className="panel animate-fade" style={{ animationDelay: '0.05s' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>PLAYERS</p>
            <span className="text-xs text-muted">{room.players.length}/10 · min 3</span>
          </div>
          <div className="player-list">
            {room.players.map((p) => (
              <div key={p.id} className="player-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="player-avatar">{p.name[0].toUpperCase()}</div>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  {p.id === playerId && <span className="tag tag-blue" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>You</span>}
                </div>
                {p.id === room.host && (
                  <span className="tag tag-gold" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>👑 Host</span>
                )}
              </div>
            ))}
          </div>
          {room.players.length < 3 && (
            <p className="text-xs text-muted" style={{ marginTop: 10, textAlign: 'center' }}>
              Waiting for {3 - room.players.length} more player{3 - room.players.length !== 1 ? 's' : ''}...
            </p>
          )}
        </div>

        {/* Settings (host only) */}
        {isHost && (
          <>
            <div className="panel animate-fade" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>TOPIC</p>
              <div className="chip-row">
                {TOPICS.map(t => (
                  <button key={t} className={`chip ${topic === t ? 'selected' : ''}`} onClick={() => handleTopicChange(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel animate-fade" style={{ animationDelay: '0.15s', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>HINT DIFFICULTY</p>
              <div className="chip-row">
                {DIFFICULTIES.map(d => (
                  <button key={d} className={`chip ${difficulty === d ? 'selected' : ''}`} onClick={() => handleDifficultyChange(d)}>
                    {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {!isHost && (
          <div className="panel animate-fade" style={{ textAlign: 'center', padding: '16px' }}>
            <p className="text-muted text-sm">
              {topic
                ? <>Topic: <strong style={{ color: 'var(--text)' }}>{topic}</strong> · Difficulty: <strong style={{ color: 'var(--text)' }}>{difficulty}</strong></>
                : 'Waiting for host to select settings...'}
            </p>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(232,68,68,0.1)', border: '1px solid rgba(232,68,68,0.3)', borderRadius: 12, padding: '12px 16px' }}>
            <p className="text-sm text-red">{error}</p>
          </div>
        )}

        {isHost ? (
          <button
            className="btn btn-primary btn-lg btn-full animate-fade"
            style={{ animationDelay: '0.2s' }}
            disabled={room.players.length < 3 || !topic || starting}
            onClick={handleStart}
          >
            {starting
              ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Starting...</>
              : '🚀 Start Game'}
          </button>
        ) : (
          <div className="panel animate-fade" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div className="spinner" />
            <p className="text-muted text-sm">Waiting for host to start...</p>
          </div>
        )}
      </div>
    </div>
  )
}
