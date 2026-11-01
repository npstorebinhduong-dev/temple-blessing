// Match the gift itself, never the viewer's running total or a combo's total.
const normalized = value => String(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const rules = [
  { kind:'incense', value:100, names:['Bó hoa', 'Bouquet', 'Flower Bouquet'], label:'Thành tâm thắp ba nén hương' },
  { kind:'offering', value:500, names:['Bong bóng tình yêu', 'Love Balloon', 'Love Balloons'], label:'Thành tâm dâng lễ trái cây' },
];
export function giftRitual(name, unitCoins) {
  const rule = rules.find(r => Number(unitCoins) === r.value && r.names.some(n => normalized(n) === normalized(name)));
  return rule ? { kind:rule.kind, label:rule.label } : null;
}
