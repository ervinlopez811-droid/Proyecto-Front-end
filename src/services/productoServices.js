import api from "../api/axios";

export const listarProductosActivos = () => api.get('/productos/mostrarActivos');
export const crearProducto = (data) => api.post('/productos', data);
export const actualizarProducto = (id, data) => api.put(`/productos/${id}`, data);
export const anularProducto = (id, data) => api.put(`/productos/anular/${id}`, data);