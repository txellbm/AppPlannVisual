// Alias per mantenir compatibilitat amb el nom anterior.
// La UI hauria d'utilitzar `dataStore`, però exportem `dataClient.entities`
// per no trencar cap import residual.
import { dataStore } from './dataStore';

export const dataClient = {
  entities: dataStore,
};
