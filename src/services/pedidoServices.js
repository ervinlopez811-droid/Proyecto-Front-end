import api from "../api/axios";

export const listarPedidosActivos = () => api.get('/pedidos/mostrarActivos');
export const listarPedidoDetalles = () => api.get('/pedido-detalles');