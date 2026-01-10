// Main App Component with Routing

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './lib/i18n';
import './styles/design-system.css';
import { usePlayerState } from './lib/playerState';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Pages
import Dashboard from './features/dashboard/Dashboard';
import ZoneMap from './features/world/ZoneMap';
import QuestList from './features/quests/QuestList';
import BattleArena from './features/quests/battle/BattleArena';
import PlayerProfile from './features/profile/PlayerProfile';
import Inventory from './features/inventory/Inventory';

function App() {
  const { playerState } = usePlayerState();

  useEffect(() => {
    document.title = 'Archive of Tongues';
  }, []);

  return (
    <BrowserRouter>
      <AppLayout playerState={playerState}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zones" element={<ZoneMap />} />
          <Route path="/zones/:zoneId/quests" element={<QuestList />} />
          <Route path="/quest/:questId/battle" element={<BattleArena />} />
          <Route path="/profile" element={<PlayerProfile />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
