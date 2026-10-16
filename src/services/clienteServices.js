import api from "../api/axios";

export const listarClientesActivos = () => api.get('/clientes/mostrarActivos');
export const crearCliente = (data) => api.post('/clientes', data);
export const actualizarCliente = (id, data) => api.put(`/clientes/${id}`, data);
export const anularCliente = (id) => api.put(`/clientes/anular/${id}`, {});