import { useEffect, useRef, useState } from 'react';
import type { CoinEvent } from '../game/types';
import { onFx, type FxEvent } from './fx';

interface Part { x: number; y: number; vx: number; vy: number; g: number; s: number; c: string; life: number; rot: number; vr: number; kind: 'tape' | 'chip' }
interface Sticker { id: number; text: string; cls: string; style: React.CSSProperties }
interface Toast { id: number; e: CoinEvent }

const COLORS = ['#e0262f', '#ffd23f', '#ffffff', '#121212'];
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let seq = 0;

/** Global celebration layer: ticker tape, bursts, slapped stickers and coin toasts. */
export default function FxLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<Part[]>([]);
  const running = useRef(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext('2d')!;
    const size = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size();
    addEventListener('resize', size);

    const loop = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.current = parts.current.filter((p) => p.life > 0 && p.y < innerHeight + 40);
      for (const p of parts.current) {
        p.life--; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.985; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.strokeStyle = '#121212'; ctx.lineWidth = 1.5;
        if (p.kind === 'tape') { ctx.fillRect(-p.s, -p.s * 0.28, p.s * 2, p.s * 0.56); ctx.strokeRect(-p.s, -p.s * 0.28, p.s * 2, p.s * 0.56); }
        else { ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.strokeRect(-p.s / 2, -p.s / 2, p.s, p.s); }
        ctx.restore();
      }
      if (parts.current.length) requestAnimationFrame(loop);
      else { running.current = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
    const kick = () => { if (!running.current) { running.current = true; requestAnimationFrame(loop); } };

    const tape = (n: number) => {
      for (let i = 0; i < n; i++) parts.current.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, g: 0.04, s: 6 + Math.random() * 6, c: COLORS[i % 4], life: 200, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, kind: 'tape' });
      kick();
    };
    const burst = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 8;
        parts.current.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, g: 0.28, s: 5 + Math.random() * 5, c: COLORS[i % 4], life: 70 + Math.random() * 40, rot: 0, vr: (Math.random() - 0.5) * 0.4, kind: Math.random() < 0.5 ? 'tape' : 'chip' });
      }
      kick();
    };
    const slap = (items: Omit<Sticker, 'id'>[]) => {
      const withIds = items.map((s) => ({ ...s, id: ++seq }));
      setStickers((cur) => [...cur, ...withIds]);
      setTimeout(() => setStickers((cur) => cur.filter((s) => !withIds.includes(s))), 2500);
    };
    const shake = () => {
      const root = document.getElementById('root');
      if (!root || reduce) return;
      root.classList.remove('screen-shake'); void root.offsetWidth; root.classList.add('screen-shake');
    };

    const off = onFx((e: FxEvent) => {
      if (e.type === 'coins') {
        const add = e.events.slice(0, 6).map((ev) => ({ id: ++seq, e: ev }));
        setToasts((cur) => [...cur, ...add].slice(-6));
        add.forEach((t, i) => setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 3200 + i * 250));
        return;
      }
      if (reduce) return;
      if (e.type === 'tape') tape(e.n ?? 140);
      if (e.type === 'burst') burst(e.x, e.y, e.n ?? 24);
      if (e.type === 'goal') {
        tape(170); shake();
        slap([
          { text: e.text, cls: 'bg-red text-white', style: { left: '8%', top: '20%', fontSize: 'clamp(40px, 9vw, 100px)', ['--r0' as string]: '-28deg', ['--r1' as string]: '-7deg' } },
          { text: 'GET IN!', cls: 'bg-sun', style: { right: '6%', top: '36%', fontSize: 'clamp(28px, 6vw, 64px)', animationDelay: '.12s', ['--r0' as string]: '24deg', ['--r1' as string]: '6deg' } },
          ...(e.sub ? [{ text: e.sub, cls: 'bg-white', style: { left: '16%', bottom: '18%', fontSize: 'clamp(18px, 4vw, 38px)', animationDelay: '.24s', ['--r0' as string]: '-18deg', ['--r1' as string]: '-2deg' } }] : []),
        ]);
      }
      if (e.type === 'stamp') {
        slap([{ text: e.text, cls: e.tone === 'sun' ? 'bg-sun' : e.tone === 'white' ? 'bg-white' : 'bg-red text-white', style: { left: '50%', top: '40%', translate: '-50% -50%', fontSize: 'clamp(30px, 7vw, 72px)', ['--r0' as string]: '-20deg', ['--r1' as string]: '-4deg' } }]);
        tape(90);
      }
    });
    return () => { off(); removeEventListener('resize', size); };
  }, []);

  return (
    <>
      <canvas ref={canvas} className="fixed inset-0 w-full h-full pointer-events-none z-[90]" aria-hidden="true" />
      {stickers.map((s) => <div key={s.id} className={`goal-sticker ${s.cls}`} style={s.style}>{s.text}</div>)}
      <div className="fixed right-3 top-20 z-[96] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="coin-toast sticker px-3 py-2 flex items-center gap-2 text-sm font-extrabold max-w-[280px]">
            <span className="coin">c</span><span className="stat-num">+{t.e.amount}</span><span className="truncate">{t.e.label}</span>
            {t.e.milestone && <span className="tag tag-sun !text-[8px]">milestone</span>}
          </div>
        ))}
      </div>
    </>
  );
}
