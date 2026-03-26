import { useState } from 'react'
import { GameConfig } from '../types'

interface Props {
  config: GameConfig
  onBack: () => void
  onPlayAgain: () => void
}

type Phase = 'reveal' | 'discussion' | 'results'

export default function SingleDeviceGame({ config, onBack, onPlayAgain }: Props) {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0)
  const [revealedCount, setRevealedCount] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [phase, setPhase] = useState<Phase>('reveal')
  const [showImposter, setShowImposter] = useState(false)
  const [screenBlocked, setScreenBlocked] = useState(false)

  const currentPlayer = config.players[currentPlayerIdx]
  const isCurrentImposter = currentPlayerIdx === config.imposterId
  const allRevealed = revealedCount >= config.players.length

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true)
  }

  const handleNext = () => {
    // Block screen briefly while handing device
    setScreenBlocked(true)
    setIsFlipped(false)

    setTimeout(() => {
      const next = currentPlayerIdx + 1
      setRevealedCount(prev => prev + 1)
      if (next >= config.players.length) {
        setPhase('discussion')
      } else {
        setCurrentPlayerIdx(next)
      }
      setScreenBlocked(false)
    }, 800)
  }

  const handleRevealImposter = () => {
    setShowImposter(true)
    setPhase('results')
  }

  // Screen blocker during device handoff
  if (screenBlocked) {
    return (
      <div className="page-center" style={{ background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🫣</div>
          <p className="text-muted">Passing device...</p>
        </div>
      </div>
    )
  }

  // Results phase
  if (phase === 'results') {
    const imposterName = config.players[config.imposterId]
    return (
      <div className="page-center">
        <div className="page-content" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="animate-reveal">
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>
              {showImposter ? '🎭' : '🗳️'}
            </div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', letterSpacing: '0.05em', marginBottom: 8 }}>
              THE IMPOSTER WAS...
            </h2>
            <div style={{
              background: 'linear-gradient(135deg, rgba(232,68,68,0.2), rgba(232,68,68,0.05))',
              border: '2px solid var(--accent)',
              borderRadius: 20,
              padding: '24px 40px',
              marginBottom: 24,
            }}>
              <p style={{ fontFamily: 'Bebas Neue', fontSize: '3rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                {imposterName}
              </p>
            </div>

            <div className="panel" style={{ marginBottom: 24, textAlign: 'left', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted text-sm">Topic</span>
                  <span className="tag tag-blue">{config.topic}</span>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted text-sm">Secret Word</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>{config.word}</span>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span className="text-muted text-sm" style={{ flexShrink: 0 }}>Imposter's Hint</span>
                  <span style={{ fontStyle: 'italic', color: 'var(--text2)', textAlign: 'right', fontSize: '0.9rem' }}>"{config.hint}"</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <button className="btn btn-primary btn-lg btn-full" onClick={onPlayAgain}>
                🔄 Play Again
              </button>
              <button className="btn btn-ghost btn-full" onClick={onBack}>
                ← Home
              </button>
            </div>
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
              DISCUSSION TIME
            </h2>
            <p className="text-muted" style={{ marginBottom: 24, maxWidth: 320 }}>
              Everyone has seen their word. Now discuss and figure out who the imposter is!
            </p>

            <div className="panel" style={{ marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '0.95rem', marginBottom: 12, color: 'var(--text2)' }}>
                PLAYERS IN GAME
              </p>
              <div className="player-list">
                {config.players.map((name, i) => (
                  <div key={i} className="player-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="player-avatar">{name[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                    </div>
                    <span className="tag tag-red" style={{ opacity: 0.6, fontSize: '0.7rem' }}>?</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <button className="btn btn-primary btn-lg btn-full" onClick={handleRevealImposter}>
                🎭 Reveal Imposter
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Card reveal phase
  return (
    <div className="page-center">
      <div className="page-content" style={{ alignItems: 'center', textAlign: 'center' }}>

        {/* Header */}
        <div className="animate-fade" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Exit</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {config.players.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < revealedCount ? 'var(--success)' : i === currentPlayerIdx ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <span className="tag tag-blue">{config.topic}</span>
        </div>

        <div className="animate-fade" style={{ animationDelay: '0.05s' }}>
          <p className="text-muted text-sm">Pass device to</p>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', letterSpacing: '0.05em', color: 'var(--text)' }}>
            {currentPlayer.toUpperCase()}
          </h2>
        </div>

        {/* Card */}
        <div className="animate-fade" style={{ animationDelay: '0.1s', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="card-scene" onClick={!isFlipped ? handleFlip : undefined}>
            <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
              {/* Back (tap to reveal) */}
              <div className="card-face card-back-face">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🃏</div>
                <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.9)' }}>
                  TAP TO REVEAL
                </p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                  Make sure no one else is watching
                </p>
              </div>

              {/* Front (word or hint) */}
              <div className="card-face card-front-face">
                {isCurrentImposter ? (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <span className="tag tag-red">🎭 IMPOSTER</span>
                    </div>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.05em', color: 'var(--accent)', marginBottom: 10 }}>
                      YOU'RE THE IMPOSTER
                    </p>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text2)', marginBottom: 10 }}>
                      YOUR HINT WORD
                    </p>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', letterSpacing: '0.06em', color: 'var(--text)', textAlign: 'center' }}>
                      {config.hint}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 10 }}>
                      Difficulty: {config.difficulty}
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <span className="tag tag-green">✓ CREWMATE</span>
                    </div>
                    <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text2)', marginBottom: 10 }}>
                      SECRET WORD
                    </p>
                    <p style={{
                      fontFamily: 'Bebas Neue',
                      fontSize: '2.8rem',
                      letterSpacing: '0.06em',
                      color: 'var(--text)',
                      textAlign: 'center',
                    }}>
                      {config.word}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions / Next button */}
        <div className="animate-fade" style={{ animationDelay: '0.15s', width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {!isFlipped ? (
            <p className="text-sm text-muted">
              {currentPlayerIdx === 0
                ? `${config.players.length} players · ${config.topic} · ${config.difficulty} hints`
                : `Player ${currentPlayerIdx + 1} of ${config.players.length}`}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">Remember your word, then pass the device</p>
              <button className="btn btn-primary btn-lg btn-full" onClick={handleNext}>
                {currentPlayerIdx === config.players.length - 1 ? '🚀 Start Discussion' : `Next: ${config.players[currentPlayerIdx + 1]} →`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
