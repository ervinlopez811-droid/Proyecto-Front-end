import api from "../api/axios";
export const listarCategoriasActivas = () => api.get('/categorias/mostrarActivos');
export const crearCategoria = (data) => api.post('/categorias', data);
export const actualizarCategoria = (id, data) => api.put(`/categorias/${id}`, data);
export const anularCategoria = (id) => api.put(`/categorias/anular/${id}`);
