export const OWNER_EMAIL = 'statyan02@gmail.com';
export const MAX_PAYLOAD_BYTES = 850000;
export function validateState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Неверный формат данных');
  for (const key of ['stores', 'plans', 'categories', 'categoryTags']) {
    if (!value[key] || typeof value[key] !== 'object' || Array.isArray(value[key])) throw Error(`Нет раздела ${key}`);
  }
  if (!Array.isArray(value.capital) || !Array.isArray(value.snapshots)) throw Error('Нет истории капитала');
  const walk = (node, depth=0) => {
    if (depth > 25) throw Error('Слишком сложный файл');
    if (typeof node === 'number' && !Number.isFinite(node)) throw Error('Некорректная сумма');
    if (typeof node === 'string' && /[<>]/.test(node)) throw Error('Недопустимые символы в данных');
    if (node && typeof node === 'object') for (const [key, child] of Object.entries(node)) {
      if (['__proto__','constructor','prototype'].includes(key)) throw Error('Недопустимое поле');
      walk(child,depth+1);
    }
  };
  walk(value);
  for (const [period, records] of Object.entries(value.stores)) {
    if (!/^\d{4}-(?:[0-9]|1[01])$/.test(period) || !Array.isArray(records)) throw Error('Неверный месяц');
    for (const record of records) {
      if (!Number.isFinite(record.amount) || typeof record.cat !== 'string' || typeof record.name !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) throw Error('Неверная операция');
      if (!Object.hasOwn(value.categories,record.cat)) throw Error('Неизвестная категория');
      if (record.tags && (!Array.isArray(record.tags) || record.tags.some(tag=>!(value.categoryTags[record.cat]||[]).includes(tag)))) throw Error('Тег не соответствует категории');
    }
  }
  const json=JSON.stringify(value);
  if (new TextEncoder().encode(json).length > MAX_PAYLOAD_BYTES) throw Error('Данные превышают размер первой версии. Экспортируйте копию и расширьте хранилище.');
  return json;
}
export function assertRevision(actual, expected) {
  if (actual !== expected) throw Object.assign(Error('Данные изменились на другом устройстве'),{code:'finance/conflict'});
}
