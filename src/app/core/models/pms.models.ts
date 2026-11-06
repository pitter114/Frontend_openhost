export type EstadoReserva =
  | 'Registrarse'
  | 'Confirmada'
  | 'Verificar'
  | 'Pendiente';

export type OrigenReserva = 'Directo' | 'Booking.com' | 'Expedia' | 'Airbnb' | 'Agencia' | 'Propiedad web';

export interface Reserva {
  reserva_id?: number;
  alojamiento_id?: number;
  codigo: string;
  cliente: string;
  documento: string;
  telefono?: string;
  habitacion: string;
  checkIn: string;
  checkOut: string;
  estado: EstadoReserva;
  total: number;
  debe: number;
  origen: OrigenReserva;
  huespedes?: number;
}

export type EstadoHabitacion = 'Disponible' | 'Ocupada' | 'Reservada' | 'Limpieza' | 'Mantenimiento' | 'Fuera de servicio';

export interface Habitacion {
  numero: string;
  tipo: string;
  estado: EstadoHabitacion;
  precioNoche: number;
}

export interface Cliente {
  nombre: string;
  documento: string;
  telefono: string;
  correo: string;
  nacionalidad: string;
  estadias: number;
  gastado: number;
  ultimaVisita: string;
  frecuencia: 'Alta' | 'Media' | 'Baja';
  vip?: boolean;
}

export interface ArticuloInventario {
  nombre: string;
  categoria: 'Higiene' | 'Lencería' | 'Limpieza' | 'Servicios';
  unidades: number;
  minimo: number;
  estado: 'Stock Alto' | 'Stock Medio' | 'Stock Bajo';
  fechaLey: string;
}

export interface TareaLimpieza {
  habitacion: string;
  piso: string;
  camarera: string;
  prioridad: 'Alta' | 'Media de comunicación' | 'Baja';
  estado: 'Pendiente' | 'En Proceso' | 'Completada';
  minutos?: number;
}

export interface Incidencia {
  habitacion: string;
  problema: string;
  prioridad: 'Alta' | 'Medios de comunicación' | 'Baja';
  responsable: string;
  estado: 'Abierto' | 'En Proceso' | 'Cerrado';
  fecha: string;
  resuelto?: string;
}

export interface MovimientoCaja {
  tipo: 'Ingreso' | 'Salida';
  concepto: string;
  metodo: 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Yape / Plin';
  monto: number;
  hora: string;
  usuario: string;
}

export interface Hotel {
  nombre: string;
  ciudad: string;
  pais: string;
  estrellas: number;
  habitaciones: number;
  ocupacion: number;
  reservas: number;
  ingresos: number;
  comision: number;
  estado: 'Activo' | 'Inactivo';
  imagen: string;
}

export interface AlertaSistema {
  titulo: string;
  detalle: string;
  hotel: string;
  prioridad: 'Alta' | 'Media';
  icono: string;
}
