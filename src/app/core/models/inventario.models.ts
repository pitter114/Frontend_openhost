export interface EstadisticasInventario {
  articulos: {
    total: number;
    stock_medio: number;
    stock_critico: number;
  };
}

export type EstadoStock = 'critico' | 'medio' | 'optimo';
export type ColorStock = 'rojo' | 'amarillo' | 'verde';

export interface ArticuloTarjeta {
  articulo_id: number;
  nombre: string;
  unidad_medida: string;
  categoria: { categoria_articulo_id: number; nombre: string };
  tipo_articulo: { tipo_articulo_id: number; nombre: string };
  cantidad_total: number;
  stock_minimo: number;
  stock_objetivo: number;
  stock_maximo: number | null;
  estado_stock: EstadoStock;
  color: ColorStock;
  porcentaje_barra: number;
  ultima_actualizacion: string | null;
}

export interface CategoriaArticulo {
  categoria_articulo_id: number;
  nombre: string;
}

export interface CrearCategoriaPayload {
  nombre: string;
  descripcion?: string;
}

export interface CrearArticuloPayload {
  categoria_articulo_id: number;
  tipo_articulo_id: number;
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  stock_minimo: number;
  stock_objetivo?: number;
  stock_maximo?: number;
  permite_stock_negativo?: boolean;
  control_individual?: boolean;
  cantidad_inicial?: number;
}

/** Shape of Laravel's JsonResource::collection() pagination wrapper. */
export interface PaginaResource<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}
