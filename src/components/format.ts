import type { Career, Fixture } from '../game/types';
import { teamName } from '../engines/teams';

export function oppLabel(fx: Fixture) {
  return `${fx.home ? '' : '@ '}${teamName(fx.oppId)}`;
}

export function involvementLine(fx: Fixture): string {
  const r = fx.report;
  if (!r) return '';
  if (r.minutes <= 0) return r.note ?? '';
  const parts = [`${r.minutes}'`];
  if (r.goals) parts.push(`${r.goals}G`);
  if (r.assists) parts.push(`${r.assists}A`);
  return parts.join(' · ');
}

export function findFixture(c: Career, id: string): Fixture | undefined {
  return c.season?.fixtures.find((f) => f.id === id) ?? c.pastFixtures.find((f) => f.id === id);
}

