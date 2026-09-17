import { useSyncExternalStore } from 'react';

export type Lang = 'ru' | 'en';

const KEY = 'studyme-lang';

function detectLang(): Lang {
  const saved = localStorage.getItem(KEY);
  if (saved === 'ru' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let current: Lang = detectLang();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach((f) => f());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

type Vars = Record<string, string | number>;

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Перевод без хука (для утилит вне React). */
export function t(key: string, vars?: Vars): string {
  const table = DICT[current] ?? DICT.en;
  const str = table[key] ?? DICT.en[key] ?? key;
  return interpolate(str, vars);
}

/** Хук: возвращает текущий язык, t() и setLang; ре-рендерит при смене языка. */
export function useT() {
  const lang = useSyncExternalStore(subscribe, () => current, () => current);
  return { lang, t, setLang };
}

// Инициализируем атрибут lang документа.
document.documentElement.lang = current;

const DICT: Record<Lang, Record<string, string>> = {
  ru: {
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.add': 'Добавить',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',

    'nav.newStudyShort': '+ Исследование',
    'nav.allStudies': '← Все исследования',

    'theme.system': 'Системная',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',

    'studies.title': 'Мои исследования',
    'studies.emptyTitle': 'Пока нет ни одного исследования.',
    'studies.emptyHint': 'Запусти первое — на срок, с набором показателей.',
    'studies.new': '+ Новое исследование',
    'studies.active': 'Активно',
    'studies.archived': 'В архиве',
    'studies.over': 'Срок вышел',
    'studies.since': '📅 с {date}',
    'studies.daysLeft': '⏳ осталось {n} дн.',
    'studies.finished': 'завершено',
    'studies.openEnded': 'бессрочно · {n} дн.',
    'studies.metricsCount': '📊 {n} показателей',

    'newStudy.title': 'Новое исследование',
    'newStudy.name': 'Название',
    'newStudy.namePh': 'Напр. Сон и настроение, октябрь',
    'newStudy.why': 'Зачем это исследование (необязательно)',
    'newStudy.whyPh': 'Гипотеза, что хочу понять…',
    'newStudy.start': 'Начало',
    'newStudy.end': 'Конец (необязательно)',
    'newStudy.note': 'Оставь конец пустым для бессрочного наблюдения. Показатели добавишь на следующем шаге.',
    'newStudy.create': 'Создать исследование',

    'study.notFound': 'Исследование не найдено.',
    'study.toList': 'К списку',
    'study.since': '📅 с {date}',
    'study.to': 'по {date}',
    'study.daysLeft': '⏳ осталось {n} дн.',
    'study.tabJournal': 'Дневник',
    'study.tabStats': 'Статистика',
    'study.tabMetrics': 'Показатели',

    'metrics.title': 'Показатели',
    'metrics.empty': 'Ещё нет показателей. Добавь первый.',
    'metrics.changeColor': 'Изменить цвет',
    'metrics.add': '+ Добавить показатель',
    'metrics.studySection': 'Исследование',
    'metrics.editStudy': 'Редактировать исследование',
    'metrics.archive': 'Завершить и в архив',
    'metrics.unarchive': 'Вернуть в активные',
    'metrics.deleteStudy': 'Удалить исследование',
    'metrics.confirmDeleteStudy': 'Удалить исследование «{name}» вместе со всеми записями?',
    'metrics.confirmDeleteMetric': 'Удалить показатель «{name}» и все его записи?',

    'journal.today': 'Отметиться за сегодня',
    'journal.addFor': 'Добавить за {date}',
    'journal.entriesFor': 'Записи · {date}',
    'journal.emptyDay': 'В этот день ничего не отмечено.',
    'journal.deletedMetric': 'Показатель удалён',
    'journal.logged': 'Записано: {name}',
    'journal.emptyMetrics': 'Сначала добавь показатели, которые будешь отслеживать.',
    'journal.addMetrics': 'Добавить показатели',

    'stats.p7': '7 дней',
    'stats.p30': '30 дней',
    'stats.p90': '90 дней',
    'stats.pAll': 'Всё',
    'stats.charts': '📈 Графики',
    'stats.table': '▤ Таблица',
    'stats.all': 'Все',
    'stats.entriesInPeriod': 'записей за период',
    'stats.activeDays': 'дней с отметками',
    'stats.metrics': 'показателей',
    'stats.emptyMetrics': 'Добавь показатели, чтобы видеть статистику.',
    'stats.noneInPeriod': 'Нет записей за выбранный период.',
    'stats.colWhen': 'Когда',
    'stats.colMetric': 'Показатель',
    'stats.colValue': 'Значение',
    'stats.notesInPeriod': '{n} заметок за период.',
    'stats.times': '{n} раз',

    'stat.count': 'Записей',
    'stat.avg': 'Среднее',
    'stat.min': 'Мин',
    'stat.max': 'Макс',
    'stat.sum': 'Сумма',
    'stat.yes': 'Да',
    'stat.no': 'Нет',
    'stat.avgTime': 'В среднем',
    'stat.earliest': 'Раньше всего',
    'stat.latest': 'Позже всего',
    'stat.notes': 'Заметок',

    'modal.edit': 'изменить',
    'modal.value': 'Значение',
    'modal.date': 'Дата',
    'modal.when': 'Когда',
    'modal.note': 'Заметка (необязательно)',
    'modal.notePh': 'Комментарий…',

    'control.yes': 'Да',
    'control.no': 'Нет',
    'control.valueWithUnit': 'значение, {unit}',
    'control.value': 'значение',
    'control.textPh': 'Текст…',

    'form.whatTrack': 'Что отслеживаем',
    'form.namePh': 'Напр. Настроение',
    'form.type': 'Тип показателя',
    'form.typeLocked': 'Тип нельзя изменить после создания',
    'form.color': 'Цвет',
    'form.unit': 'Единица измерения (необязательно)',
    'form.unitPh': 'Напр. часов, мл, порций',
    'form.min': 'Мин.',
    'form.max': 'Макс.',
    'form.options': 'Варианты (по одному в строке)',
    'form.optionsPh': 'Напр.\nдом\nработа\nулица\nв гостях',
    'form.multi': 'Можно выбрать несколько',

    'type.scale.label': 'Шкала',
    'type.scale.hint': 'Оценка по диапазону, напр. настроение 1–5',
    'type.number.label': 'Число',
    'type.number.hint': 'Числовое значение с единицей, напр. часы сна',
    'type.bool.label': 'Да / Нет',
    'type.bool.hint': 'Было или не было, напр. пил алкоголь',
    'type.time.label': 'Время',
    'type.time.hint': 'Время суток, напр. время засыпания',
    'type.enum.label': 'Выбор',
    'type.enum.hint': 'Один вариант из списка, напр. место: дом / работа',
    'type.text.label': 'Заметка',
    'type.text.hint': 'Свободный текст',

    'data.title': 'Данные',
    'data.note':
      'Данные хранятся только в этом браузере. Делай резервную копию, чтобы не потерять их и перенести на другое устройство.',
    'data.export': '⬇ Экспорт',
    'data.import': '⬆ Импорт',
    'data.exported': 'Файл резервной копии скачан',
    'data.confirmImport': 'Импортировать данные из файла? Записи с совпадающим id будут перезаписаны.',
    'data.imported': 'Импортировано: {s} иссл., {t} показ., {e} записей',
    'data.importError': 'Ошибка импорта: {msg}',
    'data.notStudyMe': 'Файл не похож на резервную копию StudyMe',

    'update.available': '🔄 Доступна новая версия',
    'update.later': 'Позже',
    'update.update': 'Обновить',
  },
  en: {
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.add': 'Add',
    'common.delete': 'Delete',
    'common.edit': 'Edit',

    'nav.newStudyShort': '+ Study',
    'nav.allStudies': '← All studies',

    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',

    'studies.title': 'My studies',
    'studies.emptyTitle': 'No studies yet.',
    'studies.emptyHint': 'Start your first one — for a set period, with a list of metrics.',
    'studies.new': '+ New study',
    'studies.active': 'Active',
    'studies.archived': 'Archived',
    'studies.over': 'Ended',
    'studies.since': '📅 from {date}',
    'studies.daysLeft': '⏳ {n} d left',
    'studies.finished': 'finished',
    'studies.openEnded': 'open-ended · {n} d',
    'studies.metricsCount': '📊 {n} metrics',

    'newStudy.title': 'New study',
    'newStudy.name': 'Name',
    'newStudy.namePh': 'e.g. Sleep and mood, October',
    'newStudy.why': 'What is this study for (optional)',
    'newStudy.whyPh': 'Hypothesis, what you want to find out…',
    'newStudy.start': 'Start',
    'newStudy.end': 'End (optional)',
    'newStudy.note': 'Leave the end empty for open-ended tracking. You’ll add metrics on the next step.',
    'newStudy.create': 'Create study',

    'study.notFound': 'Study not found.',
    'study.toList': 'To list',
    'study.since': '📅 from {date}',
    'study.to': 'to {date}',
    'study.daysLeft': '⏳ {n} d left',
    'study.tabJournal': 'Journal',
    'study.tabStats': 'Stats',
    'study.tabMetrics': 'Metrics',

    'metrics.title': 'Metrics',
    'metrics.empty': 'No metrics yet. Add the first one.',
    'metrics.changeColor': 'Change color',
    'metrics.add': '+ Add metric',
    'metrics.studySection': 'Study',
    'metrics.editStudy': 'Edit study',
    'metrics.archive': 'Finish and archive',
    'metrics.unarchive': 'Make active again',
    'metrics.deleteStudy': 'Delete study',
    'metrics.confirmDeleteStudy': 'Delete study “{name}” with all its entries?',
    'metrics.confirmDeleteMetric': 'Delete metric “{name}” and all its entries?',

    'journal.today': 'Log for today',
    'journal.addFor': 'Add for {date}',
    'journal.entriesFor': 'Entries · {date}',
    'journal.emptyDay': 'Nothing logged on this day.',
    'journal.deletedMetric': 'Metric deleted',
    'journal.logged': 'Logged: {name}',
    'journal.emptyMetrics': 'First add the metrics you want to track.',
    'journal.addMetrics': 'Add metrics',

    'stats.p7': '7 days',
    'stats.p30': '30 days',
    'stats.p90': '90 days',
    'stats.pAll': 'All',
    'stats.charts': '📈 Charts',
    'stats.table': '▤ Table',
    'stats.all': 'All',
    'stats.entriesInPeriod': 'entries in period',
    'stats.activeDays': 'days with entries',
    'stats.metrics': 'metrics',
    'stats.emptyMetrics': 'Add metrics to see stats.',
    'stats.noneInPeriod': 'No entries in the selected period.',
    'stats.colWhen': 'When',
    'stats.colMetric': 'Metric',
    'stats.colValue': 'Value',
    'stats.notesInPeriod': '{n} notes in period.',
    'stats.times': '{n}×',

    'stat.count': 'Entries',
    'stat.avg': 'Average',
    'stat.min': 'Min',
    'stat.max': 'Max',
    'stat.sum': 'Sum',
    'stat.yes': 'Yes',
    'stat.no': 'No',
    'stat.avgTime': 'Average',
    'stat.earliest': 'Earliest',
    'stat.latest': 'Latest',
    'stat.notes': 'Notes',

    'modal.edit': 'edit',
    'modal.value': 'Value',
    'modal.date': 'Date',
    'modal.when': 'When',
    'modal.note': 'Note (optional)',
    'modal.notePh': 'Comment…',

    'control.yes': 'Yes',
    'control.no': 'No',
    'control.valueWithUnit': 'value, {unit}',
    'control.value': 'value',
    'control.textPh': 'Text…',

    'form.whatTrack': 'What to track',
    'form.namePh': 'e.g. Mood',
    'form.type': 'Metric type',
    'form.typeLocked': 'Type can’t be changed after creation',
    'form.color': 'Color',
    'form.unit': 'Unit (optional)',
    'form.unitPh': 'e.g. hours, ml, servings',
    'form.min': 'Min',
    'form.max': 'Max',
    'form.options': 'Options (one per line)',
    'form.optionsPh': 'e.g.\nhome\nwork\noutside\nvisiting',
    'form.multi': 'Allow multiple choices',

    'type.scale.label': 'Scale',
    'type.scale.hint': 'Rating within a range, e.g. mood 1–5',
    'type.number.label': 'Number',
    'type.number.hint': 'Numeric value with a unit, e.g. hours of sleep',
    'type.bool.label': 'Yes / No',
    'type.bool.hint': 'Happened or not, e.g. had alcohol',
    'type.time.label': 'Time',
    'type.time.hint': 'Time of day, e.g. bedtime',
    'type.enum.label': 'Choice',
    'type.enum.hint': 'One option from a list, e.g. place: home / work',
    'type.text.label': 'Note',
    'type.text.hint': 'Free text',

    'data.title': 'Data',
    'data.note':
      'Data is stored only in this browser. Make a backup so you don’t lose it and can move it to another device.',
    'data.export': '⬇ Export',
    'data.import': '⬆ Import',
    'data.exported': 'Backup file downloaded',
    'data.confirmImport': 'Import data from file? Records with matching id will be overwritten.',
    'data.imported': 'Imported: {s} studies, {t} metrics, {e} entries',
    'data.importError': 'Import error: {msg}',
    'data.notStudyMe': 'This file doesn’t look like a StudyMe backup',

    'update.available': '🔄 A new version is available',
    'update.later': 'Later',
    'update.update': 'Update',
  },
};
