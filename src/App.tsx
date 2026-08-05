import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";


//////////////////// COMPONENTES //////////////////////

import Navbar from "./conponents/navbar";
import Footer from "./conponents/footer";
import Metas from "./conponents/metas";
import Timeline from "./conponents/timeline";
import Album from "./conponents/album";
import Perfil from "./conponents/perfil";
import Cartas from "./conponents/cartas";
import LoadingScreen from "./conponents/loading";
import Playlist from "./conponents/Playlist";
import CapsulaDelTiempo from "./conponents/CapsulaDelTiempo";
import Floo from "./conponents/floo";
import AgregarMomento from "./conponents/AgregarMomento";

//////////////////// FECHAS //////////////////////

import SanValentin from "./fechas/SanValentin";
import Aniversario from "./fechas/Aniversario"

//////////////////// PAGES //////////////////////

import Inicio from "./pages/inicio";
import Juegos from "./pages/juegos";
import Chispa from "./pages/chispa";
import Progreso from "./pages/progreso";
import Nosotros from "./pages/nosotros";
import Fechas from "./pages/fechas";

function AppContent() {
  const location = useLocation();

  // Rutas donde NO se mostrará el footer
  const rutasSinFooter = ["/album", "/juegos/chispa"];

  const ocultarFooter = rutasSinFooter.some((ruta) =>
    location.pathname.startsWith(ruta)
  );

  return (
    <div className="min-h-screen bg-[#1a0f2e] text-white">
      <Navbar />

      <main className="pt-16 pb-24">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/juegos" element={<Juegos />} />
          <Route path="/juegos/chispa" element={<Chispa />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/album" element={<Album />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/cartas" element={<Cartas />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/capsula-del-tiempo" element={<CapsulaDelTiempo />} />
          <Route path="/fechas" element={<Fechas />} />
          <Route path="/SanValentin" element={<SanValentin />} />
          <Route path="/Aniversario" element={<Aniversario />} />
          <Route path="/floo" element={<Floo />} />
          <Route path="/AgregarMomento" element={<AgregarMomento/>} />
          
          
        </Routes>
      </main>

      {!ocultarFooter && <Footer />}
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <LoadingScreen onFinish={() => setLoading(false)} soundEnabled />
    );
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;