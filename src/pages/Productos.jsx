import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    listarProductosActivos,
    crearProducto,
    actualizarProducto,
    anularProducto
} from "../services/productoServices";
import { listarCategoriasActivas } from "../services/categoriaServices";

const formInicial = {
    idProducto: null,
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    idCategoria: ""
};

const obtenerMensajeError = (error) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.mensaje ?? error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "Ocurrió un error inesperado";
};

function Productos() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [form, setForm] = useState(formInicial);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const cargarDatos = async () => {
        try {
            const resProd = await listarProductosActivos();
            
            // Invierte el arreglo para que el último producto creado aparezca de primero
            const listaInvertida = [...(resProd.data || [])].reverse();
            setProductos(listaInvertida);

            const resCat = await listarCategoriasActivas();
            setCategorias(resCat.data || []);
        } catch (error) {
            console.error("Error al cargar datos", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancelarEdicion = () => {
        setForm(formInicial);
        setModoEdicion(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const idCatNum = parseInt(form.idCategoria, 10);

            // Estructura de datos alineada con ProductoDTO
            const payload = {
                idProducto: form.idProducto,
                nombre: form.nombre,
                descripcion: form.descripcion,
                precio: parseFloat(form.precio) || 0,
                stock: parseInt(form.stock, 10) || 0,
                idCategoria: idCatNum
            };

            if (modoEdicion) {
                const respuesta = await actualizarProducto(form.idProducto, payload);
                setMensaje(respuesta.data?.mensaje || "Producto actualizado con éxito");
            } else {
                // Tu controller en Spring Boot responde con el DTO creado
                await crearProducto(payload);
                setMensaje("Producto creado con éxito");
            }

            setForm(formInicial);
            setModoEdicion(false);
            cargarDatos();
        } catch (error) {
            console.error("Error al guardar producto", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    const handleModificar = (producto) => {
        setForm({
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            descripcion: producto.descripcion || "",
            precio: producto.precio,
            stock: producto.stock,
            idCategoria: producto.idCategoria || ""
        });
        setModoEdicion(true);
    };

    const handleAnular = async (producto) => {
        const confirmar = window.confirm("¿Seguro que deseas anular este producto?");
        if (!confirmar) return;
        try {
            // Se envía el objeto del producto marcando estado false para cumplir con @RequestBody
            const payload = { ...producto, estado: false };
            const respuesta = await anularProducto(producto.idProducto, payload);
            setMensaje(respuesta.data?.mensaje || "Producto anulado con éxito");
            cargarDatos();
        } catch (error) {
            console.error("Error al anular el producto", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    const generarPDFProductos = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Listado de Productos", 14, 15);
        doc.setFontSize(10);
        doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

        const columnas = ["Nombre", "Descripción", "Precio", "Stock"];
        const filas = productos.map((prod) => [
            prod.nombre,
            prod.descripcion || "-",
            `Q${prod.precio}`,
            prod.stock
        ]);

        autoTable(doc, {
            head: [columnas],
            body: filas,
            startY: 26,
            headStyles: { fillColor: [180, 83, 9] }
        });

        return doc;
    };

    const verPDFProductos = () => {
        const url = generarPDFProductos().output("bloburl");
        window.open(url, "_blank");
    };

    const descargarPDFProductos = () => {
        generarPDFProductos().save("reporte_productos.pdf");
    };

    const exportarExcelProductos = async () => {
        const libro = new ExcelJS.Workbook();
        const hoja = libro.addWorksheet("Productos");

        hoja.addRow(["Listado de Productos"]).font = { size: 16, bold: true };
        hoja.addRow(["Fecha: " + new Date().toLocaleDateString()]);
        hoja.addRow([]);

        const encabezado = hoja.addRow(["Nombre", "Descripción", "Precio", "Stock"]);
        encabezado.eachCell((celda) => {
            celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
            celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
        });

        productos.forEach((prod) => {
            hoja.addRow([prod.nombre, prod.descripcion || "-", prod.precio, prod.stock]);
        });

        hoja.getColumn(1).width = 30;
        hoja.getColumn(2).width = 40;
        hoja.getColumn(3).width = 15;
        hoja.getColumn(4).width = 15;

        const buffer = await libro.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "reporte_productos.xlsx";
        enlace.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-center mb-4">
                {modoEdicion ? "Modificar Producto" : "Ingresa y Modificar Productos"}
            </h2>

            {mensaje && <p className="text-center text-red-600 mb-4">{mensaje}</p>}

            <form className="flex flex-col justify-center items-center gap-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="mx-4 font-bold" htmlFor="nombre">Nombre:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="mx-4 font-bold" htmlFor="descripcion">Descripción:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="text"
                        id="descripcion"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="mx-4 font-bold" htmlFor="precio">Precio:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="number"
                        step="0.01"
                        id="precio"
                        name="precio"
                        value={form.precio}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="mx-4 font-bold" htmlFor="stock">Stock:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="number"
                        id="stock"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="mx-4 font-bold" htmlFor="idCategoria">Categoría:</label>
                    <select
                        className="border-1 border-black rounded-lg outline-none px-2 py-1 bg-white"
                        id="idCategoria"
                        name="idCategoria"
                        value={form.idCategoria}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Seleccione una categoría</option>
                        {categorias.map((cat) => (
                            <option key={cat.idCategoria} value={cat.idCategoria}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-x-4">
                    <button
                        className="border-1 border-black rounded-xl px-4 py-2 bg-blue-600 text-white hover:scale-105 transition cursor-pointer"
                        type="submit"
                    >
                        {modoEdicion ? "Actualizar" : "Guardar"}
                    </button>

                    {modoEdicion && (
                        <button
                            type="button"
                            onClick={handleCancelarEdicion}
                            className="border-1 border-black rounded-xl px-4 py-2 bg-gray-600 text-white hover:scale-105 transition cursor-pointer"
                        >
                            Cancelar
                        </button>
                    )}
                </div>

                <div className="flex justify-center gap-4 my-4">
                    <button onClick={verPDFProductos} className="border-1 border-black rounded-xl px-4 py-2 bg-sky-600 text-white hover:scale-105 transition cursor-pointer">
                        Ver en PDF
                    </button>
                    <button onClick={descargarPDFProductos} className="border-1 border-black rounded-xl px-4 py-2 bg-red-600 text-white hover:scale-105 transition cursor-pointer">
                        Descargar PDF
                    </button>
                    <button onClick={exportarExcelProductos} className="border-1 border-black rounded-xl px-4 py-2 bg-green-600 text-white hover:scale-105 transition cursor-pointer">
                        Descargar Excel
                    </button>
                </div>

            </form>

            <h2 className="my-6 text-2xl text-black text-center">Listado de Productos</h2>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-xl">
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Modificar</th>
                        <th>Eliminar</th>
                    </tr>
                </thead>
                <tbody className="justify-center items-center text-center">
                    {productos.map((prod) => (
                        <tr key={prod.idProducto}>
                            <td>{prod.nombre}</td>
                            <td>{prod.descripcion || "-"}</td>
                            <td>Q{prod.precio}</td>
                            <td>{prod.stock}</td>
                            <td>
                                <button
                                    className="border-1 border-black rounded-xl px-4 py-2 bg-orange-600 text-white hover:scale-105 transition cursor-pointer my-2"
                                    onClick={() => handleModificar(prod)}
                                >
                                    Modificar
                                </button>
                            </td>
                            <td>
                                <button
                                    className="border-1 border-black rounded-xl px-4 py-2 bg-red-800 text-white hover:scale-105 transition cursor-pointer my-2"
                                    onClick={() => handleAnular(prod)}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Productos;