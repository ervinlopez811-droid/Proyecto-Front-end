import api from "../api/axios";

// Peticiones para Reportes
export const obtenerProductos = () => api.get('/productos/mostrarActivos');
export const obtenerCategorias = () => api.get('/categorias/mostrarActivos');

// Endpoints con Filtros (según ProductoController y CategoríaController)
export const obtenerProductosPorNombre = (nombre) => 
    api.get(`/productos/mostrarActivosFiltro?nombre=${nombre}`);

export const obtenerCategoriasPorNombre = (nombre) => 
    api.get(`/categorias/mostrarActivosFiltro?nombre=${nombre}`);