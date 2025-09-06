// גשר גלובלי: services יכולים לקרוא ask(...) בלי hooks
let _askImpl = null;

// פריסטים נוחים
const PRESETS = {
  navigate: { title: 'יציאה', message: 'האם אתה בטוח שברצונך לציאת מדף שיש בו שינוי מידע ?(אישור מהווה יציאה בלי עדכון)', confirmText: 'אישור', cancelText: 'בטל'},
  create:   { title: 'יצירה', message: 'האם אתה בטוח שברצונך ליצור?', confirmText: 'צור',  cancelText: 'בטל' },
  change:   { title: 'שינוי', message: 'האם אתה בטוח שברצונך לשמור שינוי?', confirmText: 'שמור', cancelText: 'בטל' },
  delete:   { title: 'מחיקה', message: 'האם אתה בטוח שברצונך למחוק?', confirmText: 'מחק', cancelText: 'בטל', danger: true },
};

// מגדיר את פונקציית ה-confirm שמגיעה מה-Provider (דרך ה-Bridge)
export function setGlobalAsk(fn /* (options) => Promise<boolean> */) {
  _askImpl = typeof fn === 'function' ? fn : null;

}

/**
 * בקשת אישור מתוך services
 * @param {'navigate'|'create'|'change'|'delete'|object} kind - פריסט או אובייקט מותאם אישית
 * @param {object} overrides - שינויים נקודתיים (כותרת/טקסטים/מסוכן וכו')
 * @returns {Promise<boolean>}
 */
export async function ask(kind, overrides = {}) {
  if (typeof _askImpl !== 'function') {
    console.warn('[confirmBus] not initialized – auto-approve.');
    return Promise.reject(new Error('Confirm not ready yet'));
  }
  const base = typeof kind === 'string' ? (PRESETS[kind] || PRESETS.change) : (kind || {});
  return _askImpl({ ...base, ...overrides });
}
