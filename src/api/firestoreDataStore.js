
import { firebaseClient } from './firebaseClient';

const withReplaceAll = (collectionName) => ({
  async filter({ year }) {
    if (typeof year !== 'number') {
      throw new Error('Cal un any per filtrar la col·lecció');
    }
    return firebaseClient.getCollection(collectionName, [{ field: 'year', operator: '==', value: year }]);
  },

  async replaceAll({ year, records = [] }) {
    if (typeof year !== 'number') {
      throw new Error('Cal un any per reemplaçar registres');
    }
    
    await firebaseClient.deleteFilteredDocs(collectionName, [{ field: 'year', operator: '==', value: year }]);

    if (records.length > 0) {
        await firebaseClient.bulkCreate(collectionName, records);
    }
    
    return records; 
  },
});

const pendingEntity = {
    async filter({ year }) {
        return firebaseClient.getCollection('PendingDay', [{ field: 'year', operator: '==', value: year }]);
    },

    async replaceAll({ year, records = [] }) {
        await firebaseClient.deleteFilteredDocs('PendingDay', [{ field: 'year', operator: '==', value: year }]);
        if (records.length > 0) {
            await firebaseClient.bulkCreate('PendingDay', records);
        }
        return records;
    },

    async append({ year, record }) {
        const docId = await firebaseClient.addDocument('PendingDay', { ...record, year });
        return { ...record, id: docId };
    },
};


export const firestoreDataStore = {
  CalendarDay: withReplaceAll('CalendarDay'),
  ManualFR: withReplaceAll('ManualFR'),
  PendingDay: pendingEntity,
  CourseHours: withReplaceAll('CourseHours'),
  CycleIndex: withReplaceAll('CycleIndex'),
};
