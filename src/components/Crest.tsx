import { useId } from 'react';
import { CLUB_MAP } from '../data/clubs';
import { crestClubId } from '../engines/teams';
import { clubInitials, clubStyle, type CrestShape } from '../data/crests';

const SHAPE_PATH: Record<CrestShape, string> = {
  shield: 'M6 4h52v26c0 16-12 25-26 30C18 55 6 46 6 30z',
  classic: 'M4 6c10 2 18 0 28-4 10 4 18 6 28 4v24c0 16-12 25-28 30C16 55 4 46 4 30z',
  round: 'M32 3a29 29 0 1 0 0.01 0z',
  diamond: 'M32 2l29 30-29 30L3 32z',
};

/** an original badge in the club's colours: shape, pattern and initials */
export default function Crest({ clubId, name, size = 32, className = '' }: { clubId?: string; name?: string; size?: number; className?: string }) {
  const clubName = name ?? (clubId ? CLUB_MAP[clubId]?.name : undefined) ?? '?';
  const st = clubStyle(clubName);
  const id = useId().replace(/:/g, '');
  const ini = clubInitials(clubName);
  const fs = ini.length >= 4 ? 13 : ini.length === 3 ? 16 : 20;
  const p = st.primary, s2 = st.secondary;
  const pattern = (() => {
    switch (st.pattern) {
      case 'stripes': return [8, 24, 40, 56].map((x) => <rect key={x} x={x - 4} y={0} width={8} height={64} fill={s2} />);
      case 'hoops': return [10, 30, 50].map((y) => <rect key={y} x={0} y={y - 5} width={64} height={10} fill={s2} />);
      case 'halves': return <rect x={32} y={0} width={32} height={64} fill={s2} />;
      case 'sash': return <path d="M-4 10L10 -4L68 54L54 68z" fill={s2} />;
      case 'chevron': return <path d="M0 18L32 40L64 18V32L32 54L0 32z" fill={s2} />;
      case 'quarters': return <><rect x={32} y={0} width={32} height={32} fill={s2} /><rect x={0} y={32} width={32} height={32} fill={s2} /></>;
      case 'band': return <rect x={0} y={22} width={64} height={18} fill={s2} />;
      default: return null;
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} role="img" aria-label={`${clubName} badge`}>
      <defs><clipPath id={`c${id}`}><path d={SHAPE_PATH[st.shape]} /></clipPath></defs>
      <g clipPath={`url(#c${id})`}>
        <rect width={64} height={64} fill={p} />
        {pattern}
      </g>
      <path d={SHAPE_PATH[st.shape]} fill="none" stroke="#121212" strokeWidth={3.5} strokeLinejoin="round" />
      {st.accent && <path d={SHAPE_PATH[st.shape]} fill="none" stroke={st.accent} strokeWidth={1.5} transform="translate(32 32) scale(0.84) translate(-32 -32)" />}
      <text x={32} y={36} textAnchor="middle" dominantBaseline="middle" fontFamily="'Bowlby One', 'Archivo', sans-serif" fontSize={fs}
        fill="#fff" stroke="#121212" strokeWidth={3} paintOrder="stroke" letterSpacing={0.5}>{ini}</text>
    </svg>
  );
}

/** a small badge for an opponent (clubs only; national teams have none) */
export function OppCrest({ id, size = 20 }: { id: string; size?: number }) {
  const club = crestClubId(id);
  return club ? <Crest clubId={club} size={size} /> : null;
}

