import { useState } from 'react';
import type { CardInstance } from '../../game/types';
import { useGame } from '../../game/store';
import { CARD_MAP } from '../../data/cards';
import { GameCard } from '../ui';

export default function PackReveal({ cards }: { cards: CardInstance[] }) {
  const { setReveal } = useGame();
  const [shown, setShown] = useState<number>(0);
  const all = shown >= cards.length;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4" onClick={() => (all ? setReveal(null) : setShown(cards.length))}>
      <div className="eyebrow mb-5">{all ? 'Added to your hand' : 'Tap a card to reveal it'}</div>
      <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
        {cards.map((inst, i) => {
          const def = CARD_MAP[inst.defId];
          const revealed = i < shown;
          return (
            <div key={inst.uid} className={`flip w-[150px] h-[220px] sm:w-[170px] sm:h-[250px] ${revealed ? 'revealed' : ''}`} onClick={(e) => { e.stopPropagation(); if (!revealed) setShown(Math.max(shown, i + 1)); }}>
              <div className="flip-inner">
                <div className="flip-face"><div className="card-back"><span className="font-display text-4xl font-black text-lime/70">XI</span></div></div>
                <div className="flip-face flip-back"><GameCard def={def} compact /></div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn-primary mt-8 px-8" onClick={(e) => { e.stopPropagation(); if (all) setReveal(null); else setShown(cards.length); }}>{all ? 'Done' : 'Reveal all'}</button>
    </div>
  );
}
