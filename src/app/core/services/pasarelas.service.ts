import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PasarelaConfig {
  id: number;
  proveedor_id: number;
  nombre: string;
  slug: string;
  public_key: string | null;
  access_token: string | null;
  sandbox: boolean;
  webhook_url: string | null;
  activo: boolean;
  auto_confirmar_reserva: boolean;
  comision_adicional_pct: number;
  notas: string | null;
  proveedor?: {
    nombre: string;
    slug: string;
    es_pasarela: boolean;
  };
}

export interface AuditoriaEdificioHotel {
  organizacion_id: number;
  nombre_comercial: string;
  ruc: string;
  plan: {
    nombre: string;
    precio: number;
    max_edificios: number;
    max_habitaciones: number;
  };
  infraestructura: {
    total_edificios: number;
    limite_edificios: number;
    uso_edificios_pct: number;
    total_habitaciones: number;
    limite_habitaciones: number;
    uso_habitaciones_pct: number;
    estado_cumplimiento: string;
    edificios: Array<{
      edificio_id: number;
      nombre: string;
      direccion: string | null;
      num_pisos: number;
      habitaciones_asignadas: number;
      descripcion: string | null;
      creado_en: string;
    }>;
  };
}

@Injectable({ providedIn: 'root' })
export class PasarelasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organizacion`;

  getPasarelas(): Observable<{ ok: boolean; data: { pasarelas: PasarelaConfig[]; estadisticas: any } }> {
    return this.http.get<{ ok: boolean; data: { pasarelas: PasarelaConfig[]; estadisticas: any } }>(
      `${this.base}/pasarelas`
    );
  }

  actualizarPasarela(id: number, payload: Partial<PasarelaConfig>): Observable<any> {
    return this.http.put(`${this.base}/pasarelas/${id}`, payload);
  }

  testConexionMercadoPago(accessToken: string): Observable<{ ok: boolean; message: string; nickname?: string; site_id?: string }> {
    return this.http.post<{ ok: boolean; message: string; nickname?: string; site_id?: string }>(
      `${this.base}/pasarelas/test-mercadopago`,
      { access_token: accessToken }
    );
  }

  getAuditoriaEdificios(): Observable<{ ok: boolean; data: AuditoriaEdificioHotel[] }> {
    return this.http.get<{ ok: boolean; data: AuditoriaEdificioHotel[] }>(`${this.base}/auditoria-edificios`);
  }

  crearPreferenciaMercadoPago(reservaId: number, datos: { concepto?: string; email?: string; nombre?: string; monto?: number }): Observable<{ ok: boolean; data: any }> {
    return this.http.post<{ ok: boolean; data: any }>(
      `${environment.apiUrl}/publico/reservas/${reservaId}/mercadopago/preferencia`,
      datos
    );
  }
}
