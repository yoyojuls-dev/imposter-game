import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { MultiplayerState } from '../types'

interface Props {
  onBack: () => void
  onEnterLobby: (state: MultiplayerState) => void
}

type View = 'menu' | 'create' | 'join'

const SERVER_URL = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:3001'

export default function MultiplayerSetup({ onBack, onEnterLobby }: Props) {
  const [view, setView] = useState<View>('menu')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const s = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        timeout: 10000,
      })
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    setSocket(s)
    return () => { s.disconnect() }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('room_joined', ({ room, playerId }: any) => {
      setLoading(false)
      onEnterLobby({ socket, room, playerId, playerName })
    })

    socket.on('error', ({ message }: { message: string }) => {
      setLoading(false)
      setError(message)
      console.log('Socket error:', message)
    })

    return () => {
      socket.off('room_joined')
      socket.off('error')
    }
  }, [socket, playerName])

  

  const handleCreate = () => {
    if (!playerName.trim()) { setError('Enter your name'); return }
    setLoading(true)
    setError('')
    socket?.emit('create_room', { playerName: playerName.trim() })
  }

  const handleJoin = () => {
    if (!playerName.trim()) { setError('Enter your name'); return }
    if (!roomCode.trim()) { setError('Enter a room code'); return }
    setLoading(true)
    setError('')
    console.log('Emitting join_room:', roomCode.toUpperCase().trim())
    socket?.emit('join_room', { roomCode: roomCode.toUpperCase().trim(), playerName: playerName.trim() })
  }

  return (
    <div className="page-center">
      <div className="page-content">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => view === 'menu' ? onBack() : setView('menu')}>← Back</button>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.05em' }}>MULTIPLAYER</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--success)' : 'var(--accent)',
              boxShadow: connected ? '0 0 6px var(--success)' : '0 0 6px var(--accent)',
              animation: connected ? 'none' : 'pulse 1.2s ease infinite',
            }} />
            <span className="text-xs text-muted">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        {view === 'menu' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌐</div>
              <p className="text-muted text-sm" style={{ marginBottom: 24, maxWidth: 280, margin: '0 auto 24px' }}>
                Play with friends on their own devices. Create a room or join one with a code.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary btn-lg btn-full" disabled={!connected} onClick={() => setView('create')}>
                  🏠 Create Room
                </button>
                <button className="btn btn-secondary btn-lg btn-full" disabled={!connected} onClick={() => setView('join')}>
                  🔑 Join Room
                </button>
              </div>
              {!connected && (
                <p className="text-xs text-muted" style={{ marginTop: 12 }}>
                  Waiting for server on {SERVER_URL}...
                </p>
              )}
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>YOUR NAME</p>
              <input
                className="input"
                placeholder="Enter your name"
                value={playerName}
                onChange={e => { setPlayerName(e.target.value); setError('') }}
                maxLength={20}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(232,68,68,0.1)', border: '1px solid rgba(232,68,68,0.3)', borderRadius: 12, padding: '12px 16px' }}>
                <p className="text-sm text-red">{error}</p>
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-full" disabled={loading || !playerName.trim() || !connected} onClick={handleCreate}>
              {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Creating...</> : '🏠 Create Room'}
            </button>
          </div>
        )}

        {view === 'join' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>YOUR NAME</p>
              <input
                className="input"
                placeholder="Enter your name"
                value={playerName}
                onChange={e => { setPlayerName(e.target.value); setError('') }}
                maxLength={20}
                autoFocus
              />
              <p style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.05em', fontSize: '1rem' }}>ROOM CODE</p>
              <input
                className="input"
                placeholder="e.g. XKQM2"
                value={roomCode}
                onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                maxLength={5}
                style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'Bebas Neue', fontSize: '1.4rem', textAlign: 'center' }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(232,68,68,0.1)', border: '1px solid rgba(232,68,68,0.3)', borderRadius: 12, padding: '12px 16px' }}>
                <p className="text-sm text-red">{error}</p>
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-full" disabled={loading || !playerName.trim() || !roomCode.trim() || !connected} onClick={handleJoin}>
              {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Joining...</> : '🔑 Join Room'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
