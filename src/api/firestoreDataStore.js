// Esquelet per a una futura implementació amb Firestore.
// Aquesta interfície ha de coincidir amb dataStore perquè la UI no canviï.

export const firestoreDataStore = {
  CalendarDay: {
    // Example: return query by year from Firestore collection "CalendarDay"
    async filter(/* { year } */) {
      // TODO: Implementar query a Firestore (where('year', '==', year))
      return [];
    },
    async replaceAll(/* { year, records } */) {
      // TODO: Esborrar documents existents del mateix any i fer batch write amb `records`
      return [];
    },
  },
  ManualFR: {
    async filter(/* { year } */) {
      // TODO: Consulta per any a la col·lecció ManualFR
      return [];
    },
    async replaceAll(/* { year, records } */) {
      // TODO: Escriure tots els documents del any (batch/set)
      return [];
    },
  },
  PendingDay: {
    async filter(/* { year } */) {
      // TODO: Consulta per any, ordenar per order_index si cal
      return [];
    },
    async replaceAll(/* { year, records } */) {
      // TODO: Esborrar i crear tots els pendents del any (batch)
      return [];
    },
    async append(/* { year, record } */) {
      // TODO: Afegir un nou pendent amb add/set
      return null;
    },
  },
  CourseHours: {
    async filter(/* { year } */) {
      // TODO: Consulta per any, ordenar per order_index si cal
      return [];
    },
    async replaceAll(/* { year, records } */) {
      // TODO: Esborrar i recrear tots els documents del any
      return [];
    },
  },
};
