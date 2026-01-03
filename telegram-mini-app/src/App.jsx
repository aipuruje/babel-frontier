import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './components/Home';
import Profile from './components/Profile';
import BattleArena from './components/BattleArena';
import UserBrainState from './components/UserBrainState';
import EquipmentInventory from './components/EquipmentInventory';
import ListeningInterrogation from './components/ListeningInterrogation';
import ReadingDecryption from './components/ReadingDecryption';
import WritingFortress from './components/WritingFortress';
import BossBattle from './components/BossBattle';
import Marketplace from './components/Marketplace';
import WritingFoundry from './components/WritingFoundry';
import RegionalMap from './components/RegionalMap';
import LiveBossRaid from './components/LiveBossRaid';
import ZenGarden from './components/ZenGarden';
import OraclesSeal from './components/OraclesSeal';
import GrammarBoss from './components/GrammarBoss';
import { LiteModeProvider } from './components/LiteModeContext';

function App() {
  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Expand the app to full height
      tg.expand();

      // Enable closing confirmation
      tg.enableClosingConfirmation();

      // Set header color to match theme
      tg.setHeaderColor('#0a0a0a');
      tg.setBackgroundColor('#0a0a0a');

      // Ready signal
      tg.ready();
    }
  }, []);

  return (
    <LiteModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/battle" element={<BattleArena />} />
          <Route path="/boss" element={<BossBattle />} />
          <Route path="/brain-state" element={<UserBrainState />} />
          <Route path="/equipment" element={<EquipmentInventory currentBandScore="band_6.5" />} />
          <Route path="/listening" element={<ListeningInterrogation />} />
          <Route path="/reading" element={<ReadingDecryption />} />
          <Route path="/writing" element={<WritingFortress />} />

          {/* Week 2: Monetization & Writing Foundry */}
          <Route path="/marketplace" element={<Marketplace userId={window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest'} />} />
          <Route path="/writing-foundry" element={<WritingFoundry userId={window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest'} />} />

          {/* Week 2: Social Warfare & Live Events */}
          <Route path="/regional-map" element={<RegionalMap userId={window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest'} />} />
          <Route path="/events/:eventId" element={<LiveBossRaid userId={window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest'} eventId={window.location.pathname.split('/')[2]} />} />
          <Route path="/events/:eventId" element={<LiveBossRaid userId={window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest'} eventId={window.location.pathname.split('/')[2]} />} />

          {/* Audit Mitigations */}
          <Route path="/zen-garden" element={<ZenGarden />} />
          <Route path="/oracle" element={<OraclesSeal />} />
          <Route path="/grammar-boss" element={<GrammarBoss />} />
        </Routes>
      </BrowserRouter>
    </LiteModeProvider>
  );
}

export default App;
