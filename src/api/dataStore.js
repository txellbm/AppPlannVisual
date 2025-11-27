import { base44 } from './base44Client';

const createEntityAdapter = (entityName) => {
  const getEntity = () => base44.entities[entityName];

  return {
    async filter(query = {}) {
      return getEntity().filter(query);
    },
    async create(record) {
      return getEntity().create(record);
    },
    async delete(id) {
      return getEntity().delete(id);
    },
    async bulkCreate(records = []) {
      return getEntity().bulkCreate(records);
    },
    async replaceAll(query = {}, records = []) {
      const existing = await getEntity().filter(query);
      await Promise.all(existing.map((item) => getEntity().delete(item.id)));
      if (!records || records.length === 0) return [];
      return getEntity().bulkCreate(records);
    },
  };
};

export const dataStore = {
  CalendarDay: createEntityAdapter('CalendarDay'),
  ManualFR: createEntityAdapter('ManualFR'),
  PendingDay: createEntityAdapter('PendingDay'),
  CourseHours: createEntityAdapter('CourseHours'),
};
