import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

//////////////////// COMPONENTES //////////////////////

import Navbar from "./conponents/navbar";
import Footer from "./conponents/footer";
import Metas from "./conponents/metas";
import Timeline from "./conponents/timeline";
import Album from "./conponents/album";
import Perfil from "./conponents/perfil";
import Cartas from "./conponents/cartas";

//////////////////// PAGES //////////////////////

import Inicio from "./pages/inicio";
import Juegos from "./pages/juegos";
import Chispa from "./pages/chispa";
import Progreso from "./pages/progreso";
import Nosotros from "./pages/nosotros";

function AppContent() {
  const location = useLocation();

  // Rutas donde NO se mostrará el footer
  const rutasSinFooter = ["/album", "/juegos/chispa"];

  const ocultarFooter = rutasSinFooter.some((ruta) =>
    location.pathname.startsWith(ruta)
  );

  const enJuego = location.pathname.startsWith("/juegos/chispa");

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
        </Routes>
      </main>

      {!ocultarFooter && <Footer enJuego={enJuego} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;