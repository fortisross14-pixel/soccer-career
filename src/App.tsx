import { GameProvider, useGame } from './game/store';
import Home from './components/Home';
import Game from './components/Game';

function Shell() {
  const { career } = useGame();
  return career ? <Game /> : <Home />;
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
