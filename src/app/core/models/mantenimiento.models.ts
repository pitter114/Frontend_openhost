export interface MantenimientoTarjeta {
  mantenimiento_id: number;
  alojamiento: {
    alojamiento_id: number;
    etiqueta_unidad: string;
    piso: string | null;
  };
  cierre_id: number | null;
  estado: 'abierta' | 'en_proceso' | 'cerrada';
  motivo: string;
  prioridad: 'alta' | 'media' | 'baja';
  responsable: string | null;
  fecha_incidente: string;
  iniciado_en: string | null;
  cerrado_en: string | null;
  notas: string | null;
}

export interface EstadisticasMantenimiento {
  abiertas: number;
  en_proceso: number;
  cerradas: number;
}

export interface RegistrarMantenimientoPayload {
  motivo: string;
  prioridad?: 'alta' | 'media' | 'baja';
  responsable?: string | null;
  fecha_incidente?: string | null;
  notas?: string | null;
  cierre?: {
    fecha_inicio: string;
    fecha_fin?: string | null;
  } | null;
}
