// Stub del client Base44 per mantenir la compatibilitat de dades
// Proporciona un emmagatzematge local (localStorage o memòria) perquè la UI funcioni
// sense el backend original.

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const memoryStore = {};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 11)}`;
};

const readStore = (entity) => {
  if (!isBrowser) {
    return memoryStore[entity] || [];
  }
  const raw = window.localStorage.getItem(`base44-${entity}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`No es pot parsejar l'emmagatzematge de ${entity}:`, e);
    return [];
  }
};

const writeStore = (entity, data) => {
  if (!isBrowser) {
    memoryStore[entity] = data;
    return;
  }
  window.localStorage.setItem(`base44-${entity}`, JSON.stringify(data));
};

const createEntity = (entityName) => ({
  async filter(query = {}) {
    const data = readStore(entityName);
    return data.filter((record) =>
      Object.entries(query).every(([key, value]) => record[key] === value)
    );
  },

  async create(record) {
    const data = readStore(entityName);
    const newRecord = { id: generateId(), ...record };
    data.push(newRecord);
    writeStore(entityName, data);
    return newRecord;
  },

  async delete(id) {
    const data = readStore(entityName).filter((record) => record.id !== id);
    writeStore(entityName, data);
  },

  async bulkCreate(records = []) {
    if (!Array.isArray(records) || records.length === 0) return [];
    const data = readStore(entityName);
    const newRecords = records.map((record) => ({
      id: record.id || generateId(),
      ...record,
    }));
    writeStore(entityName, [...data, ...newRecords]);
    return newRecords;
  },
});

export const base44 = {
  entities: {
    CalendarDay: createEntity('CalendarDay'),
    ManualFR: createEntity('ManualFR'),
    PendingDay: createEntity('PendingDay'),
    CourseHours: createEntity('CourseHours'),
  },
};
