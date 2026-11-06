export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface Establecimiento {
  establecimiento_id: number;
  nombre: string;
  descripcion_establecimiento: string | null;
  tipo_establecimiento: string | null;
  ciudad: string | null;
  direccion: string | null;
}

export interface CrearEstablecimientoPayload {
  tipo_establecimiento_id: number;
  nombre: string;
  descripcion_establecimiento?: string;
  ciudad_id: number;
  texto_direccion: string;
  url_mapas?: string;
  latitud?: number;
  longitud?: number;
}

export interface CrearAlojamientoPayload {
  etiqueta_unidad: string;
  tipo_alojamiento: number;
  num_habitaciones?: number;
  descripcion_alojamiento: string;
  precio_base: number;
  max_huespedes_base: number;
  max_huespedes_extra?: number;
  costo_huesped_extra?: number;
}

export interface Servicio {
  servicio_id: number;
  nombre_servicio: string;
  descripcion_servicio: string | null;
  precio_base: number;
  global: boolean;
}

export interface CrearServicioPayload {
  nombre_servicio: string;
  precio_base: number;
  descripcion_servicio?: string;
}
