import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

// Importiamo le nostre pagine "segnaposto"
import Home from './components/Home';
import Login from './components/Login';
import Game from './components/Game';
import Ranking from './components/Ranking';
import Navigation from './components/Navigation';
// 🛡️ COMPONENTE PROTETTORE (Il "Buttafuori")
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
      return <div>Caricamento in corso...</div>;
  }

  if (!user) {
      return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Navigation />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/game" element={
          <ProtectedRoute>
            <Game />
          </ProtectedRoute>
        } />
        
        <Route path="/ranking" element={
          <ProtectedRoute>
            <Ranking />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}