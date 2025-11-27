import React, { useState } from 'react';
import { FileText, Download, Code, FileCode, Database, Workflow, BookOpen, Package } from 'lucide-react';

export default function Documentacio() {
  const [activeTab, setActiveTab] = useState('usuario');

  const exportarCodi = async () => {
    try {
      const response = await fetch('/pages/Planning.js');
      const codiComplet = await response.text();
      
      const blob = new Blob([codiComplet], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Planning.js';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exportant el codi. Comprova la consola.');
      console.error(error);
    }
  };

  const exportarBlueprint = async () => {
    try {
      const response = await fetch('/pages/Planning.js');
      const codi = await response.text();
      
      // Extreure DAY_TYPES del codi
      const dayTypesMatch = codi.match(/const DAY_TYPES = ({[\s\S]*?});/);
      const dayTypes = dayTypesMatch ? eval('(' + dayTypesMatch[1] + ')') : {};
      
      // Extreure FR_HOLIDAYS
      const frHolidaysMatch = codi.match(/const FR_HOLIDAYS_\d+ = (\[[\s\S]*?\]);/);
      const frHolidays = frHolidaysMatch ? eval(frHolidaysMatch[1]) : [];
      
      // Extreure funcions principals
      const funcions = [];
      const funcioRegex = /function (\w+)\([^)]*\)|const (\w+) = \([^)]*\) =>/g;
      let match;
      while ((match = funcioRegex.exec(codi)) !== null) {
        funcions.push(match[1] || match[2]);
      }
      
      const blueprint = {
        nom: "Planning Hospital del Mar",
        versio: "1.0.0",
        dataGeneracio: new Date().toISOString(),
        descripcio: "Sistema de planificació de torns i vacances per a personal sanitari",
      
      arquitectura: {
        tipus: "Single Page Application (SPA)",
        framework: "React",
        gestioEstat: "useState + useEffect + localStorage",
        estils: "Tailwind CSS",
        icones: "Lucide React"
      },

      estructuraDades: {
        calendar: {
          tipus: "Object",
          clau: "dateKey (YYYY-MM-DD)",
          valor: {
            date: "string",
            day_type: "string (M|FS|VE|VS|DS|VN|LD|VC|CH|FR)",
            slotIndex: "number (opcional)",
            frId: "string (opcional)",
            fromPreviousYear: "boolean (opcional)",
            pendingIndex: "number (opcional)",
            pendingLabel: "string (opcional)"
          }
        },
        manualFR: {
          tipus: "Array",
          elements: {
            label: "string",
            date: "string (DD-MM-YYYY)"
          }
        },
        pending2025: {
          tipus: "Array",
          elements: {
            type: "string",
            date: "string (DD/MM/YYYY)"
          }
        }
      },

      funcionalitats: [
        {
          nom: "Generació automàtica de patró de treball",
          descripcio: "Genera automàticament el patró de treball setmanal (4-3 dies alternats) començant cada divendres"
        },
        {
          nom: "Assignació de vacances",
          descripcio: "Permet assignar diferents tipus de vacances (VE, VS, VN, etc.) amb regles específiques per cada tipus"
        },
        {
          nom: "Gestió de festius recuperables (FR)",
          descripcio: "Sistema per marcar i assignar festius recuperables amb càlcul automàtic de períodes i deadlines"
        },
        {
          nom: "Dies pendents any anterior",
          descripcio: "Gestió de dies no gaudits de l'any anterior que es poden utilitzar al gener de l'any següent"
        },
        {
          nom: "Exportació i persistència",
          descripcio: "Desa automàticament tots els canvis a localStorage per mantenir l'estat entre sessions"
        }
      ],

      configuracio: {
        DAY_TYPES: Object.keys(dayTypes).reduce((acc, key) => {
          acc[key] = dayTypes[key].name + (dayTypes[key].total ? ` (${dayTypes[key].total} ${dayTypes[key].isBlock ? 'períodes' : 'dies'})` : '');
          return acc;
        }, {}),
        FR_HOLIDAYS: frHolidays.map(h => `${h.label} (${h.date})`)
      },

      normativa: {
        VE: {
          total: "31 dies naturals",
          blocs: 3,
          deadline: "28 febrer",
          periode: "1 juny - 30 setembre",
          restriccions: ["Mínim 7 dies per bloc", "Mínim 7 dies entre blocs"]
        },
        VS: {
          total: "2 dies",
          deadline: "31 gener",
          periode: "1 mes abans/després Divendres Sant"
        },
        DS: {
          total: "1 dia",
          deadline: "31 gener",
          periode: "1 mes abans/després Divendres Sant"
        },
        VN: {
          total: "2 dies",
          deadline: "15 octubre",
          periode: "1 desembre - 28 febrer"
        },
        LD: {
          total: "3 dies",
          deadline: "Durant l'any",
          periode: "Tot l'any, excepcionalment fins 31 gener"
        },
        VC: {
          total: "3 dies",
          deadline: "Durant l'any",
          periode: "Tot l'any, excepcionalment fins 31 gener"
        },
        CH: {
          total: "4 dies",
          deadline: "Durant l'any",
          periode: "Tot l'any"
        },
        FR: {
          periodes: {
            "Març-Maig": "deadline 31 gener",
            "Juny-Setembre": "deadline 28 febrer",
            "Octubre-Novembre": "deadline 15 abril",
            "Desembre-Gener-Febrer": "deadline 15 octubre"
          }
        }
      },

      fluxosTreball: [
        {
          nom: "Assignar vacances d'estiu (VE)",
          passos: [
            "1. Clicar sobre una fila VE P1, P2 o P3 a la taula 'Dies per Demanar'",
            "2. El sistema entra en mode assignació (banner groc)",
            "3. Clicar sobre els dies del calendari per afegir-los al bloc",
            "4. Clicar '✓ Finalitzar bloc' per acabar"
          ]
        },
        {
          nom: "Assignar festiu recuperable (FR)",
          passos: [
            "1. Marcar un festiu oficial com a treballat (M) al calendari",
            "2. Clicar sobre la fila del FR a la taula 'FR - Festius Recuperables'",
            "3. El sistema entra en mode assignació FR (banner taronja)",
            "4. Clicar sobre un dia treballat (M) per assignar el FR",
            "5. El dia es converteix en FR i es marca com a recuperable"
          ]
        },
        {
          nom: "Gestionar dies pendents any anterior",
          passos: [
            "1. Afegir dies pendents a la taula 'Dies Pendents Any Anterior'",
            "2. Clicar sobre una fila per activar mode assignació (banner morat)",
            "3. Clicar sobre un dia del calendari per assignar-lo",
            "4. El dia queda marcat amb una 📌"
          ]
        },
        {
          nom: "Passar dies al proper any",
          passos: [
            "1. Assignar primer el dia a l'any actual",
            "2. Clicar sobre la fletxa → a la columna del proper any",
            "3. El dia es marca com a pendent per l'any següent"
          ]
        }
      ],

      localStorageKeys: [
        "calendar-{year}",
        "manual-fr-{year}",
        "pending-2025-{year}"
      ],

      funcionsClau: funcions.filter(f => 
        f && !f.startsWith('use') && f !== 'Planning' && f !== 'export'
      ).slice(0, 30),
      
      estadistiques: {
        totalLinies: codi.split('\n').length,
        totalFuncions: funcions.length,
        dataAnalisi: new Date().toLocaleString('ca-ES')
      },

      compatibilitat: {
        navegadors: ["Chrome", "Firefox", "Safari", "Edge"],
        dispositius: ["Desktop", "Tablet"],
        resolucions: ["Mínim 1280px d'amplada recomanat"]
      },

      dependencies: {
        react: "^18.x",
        "lucide-react": "^0.x",
        "tailwindcss": "^3.x"
      }
    };

      const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planning-blueprint.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error generant el blueprint: ' + error.message);
      console.error(error);
    }
  };

  const exportarTotsElsFitxers = async () => {
    try {
      const responsePlanning = await fetch('/pages/Planning.js');
      const codiPlanning = await responsePlanning.text();
      
      const responseDoc = await fetch('/pages/Documentacio.js');
      const codiDoc = await responseDoc.text();
      
      const responseLayout = await fetch('/Layout.js');
      const codiLayout = await responseLayout.text();
      
      // Crear un arxiu text amb tots els fitxers separats
      let contentText = `# PLANNING HOSPITAL DEL MAR - EXPORTACIÓ COMPLETA
# Data: ${new Date().toLocaleString('ca-ES')}
# 
# Instruccions:
# 1. Copia cada secció de codi al fitxer corresponent
# 2. Segueix l'estructura de carpetes indicada
# 3. Executa: npm install
# 4. Executa: npm start
#
========================================

`;

      const files = {
        'src/pages/Planning.js': codiPlanning,
        'src/pages/Documentacio.js': codiDoc,
        'src/Layout.js': codiLayout,
        'src/utils.js': `export function createPageUrl(pageName) {
  return '/' + pageName.toLowerCase();
}`,
        'src/App.js': `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Planning from './pages/Planning';
import Documentacio from './pages/Documentacio';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/planning" replace />} />
        <Route path="/planning" element={
          <Layout currentPageName="Planning">
            <Planning />
          </Layout>
        } />
        <Route path="/documentacio" element={
          <Layout currentPageName="Documentacio">
            <Documentacio />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}`,
        'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
        'public/index.html': `<!DOCTYPE html>
<html lang="ca">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Planning Hospital del Mar - Gestió de torns i vacances" />
    <title>Planning Hospital del Mar</title>
  </head>
  <body>
    <noscript>Necessites JavaScript per executar aquesta app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
        'package.json': JSON.stringify({
          "name": "planning-hospital-mar",
          "version": "1.0.0",
          "private": true,
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.20.0",
            "react-scripts": "5.0.1",
            "lucide-react": "^0.300.0"
          },
          "devDependencies": {
            "tailwindcss": "^3.4.0"
          },
          "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
          },
          "eslintConfig": {
            "extends": ["react-app"]
          },
          "browserslist": {
            "production": [">0.2%", "not dead", "not op_mini all"],
            "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
          }
        }, null, 2),
        'tailwind.config.js': `module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        '.gitignore': `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`,
        'README.md': `# Planning Hospital del Mar

Sistema de planificació de torns i gestió de vacances per a personal sanitari de l'Hospital del Mar.

## Instal·lació

\`\`\`bash
# 1. Crear carpeta del projecte
mkdir planning-hospital-mar
cd planning-hospital-mar

# 2. Copiar tots els fitxers exportats segons l'estructura indicada

# 3. Instal·lar dependències
npm install

# 4. Executar en mode desenvolupament
npm start

# 5. Build per producció
npm run build
\`\`\`

## Estructura

\`\`\`
/src
  /pages
    Planning.js          # Component principal del calendari
    Documentacio.js      # Pàgina de documentació
  Layout.js              # Layout amb navegació
  App.js                 # Router principal
  index.js               # Entry point
  index.css              # Tailwind imports
  utils.js               # Utilitats
/public
  index.html             # HTML base
package.json             # Dependències
tailwind.config.js       # Configuració Tailwind
README.md                # Aquest fitxer
\`\`\`

## Funcionalitats

✅ Generació automàtica de patró de treball
✅ Gestió de vacances (VE, VS, VN, LD, VC, CH)
✅ Festius recuperables (FR)
✅ Dies pendents d'any anterior
✅ Ampliació contracte (29h)
✅ Hores de cursos
✅ Undo/Redo (Ctrl+Z/Y)
✅ Generador de sol·licitud
✅ Persistència amb localStorage

## Tecnologies

- React 18
- React Router 6
- Tailwind CSS
- Lucide React (icones)
- LocalStorage (persistència)
`
      };

      for (const [path, content] of Object.entries(files)) {
        contentText += `
========================================
FITXER: ${path}
========================================

${content}

`;
      }

      contentText += `
========================================
FI DE L'EXPORTACIÓ
========================================

Total fitxers: ${Object.keys(files).length}
Línies Planning.js: ${codiPlanning.split('\n').length}
Línies Documentacio.js: ${codiDoc.split('\n').length}
Línies Layout.js: ${codiLayout.split('\n').length}
`;

      const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planning-hospital-mar-app-completa.txt';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exportant els fitxers: ' + error.message);
      console.error(error);
    }
  };

  const exportarZIPComplet = async () => {
    try {
      // Carregar JSZip des de CDN
      if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const JSZip = window.JSZip;
      const zip = new JSZip();

      // Obtenir fitxers
      const responsePlanning = await fetch('/pages/Planning.js');
      const codiPlanning = await responsePlanning.text();
      
      const responseDoc = await fetch('/pages/Documentacio.js');
      const codiDoc = await responseDoc.text();
      
      const responseLayout = await fetch('/Layout.js');
      const codiLayout = await responseLayout.text();

      // Afegir fitxers al ZIP
      zip.file('README.md', `# Planning Hospital del Mar

Sistema de planificació de torns i gestió de vacances per a personal sanitari de l'Hospital del Mar.

## Instal·lació

\`\`\`bash
# 1. Instal·lar dependències
npm install

# 2. Executar en desenvolupament
npm start

# 3. Build per producció
npm run build
\`\`\`

## Estructura

\`\`\`
/src
  /pages
    Planning.js          # Component principal del calendari
    Documentacio.js      # Pàgina de documentació
  Layout.js              # Layout amb navegació
  App.js                 # Router principal
  index.js               # Entry point
  index.css              # Tailwind imports
  utils.js               # Utilitats
/public
  index.html             # HTML base
package.json             # Dependències
tailwind.config.js       # Configuració Tailwind
\`\`\`

## Funcionalitats

✅ Generació automàtica de patró de treball
✅ Gestió de vacances (VE, VS, VN, LD, VC, CH)
✅ Festius recuperables (FR)
✅ Dies pendents d'any anterior
✅ Ampliació contracte (29h)
✅ Hores de cursos
✅ Undo/Redo (Ctrl+Z/Y)
✅ Generador de sol·licitud
✅ Persistència amb localStorage

## Tecnologies

- React 18
- React Router 6
- Tailwind CSS
- Lucide React (icones)
- LocalStorage (persistència)
`);

      zip.file('package.json', JSON.stringify({
        "name": "planning-hospital-mar",
        "version": "1.0.0",
        "private": true,
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router-dom": "^6.20.0",
          "react-scripts": "5.0.1",
          "lucide-react": "^0.300.0"
        },
        "devDependencies": {
          "tailwindcss": "^3.4.0"
        },
        "scripts": {
          "start": "react-scripts start",
          "build": "react-scripts build",
          "test": "react-scripts test",
          "eject": "react-scripts eject"
        },
        "eslintConfig": {
          "extends": ["react-app"]
        },
        "browserslist": {
          "production": [">0.2%", "not dead", "not op_mini all"],
          "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
        }
      }, null, 2));

      zip.file('tailwind.config.js', `module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}`);

      zip.file('.gitignore', `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`);

      const srcFolder = zip.folder('src');
      const pagesFolder = srcFolder.folder('pages');
      
      pagesFolder.file('Planning.js', codiPlanning);
      pagesFolder.file('Documentacio.js', codiDoc);
      
      srcFolder.file('Layout.js', codiLayout);
      
      srcFolder.file('App.js', `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Planning from './pages/Planning';
import Documentacio from './pages/Documentacio';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/planning" replace />} />
        <Route path="/planning" element={
          <Layout currentPageName="Planning">
            <Planning />
          </Layout>
        } />
        <Route path="/documentacio" element={
          <Layout currentPageName="Documentacio">
            <Documentacio />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}`);

      srcFolder.file('index.js', `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

      srcFolder.file('index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;`);

      srcFolder.file('utils.js', `export function createPageUrl(pageName) {
  return '/' + pageName.toLowerCase();
}`);

      const publicFolder = zip.folder('public');
      publicFolder.file('index.html', `<!DOCTYPE html>
<html lang="ca">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Planning Hospital del Mar - Gestió de torns i vacances" />
    <title>Planning Hospital del Mar</title>
  </head>
  <body>
    <noscript>Necessites JavaScript per executar aquesta app.</noscript>
    <div id="root"></div>
  </body>
</html>`);

      // Generar i descarregar el ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planning-hospital-mar.zip';
      a.click();
      URL.revokeObjectURL(url);
      
      alert('✅ ZIP descarregat correctament!');
    } catch (error) {
      alert('Error generant el ZIP: ' + error.message);
      console.error(error);
    }
  };

  const exportarTotsElsFitxersJSON = async () => {
    try {
      const responsePlanning = await fetch('/pages/Planning.js');
      const codiPlanning = await responsePlanning.text();
      
      const responseDoc = await fetch('/pages/Documentacio.js');
      const codiDoc = await responseDoc.text();
      
      const responseLayout = await fetch('/Layout.js');
      const codiLayout = await responseLayout.text();
      
      // Crear un JSON amb tots els fitxers de l'app
      const appPackage = {
      info: {
        name: "Planning Hospital del Mar",
        version: "1.0.0",
        date: new Date().toISOString(),
        description: "Sistema de gestió de calendari laboral per Hospital del Mar"
      },
      files: {
        "src/pages/Planning.js": codiPlanning,
        "src/pages/Documentacio.js": codiDoc,
        "src/Layout.js": codiLayout,
        "README.md": `# Planning Hospital del Mar

## Instal·lació

1. Crea un projecte React:
\`\`\`bash
npx create-react-app planning-hospital
cd planning-hospital
\`\`\`

2. Instal·la dependències:
\`\`\`bash
npm install lucide-react
npm install -D tailwindcss
npx tailwindcss init
\`\`\`

3. Configura Tailwind (tailwind.config.js):
\`\`\`javascript
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
\`\`\`

4. Afegeix Tailwind a src/index.css:
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

5. Copia els fitxers Planning.js i Documentacio.js a src/

6. Importa a App.js:
\`\`\`javascript
import Planning from './Planning';
import Documentacio from './Documentacio';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Planning</Link>
        <Link to="/documentacio">Documentació</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Planning />} />
        <Route path="/documentacio" element={<Documentacio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
\`\`\`

7. Executa:
\`\`\`bash
npm start
\`\`\`

## Ús

- Selecciona l'any
- Assigna vacances clicant les files de la taula i després els dies del calendari
- Usa Ctrl+Z per desfer i Ctrl+Y per refer
- Exporta la sol·licitud amb el botó "Sol·licitud"

## Funcionalitats

- ✅ Generació automàtica de patró de treball
- ✅ Gestió de vacances (VE, VS, VN, LD, VC, CH)
- ✅ Festius recuperables (FR)
- ✅ Dies pendents d'any anterior
- ✅ Ampliació contracte (29h)
- ✅ Hores de cursos
- ✅ Undo/Redo (Ctrl+Z/Y)
- ✅ Generador de sol·licitud
- ✅ Persistència amb localStorage

## Estructura de Fitxers

\`\`\`
/src
  /pages
    Planning.js
    Documentacio.js
  Layout.js
  App.js
  index.js
  index.css
/public
  index.html
package.json
tailwind.config.js
\`\`\`
`,
        "package.json": JSON.stringify({
          "name": "planning-hospital-mar",
          "version": "1.0.0",
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.20.0",
            "lucide-react": "^0.300.0"
          },
          "devDependencies": {
            "tailwindcss": "^3.4.0",
            "react-scripts": "5.0.1"
          },
          "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
          },
          "eslintConfig": {
            "extends": ["react-app"]
          },
          "browserslist": {
            "production": [">0.2%", "not dead", "not op_mini all"],
            "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
          }
        }, null, 2),
        "tailwind.config.js": `module.exports = {
        content: ["./src/**/*.{js,jsx,ts,tsx}"],
        theme: {
        extend: {},
        },
        plugins: [],
        }`,
        "src/index.css": `@tailwind base;
        @tailwind components;
        @tailwind utilities;`,
        "src/index.js": `import React from 'react';
        import ReactDOM from 'react-dom/client';
        import './index.css';
        import App from './App';

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
        <React.StrictMode>
        <App />
        </React.StrictMode>
        );`,
        "src/App.js": `import React from 'react';
        import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
        import Layout from './Layout';
        import Planning from './pages/Planning';
        import Documentacio from './pages/Documentacio';

        export default function App() {
        return (
        <BrowserRouter>
        <Routes>
        <Route path="/" element={<Navigate to="/planning" replace />} />
        <Route path="/planning" element={
        <Layout currentPageName="Planning">
        <Planning />
        </Layout>
        } />
        <Route path="/documentacio" element={
        <Layout currentPageName="Documentacio">
        <Documentacio />
        </Layout>
        } />
        </Routes>
        </BrowserRouter>
        );
        }`,
        "src/utils.js": `export function createPageUrl(pageName) {
        return '/' + pageName.toLowerCase();
        }`,
        "public/index.html": `<!DOCTYPE html>
        <html lang="ca">
        <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Planning Hospital del Mar - Gestió de torns i vacances" />
        <title>Planning Hospital del Mar</title>
        </head>
        <body>
        <noscript>Necessites JavaScript per executar aquesta app.</noscript>
        <div id="root"></div>
        </body>
        </html>`,
        ".gitignore": `# dependencies
        /node_modules
        /.pnp
        .pnp.js

        # testing
        /coverage

        # production
        /build

        # misc
        .DS_Store
        .env.local
        .env.development.local
        .env.test.local
        .env.production.local

        npm-debug.log*
        yarn-debug.log*
        yarn-error.log*`
      },
        instructions: "Descarrega els fitxers individualment amb els botons d'exportació i segueix les instruccions del README.md",
        estadistiques: {
          liniesPlanning: codiPlanning.split('\n').length,
          liniesDocumentacio: codiDoc.split('\n').length,
          liniesLayout: codiLayout.split('\n').length,
          totalFitxers: 11,
          dataExportacio: new Date().toISOString()
        },
        notes: [
          "Aquest package conté tots els fitxers necessaris per executar l'aplicació",
          "Extreu cada fitxer segons la ruta especificada (src/pages/Planning.js, etc.)",
          "Segueix les instruccions del README.md per la instal·lació completa",
          "Els fitxers Planning.js, Documentacio.js i Layout.js són els components principals",
          "L'aplicació usa localStorage per guardar les dades localment"
        ]
      };

      const blob = new Blob([JSON.stringify(appPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planning-app-package.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error generant el package: ' + error.message);
      console.error(error);
    }
  };

  const exportarDocumentacioCompleta = async () => {
    try {
      const response = await fetch('/pages/Planning.js');
      const codi = await response.text();
      
      // Extreure informació del codi
      const dayTypesMatch = codi.match(/const DAY_TYPES = ({[\s\S]*?});/);
      const dayTypes = dayTypesMatch ? eval('(' + dayTypesMatch[1] + ')') : {};
      
      const frHolidaysMatch = codi.match(/const FR_HOLIDAYS_\d+ = (\[[\s\S]*?\]);/);
      const frHolidays = frHolidaysMatch ? eval(frHolidaysMatch[1]) : [];
      
      const funcions = [];
      const funcioRegex = /function (\w+)\([^)]*\)|const (\w+) = \([^)]*\) =>/g;
      let match;
      while ((match = funcioRegex.exec(codi)) !== null) {
        const nom = match[1] || match[2];
        if (nom && !nom.startsWith('use') && nom !== 'Planning') {
          funcions.push(nom);
        }
      }
      
      const totalLinies = codi.split('\n').length;
      const dataGeneracio = new Date().toLocaleString('ca-ES');
      
    const markdown = `# Planning Hospital del Mar - Documentació Tècnica Completa

**Documentació generada automàticament el ${dataGeneracio}**
**Total línies de codi: ${totalLinies}**
**Total funcions detectades: ${funcions.length}**

## 📋 Índex
1. [Visió General](#visio-general)
2. [Arquitectura](#arquitectura)
3. [Estructura de Dades](#estructura-dades)
4. [Funcionalitats](#funcionalitats)
5. [Normativa](#normativa)
6. [Guia d'Implementació](#guia-implementacio)
7. [API / Funcions](#api-funcions)
8. [Fluxos de Treball](#fluxos-treball)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## 1. Visió General

### Propòsit
Sistema de planificació de torns i gestió de vacances per a personal sanitari de l'Hospital del Mar amb jornada de 25,38 hores setmanals.

### Funcionalitats Principals
- Generació automàtica de patró de treball setmanal
- Gestió de vacances (estiu, Nadal, Setmana Santa)
- Assignació de festius recuperables (FR)
- Control de dies de lliure disposició, jornada intensiva i compensació d'hores
- Gestió de dies pendents d'anys anteriors
- Persistència local de dades
- Exportació de planning

### Usuaris Target
Personal sanitari amb torns especials (divendres-dilluns alternats 4-3 dies)

---

## 2. Arquitectura

### Stack Tecnològic
- **Frontend**: React 18+ (Hooks)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: LocalStorage (client-side)
- **Build**: Modern JavaScript (ES6+)

### Patró Arquitectònic
Single Page Application (SPA) amb gestió d'estat local

### Estructura de Components
\`\`\`
Planning (Component Principal)
├── Header (Títol, selector any, botons)
├── BannerAssignacio (Condicional: mostrar quan s'assigna)
├── CalendariVisual (Graella 12x31)
├── PanelNormativa (Condicional: mostrar/amagar)
├── TaulaFestius (FR oficials + manuals)
├── TaulaDiesPerDemanar (VE, VS, VN, LD, VC, CH)
├── TaulaDiesPendents (Any anterior)
└── LlegendaCodis (Explicació colors i símbols)
\`\`\`

### Flux de Dades
\`\`\`
LocalStorage ←→ useState ←→ UI Components
                    ↓
                useEffect (sync amb localStorage)
\`\`\`

---

## 3. Estructura de Dades

### calendar: Object
Diccionari amb clau = dateKey (YYYY-MM-DD)

\`\`\`javascript
{
  "2026-01-15": {
    date: "2026-01-15",
    day_type: "M",  // Tipus de dia
    slotIndex: 0,   // Índex si és slot assignable (opcional)
    frId: "official-3",  // ID del FR si és festiu recuperable (opcional)
    fromPreviousYear: true,  // Si és dia pendent any anterior (opcional)
    pendingIndex: 2,  // Índex dins pending2025 (opcional)
    pendingLabel: "VN25"  // Etiqueta del dia pendent (opcional)
  }
}
\`\`\`

**day_type** pot ser:
- **M**: Treballat
- **FS**: Descans/Festiu
- **VE**: Vacances Estiu
- **VS**: Setmana Santa
- **DS**: Adicional Setmana Santa
- **VN**: Nadal
- **LD**: Lliure Disposició
- **VC**: Jornada Intensiva
- **CH**: Compensació Hores
- **FR**: Festiu Recuperable

### manualFR: Array
\`\`\`javascript
[
  {
    label: "FR Manual 1",
    date: "08-12-2026"  // Format DD-MM-YYYY
  },
  {
    label: "FR Manual 2",
    date: "25-12-2026"
  }
]
\`\`\`

### pending2025: Array
\`\`\`javascript
[
  {
    type: "VN25",  // Tipus + any
    date: "15/01/2026"  // Format DD/MM/YYYY (opcional, s'emplena al assignar)
  },
  {
    type: "FR 06-12-2025",
    date: ""
  }
]
\`\`\`

---

## 4. Funcionalitats

### 4.1. Generació Automàtica de Patró
**Funció**: \`generateWorkPattern(year)\`

Genera el patró de treball per tot l'any:
- Comença cada divendres
- Alterna setmanes de 4 dies (divendres-dilluns) i 3 dies (divendres-diumenge)
- Marca la resta de dies com a descans (FS)

**Algoritme**:
1. Troba el primer divendres de l'any
2. Cicle fins final d'any:
   - Si índex parell: 4 dies (divendres, dissabte, diumenge, dilluns)
   - Si índex senar: 3 dies (divendres, dissabte, diumenge)
   - Avança 7 dies (una setmana)
3. Emplena buits amb FS

### 4.2. Assignació de Vacances
Cada tipus de vacances té les seves regles:

**VE (Vacances Estiu)**:
- 3 períodes (blocs)
- Cada bloc pot tenir múltiples dies
- Assignació: clicar fila → clicar dies al calendari → finalitzar bloc

**VS, DS, VN, LD, VC, CH**:
- Dies individuals
- Assignació: clicar fila → clicar 1 dia al calendari

### 4.3. Festius Recuperables (FR)
Dos tipus de FR:

**Oficials**: Festius oficials que es treballen
- Es mostren automàticament si el dia al calendari és M
- Assignació: clicar fila FR → clicar dia M al calendari per recuperar-lo

**Manuals**: FR introduïts manualment
- Selector de data tipus \`<input type="date">\`
- Càlcul automàtic de període i deadline segons la data

### 4.4. Dies Pendents Any Anterior
- Taula editable per afegir dies pendents
- Assignació: clicar fila → clicar dia al calendari
- Visual: dies marcats amb 📌
- Es guarden a localStorage amb clau \`pending-2025-{year}\`

### 4.5. Passar Dies al Proper Any
- Botó → a la columna de cada dia assignable
- Només disponible per VN, LD, VC, CH (i FR de Des-Gen-Feb)
- Afegeix el dia a \`pending-2025-{year+1}\` al localStorage

### 4.6. Reset Planning
- Botó "Reset" regenera el patró de treball
- Demana confirmació abans d'esborrar
- Manté els FR manuals i dies pendents

---

## 5. Normativa

### Vacances d'Estiu (VE)
- **Total**: 31 dies naturals
- **Blocs**: 3 períodes separats
- **Deadline**: Sol·licitar abans del 28 de febrer
- **Període**: Gaudir entre 1 juny - 30 setembre
- **Restriccions**: 
  - Mínim 7 dies naturals per bloc
  - Mínim 7 dies naturals entre blocs

### Setmana Santa (VS + DS)
- **VS**: 2 dies festius
- **DS**: 1 dia addicional
- **Deadline**: Sol·licitar abans del 31 de gener
- **Període**: 1 mes abans/després del Divendres Sant

### Nadal (VN)
- **Total**: 2 dies festius
- **Deadline**: Sol·licitar abans del 15 d'octubre
- **Període**: 1 desembre - 28 febrer

### Lliure Disposició (LD)
- **Total**: 3 dies
- **Deadline**: Durant l'any
- **Període**: Tot l'any, excepcionalment fins 31 gener

### Jornada Intensiva (VC)
- **Total**: 3 dies
- **Deadline**: Durant l'any
- **Període**: Tot l'any, excepcionalment fins 31 gener

### Compensació Hores (CH)
- **Total anual**: 4 dies
- **Assignació**: Els assigna el planificador (no l'usuari) dins del calendari oficial del servei
- **Elecció**: L'usuari no pot triar els dies de CH; només els marca al calendari quan ja consten al planning oficial
- **Període de gaudiment**: Dins del mateix any natural, no es poden traslladar a l'any següent
- **Finalitat**: Compensen hores extres derivades de la jornada anual de 25,38 h setmanals
- **Proporcionalitat**: Per contractes de 25,38 h equival aproximadament a 4,44 dies → 4 CH
- **Referència**: Normativa interna RH-ADM 2026 del Consorci Mar Parc de Salut de Barcelona

### Festius Recuperables (FR)
Organitzats per períodes trimestrals:

| Període | Deadline sol·licitud | Dies a gaudir |
|---------|---------------------|---------------|
| Març-Maig | 31 gener | Dins mateix període |
| Juny-Setembre | 28 febrer | Dins mateix període |
| Octubre-Novembre | 15 abril | Dins mateix període |
| Des-Gen-Feb | 15 octubre | Dins mateix període |

---

## 6. Guia d'Implementació

### 6.1. Requisits del Sistema
- Node.js 16+ (per desenvolupament)
- npm o yarn
- Navegador modern amb suport LocalStorage

### 6.2. Instal·lació

#### Opció A: React from Scratch
\`\`\`bash
npx create-react-app planning-hospital
cd planning-hospital
npm install lucide-react
npm install -D tailwindcss
npx tailwindcss init
\`\`\`

Configurar Tailwind:
\`\`\`javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
\`\`\`

\`\`\`css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

Copiar \`Planning.js\` a \`src/Planning.js\` i importar-lo a \`App.js\`.

#### Opció B: Next.js
\`\`\`bash
npx create-next-app planning-hospital
cd planning-hospital
npm install lucide-react
\`\`\`

Crear \`pages/planning.js\` amb el codi del component.

#### Opció C: Vite
\`\`\`bash
npm create vite@latest planning-hospital -- --template react
cd planning-hospital
npm install
npm install lucide-react
\`\`\`

### 6.3. Estructura de Fitxers
\`\`\`
/src
  /components
    Planning.js          # Component principal
  /utils
    dateUtils.js         # Funcions de dates (opcional refactor)
    workPatterns.js      # Generació patrons (opcional refactor)
  App.js
  index.js
\`\`\`

### 6.4. Variables d'Entorn
No requereix variables d'entorn (tot client-side).

Per personalitzar:
\`\`\`javascript
const CONFIG = {
  HOSPITAL_NAME: "Hospital del Mar",
  WORK_HOURS: "25,38h",
  DEFAULT_YEAR: 2026,
  STORAGE_PREFIX: "planning_"
};
\`\`\`

---

## 7. API / Funcions

### Funcions Principals

#### \`generateWorkPattern(year: number): Object\`
Genera el diccionari de dies treballats/descans per l'any especificat.

**Entrada**: Any (number)  
**Sortida**: Object { dateKey: { date, day_type } }

**Exemple**:
\`\`\`javascript
const pattern = generateWorkPattern(2026);
// Retorna: { "2026-01-02": { date: "2026-01-02", day_type: "M" }, ... }
\`\`\`

---

#### \`formatDateKey(year: number, month: number, day: number): string\`
Converteix any/mes/dia a format clau (YYYY-MM-DD).

**Exemple**:
\`\`\`javascript
formatDateKey(2026, 0, 15)  // "2026-01-15"
\`\`\`

---

#### \`formatDateDisplay(dateKey: string): string\`
Converteix dateKey a format visual (DD/MM/YYYY).

**Exemple**:
\`\`\`javascript
formatDateDisplay("2026-01-15")  // "15/01/2026"
\`\`\`

---

#### \`isWeekend(dateKey: string): boolean\`
Retorna true si és dissabte o diumenge.

---

#### \`isOfficialHoliday(dateKey: string, year: number): boolean\`
Retorna true si és un festiu oficial (de FR_HOLIDAYS_2026).

---

#### \`calculateFRPeriod(dateStr: string): { period: string, deadline: string }\`
Calcula el període trimestral i deadline per un festiu donat.

**Entrada**: "DD-MM-YYYY"  
**Sortida**: { period: "Març-Maig", deadline: "31 gener" }

---

#### \`calculateGoodFriday(year: number): string\`
Calcula la data del Divendres Sant per l'any (algoritme de Computus).

**Sortida**: "3 d'abril" (exemple)

---

#### \`getAssignedDates(): Object\`
Retorna un objecte amb tots els dies assignats agrupats per tipus.

**Sortida**:
\`\`\`javascript
{
  VE: [
    ["2026-06-01", "2026-06-02", ...],  // Període 1
    [],  // Període 2
    []   // Període 3
  ],
  VS: ["2026-03-20", "2026-03-27"],
  VN: ["2026-12-24", null],
  ...
}
\`\`\`

---

### Handlers d'Interacció

#### \`handleDayClick(dateKey: string): void\`
Gestiona el clic sobre un dia del calendari.

**Comportament**:
- Si mode assignació pendent → assigna dia pendent
- Si mode assignació FR → assigna/desassigna FR
- Si mode assignació slot → assigna/desassigna slot
- Si no hi ha mode actiu → no fa res

---

#### \`handleSlotClick(type: string, index: number): void\`
Activa el mode d'assignació per un slot de vacances.

**Paràmetres**:
- type: "VE" | "VS" | "VN" | ...
- index: 0, 1, 2 (índex del slot)

---

#### \`handleFRClick(frId: string, label: string): void\`
Activa el mode d'assignació per un FR.

**Paràmetres**:
- frId: "official-0" | "manual-1"
- label: "Any Nou" | "FR Manual 1"

---

#### \`handlePendingClick(index: number, type: string): void\`
Activa el mode d'assignació per un dia pendent.

---

## 8. Fluxos de Treball

### 8.1. Flux Assignar VE (Vacances Estiu)
\`\`\`
[Usuari] → Clic fila VE P1
         ↓
[Sistema] → setAssigningSlot({ type: "VE", index: 0 })
         → Mostra banner groc
         ↓
[Usuari] → Clic dies calendari (múltiples)
         ↓
[Sistema] → Per cada clic:
            - Afegeix/treu dia del bloc
            - Actualitza calendar[dateKey]
            - Guarda a localStorage
         ↓
[Usuari] → Clic "Finalitzar bloc"
         ↓
[Sistema] → setAssigningSlot(null)
         → Amaga banner
\`\`\`

### 8.2. Flux Assignar FR
\`\`\`
[Usuari] → Treballa festiu oficial (marca dia com M)
         ↓
[Sistema] → El FR apareix a la taula FR
         ↓
[Usuari] → Clic fila FR
         ↓
[Sistema] → setAssigningFR({ id: frId, label })
         → Mostra banner taronja
         → Destaca dies M amb ring taronja parpellejant
         ↓
[Usuari] → Clic dia M
         ↓
[Sistema] → Converteix dia M a FR
         → Guarda frId al calendar[dateKey]
         → Guarda a localStorage
         → setAssigningFR(null)
\`\`\`

### 8.3. Flux Dia Pendent
\`\`\`
[Usuari] → Clic fila dia pendent
         ↓
[Sistema] → setAssigningPending({ index, type })
         → Mostra banner morat
         ↓
[Usuari] → Clic dia calendari
         ↓
[Sistema] → Detecta tipus dia (VN, LD, FR, etc.)
         → Actualitza calendar[dateKey] amb fromPreviousYear: true
         → Actualitza pending2025[index].date
         → Guarda a localStorage
         → setAssigningPending(null)
\`\`\`

---

## 9. Testing

### 9.1. Test Cases

#### TC001: Generació Patró
**Objectiu**: Verificar que el patró de treball es genera correctament

**Passos**:
1. Cridar \`generateWorkPattern(2026)\`
2. Verificar primer divendres és 2 de gener
3. Verificar alternança 4-3 dies
4. Verificar tots els dies de l'any tenen entrada

**Resultat esperat**: Pattern complet amb 365 dies

---

#### TC002: Assignació VE
**Objectiu**: Assignar 3 períodes de vacances d'estiu

**Passos**:
1. Clicar VE P1
2. Seleccionar 10 dies juny
3. Finalitzar bloc
4. Repetir per P2 i P3

**Resultat esperat**: 
- Total dies VE = suma dels 3 blocs
- Dies marcats correctament al calendari
- Dades persistides a localStorage

---

#### TC003: FR Manual
**Objectiu**: Afegir un festiu manual i recuperar-lo

**Passos**:
1. Seleccionar data FR manual: 15-08-2026
2. Verificar càlcul període: "Juny-Set"
3. Verificar deadline: "28 febrer"
4. Clicar fila FR manual
5. Clicar dia M per recuperar-lo

**Resultat esperat**: Dia convertit a FR, persistit correctament

---

#### TC004: Dies Pendents
**Objectiu**: Gestionar dies pendents 2025

**Passos**:
1. Afegir dia pendent VN25
2. Clicar fila
3. Assignar dia al gener 2026
4. Verificar marca 📌 al calendari

**Resultat esperat**: Dia assignat i marcat visualment

---

### 9.2. Tests Unitaris Recomanats

\`\`\`javascript
describe('dateUtils', () => {
  test('formatDateKey formats correctly', () => {
    expect(formatDateKey(2026, 0, 15)).toBe('2026-01-15');
  });

  test('isWeekend detects saturday', () => {
    expect(isWeekend('2026-01-03')).toBe(true); // Dissabte
  });

  test('calculateGoodFriday returns correct date', () => {
    expect(calculateGoodFriday(2026)).toContain('abril');
  });
});

describe('workPattern', () => {
  test('generates pattern for full year', () => {
    const pattern = generateWorkPattern(2026);
    expect(Object.keys(pattern).length).toBe(365);
  });

  test('alternates 4-3 work days', () => {
    const pattern = generateWorkPattern(2026);
    // Verificar primers divendres...
  });
});
\`\`\`

---

## 10. Deployment

### 10.1. Build de Producció

#### React (create-react-app)
\`\`\`bash
npm run build
# Genera carpeta /build amb fitxers estàtics
\`\`\`

#### Next.js
\`\`\`bash
npm run build
npm start  # O export per static
\`\`\`

#### Vite
\`\`\`bash
npm run build
# Genera carpeta /dist
\`\`\`

### 10.2. Hosting

#### Opció A: Netlify
\`\`\`bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
\`\`\`

#### Opció B: Vercel
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

#### Opció C: GitHub Pages
\`\`\`bash
npm install gh-pages --save-dev
# Afegir a package.json:
# "homepage": "https://{username}.github.io/{repo}",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

npm run deploy
\`\`\`

### 10.3. Consideracions de Producció

#### LocalStorage
- Límit: ~5-10MB per domini
- No compartit entre dispositius
- Considerar backend per sincronització multi-dispositiu

#### Backup de Dades
Afegir funció d'exportació:
\`\`\`javascript
const exportData = () => {
  const data = {
    calendar: localStorage.getItem('calendar-2026'),
    manualFR: localStorage.getItem('manual-fr-2026'),
    pending: localStorage.getItem('pending-2025-2026')
  };
  // Descarregar com JSON
};
\`\`\`

#### Migració a Backend (Futur)
Quan calgui backend:
- API REST o GraphQL
- Base de dades: PostgreSQL, MongoDB
- Auth: JWT, OAuth
- Sincronització en temps real: WebSockets

---

## 11. Roadmap / Futures Millores

### v1.1 (Curt termini)
- [ ] Validació de regles (mínim 7 dies per bloc VE)
- [ ] Alertes deadlines (avisar si prop de deadline)
- [ ] Estadístiques (dies treballats, descans, vacances)
- [ ] Exportar a PDF
- [ ] Impressió optimitzada

### v1.2 (Mitjà termini)
- [ ] Multi-usuari (backend)
- [ ] Sincronització entre dispositius
- [ ] Calendari Google/Outlook
- [ ] Notificacions push
- [ ] Mode fosc

### v2.0 (Llarg termini)
- [ ] App mòbil (React Native)
- [ ] IA per suggerir plannings òptims
- [ ] Gestió d'equips (coordinador)
- [ ] Intercanvi de torns entre companys
- [ ] Integració amb sistema RH hospital

---

## 12. Troubleshooting

### Problema: Dades no es guarden
**Causa**: LocalStorage desactivat o ple  
**Solució**: Verificar \`localStorage.setItem()\` no dona error

### Problema: Dates incorrectes
**Causa**: Diferència de timezone  
**Solució**: Usar sempre UTC o normalitzar zones horàries

### Problema: Patró no genera bé
**Causa**: Any comença dimarts (no divendres)  
**Solució**: Ajustar \`currentFriday\` inicial

---

## 13. Contacte i Suport

**Desenvolupador**: Base44 AI  
**Versió**: 1.0.0  
**Data**: Gener 2025  

Per preguntes o millores, contactar amb l'equip de desenvolupament.

---

---

## Funcions Detectades al Codi

${funcions.slice(0, 50).map((f, i) => `${i + 1}. ${f}`).join('\n')}

---

## Configuració DAY_TYPES Actual

${Object.entries(dayTypes).map(([key, config]) => 
  `- **${key}**: ${config.name}${config.total ? ` (${config.total} ${config.isBlock ? 'blocs' : 'dies'})` : ''}`
).join('\n')}

---

## Festius Recuperables Configurats

${frHolidays.map((h, i) => `${i + 1}. ${h.label} - ${h.date} (${h.period})`).join('\n')}

---

**Fi de la Documentació Tècnica**
`;

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planning-documentacio-completa.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error generant la documentació: ' + error.message);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Documentació Tècnica</h1>
                <p className="text-gray-600">Blueprint i guia completa de l'aplicació</p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exportarZIPComplet}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 shadow-lg font-bold"
                title="Exportar tot el projecte en ZIP"
              >
                <Package className="w-6 h-6" />
                Exportar Projecte
              </button>

              <button
                onClick={exportarBlueprint}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <Database className="w-5 h-5" />
                Blueprint
              </button>

              <button
                onClick={exportarDocumentacioCompleta}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <FileText className="w-5 h-5" />
                Documentació MD
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab('usuario')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'usuario' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Documentació Usuari
              </button>
              <button
                onClick={() => setActiveTab('tecnica')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'tecnica' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                Migració App
              </button>
              <button
                onClick={() => setActiveTab('blueprint')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'blueprint' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Blueprint
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'usuario' && (
              <div className="space-y-6 max-w-4xl">
                <h2 className="text-3xl font-bold text-gray-900">📖 Guia d'Usuari</h2>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-bold text-blue-900 mb-2">Què fa aquesta app?</h3>
                  <p className="text-blue-800">
                    Planning és una eina visual per planificar torns i vacances per a personal sanitari amb jornada de 25,38h setmanals 
                    (patró divendres-dilluns alternant 4-3 dies). Permet gestionar vacances d'estiu, Setmana Santa, Nadal, dies de 
                    lliure disposició i festius recuperables.
                  </p>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">🎯 Com usar el calendari</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 min-w-6">1.</span>
                      <span><strong>Genera el patró:</strong> En obrir l'app, el calendari ja té el patró de treball generat automàticament (M = treballat, FS = descans).</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 min-w-6">2.</span>
                      <span><strong>Selecciona un tipus de dia:</strong> Clica sobre una fila de la taula "Dies per Demanar" o "Festius Recuperables".</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 min-w-6">3.</span>
                      <span><strong>Assigna al calendari:</strong> Clica els dies del calendari per assignar-los. Apareixerà un banner indicant el mode actiu.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 min-w-6">4.</span>
                      <span><strong>Revisa i exporta:</strong> Verifica les assignacions a les taules i clica "Sol·licitud" per exportar el document final.</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">📅 Tipus de dies</h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="font-bold text-cyan-700">VE - Vacances d'Estiu</h4>
                      <ul className="text-sm mt-2 space-y-1 text-gray-700">
                        <li>• Total: 31 dies naturals dividits en 3 períodes (P1, P2, P3)</li>
                        <li>• Període: 1 juny - 30 setembre</li>
                        <li>• Deadline: Sol·licitar abans del 28 febrer</li>
                        <li>• Recomanació: Mínim 7 dies per bloc, 7 dies entre blocs</li>
                        <li>• Mode: Selecciona VE P1/P2/P3, clica múltiples dies, finalitza bloc</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-bold text-purple-700">VS i DS - Setmana Santa</h4>
                      <ul className="text-sm mt-2 space-y-1 text-gray-700">
                        <li>• VS: 2 dies festius | DS: 1 dia addicional</li>
                        <li>• Període: 1 mes abans/després Divendres Sant</li>
                        <li>• Deadline: Sol·licitar abans del 31 gener</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-bold text-red-700">VN - Nadal</h4>
                      <ul className="text-sm mt-2 space-y-1 text-gray-700">
                        <li>• Total: 2 dies festius</li>
                        <li>• Període: 1 desembre - 28 febrer</li>
                        <li>• Deadline: Sol·licitar abans del 15 octubre</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-lime-500 pl-4">
                      <h4 className="font-bold text-lime-700">LD, VC - Dies a Escollir</h4>
                      <ul className="text-sm mt-2 space-y-1 text-gray-700">
                        <li>• LD (Lliure Disposició): 3 dies, durant l'any</li>
                        <li>• VC (Jornada Intensiva): 3 dies, durant l'any</li>
                        <li>• Excepcionalment fins 31 gener de l'any següent</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-pink-500 pl-4">
                      <h4 className="font-bold text-pink-700">🕓 CH - Compensació d'Hores</h4>
                      <ul className="text-sm mt-2 space-y-1 text-gray-700">
                        <li>• <strong>Total anual:</strong> 4 dies</li>
                        <li>• <strong>Assignació:</strong> els assigna el planificador dins del calendari oficial del servei</li>
                        <li>• <strong>Elecció:</strong> l'usuari NO pot triar els dies de CH; només els marca al calendari quan ja consten al planning oficial</li>
                        <li>• <strong>Període de gaudiment:</strong> dins del mateix any natural, no es poden traslladar a l'any següent</li>
                        <li>• <strong>Finalitat:</strong> compensen hores extres derivades de la jornada anual de 25,38 h setmanals</li>
                        <li>• <strong>Proporcionalitat:</strong> per contractes de 25,38 h equival aproximadament a 4,44 dies → 4 CH</li>
                        <li>• <strong>Referència:</strong> Normativa interna RH-ADM 2026 del Consorci Mar Parc de Salut de Barcelona</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-bold text-orange-700">FR - Festius Recuperables</h4>
                      <ul className="text-sm mt-2 space-y-1 text-gray-700">
                        <li>• Festius oficials que es treballen (M) i es recuperen després</li>
                        <li>• IMPORTANT: FR només sobre dies treballats (M)</li>
                        <li>• Els FR es mostren automàticament si marques el festiu com M</li>
                        <li>• Deadlines per trimestre (Març-Maig: 31 gener, Juny-Set: 28 febrer, etc.)</li>
                        <li>• També pots afegir FR manuals amb data personalitzada</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">🎨 Senyals Visuals</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs ring-4 ring-yellow-400">M</div>
                      <span className="text-sm">Anell groc: Mode assignació actiu (clica dies per assignar)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs ring-2 ring-orange-500 animate-pulse">M</div>
                      <span className="text-sm">Anell taronja parpellejant: Dia M vàlid per assignar FR</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border rounded flex items-center justify-center font-bold text-xs ring-2 ring-purple-500 animate-pulse">FS</div>
                      <span className="text-sm">Anell morat parpellejant: Dia vàlid per assignar dia pendent</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold text-xs relative">M<span className="absolute top-0 right-0 text-[8px]">⭐</span></div>
                      <span className="text-sm">⭐ Estrella: Festiu oficial que estàs treballant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs relative">VN<span className="absolute bottom-0 left-0 text-[8px]">📌</span></div>
                      <span className="text-sm">📌 Xinxeta: Dia pendent de l'any anterior</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs relative">M<span className="absolute top-0 left-0 text-[8px]">💼</span></div>
                      <span className="text-sm">💼 Maletí: Ampliació contracte (29h) — FS convertit a M puntual</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">⌨️ Atajos de Teclat</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">Ctrl+Z</span>
                      <span className="ml-2 text-sm">Desfer últim canvi</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">Ctrl+Y</span>
                      <span className="ml-2 text-sm">Refer canvi</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">Esc</span>
                      <span className="ml-2 text-sm">Cancel·lar mode assignació</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4">
                  <h3 className="font-bold text-red-900 mb-3">⚠️ Regles i Límits Importants</h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li>• <strong>FR només sobre M:</strong> Els festius recuperables només es poden assignar sobre dies treballats. Si converteixes M→FS, perdràs el FR.</li>
                    <li>• <strong>VE en blocs:</strong> Les vacances d'estiu van en 3 períodes separats. Recomanació: mínim 7 dies per bloc i 7 dies entre blocs.</li>
                    <li>• <strong>Dies pendents:</strong> Els VN/LD/VC/CH de l'any anterior es poden gaudir fins al 31 gener. Els FR segons el seu període.</li>
                    <li>• <strong>Festius per any:</strong> Els festius oficials estan hardcoded per any. Cal actualitzar-los manualment (o usar FR manuals).</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-600 p-4">
                  <h3 className="font-bold text-green-900 mb-3">💡 Consells d'Ús</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• Usa Ctrl+Z si et confons assignant dies</li>
                    <li>• Prem Esc per sortir del mode assignació sense canvis</li>
                    <li>• Revisa les taules "FR" i "Dies per Demanar" abans d'exportar</li>
                    <li>• Marca els festius que treballes com M perquè apareguin a la taula FR</li>
                    <li>• Usa el botó "Sol·licitud" per generar el document final per copiar o descarregar</li>
                      <li>• El botó "Ampliació" permet convertir dies de descans (FS) a treballats (M) sense alterar el patró; pensat per divendres-dilluns, però pots afegir altres dies puntuals si cal</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'tecnica' && (
              <div className="space-y-6 max-w-4xl">
                <h2 className="text-3xl font-bold text-gray-900">🔧 Guia de Migració</h2>

                <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
                  <h3 className="font-bold text-purple-900 mb-2">Migració i Desplegament</h3>
                  <p className="text-purple-800 text-sm">
                    Informació tècnica per migrar l'app a qualsevol plataforma (Vercel, Netlify, Firebase, etc.)
                  </p>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">📁 Estructura de Fitxers</h3>
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-x-auto font-mono">
          {`planning-hospital-mar/
          ├── src/
          │   ├── pages/
          │   │   ├── Planning.js           # Component principal del calendari
          │   │   └── Documentacio.js       # Pàgina de documentació
          │   ├── Layout.js                 # Layout amb navegació
          │   ├── App.js                    # Router principal
          │   ├── index.js                  # Entry point
          │   ├── index.css                 # Tailwind imports
          │   └── utils.js                  # Utilitat createPageUrl
          ├── public/
          │   └── index.html                # HTML base
          ├── package.json                  # Dependències i scripts
          ├── tailwind.config.js            # Configuració Tailwind
          ├── .gitignore
          └── README.md`}
                  </pre>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">📦 Dependències (package.json)</h3>
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto font-mono">
          {`{
          "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router-dom": "^6.20.0",
          "react-scripts": "5.0.1",
          "lucide-react": "^0.300.0"
          },
          "devDependencies": {
          "tailwindcss": "^3.4.0"
          },
          "scripts": {
          "start": "react-scripts start",
          "build": "react-scripts build"
          }
          }`}
                  </pre>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">🚀 Instal·lació i Execució</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">1. Descarregar fitxers</h4>
                      <p className="text-sm text-gray-600 mb-2">Usa els botons d'exportació del header per descarregar tots els fitxers:</p>
                      <ul className="text-sm text-gray-700 space-y-1 ml-4">
                        <li>• "Fitxers (.txt)" - Tots els fitxers en text pla</li>
                        <li>• "Fitxers (.json)" - Tots els fitxers en JSON estructurat</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">2. Crear estructura</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`mkdir planning-hospital-mar
          cd planning-hospital-mar
          # Crea les carpetes: src/, src/pages/, public/
          # Copia cada fitxer a la seva ubicació`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">3. Instal·lar dependències</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`npm install
          # o
          yarn install`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">4. Executar en desenvolupament</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`npm start
          # L'app s'obrirà a http://localhost:3000`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">5. Build per producció</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`npm run build
          # Genera carpeta /build amb fitxers optimitzats`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">💾 Persistència de Dades</h3>

                  <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4">
                    <h4 className="font-bold text-green-900 mb-2">✅ Base de Dades (Actual)</h4>
                    <p className="text-sm text-green-800">
                      L'app ara utilitza Base44 Database. Les dades es guarden al núvol i es sincronitzen automàticament.
                    </p>
                  </div>

                  <h4 className="font-bold text-gray-800 mb-3 text-sm">Entitats de la Base de Dades:</h4>
                  <ul className="space-y-2 text-sm bg-gray-50 p-3 rounded">
                    <li className="text-gray-700"><span className="font-bold text-blue-600">CalendarDay</span> - Tots els dies del calendari amb el seu estat (M, FS, VE, etc.)</li>
                    <li className="text-gray-700"><span className="font-bold text-blue-600">ManualFR</span> - Festius recuperables afegits manualment</li>
                    <li className="text-gray-700"><span className="font-bold text-blue-600">PendingDay</span> - Dies pendents de l'any anterior</li>
                    <li className="text-gray-700"><span className="font-bold text-blue-600">CourseHours</span> - Hores de cursos hospitalaris</li>
                  </ul>

                  <h4 className="font-bold text-gray-800 mb-3 text-sm mt-4">Estructura CalendarDay:</h4>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto font-mono">
                {`{
  "year": 2026,                      // Any del calendari
  "date_key": "2026-07-15",          // Data YYYY-MM-DD
  "day_type": "VE|VS|DS|VN|LD|VC|CH|FR|M|FS",
  "slot_index": 0,                   // Índex slot
  "fr_id": "official-3",             // ID FR
  "from_previous_year": false,       // Pendent any anterior
  "pending_index": 1,                // Índex pendent
  "pending_label": "VN25",           // Etiqueta
    "contract_expansion": false,       // Ampliació (29h)
  "originally_worked": true          // Era M abans
}`}
                  </pre>
                  
                  <h4 className="font-bold text-gray-800 mb-3 text-sm mt-4">Flux de Càrrega de Dades:</h4>
                  <div className="bg-gray-100 p-3 rounded text-xs">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Consultar CalendarDay.filter({"{"} year {"}"})</li>
                      <li>Si hi ha dades → carregar-les</li>
                      <li>Si no → buscar localStorage (calendar-backup-{"{"}year{"}"})</li>
                      <li>Si no → generar patró amb generateWorkPattern(year)</li>
                    </ol>
                  </div>

                  <div className="mt-4 bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>✅ Avantatges:</strong> Sincronització automàtica, backup al núvol, accés des de múltiples dispositius.
                    </p>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">☁️ Deployment</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Netlify</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`npm run build
          netlify deploy --prod --dir=build`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Vercel</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`npm run build
          vercel --prod`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">GitHub Pages</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
          {`npm install gh-pages --save-dev
          # Afegir a package.json: "homepage": "https://user.github.io/repo"
          npm run deploy`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-bold text-blue-900 mb-2">✅ Checklist de Migració</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>□ Descarregar ZIP complet (botó 📦 APP COMPLETA)</li>
                    <li>□ Descomprimir el fitxer planning-hospital-mar.zip</li>
                    <li>□ Obrir terminal a la carpeta descomprimida</li>
                    <li>□ Executar: npm install</li>
                    <li>□ Executar: npm start (per provar en local)</li>
                    <li>□ Executar: npm run build (per producció)</li>
                    <li>□ Pujar carpeta /build al hosting (Vercel, Netlify, etc.)</li>
                  </ul>
                  <div className="mt-3 bg-indigo-50 p-2 rounded">
                    <p className="text-xs text-indigo-800">
                      <strong>💡 Nota:</strong> Si migres fora de Base44, hauràs d'adaptar la persistència de localStorage (el ZIP ja ho porta preparat).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'blueprint' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">📐 Blueprint de l'Aplicació</h2>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                      <h3 className="font-bold text-blue-900 mb-2">Visió General</h3>
                      <p className="text-blue-800">
                        Sistema de planificació de torns i gestió de vacances per a personal sanitari de l'Hospital del Mar amb jornada de 25,38 hores setmanals.
                        Visual, ràpid i offline-first amb guardado en localStorage.
                      </p>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6">
                      <h3 className="font-bold text-green-900 mb-2">🚀 Tecnologies</h3>
                      <div className="text-green-800 text-sm space-y-2">
                        <div><strong>Frontend:</strong> React 18+ amb Hooks + React Query</div>
                        <div><strong>Estils:</strong> Tailwind CSS</div>
                        <div><strong>Icones:</strong> Lucide React</div>
                        <div><strong>Base de Dades:</strong> Base44 Database (núvol) amb sincronització automàtica</div>
                        <div><strong>Backup:</strong> localStorage automàtic + exportació JSON manual</div>
                        <div><strong>Atajos:</strong> Ctrl+Z (Undo), Ctrl+Y (Redo), Esc (Cancel·lar mode)</div>
                        <div><strong>Selecció d'any:</strong> Suport multi-any (2025, 2026, etc.)</div>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3 text-purple-700">🎯 Funcionalitats Principals</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Generació automàtica de patró de treball setmanal (4-3 dies alternats)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Gestió de vacances d'estiu (3 períodes de 31 dies totals)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Assignació de festius recuperables (FR) amb càlcul automàtic</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Control de dies especials (Nadal, Setmana Santa, LD, VC, CH)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Gestió de dies pendents d'anys anteriors</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Persistència amb Base44 Database + Backup local</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Interfície visual amb calendari 12x31</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3 text-blue-700">🔧 Stack Tecnològic</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-semibold">Frontend:</span> React 18+ (Hooks)
                        </div>
                        <div>
                          <span className="font-semibold">Styling:</span> Tailwind CSS
                        </div>
                        <div>
                          <span className="font-semibold">Icons:</span> Lucide React
                        </div>
                        <div>
                          <span className="font-semibold">Database:</span> Base44 Database (núvol) + Backup local
                        </div>
                        <div>
                          <span className="font-semibold">Build:</span> Modern JavaScript (ES6+)
                        </div>
                        <div>
                          <span className="font-semibold">Compatibilitat:</span> Chrome, Firefox, Safari, Edge
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-50 border rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-900">📊 Flux de Dades</h3>
                    <div className="bg-white rounded p-4 font-mono text-sm">
                      <div className="text-center space-y-2">
                        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded inline-block">Base44 Database (núvol)</div>
                        <div>↕️ <span className="text-xs">(async - Promise.all per esborrar/crear)</span></div>
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded inline-block">React State (useState + history)</div>
                        <div>↕️</div>
                        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded inline-block">UI Components</div>
                        <div className="text-xs text-gray-600 mt-3">+ Backup local (localStorage per any: calendar-backup-{year})</div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-600 space-y-1">
                      <p><strong>Entitats:</strong> CalendarDay, ManualFR, PendingDay, CourseHours</p>
                      <p><strong>Càrrega:</strong> Primer núvol → si buit, backup local → si buit, genera patró</p>
                      <p><strong>Guardado:</strong> Esborrar tots + bulkCreate nous registres</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-green-700">💾 Backup i Restauració</h3>
                    <div className="space-y-3 text-sm">
                      <div className="bg-green-50 border-l-4 border-green-500 p-3">
                        <p className="font-bold text-green-900 mb-2">✅ Guardado Automàtic al Núvol</p>
                        <p className="text-green-800">Cada canvi es guarda automàticament a Base44 Database. Les operacions d'esborrar i crear es fan en paral·lel (Promise.all) per màxima eficiència.</p>
                      </div>
                      
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                        <p className="font-bold text-yellow-900 mb-2">📦 Backup Local Automàtic</p>
                        <p className="text-yellow-800">Cada canvi també es guarda a localStorage (calendar-backup-{year}). Si el núvol falla o està buit, l'app recupera automàticament del backup local.</p>
                      </div>
                      
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                        <p className="font-bold text-blue-900 mb-2">💾 Exportar Backup Manual</p>
                        <p className="text-blue-800">Usa el botó "Backup" del planning per descarregar totes les dades en format JSON. Inclou: calendari, FR manuals, dies pendents i cursos.</p>
                      </div>
                      
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
                        <p className="font-bold text-purple-900 mb-2">🔄 Canvi d'Any</p>
                        <p className="text-purple-800">En canviar d'any, l'app carrega les dades del núvol per aquell any. Si no n'hi ha, busca backup local. Si tampoc n'hi ha, genera el patró de treball bàsic.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-blue-700">⌨️ Atajos de Teclat</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-mono bg-gray-200 px-2 py-1 rounded">Ctrl+Z</span>
                        <span className="ml-2">Desfer últim canvi</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-mono bg-gray-200 px-2 py-1 rounded">Ctrl+Y</span>
                        <span className="ml-2">Refer canvi desfet</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-mono bg-gray-200 px-2 py-1 rounded">Esc</span>
                        <span className="ml-2">Cancel·lar mode assignació</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-mono bg-gray-200 px-2 py-1 rounded">Shift+Z</span>
                        <span className="ml-2">Refer canvi (alternativa)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-purple-700">📊 Senyals Visuals</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs ring-4 ring-yellow-400">M</div>
                        <span>Anell groc: Mode assignació actiu</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs ring-2 ring-orange-500 animate-pulse">M</div>
                        <span>Anell taronja parpellejant: Dia vàlid per assignar FR</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border rounded flex items-center justify-center font-bold text-xs ring-2 ring-purple-500 animate-pulse">FS</div>
                        <span>Anell morat parpellejant: Dia vàlid per assignar pendent</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold text-xs relative">M<span className="absolute top-0 right-0 text-[8px]">⭐</span></div>
                        <span>⭐ Estrella: Festiu oficial treballat</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs relative">VN<span className="absolute bottom-0 left-0 text-[8px]">📌</span></div>
                        <span>📌 Xinxeta: Dia pendent any anterior</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs relative">M<span className="absolute top-0 left-0 text-[8px]">💼</span></div>
                        <span>💼 Maletí: Ampliació contracte (29h)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'arquitectura' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">🏗️ Arquitectura de l'Aplicació</h2>
                
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-blue-700">Estructura de Dades</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-bold text-purple-700 mb-2">📅 calendar: Object</h4>
                      <p className="text-sm text-gray-600 mb-3">Diccionari amb clau = dateKey (YYYY-MM-DD)</p>
                      <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`{
  "2026-01-15": {
    date: "2026-01-15",
    day_type: "M",  // M|FS|VE|VS|DS|VN|LD|VC|CH|FR
    slotIndex: 0,   // Opcional
    frId: "official-3",  // Opcional
    fromPreviousYear: true,  // Opcional
    pendingIndex: 2,  // Opcional
    pendingLabel: "VN25"  // Opcional
  }
}`}
                      </pre>
                    </div>

                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-bold text-orange-700 mb-2">🔶 manualFR: Array</h4>
                      <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`[
  {
    label: "FR Manual 1",
    date: "08-12-2026"  // DD-MM-YYYY
  }
]`}
                      </pre>
                    </div>

                    <div className="bg-gray-50 rounded p-4">
                      <h4 className="font-bold text-purple-700 mb-2">📌 pending2025: Array</h4>
                      <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`[
  {
    type: "VN25",  // Tipus + any
    date: "15/01/2026"  // DD/MM/YYYY (opcional)
  }
]`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-red-700">⚠️ Regles i Limitacions</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-red-50 p-3 rounded">
                      <strong>FR només sobre dies M:</strong> Els festius recuperables només es poden assignar sobre dies treballats (M). Si converteixes un M a FS, el FR es perdrà.
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <strong>VE en blocs:</strong> Les vacances d'estiu es divideixen en 3 períodes. Recomanació: mínim 7 dies per bloc i mínim 7 dies entre blocs.
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>Pendents fins 31 gener:</strong> Els dies pendents de l'any anterior (VN, LD, VC, CH) es poden gaudir fins al 31 de gener. Els FR pendents segons el seu període.
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>Festius hardcoded:</strong> Els festius oficials estan definits per any al codi (FR_HOLIDAYS_2026). Cal actualitzar-los manualment cada any.
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <strong>LocalStorage:</strong> Les dades es guarden al navegador. Si esborres les dades del navegador o canvies de dispositiu, perdràs el planning. Exporta regularment!
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 text-green-700">Tipus de Dies (day_type)</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-3">
                      <span className="font-bold">M</span> - Treballat
                    </div>
                    <div className="bg-gray-50 border-l-4 border-gray-600 p-3">
                      <span className="font-bold">FS</span> - Descans/Festiu
                    </div>
                    <div className="bg-cyan-50 border-l-4 border-cyan-600 p-3">
                      <span className="font-bold">VE</span> - Vacances Estiu (3 blocs)
                    </div>
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-3">
                      <span className="font-bold">VS</span> - Setmana Santa (2 dies)
                    </div>
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-3">
                      <span className="font-bold">DS</span> - Adicional SS (1 dia)
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-600 p-3">
                      <span className="font-bold">VN</span> - Nadal (2 dies)
                    </div>
                    <div className="bg-lime-50 border-l-4 border-lime-600 p-3">
                      <span className="font-bold">LD</span> - Lliure Disposició (3 dies)
                    </div>
                    <div className="bg-amber-50 border-l-4 border-amber-600 p-3">
                      <span className="font-bold">VC</span> - Jornada Intensiva (3 dies)
                    </div>
                    <div className="bg-pink-50 border-l-4 border-pink-600 p-3">
                      <span className="font-bold">CH</span> - Compensació Hores (4 dies)
                    </div>
                    <div className="bg-orange-50 border-l-4 border-orange-600 p-3">
                      <span className="font-bold">FR</span> - Festiu Recuperable
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">⚙️ API / Funcions Principals</h2>
                
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">generateWorkPattern(year: number): Object</h3>
                    <p className="text-sm text-gray-600 mb-3">Genera el diccionari de dies treballats/descans per l'any especificat.</p>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div><span className="font-semibold">Entrada:</span> Any (number)</div>
                      <div><span className="font-semibold">Sortida:</span> Object {`{ dateKey: { date, day_type } }`}</div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">formatDateKey(year, month, day): string</h3>
                    <p className="text-sm text-gray-600 mb-3">Converteix any/mes/dia a format clau (YYYY-MM-DD).</p>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      formatDateKey(2026, 0, 15) → "2026-01-15"
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">formatDateDisplay(dateKey: string): string</h3>
                    <p className="text-sm text-gray-600 mb-3">Converteix dateKey a format visual (DD/MM/YYYY).</p>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      formatDateDisplay("2026-01-15") → "15/01/2026"
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">calculateFRPeriod(dateStr: string): Object</h3>
                    <p className="text-sm text-gray-600 mb-3">Calcula el període trimestral i deadline per un festiu donat.</p>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div><span className="font-semibold">Entrada:</span> "DD-MM-YYYY"</div>
                      <div><span className="font-semibold">Sortida:</span> {`{ period: "Març-Maig", deadline: "31 gener" }`}</div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">calculateGoodFriday(year: number): string</h3>
                    <p className="text-sm text-gray-600 mb-3">Calcula la data del Divendres Sant per l'any (algoritme de Computus).</p>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      calculateGoodFriday(2026) → "3 d'abril"
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">isWeekend(dateKey: string): boolean</h3>
                    <p className="text-sm text-gray-600">Retorna true si és dissabte o diumenge.</p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">isOfficialHoliday(dateKey, year): boolean</h3>
                    <p className="text-sm text-gray-600">Retorna true si és un festiu oficial.</p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-blue-600 font-bold mb-2">getAssignedDates(): Object</h3>
                    <p className="text-sm text-gray-600">Retorna tots els dies assignats agrupats per tipus.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'implementacio' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">🚀 Guia d'Implementació</h2>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-6">
                  <h3 className="font-bold text-yellow-900 mb-2">⚠️ Prerequisits</h3>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Node.js 16+ instal·lat</li>
                    <li>• npm o yarn</li>
                    <li>• Navegador modern amb suport LocalStorage</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-3 text-blue-700">Opció A: React (create-react-app)</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`npx create-react-app planning-hospital
cd planning-hospital
npm install lucide-react
npm install -D tailwindcss
npx tailwindcss init

# Configurar tailwind.config.js
# Copiar Planning.js a src/
# Importar a App.js

npm start`}
                    </pre>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-3 text-green-700">Opció B: Next.js</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`npx create-next-app planning-hospital
cd planning-hospital
npm install lucide-react

# Crear pages/planning.js
# Copiar el codi del component

npm run dev`}
                    </pre>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-3 text-purple-700">Opció C: Vite (Recomanat)</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`npm create vite@latest planning-hospital -- --template react
cd planning-hospital
npm install
npm install lucide-react

# Copiar Planning.js a src/
# Configurar Tailwind CSS

npm run dev`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-3 text-orange-700">📦 Deployment</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold">Netlify:</span>
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">npm run build && netlify deploy --prod --dir=build</pre>
                    </div>
                    <div>
                      <span className="font-semibold">Vercel:</span>
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">npm run build && vercel --prod</pre>
                    </div>
                    <div>
                      <span className="font-semibold">GitHub Pages:</span>
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">npm install gh-pages && npm run deploy</pre>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-bold text-blue-900 mb-2">💡 Notes Importants</h3>
                  <ul className="text-blue-800 text-sm space-y-2">
                    <li>• Les dades es guarden localment (localStorage)</li>
                    <li>• No es comparteixen entre dispositius</li>
                    <li>• Límit d'emmagatzematge: ~5-10MB</li>
                    <li>• Per sincronització multi-dispositiu, caldria backend</li>
                    <li>• Exporta regularment les dades com a backup</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-lg shadow-lg p-6">
            <Package className="w-12 h-12 mb-3" />
            <h3 className="font-bold text-2xl mb-3">📦 Exportar App Completa</h3>
            <p className="text-sm text-indigo-100 mb-4">Descarrega el ZIP amb tots els fitxers necessaris per executar l'app fora de Base44: package.json, estructura completa, configuració Tailwind, etc.</p>
            <p className="text-xs text-indigo-200">✅ Llesta per: npm install → npm start</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <FileText className="w-12 h-12 mb-3" />
            <h3 className="font-bold text-2xl mb-3">📄 Documentació Tècnica</h3>
            <p className="text-sm text-green-100 mb-4">Exporta la documentació completa en Markdown amb tota l'arquitectura, API, funcionalitats, guies d'instal·lació i desplegament.</p>
            <p className="text-xs text-green-200">✅ Format: Markdown (.md)</p>
          </div>
        </div>
      </div>
    </div>
  );
}