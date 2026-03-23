export function getBandKey(tier: 1 | 2 | 3): string {
  if (tier === 3) return 'ui.masteryExpert';
  if (tier === 2) return 'ui.masteryIntermediate';
  return 'ui.masteryBeginner';
}

export function getTierColor(tier: 1 | 2 | 3): string {
  if (tier === 3) return '#ffcd36'; // gold
  if (tier === 2) return '#dbc3e2'; // purple
  return '#9ed6ea'; // blue
}
