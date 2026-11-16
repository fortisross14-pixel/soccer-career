import { Component, type ReactNode } from 'react';
import { GameProvider, useGame } from './game/store';
import Home from './components/Home';
import Game from './components/Game';
import FxLayer from './components/FxLayer';

/** a crash on one screen must never look like a lost save */
class Crash extends Component<{ children: ReactNode; onExit: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="panel p-6 max-w-md text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Something broke on this screen</h1>
          <p className="text-sm font-semibold text-muted mb-4">Your career is saved and safe. Go back to the menu and continue it from there.</p>
          <p className="text-[11px] font-mono text-muted mb-4 break-words">{this.state.error.message}</p>
          <button className="btn-red" onClick={() => { this.setState({ error: null }); this.props.onExit(); }}>Back to menu</button>
        </div>
      </div>
    );
  }
}

function Shell() {
  const { career, exit } = useGame();
  return <Crash onExit={exit}>{career ? <Game /> : <Home />}</Crash>;
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
      <FxLayer />
    </GameProvider>
  );
}
