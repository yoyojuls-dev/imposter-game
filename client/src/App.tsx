import { useState } from 'react'
import HomePage from './pages/HomePage'
import SingleDeviceSetup from './pages/SingleDeviceSetup'
import SingleDeviceGame from './pages/SingleDeviceGame'
import MultiplayerSetup from './pages/MultiplayerSetup'
import MultiplayerLobby from './pages/MultiplayerLobby'
import MultiplayerGame from './pages/MultiplayerGame'
import { AppPage, GameConfig, MultiplayerState } from './types'

const [savedPlayers, setSavedPlayers] = useState<string[]>([])

export default function App() {
  const [page, setPage] = useState<AppPage>('home')
  const [singleConfig, setSingleConfig] = useState<GameConfig | null>(null)
  const [mpState, setMpState] = useState<MultiplayerState | null>(null)

  const navigate = (p: AppPage) => setPage(p)

  return (
    <div className="app">
      {page === 'home' && (
        <HomePage
          onSingleDevice={() => navigate('single-setup')}
          onMultiplayer={() => navigate('mp-setup')}
        />
      )}
      {page === 'single-setup' && (
        <SingleDeviceSetup
          initialPlayers={savedPlayers}
          onBack={() => { setSavedPlayers([]); navigate('home') }}
          onStart={(config) => { setSingleConfig(config); navigate('single-game') }}
        />
      )}
      {page === 'single-game' && singleConfig && (
        <SingleDeviceGame
          config={singleConfig}
          onBack={() => navigate('home')}
          onPlayAgain={() => { setSavedPlayers(singleConfig.players); navigate('single-setup') }}
        />
      )}
      {page === 'mp-setup' && (
        <MultiplayerSetup
          onBack={() => navigate('home')}
          onEnterLobby={(state) => { setMpState(state); navigate('mp-lobby') }}
        />
      )}
      {page === 'mp-lobby' && mpState && (
        <MultiplayerLobby
          initialState={mpState}
          onBack={() => navigate('home')}
          onGameStart={(state) => { setMpState(state); navigate('mp-game') }}
        />
      )}
      {page === 'mp-game' && mpState && (
        <MultiplayerGame
          state={mpState}
          onBack={() => navigate('home')}
          onPlayAgain={(state) => { setMpState(state); navigate('mp-lobby') }}
        />
      )}
    </div>
  )
}
