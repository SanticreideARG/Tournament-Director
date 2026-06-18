import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppBackground from './components/AppBackground';
import MenuScreen from './screens/MenuScreen';
import StartScreen from './screens/StartScreen';
import TimerScreen from './screens/TimerScreen';
import ConfigScreen from './screens/ConfigScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useSettingsStore } from './store/useSettingsStore';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <HashRouter>
      <AppBackground />
      <div className="stage-root">
        <Routes>
          <Route path="/" element={<MenuScreen />} />
          <Route path="/start" element={<StartScreen />} />
          <Route path="/timer" element={<TimerScreen />} />
          <Route path="/config" element={<ConfigScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
