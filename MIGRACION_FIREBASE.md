# Plan de migración a Firebase/Firestore

Este documento describe el modelo de datos previsto para la migración de la app a Firebase/Firestore y las operaciones principales que realiza la UI. Está pensado para que Gemini/FireStudio pueda sustituir la capa actual (Base44/localStorage) por Firestore sin tocar la interfaz.

## Colecciones previstas

### CalendarDay
- **Campos**
  - `id` *(string)*: identificador único del documento.
  - `year` *(number)*: año al que pertany el dia.
  - `date_key` *(string, YYYY-MM-DD)*: clau de la data.
  - `day_type` *(string)*: tipus de dia (`M`, `FS`, `VE`, `VS`, `DS`, `VN`, `LD`, `VC`, `CH`, `FR`).
  - `slot_index` *(number, opcional)*: índex del bloc/posició dins dels dies assignables (vacances, etc.).
  - `fr_id` *(string, opcional)*: identificador del festiu recuperable associat.
  - `pending_index` *(number, opcional)*: índex del dia pendent utilitzat.
  - `pending_label` *(string, opcional)*: etiqueta del pendent original (p. ex. "FR 06-12-2025").
  - `from_previous_year` *(boolean, opcional)*: indica si prové d\'un trasllat d\'any anterior.
  - `contract_expansion` *(boolean, opcional)*: marca ampliació de contracte (29h).
  - `originally_worked` *(boolean, opcional)*: indica si el dia era treballat en el patró base.
  - `notes` *(string, opcional)*: comentaris lliures si cal.
- **Exemple**
  ```json
  {
    "id": "abc123",
    "year": 2026,
    "date_key": "2026-01-02",
    "day_type": "M",
    "slot_index": 0,
    "fr_id": "FR Manual 1",
    "pending_index": 1,
    "pending_label": "FR 08-12-2025",
    "from_previous_year": false,
    "contract_expansion": false,
    "originally_worked": true
  }
  ```

### ManualFR
- **Campos**
  - `id` *(string)*
  - `year` *(number)*
  - `label` *(string)*: nom visible del FR manual.
  - `date` *(string, DD-MM-YYYY)*: data triada per al FR.
- **Exemple**
  ```json
  { "id": "fr-1", "year": 2026, "label": "FR Manual 1", "date": "12-10-2026" }
  ```

### PendingDay
- **Campos**
  - `id` *(string)*
  - `year` *(number)*
  - `type` *(string)*: etiqueta del pendent (p. ex. `LD25`, `FR 06-12-2025`).
  - `date` *(string, DD-MM-YYYY, opcional)*: data assignada.
  - `order_index` *(number)*: ordre per mostrar a la llista.
- **Exemple**
  ```json
  { "id": "p1", "year": 2026, "type": "LD25", "date": "15-01-2026", "order_index": 0 }
  ```

### CourseHours
- **Campos**
  - `id` *(string)*
  - `year` *(number)*
  - `name` *(string)*: nom del curs.
  - `date` *(string, DD-MM-YYYY, opcional)*: data del curs.
  - `hours` *(number)*: hores disponibles.
  - `used` *(number, opcional)*: hores consumides.
  - `order_index` *(number)*: ordre de la llista.
- **Exemple**
  ```json
  { "id": "c1", "year": 2026, "name": "PRL", "date": "05-03-2026", "hours": 6, "used": 0, "order_index": 0 }
  ```

## Consultes habituals de la UI
- `filter({ year })` sobre cada col·lecció per carregar dades de l\'any seleccionat.
- Ordenació client-side per `order_index` en `PendingDay` i `CourseHours`.
- No hi ha paginació; els conjunts són petits (pocs centenars de documents màxim).

## Notes d\'implementació
- L\'app fa escritures massives per any: quan es guarda el calendari o llistes (FR, pendents, cursos) es fa un `replaceAll` lògic (esborrar existents de l\'any i inserir els nous).
- Les claus `date_key` usen format `YYYY-MM-DD`; les dates introduïdes en formularis (`date`) van en format `DD-MM-YYYY`.
- El patró de treball (M) alterna setmanes de 4 dies (divendres-dilluns) i 3 dies (divendres-diumenge) a partir del primer divendres de l\'any.
