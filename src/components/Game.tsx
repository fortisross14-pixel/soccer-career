import { useState } from 'react';
import { useGame } from '../game/store';
import { playerOverall } from '../engines/overall';
import { POSITION_MAP } from '../data/positions';
import { fmtMoney } from '../engines/util';
import { TRAINING } from '../data/development';
import Summary from './tabs/Summary';
import Skills from './tabs/Skills';
import Actions from './tabs/Actions';
import Career from './tabs/Career';
import Honors from './tabs/Honors';
import Timeline from './tabs/Timeline';
import Rival from './tabs/Rival';
import NationalTeam from './tabs/NationalTeam';
import Records from './tabs/Records';
import YearSummary from './YearSummary';
import SeasonEventModal from './SeasonEventModal';
import { CLUB_MAP } from '../data/clubs';


const TABS = [
  { label: 'Overview', icon: '⌂' },
  { label: 'Development', icon: '↗' },
  { label: 'Contract', icon: '✎' },
  { label: 'National Team', icon: '◎' },
  { label: 'Rivalry', icon: '⚔' },
  { label: 'Records', icon: '▤' },
  { label: 'Career', icon: '◫' },
  { label: 'Honors', icon: '★' },
  { label: 'Timeline', icon: '⌁' },
] as const;

function playUiSound(kind: 'tap' | 'advance') {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = kind === 'advance' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(kind === 'advance' ? 160 : 420, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'advance' ? 520 : 620, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.13);
    oscillator.addEventListener('ended', () => void ctx.close());
  } catch {
    // Sound is an enhancement; browsers may block it without user interaction.
  }
}

export default function Game() {
  const { player, exit, advance, summary, clearSummary, currentEvent, pendingEvents, resolveEvent } = useGame();
  const [tab, setTab] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  if (!player) return null;
  const ovr = playerOverall(player);
const pos = POSITION_MAP[player.position];

const currentClub = player.contract
  ? CLUB_MAP[player.contract.clubId]
  : player.academyClubId
    ? CLUB_MAP[player.academyClubId]
    : null;

const clubLabel =
  currentClub?.name ??
  (player.age < 16 ? 'Academy prospect' : 'Free agent');

const fitness = player.fitness ?? 75;
const morale = player.morale ?? 70;

const fitnessTone =
  fitness >= 75
    ? 'good'
    : fitness >= 45
      ? 'warn'
      : 'danger';

const shirtNumber =
  player.position === 'GK'
    ? '1'
    : player.position === 'ST'
      ? '9'
      : player.position === 'W'
        ? '11'
        : player.position === 'CB' || player.position === 'FB'
          ? '4'
          : '8';
  const selectTab = (index: number) => {
    if (soundOn) playUiSound('tap');
    setTab(index);
  };

  const doAdvance = () => {
    if (soundOn) playUiSound('advance');
    const keys = focusId ? TRAINING.find((t) => t.id === focusId)?.keys ?? null : null;
    advance(keys);
    setFocusId(null);
  };

  return (
    <div className="career-game">
      <aside className="career-rail">
        <button className="brand-mark" onClick={exit} aria-label="Return to main menu">
          <span>XI</span>
          <small>THE<br />ELEVENTH</small>
        </button>

        <nav className="rail-nav" aria-label="Career screens">
          {TABS.map((item, index) => (
            <button key={item.label} className={tab === index ? 'active' : ''} onClick={() => selectTab(index)}>
              <span className="rail-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="rail-footer">
          <button className="sound-toggle" onClick={() => setSoundOn((value) => !value)}>
            {soundOn ? '◖))' : '◖×'} <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
          </button>
          <button className="exit-career" onClick={exit}>Exit career</button>
        </div>
      </aside>

      <div className="career-stage">
        <header className="player-hud">
          <div className="player-identity">
            <div className="shirt-number">{shirtNumber}</div>
            
            
            <div>
              <span className="hud-kicker">{player.age < 16 ? 'ACADEMY JOURNEY' : player.retired ? 'CAREER ARCHIVE' : 'ACTIVE CAREER'}</span>
              <h1>{player.name}</h1>
              <p>{clubLabel} <b>·</b> {pos.name} <b>·</b> Age {player.age}</p>
            </div>
          </div>

          <div className="hud-stats">
            <div className="hud-stat overall"><span>OVR</span><strong>{ovr}</strong></div>
            
            <div className="hud-stat">
              <span>Morale</span>
                <strong>{morale}</strong>
              </div>

            <div className={`hud-stat ${fitnessTone}`}>
              <span>Fitness</span>
              <strong>{fitness}</strong>
            </div>
            
            <div className="hud-stat money"><span>Career wealth</span><strong>{fmtMoney(player.money)}</strong></div>
          </div>
        </header>

        <div className="screen-titlebar">
          <div>
            <span>{String(tab + 1).padStart(2, '0')} / {String(TABS.length).padStart(2, '0')}</span>
            <h2>{TABS[tab].label}</h2>
          </div>
          <div className="season-chip">
            <small>Current season</small>
            <strong>{player.age} YEARS OLD</strong>
          </div>
        </div>

        <main className="career-content animate-screen-in">
          {tab === 0 && <Summary player={player} />}
          {tab === 1 && <Skills player={player} focusId={focusId} setFocusId={setFocusId} />}
          {tab === 2 && <Actions player={player} />}
          {tab === 3 && <NationalTeam player={player} />}
          {tab === 4 && <Rival player={player} />}
          {tab === 5 && <Records player={player} />}
          {tab === 6 && <Career player={player} />}
          {tab === 7 && <Honors player={player} />}
          {tab === 8 && <Timeline player={player} />}
        </main>
      </div>

      <nav className="mobile-game-nav" aria-label="Mobile career screens">
        {TABS.slice(0, 5).map((item, index) => (
          <button key={item.label} className={tab === index ? 'active' : ''} onClick={() => selectTab(index)}>
            <span>{item.icon}</span><small>{item.label === 'National Team' ? 'Nation' : item.label}</small>
          </button>
        ))}
      </nav>

      {!player.retired ? (
        <div className="advance-dock">
          <div className="advance-context">
            <span>Next season plan</span>
            <strong>{focusId ? TRAINING.find((t) => t.id === focusId)?.label : 'No specialist focus selected'}</strong>
          </div>
          <button className="advance-button" onClick={doAdvance}>
            <span>ADVANCE YEAR</span>
            <b>→</b>
          </button>
        </div>
      ) : (
        <div className="advance-dock retired-dock">
          <div className="advance-context"><span>Final whistle</span><strong>This career has ended</strong></div>
          <button className="advance-button" onClick={exit}><span>MAIN MENU</span><b>→</b></button>
        </div>
      )}

      {currentEvent && <SeasonEventModal event={currentEvent} index={1} total={pendingEvents.length} onChoose={resolveEvent} />}
      {summary && <YearSummary summary={summary} player={player} onClose={clearSummary} />}
    </div>
  );
}
