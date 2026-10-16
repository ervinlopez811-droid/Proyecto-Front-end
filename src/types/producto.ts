export interface Producto {
  idProducto: number | null;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  idCategoria: number | null;
  estado?: boolean;
  categoria?: {
    idCategoria: number;
    nombre?: string;
    descripcion?: string;
  };
}