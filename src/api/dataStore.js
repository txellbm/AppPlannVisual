import { base44 } from './base44Client';

// Helper to keep backup storage within the data layer (never in UI)
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const readBackup = (key) => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('No es pot parsejar el backup local', error);
    return null;
  }
};

const writeBackup = (key, payload) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('No s\'ha pogut escriure el backup local', error);
  }
};

const getEntity = (name) => base44.entities[name];

const calendarBackupKey = (year) => `calendar-backup-${year}`;

const calendarFromRecords = (records = []) => {
  const calendar = {};
  records.forEach((record) => {
    if (!record?.date_key) return;
    calendar[record.date_key] = {
      date: record.date_key,
      day_type: record.day_type,
      slotIndex: record.slot_index,
      frId: record.fr_id,
      fromPreviousYear: record.from_previous_year,
      pendingIndex: record.pending_index,
      pendingLabel: record.pending_label,
      contractExpansion: record.contract_expansion,
      originallyWorked: record.originally_worked,
    };
  });
  return calendar;
};

const calendarToRecords = (calendar = {}, year) =>
  Object.entries(calendar)
    .filter(([, entry]) => entry && entry.day_type)
    .map(([dateKey, entry]) => {
      const record = {
        year,
        date_key: dateKey,
        day_type: entry.day_type,
        from_previous_year: entry.fromPreviousYear === true,
        contract_expansion: entry.contractExpansion === true,
        originally_worked: entry.originallyWorked === true,
      };

      if (typeof entry.slotIndex === 'number' && entry.slotIndex >= 0) {
        record.slot_index = entry.slotIndex;
      }
      if (typeof entry.frId === 'string' && entry.frId.length > 0) {
        record.fr_id = entry.frId;
      }
      if (typeof entry.pendingIndex === 'number' && entry.pendingIndex >= 0) {
        record.pending_index = entry.pendingIndex;
      }
      if (typeof entry.pendingLabel === 'string' && entry.pendingLabel.length > 0) {
        record.pending_label = entry.pendingLabel;
      }

      return record;
    });

const withReplaceAll = (entityName) => ({
  async filter(query = {}) {
    const entity = getEntity(entityName);
    const records = await entity.filter(query);

    if (entityName === 'CalendarDay' && (!records || records.length === 0) && query.year) {
      const backup = readBackup(calendarBackupKey(query.year));
      if (backup) {
        return backup;
      }
    }

    return records;
  },

  async replaceAll({ year, records = [] }) {
    const entity = getEntity(entityName);
    const existing = await entity.filter({ year });
    await Promise.all(existing.map(({ id }) => entity.delete(id)));

    const created = records.length > 0 ? await entity.bulkCreate(records) : [];

    if (entityName === 'CalendarDay' && typeof year === 'number') {
      writeBackup(calendarBackupKey(year), records);
    }

    return created;
  },
});

const pendingEntity = {
  async filter({ year } = {}) {
    return getEntity('PendingDay').filter({ year });
  },

  async replaceAll({ year, records = [] }) {
    const entity = getEntity('PendingDay');
    const existing = await entity.filter({ year });
    await Promise.all(existing.map(({ id }) => entity.delete(id)));
    return records.length > 0 ? entity.bulkCreate(records) : [];
  },

  async append({ year, record }) {
    return getEntity('PendingDay').create({ ...record, year });
  },
};

export const dataStore = {
  /**
   * CalendarDay: principal col·lecció per als dies del calendari.
   * Pensat per Firestore: filter({ year }) i replaceAll({ year, records })
   * on `records` és un array de documents amb { year, date_key, day_type, ... }.
   */
  CalendarDay: withReplaceAll('CalendarDay'),

  /**
   * ManualFR: festius recuperables manuals per any. Interfície idèntica a la prevista a Firestore.
   */
  ManualFR: withReplaceAll('ManualFR'),

  /**
   * PendingDay: dies pendents; permet afegir elements incrementalment (append) o substituir el conjunt.
   */
  PendingDay: pendingEntity,

  /**
   * CourseHours: hores de cursos; substitució completa per any.
   */
  CourseHours: withReplaceAll('CourseHours'),

  // Conversió auxiliar per al calendari (només usada internament o en adaptacions futures)
  _calendar: {
    toRecords: calendarToRecords,
    fromRecords: calendarFromRecords,
  },
};
