import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    listarClientesActivos,
    crearCliente,
    actualizarCliente,
    anularCliente
} from "../services/clienteServices";

const formInicial = {
    idCliente: null,
    nombre: "",
    apellido: "",
    email: "",
    telefono: ""
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

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [form, setForm] = useState(formInicial);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const cargarClientes = async () => {
    try {
        const respuesta = await listarClientesActivos();
        
        // Se invierte el arreglo devuelto por la API para que los elementos más recientes aparezcan al inicio
        const datosInvertidos = (respuesta.data || []).reverse();
        setClientes(datosInvertidos);
    } catch (error) {
        console.error("Error al listar clientes", error);
        setMensaje(obtenerMensajeError(error));
    }
};

    useEffect(() => {
        cargarClientes();
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
            // Estructura adaptada al ClienteDTO exigido por Spring Boot
            const payload = {
                idCliente: form.idCliente,
                nombre: form.nombre,
                apellido: form.apellido,
                email: form.email,
                telefono: form.telefono,
                telefono33: form.telefono, // Soporte para sufijo 33
                estado: true // Garantiza que se guarde activo en la BD
            };

            let respuesta;
            if (modoEdicion) {
                respuesta = await actualizarCliente(form.idCliente, payload);
            } else {
                respuesta = await crearCliente(payload);
            }

            setMensaje(respuesta.data?.mensaje || "Operación realizada con éxito");
            setForm(formInicial);
            setModoEdicion(false);
            cargarClientes(); // Recarga la lista inmediatamente
        } catch (error) {
            console.error("Error al guardar cliente", error);
            setMensaje(obtenerMensajeError(error));
        }
    };

    const handleModificar = (cliente) => {
        setForm({
            idCliente: cliente.idCliente,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            email: cliente.email || "",
            telefono: cliente.telefono || cliente.telefono33 || ""
        });
        setModoEdicion(true);
    };

    const handleAnular = async (cliente) => {
        const confirmar = window.confirm("¿Seguro que deseas anular este cliente?");
        if (!confirmar) return;
        try {
            // Se envía el objeto del cliente con estado: false para cumplir con @RequestBody ClienteDTO
            const payload = { ...cliente, estado: false };
            const respuesta = await anularCliente(cliente.idCliente, payload);
            setMensaje(respuesta.data?.mensaje || "Cliente anulado con éxito");
            cargarClientes();
        } catch (error) {
            console.error("Error al anular el cliente", error);
            setMensaje(obtenerMensajeError(error));
        }
    };
    

    const generarPDFClientes = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Listado de Clientes", 14, 15);
        doc.setFontSize(10);
        doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 22);

        const columnas = ["Nombre", "Apellido", "Email", "Teléfono"];
        const filas = clientes.map((cli) => [
            cli.nombre,
            cli.apellido,
            cli.email || "-",
            cli.telefono || cli.telefono33 || "-"
        ]);

        autoTable(doc, {
            head: [columnas],
            body: filas,
            startY: 26,
            headStyles: { fillColor: [30, 58, 138] }
        });

        return doc;
    };

    const verPDFClientes = () => {
        const url = generarPDFClientes().output("bloburl");
        window.open(url, "_blank");
    };

    const descargarPDFClientes = () => {
        generarPDFClientes().save("reporte_clientes.pdf");
    };

    const exportarExcelClientes = async () => {
        const libro = new ExcelJS.Workbook();
        const hoja = libro.addWorksheet("Clientes");

        hoja.addRow(["Listado de Clientes"]).font = { size: 16, bold: true };
        hoja.addRow(["Fecha: " + new Date().toLocaleDateString()]);
        hoja.addRow([]);

        const encabezado = hoja.addRow(["Nombre", "Apellido", "Email", "Teléfono"]);
        encabezado.eachCell((celda) => {
            celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
            celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        });

        clientes.forEach((cli) => {
            hoja.addRow([cli.nombre, cli.apellido, cli.email || "-", cli.telefono || cli.telefono33 || "-"]);
        });

        hoja.getColumn(1).width = 25;
        hoja.getColumn(2).width = 25;
        hoja.getColumn(3).width = 35;
        hoja.getColumn(4).width = 20;

        const buffer = await libro.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "reporte_clientes.xlsx";
        enlace.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-center mb-4">
                {modoEdicion ? "Modificar Cliente" : "Ingresar Clientes"}
            </h2>

            {mensaje && <p className="text-center text-red-600 mb-4">{mensaje}</p>}

            <form className="flex flex-col justify-center items-center gap-y-4" onSubmit={handleSubmit}>
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
                    <label className="mx-4 font-bold" htmlFor="apellido">Apellido:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="text"
                        id="apellido"
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="mx-4 font-bold" htmlFor="email">Email:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="mx-4 font-bold" htmlFor="telefono">Teléfono:</label>
                    <input
                        className="border-1 border-black rounded-lg outline-none px-2 py-1"
                        type="text"
                        id="telefono"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                    />
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
                    <button onClick={verPDFClientes} className="border-1 border-black rounded-xl px-4 py-2 bg-sky-600 text-white hover:scale-105 transition cursor-pointer">
                        Ver en PDF
                    </button>
                    <button onClick={descargarPDFClientes} className="border-1 border-black rounded-xl px-4 py-2 bg-red-600 text-white hover:scale-105 transition cursor-pointer">
                        Descargar PDF
                    </button>
                    <button onClick={exportarExcelClientes} className="border-1 border-black rounded-xl px-4 py-2 bg-green-600 text-white hover:scale-105 transition cursor-pointer">
                        Descargar Excel
                    </button>
                </div>

            </form>

            <h2 className="my-6 text-2xl text-black text-center">Listado de Clientes</h2>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-xl">
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Modificar</th>
                        <th>Eliminar</th>
                    </tr>
                </thead>
                <tbody className="justify-center items-center text-center">
                    {clientes.map((cliente) => (
                        <tr key={cliente.idCliente}>
                            <td>{cliente.nombre}</td>
                            <td>{cliente.apellido}</td>
                            <td>{cliente.email || "-"}</td>
                            <td>{cliente.telefono || cliente.telefono33 || "-"}</td>
                            <td>
                                <button
                                    className="border-1 border-black rounded-xl px-4 py-2 bg-orange-600 text-white hover:scale-105 transition cursor-pointer my-2"
                                    onClick={() => handleModificar(cliente)}
                                >
                                    Modificar
                                </button>
                            </td>
                            <td>
                                <button
                                    className="border-1 border-black rounded-xl px-4 py-2 bg-red-800 text-white hover:scale-105 transition cursor-pointer my-2"
                                    onClick={() => handleAnular(cliente)}
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

export default Clientes;