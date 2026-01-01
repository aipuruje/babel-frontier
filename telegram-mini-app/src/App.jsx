import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './components/Home';
import Profile from './components/Profile';
import BattleArena from './components/BattleArena';
import UserBrainState from './components/UserBrainState';

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/battle" element={<BattleArena />} />
        <Route path="/brain-state" element={<UserBrainState />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
