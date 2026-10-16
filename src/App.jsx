import { Routes, Route, Link, useLocation } from "react-router-dom";
import Categorias from "./pages/Categorias";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Reportes from "./pages/Reportes"; // Importación del nuevo componente de reportes

function App() {
  const location = useLocation();

  // Función para resaltar el enlace activo
  const getLinkClass = (path) => {
    const isActive = location.pathname === path || (path === "/categorias" && location.pathname === "/");
    return `px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
      isActive
        ? "bg-blue-700 text-white shadow-sm"
        : "text-blue-100 hover:bg-blue-500 hover:text-white"
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900 flex flex-col ">
      {/* Header y Navegación */}
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-wide">
            Punto de Venta
          </h1>
          <nav className="flex items-center space-x-2">
            <Link to="/categorias" className={getLinkClass("/categorias")}>
              Categorías
            </Link>
            <Link to="/clientes" className={getLinkClass("/clientes")}>
              Clientes
            </Link>
            <Link to="/productos" className={getLinkClass("/productos")}>
              Productos
            </Link>
            <Link to="/reportes" className={getLinkClass("/reportes")}>
              Reportes
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/" element={<Categorias />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;