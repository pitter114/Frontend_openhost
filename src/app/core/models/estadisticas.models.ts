export interface EstadisticasPanel {
  alojamientos: {
    total: number;
    ocupados: number;
    disponibles: number;
    en_limpieza: number;
    mantenimiento: number;
  };
  reservas: { checkin_hoy: number; checkout_hoy?: number };
  finanzas: {
    ingresos_dia: number;
    ingresos_mes: number;
    egresos_mes: number;
    utilidad_mes: number;
  };
  alertas?: {
    stock_critico?: { nombre: string; stock_actual: number }[];
  };
}

export interface ClientesNuevosRecurrentesPunto {
  mes: string;
  nuevos: number;
  recurrentes: number;
}

export interface TopAlojamiento {
  alojamiento_id: number;
  etiqueta_unidad: string;
  total_reservas: number;
  ingresos: number;
}

export interface OcupacionMensualPunto {
  mes: string;
  tasa_ocupacion: number;
}

export interface EstadisticasAlojamientos {
  disponibles: number;
  ocupados: number;
  reservados: number;
  en_limpieza: number;
  mantenimiento: number;
  fuera_de_servicio: number;
}

export type EstadoAlojamientoReal =
  | 'disponible'
  | 'ocupado'
  | 'reservado'
  | 'en_limpieza'
  | 'mantenimiento'
  | 'fuera_de_servicio';

export interface ReservaResumen {
  reserva_id: number;
  fecha_entrada: string;
  hora_entrada: string | null;
  fecha_salida: string;
  hora_salida: string | null;
  huesped: string;
}

export interface AlojamientoTarjeta {
  alojamiento_id: number;
  etiqueta_unidad: string;
  tipo_alojamiento: string;
  precio_base: number;
  imagen_principal?: string | null;
  max_huespedes_base?: number;
  max_huespedes_extra?: number;
  costo_huesped_extra?: number;
  estados: EstadoAlojamientoReal[];
  reserva: ReservaResumen | null;
}


/** Shape of Laravel's default LengthAwarePaginator JSON response. */
export interface PaginaLaravel<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}