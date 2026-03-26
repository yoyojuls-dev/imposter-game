import { useState, useEffect } from 'react'
import { MultiplayerState } from '../types'

interface Props {
  state: MultiplayerState
  onBack: () => void
  onPlayAgain: (state: MultiplayerState) => void
}

type Phase = 'reveal' | 'discussion' | 'results'

export default function MultiplayerGame({ state, onBack, onPlayAgain }: Props) {
  const { socket, room, playerId, isImposter, word, hint } = state
  const [phase, setPhase] = useState<Phase>('reveal')
  const [isFlipped, setIsFlipped] = useState(false)
  const [revealData, setRevealData] = useState<{ imposterId: string; word: string; players: any[] } | null>(null)
  const [players, setPlayers] = useState(room.players)
  const [hostRequestedReveal, setHostRequestedReveal] = useState(false)

  const isHost = room.host === playerId

  useEffect(() => {
    socket.on('imposter_revealed', (data: any) => {
      setRevealData(data)
      setPhase('results')
    })

    socket.on('reset_game', () => {
      onPlayAgain({ ...state, room: { ...room, state: 'lobby' } })
    })

    socket.on('room_updated', ({ room: updatedRoom }: any) => {
      setPlayers(updatedRoom.players)
    })

    socket.on('player_left', ({ playerId: leftId }: any) => {
      setPlayers(prev => prev.filter(p => p.id !== leftId))
    })

    return () => {
      socket.off('imposter_revealed')
      socket.off('reset_game')
      socket.off('room_updated')
      socket.off('player_left')
    }
  }, [socket])

  const handleReveal = () => {
    socket.emit('reveal_imposter', { roomCode: room.code })
  }

  const handlePlayAgain = () => {
    socket.emit('play_again', { roomCode: room.code })
  }

  const imposterPlayer = revealData ? players.find(p => p.id === revealData.imposterId) : null
  const myName = players.find(p => p.id === playerId)?.name || 'You'

  // Results
  if (phase === 'results' && revealData) {
    const wasImposter = revealData.imposterId === playerId

    return (
      <div className="page-center">
        <div className="page-content" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="animate-reveal">
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎭</div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: 8 }}>
              THE IMPOSTER WAS...
            </h2>
            <div style={{
              background: wasImposter
                ? 'linear-gradient(135deg, rgba(232,68,68,0.2), rgba(232,68,68,0.05))'
                : 'linear-gradient(135deg, rgba(64,192,112,0.15), rgba(64,192,112,0.05))',
              border: `2px solid ${wasImposter ? 'var(--accent)' : 'var(--success)'}`,
              borderRadius: 20,
              padding: '24px 40px',
              marginBottom: 16,
            }}>
              <p style={{
                fontFamily: 'Bebas Neue',
                fontSize: '2.5rem',
                color: wasImposter ? 'var(--accent)' : 'var(--success)',
                letterSpacing: '0.05em'
              }}>
                {imposterPlayer?.name || 'Unknown'}
              </p>
            </div>

            {wasImposter ? (
              <div className="tag tag-red" style={{ marginBottom: 16, fontSize: '0.9rem', padding: '8px 16px' }}>
                🎭 You were the imposter!
              </div>
            ) : (
              <div className="tag tag-green" style={{ marginBottom: 16, fontSize: '0.9rem', padding: '8px 16px' }}>
                ✓ You were a crewmate
              </div>
            )}

            <div className="panel" style={{ marginBottom: 24, textAlign: 'left', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted text-sm">Secret Word</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>{revealData.word}</span>
                </div>
                <div className="divider" />
                <div>
                  <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '0.9rem', marginBottom: 8, color: 'var(--text2)' }}>
                    PLAYERS
                  </p>
                  <div className="player-list">
                    {revealData.players.map((p: any) => (
                      <div key={p.id} className="player-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="player-avatar" style={{
                            background: p.id === revealData.imposterId
                              ? 'linear-gradient(135deg, var(--accent), #c03030)'
                              : 'linear-gradient(135deg, var(--success), #308050)'
                          }}>
                            {p.name[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                          {p.id === playerId && <span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>You</span>}
                        </div>
                        <span className={`tag ${p.id === revealData.imposterId ? 'tag-red' : 'tag-green'}`} style={{ fontSize: '0.7rem' }}>
                          {p.id === revealData.imposterId ? '🎭 Imposter' : '✓ Crew'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isHost ? (
              <button className="btn btn-primary btn-lg btn-full" onClick={handlePlayAgain}>
                🔄 Play Again
              </button>
            ) : (
              <div className="panel" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div className="spinner" />
                <p className="text-sm text-muted">Waiting for host...</p>
              </div>
            )}
            <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={onBack}>← Home</button>
          </div>
        </div>
      </div>
    )
  }

  // Discussion phase
  if (phase === 'discussion') {
    return (
      <div className="page-center">
        <div className="page-content" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="animate-fade">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: 8 }}>
              DISCUSSION
            </h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Discuss your clues and figure out who the imposter is!
            </p>

            <div className="panel" style={{ marginBottom: 20, padding: '16px 20px' }}>
              {isImposter ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="tag tag-red" style={{ alignSelf: 'center' }}>🎭 You are the Imposter</span>
                  <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text2)', marginBottom: 10 }}>YOUR HINT</p>
                  <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text)', textAlign: 'center', lineHeight: 1.5, padding: '0 8px' }}>
                    "{hint}"
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="tag tag-green" style={{ alignSelf: 'center' }}>✓ You're a Crewmate</span>
                  <p className="text-sm text-muted" style={{ marginTop: 6 }}>The secret word is:</p>
                  <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--text)' }}>{word}</p>
                </div>
              )}
            </div>

            <div className="panel" style={{ marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '0.9rem', marginBottom: 10, color: 'var(--text2)' }}>
                PLAYERS ({players.length})
              </p>
              <div className="player-list">
                {players.map(p => (
                  <div key={p.id} className="player-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="player-avatar">{p.name[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      {p.id === playerId && <span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>You</span>}
                    </div>
                    {p.id === room.host && <span className="tag tag-gold" style={{ fontSize: '0.7rem' }}>👑</span>}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button className="btn btn-primary btn-lg btn-full" onClick={handleReveal}>
                🎭 Reveal Imposter
              </button>
            ) : (
              <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div className="spinner" />
                <p className="text-sm text-muted">Waiting for host to reveal...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Card reveal phase
  return (
    <div className="page-center">
      <div className="page-content" style={{ alignItems: 'center', textAlign: 'center' }}>

        <div className="animate-fade" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Exit</button>
          <span className="tag tag-blue">{room.topic}</span>
        </div>

        <div className="animate-fade" style={{ animationDelay: '0.05s' }}>
          <p className="text-muted text-sm">Your card, {myName}</p>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em' }}>
            TAP TO SEE YOUR ROLE
          </h2>
        </div>

        <div className="animate-fade" style={{ animationDelay: '0.1s', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="card-scene" onClick={!isFlipped ? () => setIsFlipped(true) : undefined}>
            <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
              <div className="card-face card-back-face">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🃏</div>
                <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.9)' }}>
                  TAP TO REVEAL
                </p>
              </div>
              <div className="card-face card-front-face">
                {isImposter ? (
                  <>
                    <div style={{ marginBottom: 10 }}><span className="tag tag-red">🎭 IMPOSTER</span></div>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text2)', marginBottom: 10 }}>YOUR HINT</p>
                    <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text)', textAlign: 'center', lineHeight: 1.5, padding: '0 8px' }}>
                      "{hint}"
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 10 }}>
                      Difficulty: {room.difficulty}
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 10 }}><span className="tag tag-green">✓ CREWMATE</span></div>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text2)', marginBottom: 10 }}>SECRET WORD</p>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', letterSpacing: '0.06em', color: 'var(--text)' }}>{word}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade" style={{ animationDelay: '0.15s', width: '100%' }}>
          {isFlipped && (
            <button className="btn btn-primary btn-lg btn-full" onClick={() => setPhase('discussion')}>
              ✓ I've Seen My Card
            </button>
          )}
          {!isFlipped && (
            <p className="text-sm text-muted">Make sure no one else can see your screen</p>
          )}
        </div>
      </div>
    </div>
  )
}
