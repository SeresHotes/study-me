// Палитра цветов для показателей. Работает и на тёмной, и на светлой теме.
export const TRACKABLE_COLORS = [
  '#6c5ce7', // фиолетовый
  '#00b894', // зелёный
  '#0984e3', // синий
  '#e17055', // терракота
  '#fdcb6e', // янтарь
  '#e84393', // розовый
  '#00cec9', // бирюза
  '#a29bfe', // лаванда
  '#fab1a0', // персик
  '#ff7675', // красный
  '#74b9ff', // небесный
  '#55efc4', // мята
];

/** Цвет, предлагаемый по умолчанию для нового показателя (циклично по индексу). */
export function suggestColor(index: number): string {
  return TRACKABLE_COLORS[index % TRACKABLE_COLORS.length];
}

/** Итоговый цвет показателя: заданный вручную либо фолбэк по порядку. */
export function trackableColor(t: { color?: string; order: number }): string {
  return t.color ?? suggestColor(t.order);
}
