import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import PagePrincipale from './pages/page_principale';
import { Login } from './pages/Login';
import MesEmplois from './pages/MesEmplois';
import Ia from './pages/Ia';
import Profil from './pages/Profil';
import Parametres from './pages/Parametres';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PagePrincipale />} />
      <Route path="/decouvrir" element={<Navigate to="/" replace />} />
      <Route path="/mes-emplois" element={<MesEmplois />} />
      <Route path="/ia" element={<Ia />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/profil" element={<Profil />} />
      <Route path="/parametres" element={<Parametres />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/login" element={<Login mode="login" />} />
      <Route path="/register" element={<Login mode="register" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
