// Категориальная палитра показателей. Порядок и hex взяты из выверенной
// референсной палитры dataviz (CVD-безопасный порядок, проверен validate_palette).
// У каждого слота два шага: под светлую и под тёмную поверхность — одиночный hex
// не проходит обе темы одновременно, поэтому храним канонический (светлый) цвет,
// а на тёмной теме резолвим в парный тёмный шаг через resolveColor().

export interface ColorSlot {
  light: string;
  dark: string;
}

export const CATEGORICAL: ColorSlot[] = [
  { light: '#2a78d6', dark: '#3987e5' }, // синий
  { light: '#1baf7a', dark: '#199e70' }, // аква
  { light: '#eda100', dark: '#c98500' }, // жёлтый
  { light: '#008300', dark: '#008300' }, // зелёный
  { light: '#4a3aa7', dark: '#9085e9' }, // фиолетовый
  { light: '#e34948', dark: '#e66767' }, // красный
  { light: '#e87ba4', dark: '#d55181' }, // маджента
  { light: '#eb6834', dark: '#d95926' }, // оранжевый
  { light: '#0e9aa7', dark: '#1595a3' }, // циан
  { light: '#a1662f', dark: '#a87838' }, // коричневый
  { light: '#6f9c00', dark: '#77a015' }, // лайм
  { light: '#b5179e', dark: '#cf4cbf' }, // пурпур
];

// Канонические (светлые) значения — их показываем в палитре и храним в БД.
export const TRACKABLE_COLORS = CATEGORICAL.map((s) => s.light);

const DARK_OF: Record<string, string> = Object.fromEntries(
  CATEGORICAL.map((s) => [s.light.toLowerCase(), s.dark]),
);

/** Цвет по умолчанию для нового показателя (по порядку; при >8 циклится). */
export function suggestColor(index: number): string {
  return TRACKABLE_COLORS[index % TRACKABLE_COLORS.length];
}

/** Итоговый (канонический) цвет показателя: заданный вручную либо фолбэк по порядку. */
export function trackableColor(t: { color?: string; order: number }): string {
  return t.color ?? suggestColor(t.order);
}

/** Резолвит канонический цвет в шаг под текущую поверхность.
 *  Кастомные/старые цвета вне палитры возвращаются как есть. */
export function resolveColor(hex: string, isDark: boolean): string {
  if (!isDark) return hex;
  return DARK_OF[hex.toLowerCase()] ?? hex;
}
