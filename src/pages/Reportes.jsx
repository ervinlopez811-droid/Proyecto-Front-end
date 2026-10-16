import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
    obtenerProductos, 
    obtenerCategorias, 
    obtenerProductosPorNombre, 
    obtenerCategoriasPorNombre 
} from "../services/reporteServices";
import { listarClientesActivos } from "../services/clienteServices";
import { listarPedidosActivos, listarPedidoDetalles } from "../services/pedidoServices";

function Reportes() {
    const [filtroCat, setFiltroCat] = useState("");
    const [filtroProd, setFiltroProd] = useState("");
    const [mostrarInputCat, setMostrarInputCat] = useState(false);
    const [mostrarInputProd, setMostrarInputProd] = useState(false);
    const [mensaje, setMensaje] = useState("");

    // --- 1. Reporte Productos PDF ---
    const generarReporteProductos = async () => {
        try {
            const res = await obtenerProductos();
            const productos = res.data || [];

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text("Reporte General de Productos", 14, 15);
            doc.setFontSize(10);
            doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

            const columnas = ["ID", "Nombre", "Descripción", "Precio", "Stock"];
            const filas = productos.map(p => [
                p.idProducto, 
                p.nombre, 
                p.descripcion || "-", 
                `Q${p.precio}`, 
                p.stock
            ]);

            autoTable(doc, { head: [columnas], body: filas, startY: 26 });
            doc.save("reporte_productos.pdf");
            setMensaje("Reporte de Productos generado con éxito.");
        } catch (error) {
            console.error(error);
            setMensaje("Error al generar el reporte de productos.");
        }
    };

    // --- 2. Reporte Categorías PDF ---
    const generarReporteCategorias = async () => {
        try {
            const res = await obtenerCategorias();
            const categorias = res.data || [];

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text("Reporte General de Categorías", 14, 15);
            doc.setFontSize(10);
            doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

            const columnas = ["ID", "Nombre", "Descripción"];
            const filas = categorias.map(c => [
                c.idCategoria, 
                c.nombre, 
                c.descripcion || "-"
            ]);

            autoTable(doc, { head: [columnas], body: filas, startY: 26 });
            doc.save("reporte_categorias.pdf");
            setMensaje("Reporte de Categorías generado con éxito.");
        } catch (error) {
            console.error(error);
            setMensaje("Error al generar el reporte de categorías.");
        }
    };

    // --- 3. Filtro Categorías ---
    const ejecutarFiltroCategorias = async () => {
        try {
            const res = await obtenerCategoriasPorNombre(filtroCat);
            const categorias = res.data || [];

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`Reporte Categorías - Filtro: "${filtroCat}"`, 14, 15);
            doc.setFontSize(10);
            doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

            const columnas = ["ID", "Nombre", "Descripción"];
            const filas = categorias.map(c => [c.idCategoria, c.nombre, c.descripcion || "-"]);

            autoTable(doc, { head: [columnas], body: filas, startY: 26 });
            doc.save(`categorias_filtro_${filtroCat || "todas"}.pdf`);
            setMensaje("Reporte filtrado de Categorías generado.");
        } catch (error) {
            console.error(error);
            setMensaje("Error al aplicar filtro en categorías.");
        }
    };

    // --- 4. Filtro Productos ---
    const ejecutarFiltroProductos = async () => {
        try {
            const res = await obtenerProductosPorNombre(filtroProd);
            const productos = res.data || [];

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(`Reporte Productos - Filtro: "${filtroProd}"`, 14, 15);
            doc.setFontSize(10);
            doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

            const columnas = ["ID", "Nombre", "Descripción", "Precio", "Stock"];
            const filas = productos.map(p => [p.idProducto, p.nombre, p.descripcion || "-", `Q${p.precio}`, p.stock]);

            autoTable(doc, { head: [columnas], body: filas, startY: 26 });
            doc.save(`productos_filtro_${filtroProd || "todos"}.pdf`);
            setMensaje("Reporte filtrado de Productos generado.");
        } catch (error) {
            console.error(error);
            setMensaje("Error al aplicar filtro en productos.");
        }
    };

    // --- 5. Reporte Producto Categoría (Productos y Categorías a PDF) ---
    const generarProductosYCategoriasPDF = async () => {
        try {
            const resProd = await obtenerProductos();
            const resCat = await obtenerCategorias();

            const productos = resProd.data || [];
            const categorias = resCat.data || [];

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text("Reporte Unificado: Categorías y Productos", 14, 15);
            doc.setFontSize(12);
            doc.text("Listado de Categorías", 14, 24);

            const colCat = ["ID", "Nombre", "Descripción"];
            const filCat = categorias.map(c => [c.idCategoria, c.nombre, c.descripcion || "-"]);

            autoTable(doc, { head: [colCat], body: filCat, startY: 28 });

            const posFinalTablaCat = doc.lastAutoTable.finalY + 12;
            doc.text("Listado de Productos", 14, posFinalTablaCat);

            const colProd = ["ID", "Nombre", "Precio", "Stock"];
            const filProd = productos.map(p => [p.idProducto, p.nombre, `Q${p.precio}`, p.stock]);

            autoTable(doc, { head: [colProd], body: filProd, startY: posFinalTablaCat + 4 });

            doc.save("Reporte_Producto_Categoria.pdf");
            setMensaje("Reporte 'Producto Categoría' generado con éxito.");
        } catch (error) {
            console.error(error);
            setMensaje("Error al generar el reporte unificado.");
        }
    };

    // --- 6. NUEVO: Reporte Pedido Cliente (Fecha Pedido, Nombre Cliente) ---
    const generarReportePedidoCliente = async () => {
        try {
            const resPed = await listarPedidosActivos();
            const resCli = await listarClientesActivos();

            const pedidos = resPed.data || [];
            const clientes = resCli.data || [];

            const mapaClientes = new Map(clientes.map(c => [c.idCliente, `${c.nombre} ${c.apellido}`]));

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text("Reporte: Pedido - Cliente", 14, 15);
            doc.setFontSize(10);
            doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

            const columnas = ["ID Pedido", "Fecha Pedido", "Nombre Cliente", "Total"];
            const filas = pedidos.map(p => [
                p.idPedido,
                p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString() : "-",
                mapaClientes.get(p.idCliente) || `Cliente #${p.idCliente}`,
                `Q${p.total || 0}`
            ]);

            autoTable(doc, { 
                head: [columnas], 
                body: filas, 
                startY: 26,
                headStyles: { fillColor: [79, 70, 229] }
            });

            doc.save("Reporte_Pedido_Cliente.pdf");
            setMensaje("Reporte 'Pedido Cliente' generado con éxito.");
        } catch (error) {
            console.error("Error al generar reporte", error);
            setMensaje("Error al generar el reporte de Pedido Cliente.");
        }
    };

