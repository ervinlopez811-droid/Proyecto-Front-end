import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    listarCategoriasActivas,
    crearCategoria,
    actualizarCategoria,
    anularCategoria
} from "../services/categoriaServices";

const formInicial = {
    idCategoria: null,
    nombre: "",
    descripcion: ""
};

// Función para extraer el mensaje de error de Axios o JavaScript
const obtenerMensajeError = (error) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.mensaje ?? error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "Ocurrió un error inesperado";
};

function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [form, setForm] = useState(formInicial);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const cargarCategorias = async () => {
        try {
            const respuesta = await listarCategoriasActivas();
            setCategorias(respuesta.data);
        } catch (error) {
            console.error("Error al listar categorías", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let respuesta;
            if (modoEdicion) {
                respuesta = await actualizarCategoria(form.idCategoria, form);
            } else {
                respuesta = await crearCategoria(form);
            }
            setMensaje(respuesta.data.mensaje);
            setForm(formInicial);
            setModoEdicion(false);
            cargarCategorias();
        } catch (error) {
            console.error("Error al guardar categoría", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    const handleModificar = (categoria) => {
        setForm(categoria);
        setModoEdicion(true);
    };

    const handleAnular = async (idCategoria) => {
        const confirmar = window.confirm("¿Seguro que deseas anular esta categoría?");
        if (!confirmar) return;
        try {
            await anularCategoria(idCategoria);
            setMensaje("Categoría anulada correctamente");
            cargarCategorias();
        } catch (error) {
            console.error("Error al anular la categoría", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    // 1. Generador base de PDF
const generarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Listado de Categorías", 14, 15);
    doc.setFontSize(10);
    doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

    const columnas = ["ID", "Nombre", "Descripción"];
    const filas = categorias.map((cat) => [
        cat.idCategoria,
        cat.nombre,
        cat.descripcion || "-"
    ]);

    autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 26,
        headStyles: { fillColor: [22, 101, 52] }
    });

    return doc;
};

// 2. Ver PDF en nueva pestaña
const verPDF = () => {
    const doc = generarPDF();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
};

// 3. Descargar PDF
const descargarPDF = () => {
    const doc = generarPDF();
    doc.save("reporte_categorias.pdf");
};

// 4. Descargar Excel
const exportarExcel = async () => {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet("Categorías");

    hoja.addRow(["Listado de Categorías"]).font = { size: 16, bold: true };
    hoja.addRow(["Fecha: " + new Date().toLocaleDateString()]);
    hoja.addRow([]);

    const encabezado = hoja.addRow(["ID", "Nombre", "Descripción"]);
    encabezado.eachCell((celda) => {
        celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } };
    });

    categorias.forEach((cat) => {
        hoja.addRow([cat.idCategoria, cat.nombre, cat.descripcion || "-"]);
    });

    hoja.getColumn(1).width = 10;
    hoja.getColumn(2).width = 30;
    hoja.getColumn(3).width = 50;

    const buffer = await libro.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "reporte_categorias.xlsx";
    enlace.click();
    URL.revokeObjectURL(url);
};


    return (
        <div className=" flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-center mb-4">Ingresa y Modificar Categorías</h2>
            {mensaje && <p className=" text-center text-red-600 mb-4">{mensaje}</p>}
            <form className="flex flex-col justify-center items-center gap-y-6" onSubmit={handleSubmit}>
                <div className=" ">
                    <label className=" mx-4 font-bold" htmlFor="nombre">Nombre:</label>
                    <input className=" border-1 rounded-lg outline-none"
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className=" mx-4 font-bold " htmlFor="descripcion">Descripción:</label>
                    <input className="border-1 border-black rounded-lg outline-none"
                        type="text"
                        id="descripcion"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                    />
                </div>

                <button className="border-1 border-black rounded-xl px-4 py-2 text-black bg-blue-600
                text-white hover:scale-105 transition cursor-pointer" type="submit">Guardar</button>
            </form>

            <div className="flex justify-center gap-4 my-4">
                <button onClick={verPDF} className="border-1 border-black rounded-xl px-4 py-2 bg-sky-600 text-white hover:scale-105 transition cursor-pointer">
                    Ver en PDF
                </button>
                <button onClick={descargarPDF} className="border-1 border-black rounded-xl px-4 py-2 bg-red-600 text-white hover:scale-105 transition cursor-pointer">
                    Descargar PDF
                </button>
                <button onClick={exportarExcel} className="border-1 border-black rounded-xl px-4 py-2 bg-green-600 text-white hover:scale-105 transition cursor-pointer">
                    Descargar Excel
                </button>
            </div>

            <h2 className="my-6 text-2xl text-black text-center">Listado de Categorías</h2>
            <table>
                <thead className=" ">
                    <tr className=" text-xl  ">
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Modificar</th>
                        <th>Eliminar</th>
                    </tr>
                </thead>
                <tbody className=" justify-center items-center text-center">
                    {categorias.map((categoria) => (
                        <tr className="" key={categoria.idCategoria}>
                            <td>{categoria.nombre}</td>
                            <td>{categoria.descripcion}</td>
                            <td>
                                <button className="border-1 border-black rounded-xl px-4 py-2 text-black bg-orange-600
                text-white hover:scale-105 transition cursor-pointer my-2" onClick={() => handleModificar(categoria)}>
                                    Modificar
                                </button>
                            </td>
                            <td className="">
                                <button className="border-1 border-black rounded-xl px-4 py-2 text-black bg-red-800
                text-white hover:scale-105 transition cursor-pointer my-2" onClick={() => handleAnular(categoria.idCategoria)}>
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

export default Categorias;