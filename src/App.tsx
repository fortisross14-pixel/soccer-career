import { GameProvider, useGame } from './game/store';
import Home from './components/Home';
import Game from './components/Game';

function Shell() {
  const { screen } = useGame();
  return screen === 'home' ? <Home /> : <Game />;
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
