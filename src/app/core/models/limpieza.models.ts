export interface LimpiezaTarjeta {
  limpieza_id: number;
  alojamiento: {
    alojamiento_id: number;
    etiqueta_unidad: string;
    piso: string | null;
  };
  estado: 'pendiente' | 'en_proceso' | 'completada';
  estimado_para: string | null;
  iniciado_en: string | null;
  completado_en: string | null;
  notas: string | null;
  asignado: {
    miembro_organizacion_id: number;
    nombre: string;
  } | null;
}

export interface EstadisticasLimpieza {
  pendientes: number;
  en_proceso: number;
  completadas_hoy: number;
}

export interface RegistrarLimpiezaPayload {
  detalle_reserva_id?: number | null;
  estimado_para?: string | null;
  notas?: string | null;
  asignado_a?: number | null;
}
