import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductoTienda {
  producto_id: number;
  organizacion_id?: number | null;
  nombre: string;
  categoria: 'Bebidas' | 'Snacks' | 'Higiene' | 'Servicios' | 'Souvenirs';
  precio_venta: number;
  stock_actual: number;
  icono: string;
  activo: boolean | number;
}

export interface VentaItemPayload {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface RegistrarVentaPayload {
  items: VentaItemPayload[];
  metodo_pago: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' | 'Cargo a Habitación';
  huesped_nombre?: string;
  reserva_id?: number | null;
  alojamiento_id?: number | null;
  habitacion_etiqueta?: string | null;
  notas?: string;
}

export interface HorariosHotel {
  organizacion_id: number;
  nombre_comercial: string;
  hora_check_in: string;
  hora_check_out: string;
  checkout_automatico: boolean;
  checkout_tolerancia_minutos: number;
}

@Injectable({ providedIn: 'root' })
export class TiendaService {
  private http = inject(HttpClient);

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}`;
  }

  // --- Horarios y Check-Out Automático ---
  obtenerHorarios(orgId: number): Observable<{ data: HorariosHotel }> {
    return this.http.get<{ data: HorariosHotel }>(`${this.base(orgId)}/horarios`);
  }

  actualizarHorarios(orgId: number, payload: Partial<HorariosHotel>): Observable<{ mensaje: string; data: HorariosHotel }> {
    return this.http.put<{ mensaje: string; data: HorariosHotel }>(`${this.base(orgId)}/horarios`, payload);
  }

  ejecutarCheckoutManual(orgId: number): Observable<{ mensaje: string; detalle: string }> {
    return this.http.post<{ mensaje: string; detalle: string }>(`${this.base(orgId)}/ejecutar-checkout-auto`, {});
  }

  // --- Mini Tienda & POS ---
  listarProductos(orgId: number): Observable<{ data: ProductoTienda[] }> {
    return this.http.get<{ data: ProductoTienda[] }>(`${this.base(orgId)}/tienda/productos`);
  }

  guardarProducto(orgId: number, payload: Partial<ProductoTienda>): Observable<{ mensaje: string; data: ProductoTienda }> {
    return this.http.post<{ mensaje: string; data: ProductoTienda }>(`${this.base(orgId)}/tienda/productos`, payload);
  }

  habitacionesActivas(orgId: number): Observable<{ data: { alojamiento_id: number; etiqueta: string; reserva_id: number; huesped: string; dni: string }[] }> {
    return this.http.get<{ data: any[] }>(`${this.base(orgId)}/tienda/habitaciones-activas`);
  }

  registrarVenta(orgId: number, payload: RegistrarVentaPayload): Observable<{ mensaje: string; data: any }> {
    return this.http.post<{ mensaje: string; data: any }>(`${this.base(orgId)}/tienda/vender`, payload);
  }

  listarVentas(orgId: number): Observable<{ data: any[]; resumen: { total_ventas_hoy: number; cargos_pendientes_checkout: number } }> {
    return this.http.get<{ data: any[]; resumen: any }>(`${this.base(orgId)}/tienda/ventas`);
  }
}
