interface HomePageProps {
  onSingleDevice: () => void
  onMultiplayer: () => void
}

export default function HomePage({ onSingleDevice, onMultiplayer }: HomePageProps) {
  return (
    <div className="page-center">
      <div className="page-content" style={{ alignItems: 'center', textAlign: 'center' }}>

        <div className="animate-fade" style={{ animationDelay: '0s' }}>
          <div style={{ marginBottom: 8 }}>
            <span className="tag tag-red">🕵️ Party Game</span>
          </div>
          <h1 className="title-huge">IMPOSTER</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1rem', maxWidth: 320 }}>
            One player hides among the crowd.<br />Can you find them before it's too late?
          </p>
        </div>

        <div className="animate-fade" style={{ animationDelay: '0.1s', width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <button className="btn btn-primary btn-lg btn-full" onClick={onSingleDevice}>
            <span>📱</span> Single Device
          </button>
          <button className="btn btn-secondary btn-lg btn-full" onClick={onMultiplayer}>
            <span>🌐</span> Multiplayer (Online)
          </button>
        </div>

        <div className="animate-fade" style={{ animationDelay: '0.2s', marginTop: 8 }}>
          <div className="panel" style={{ textAlign: 'left', gap: 12, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem', color: 'var(--text2)' }}>HOW TO PLAY</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['🎯', 'A topic is chosen and a secret word is picked'],
                ['🤫', 'Everyone gets the word — except one imposter'],
                ['💬', 'Players discuss clues without revealing the word'],
                ['🗳️', 'Vote to find the imposter before they blend in'],
              ].map(([icon, text], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                  <span className="text-sm text-muted">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted animate-fade" style={{ animationDelay: '0.3s', opacity: 0.5 }}>
          Powered by AI · Minimum 3 players
        </p>
      </div>
    </div>
  )
}
