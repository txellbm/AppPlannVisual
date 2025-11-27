import Layout from "./Layout.jsx";
import Planning from "./Planning";
import Documentacio from "./Documentacio";
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

export default function Pages() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Planning />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/documentacio" element={<Documentacio />} />
          {/* Redirect any other path to the root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
