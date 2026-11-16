import { useEffect, useState } from 'react';
import type { CardInstance } from '../../game/types';
import { useGame } from '../../game/store';
import { CARD_MAP } from '../../data/cards';
import { GameCard } from '../ui';
import { fx } from '../fx';

const ROT = [-4, 2, -1, 3, -3];

export default function PackReveal({ cards }: { cards: CardInstance[] }) {
  const { setReveal } = useGame();
  const [shown, setShown] = useState(0);
  const all = shown >= cards.length;

  useEffect(() => {
    if (shown >= cards.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 150 : 320);
    return () => clearTimeout(t);
  }, [shown, cards.length]);

  useEffect(() => {
    if (shown === 0) return;
    const def = CARD_MAP[cards[shown - 1].defId];
    if (def.rarity === 'legendary') fx({ type: 'stamp', text: 'Legendary!', tone: 'sun' });
    else if (def.rarity === 'epic') fx({ type: 'tape', n: 50 });
  }, [shown, cards]);

  return (
    <div className="fixed inset-0 z-50 bg-ink/80 flex flex-col items-center justify-center p-4" onClick={() => (all ? setReveal(null) : setShown(cards.length))}>
      <div className="tag tag-sun !text-sm mb-6">{all ? 'Added to your hand' : 'Opening…'}</div>
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
        {cards.map((inst, i) => {
          const def = CARD_MAP[inst.defId];
          return (
            <div key={inst.uid} className={`w-[140px] h-[200px] sm:w-[165px] sm:h-[235px] ${i < shown ? 'card-slap' : 'opacity-0'}`} style={{ ['--rot' as string]: `${ROT[i % ROT.length]}deg` }}>
              <GameCard def={def} />
            </div>
          );
        })}
      </div>
      <button className="btn-sun mt-8 !px-8" onClick={(e) => { e.stopPropagation(); if (all) setReveal(null); else setShown(cards.length); }}>{all ? 'Done' : 'Skip'}</button>
    </div>
  );
}