// --- 7. Reporte Pedido Cliente Detalle (Cumpliendo todas las columnas exactas) ---
    const generarReportePedidoClienteDetalle = async () => {
        try {
            const [resPed, resCli, resProd, resDet] = await Promise.all([
                listarPedidosActivos(),
                listarClientesActivos(),
                obtenerProductos(),
                listarPedidoDetalles()
            ]);

            const pedidos = resPed.data || [];
            const clientes = resCli.data || [];
            const productos = resProd.data || [];
            const detalles = resDet.data || [];

            // Mapas para unir las 4 tablas: Pedido, cliente, producto, pedido_detalle
            const mapaPedidos = new Map(pedidos.map(p => [p.idPedido, p]));
            const mapaClientes = new Map(clientes.map(c => [c.idCliente, `${c.nombre} ${c.apellido}`]));
            const mapaProductos = new Map(productos.map(p => [p.idProducto, p]));

            const doc = new jsPDF({ orientation: "landscape" }); // Horizontal para acomodar las 7 columnas cómodamente
            doc.setFontSize(16);
            doc.text("Reporte Pedido Cliente Detalle", 14, 15);
            doc.setFontSize(10);
            doc.text("Fecha de generación: " + new Date().toLocaleDateString(), 14, 22);

            // Las 7 columnas requeridas por la guía
            const columnas = [
                "Fecha Pedido", 
                "Nombre Cliente", 
                "Nombre Producto", 
                "Cantidad Pedido", 
                "Precio", 
                "Precio Unitario", 
                "SubTotal"
            ];

            const filas = detalles.map(det => {
                const pedido = mapaPedidos.get(det.idPedido) || {};
                const productoObj = mapaProductos.get(det.idProducto) || {};

                return [
                    pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleDateString() : "-",
                    mapaClientes.get(pedido.idCliente) || "Desconocido",
                    productoObj.nombre || `Producto #${det.idProducto}`,
                    det.cantidad,
                    `Q${productoObj.precio || 0}`, // Precio original del producto
                    `Q${det.precioUnitario || 0}`, // Precio unitario de la venta
                    `Q${det.subtotal || 0}`        // SubTotal
                ];
            });

            autoTable(doc, { 
                head: [columnas], 
                body: filas, 
                startY: 26,
                headStyles: { fillColor: [16, 185, 129] }
            });

            doc.save("Reporte_Pedido_Cliente_Detalle.pdf");
            setMensaje("Reporte 'Pedido Cliente Detalle' generado con éxito.");
        } catch (error) {
            console.error("Error al generar reporte", error);
            setMensaje("Error al generar el reporte detallado de pedidos.");
        }
    };

    return (
        <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-center mb-6">Reportes</h2>

            {mensaje && <p className="text-center text-blue-600 mb-4">{mensaje}</p>}

            {/* Botonera Completa (Todos los botones anteriores + los 2 nuevos) */}
            <div className="flex justify-center flex-wrap gap-4 my-4">
                <button 
                    onClick={generarReporteProductos} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-sky-600 text-white hover:scale-105 transition cursor-pointer"
                >
                    Reporte Productos PDF
                </button>

                <button 
                    onClick={generarReporteCategorias} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-sky-600 text-white hover:scale-105 transition cursor-pointer"
                >
                    Reporte Categorías PDF
                </button>

                <button 
                    onClick={() => {
                        setMostrarInputCat(!mostrarInputCat);
                        setMostrarInputProd(false);
                    }} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-indigo-600 text-white hover:scale-105 transition cursor-pointer"
                >
                    Filtro Categorías
                </button>

                <button 
                    onClick={() => {
                        setMostrarInputProd(!mostrarInputProd);
                        setMostrarInputCat(false);
                    }} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-indigo-600 text-white hover:scale-105 transition cursor-pointer"
                >
                    Filtro Productos
                </button>

                <button 
                    onClick={generarProductosYCategoriasPDF} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-green-600 text-white hover:scale-105 transition cursor-pointer"
                >
                    Reporte Producto Categoría
                </button>

                {/* --- BOTONES NUEVOS AGREGADOS --- */}
                <button 
                    onClick={generarReportePedidoCliente} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-purple-600 text-white hover:scale-105 transition cursor-pointer"
                >
                    Reporte Pedido Cliente
                </button>

                <button 
                    onClick={generarReportePedidoClienteDetalle} 
                    className="border-1 border-black rounded-xl px-4 py-2 bg-emerald-700 text-white hover:scale-105 transition cursor-pointer"
                >
                    Reporte Pedido Cliente Detalle
                </button>
            </div>

            {/* Input emergente para Filtro Categorías */}
            {mostrarInputCat && (
                <div className="flex justify-center items-center gap-x-4 my-4">
                    <input
                        type="text"
                        placeholder="Buscar categoría..."
                        value={filtroCat}
                        onChange={(e) => setFiltroCat(e.target.value)}
                        className="border-1 border-black rounded-lg outline-none px-3 py-1 bg-white"
                    />
                    <button
                        onClick={ejecutarFiltroCategorias}
                        className="border-1 border-black rounded-xl px-4 py-2 bg-indigo-600 text-white hover:scale-105 transition cursor-pointer"
                    >
                        Descargar PDF
                    </button>
                </div>
            )}

            {/* Input emergente para Filtro Productos */}
            {mostrarInputProd && (
                <div className="flex justify-center items-center gap-x-4 my-4">
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={filtroProd}
                        onChange={(e) => setFiltroProd(e.target.value)}
                        className="border-1 border-black rounded-lg outline-none px-3 py-1 bg-white"
                    />
                    <button
                        onClick={ejecutarFiltroProductos}
                        className="border-1 border-black rounded-xl px-4 py-2 bg-indigo-600 text-white hover:scale-105 transition cursor-pointer"
                    >
                        Descargar PDF
                    </button>
                </div>
            )}
        </div>
    );
}

export default Reportes;