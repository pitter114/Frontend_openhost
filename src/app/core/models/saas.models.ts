export interface PlanSaas {
  plan_id: number;
  nombre: string;
  precio: number;
  descripcion: string | null;
  max_habitaciones: number;
  max_edificios: number;
  permite_inventario: boolean;
  permite_limpieza: boolean;
  permite_mantenimiento: boolean;
  comision_pct: number;
  caracteristicas: string[];
  activo: boolean;
  hoteles_suscritos?: number;
}

export interface AsignarPlanPayload {
  plan_id: number;
  duracion_meses: number;
  estado?: 'activa' | 'prueba' | 'vencida' | 'cancelada';
  monto_pagado?: number;
  notas?: string;
}

export interface ImpersonarResponse {
  mensaje: string;
  data: {
    organizacion: any;
    modo_soporte: boolean;
    superadmin_usuario_id: number;
    timestamp: string;
  };
}

export interface LiquidacionSaas {
  liquidacion_id: number;
  codigo: string;
  organizacion_id: number;
  hotel_nombre: string;
  hotel_ruc?: string;
  hotel_correo?: string;
  periodo: string;
  plan_nombre: string;
  cuota_plan: number;
  reservas_procesadas: number;
  volumen_reservas: number;
  comision_pct: number;
  monto_comision: number;
  total: number;
  estado: 'Pendiente' | 'Pagada' | 'En Mora';
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_pago?: string | null;
}

export interface AnuncioSaas {
  anuncio_id: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'alerta' | 'mantenimiento';
  activo: boolean | number;
  fecha_expiracion?: string;
  created_at?: string;
}
