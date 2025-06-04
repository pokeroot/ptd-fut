import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import GestionEquipoPage from './pages/GestionEquipoPage';
import CrearEstrategiaPage from './pages/CrearEstrategiaPage';
import MisEstrategiasPage from './pages/MisEstrategiasPage';
import EstrategiasEquipoPage from './pages/EstrategiasEquipoPage';
// Placeholder for DashboardPage - to be created later
// import DashboardPage from './pages/DashboardPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rutas Privadas */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/gestion-equipo" element={<GestionEquipoPage />} />
              <Route path="/crear-estrategia/:estrategiaId?" element={<CrearEstrategiaPage />} />
              <Route path="/mis-estrategias" element={<MisEstrategiasPage />} />
              <Route path="/estrategias-equipo" element={<EstrategiasEquipoPage />} />
              <Route path="/visualizar-estrategia/:estrategiaId" element={<CrearEstrategiaPage />} />
              {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
              {/* Más rutas privadas aquí, ej: /crear-estrategia, /mis-estrategias, etc. */}
            </Route>

            {/* Ruta para página no encontrada - opcional */}
            {/* <Route path="*" element={<div>404 - Página No Encontrada</div>} /> */}
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;
