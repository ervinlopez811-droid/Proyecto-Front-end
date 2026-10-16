export interface Cliente {
  idCliente: number | null;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  telefono33?: string;
  estado?: boolean;
}