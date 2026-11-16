import { GameProvider, useGame } from './game/store';
import Home from './components/Home';
import Game from './components/Game';
import FxLayer from './components/FxLayer';

function Shell() {
  const { career } = useGame();
  return career ? <Game /> : <Home />;
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
      <FxLayer />
    </GameProvider>
  );
}
