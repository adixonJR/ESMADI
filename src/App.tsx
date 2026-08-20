import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import supabase from "./lib/supabase.js";

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
import Login from "./conponents/Login";

//////////////////// NOTIFICACIONES //////////////////////

import { pedirPermisoNotificaciones } from "./utils/notificaciones";

//////////////////// FECHAS //////////////////////

import SanValentin from "./fechas/SanValentin";
import Aniversario from "./fechas/Aniversario";

//////////////////// PAGES //////////////////////

import Inicio from "./pages/inicio";
import Juegos from "./pages/juegos";
import Chispa from "./pages/chispa";
import Progreso from "./pages/progreso";
import Nosotros from "./pages/nosotros";
import Fechas from "./pages/fechas";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Revisa si ya existe una sesión guardada (localStorage) al montar la app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionChecked(true);
    });

    // Escucha cambios de sesión: login, logout, refresh de token
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Solicita permiso para enviar notificaciones
  useEffect(() => {
    pedirPermisoNotificaciones();
  }, []);

  // Solo navega cuando la animación de carga terminó Y ya sabemos si hay sesión.
  // Esto evita el bug de que LoadingScreen termine antes de que Supabase
  // responda, lo que siempre mandaba al login aunque hubiera sesión guardada.
  useEffect(() => {
    if (loading || !sessionChecked) return;

    const enLogin = location.pathname.toLowerCase() === "/login";

    if (session && enLogin) {
      navigate("/"); // ya logueado pero está en /Login -> lo saca de ahí
    } else if (!session && !enLogin) {
      navigate("/Login"); // sin sesión y no está en /Login -> lo manda ahí
    }
  }, [loading, sessionChecked, session, location.pathname, navigate]);

  // La pantalla de carga solo controla la animación; ya NO decide a dónde navegar
  if (loading || !sessionChecked) {
    return <LoadingScreen onFinish={() => setLoading(false)} soundEnabled />;
  }

  // Rutas donde NO se mostrará el footer
  const rutasSinFooter = ["/album", "/juegos/chispa", "/Login"];

  // Rutas donde NO se mostrará el navbar
  const rutasSinNavbar = ["/Login"];

  const ocultarFooter = rutasSinFooter.some((ruta) =>
    location.pathname.toLowerCase().startsWith(ruta.toLowerCase())
  );

  const ocultarNavbar = rutasSinNavbar.some((ruta) =>
    location.pathname.toLowerCase().startsWith(ruta.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1a0f2e] text-white">
      {!ocultarNavbar && <Navbar />}

      <main className={ocultarNavbar ? "pb-24" : "pt-16 pb-24"}>
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
          <Route path="/AgregarMomento" element={<AgregarMomento />} />
          <Route path="/Login" element={<Login />} />
        </Routes>
      </main>

      {!ocultarFooter && <Footer />}
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