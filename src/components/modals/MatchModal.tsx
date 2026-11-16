import { useGame } from '../../game/store';
import { teamName } from '../../engines/teams';
import { fmtDay } from '../../engines/util';
import { Modal, RatingBadge, Stat } from '../ui';
import { findFixture } from '../format';

const LABELS: Record<string, string> = {
  shots: 'Shots', onTarget: 'On target', keyPasses: 'Key passes', passes: 'Passes', passAcc: 'Pass acc. %', dribbles: 'Dribbles',
  tackles: 'Tackles', interceptions: 'Interceptions', aerials: 'Aerials won', saves: 'Saves', conceded: 'Conceded',
};
const ICON: Record<string, string> = { goal: '⚽', 'sub-on': '↑', 'sub-off': '↓', yellow: '🟨', injury: '🚑', save: '🧤', chance: '◎' };

export default function MatchModal({ id }: { id: string }) {
  const { career, openMatch } = useGame();
  if (!career) return null;
  const fx = findFixture(career, id);
  if (!fx || !fx.report) return null;
  const r = fx.report;
  const year = career.season?.fixtures.includes(fx) ? career.year : career.year - 1;
  const home = fx.home ? fx.usId : fx.oppId;
  const away = fx.home ? fx.oppId : fx.usId;
  const hg = fx.home ? fx.usGoals : fx.oppGoals;
  const ag = fx.home ? fx.oppGoals : fx.usGoals;
  const won = (fx.usGoals ?? 0) > (fx.oppGoals ?? 0) || fx.penalties?.startsWith('W');
  const lost = (fx.usGoals ?? 0) < (fx.oppGoals ?? 0) || fx.penalties?.startsWith('L');

  return (
    <Modal onClose={() => openMatch(null)} wide>
      <div className="p-5 border-b border-ink">
        <div className="flex justify-between text-[10px] uppercase tracking-[.16em] text-muted font-bold">
          <span>{fx.compName} · {fx.stage}</span><span>{fmtDay(fx.day, year)}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4">
          <div className={`font-display text-xl sm:text-3xl font-bold text-right leading-tight ${home === fx.usId ? 'text-ink' : 'text-muted'}`}>{teamName(home)}</div>
          <div className={`stat-num text-4xl sm:text-5xl px-3 ${won ? 'text-[#178a4c]' : lost ? 'text-red' : ''}`}>{hg}–{ag}</div>
          <div className={`font-display text-xl sm:text-3xl font-bold leading-tight ${away === fx.usId ? 'text-ink' : 'text-muted'}`}>{teamName(away)}</div>
        </div>
        {fx.penalties && <div className="text-center text-xs text-muted mt-1">{fx.penalties}</div>}
      </div>

      <div className="p-5 grid sm:grid-cols-[1fr_1.1fr] gap-5">
        <div>
          <div className="eyebrow mb-3">Your match</div>
          {r.minutes > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl"><RatingBadge value={r.rating} /></div>
                <div className="text-sm">{r.note} · <span className="stat-num">{r.minutes}'</span>{r.motm && <span className="ml-2 pill !bg-sun">⭐ Man of the Match</span>}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Goals" value={r.goals} />
                <Stat label="Assists" value={r.assists} />
                <Stat label="Minutes" value={r.minutes} />
                {Object.entries(r.stats).filter(([k]) => LABELS[k]).map(([k, v]) => <Stat key={k} label={LABELS[k]} value={v} />)}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-ink p-4 text-sm text-muted">{r.note}. {r.involvement === 'dropped' ? 'Improve your form, fitness and manager trust to get picked.' : r.involvement === 'bench' ? 'You warmed up but never came on.' : ''}</div>
          )}
        </div>
        <div>
          <div className="eyebrow mb-3">Timeline</div>
          {r.events.length === 0 ? <p className="text-sm text-muted">A quiet game.</p> : (
            <div className="space-y-1.5">
              {r.events.map((e, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm rounded px-2 py-1 ${e.mine ? 'bg-sun' : ''} ${e.side === 'them' ? 'text-muted' : ''}`}>
                  <span className="stat-num text-xs w-8 text-right">{e.minute}'</span>
                  <span className="w-5 text-center">{ICON[e.type]}</span>
                  <span className="flex-1">{e.side === 'them' && e.type === 'goal' ? `${teamName(fx.oppId)}: ${e.text}` : e.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-5"><button className="btn-white btn-sm w-full" onClick={() => openMatch(null)}>Close</button></div>
    </Modal>
  );
}
