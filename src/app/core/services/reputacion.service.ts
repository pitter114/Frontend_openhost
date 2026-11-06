import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IncidenciaHuesped {
  id: number;
  numero_documento: string;
  tipo_documento: string;
  nombre_completo: string;
  hotel_nombre: string;
  hotel_ruc: string;
  tipo_incidencia: 'impago' | 'danos_materiales' | 'conducta_inapropiada' | 'fraude' | 'otro';
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  monto_deuda: number;
  descripcion: string;
  estado: 'activa' | 'en_revision' | 'descartada';
  reportado_por: string;
  fecha: string;
}

export interface AlertaReputacionRespuesta {
  tiene_alerta: boolean;
  alerta?: {
    id: number;
    numero_documento: string;
    nombre_completo: string;
    tipo_incidencia: string;
    severidad: string;
    monto_deuda: number;
    descripcion: string;
    hotel_origen: string;
    fecha_reporte: string;
    mensaje_sugerido: string;
    es_mismo_hotel: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class ReputacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organizacion`;

  // Super Admin: Listar y moderar incidencias de la red
  listarIncidenciasSuperadmin(opts: { busqueda?: string; estado?: string } = {}): Observable<{
    ok: boolean;
    totales: { total: number; activas: number; deuda_total: number; casos_criticos: number };
    data: IncidenciaHuesped[];
  }> {
    let params = new HttpParams();
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.estado) params = params.set('estado', opts.estado);

    return this.http.get<any>(`${this.base}/reputacion-huespedes`, { params });
  }

  moderarIncidencia(id: number, estado: 'activa' | 'en_revision' | 'descartada'): Observable<any> {
    return this.http.patch(`${this.base}/reputacion-huespedes/${id}/estado`, { estado });
  }

  // Tenant Hotel: Verificar reputación preventiva por DNI
  verificarReputacion(orgId: number, documento: string): Observable<AlertaReputacionRespuesta> {
    return this.http.get<AlertaReputacionRespuesta>(
      `${this.base}/${orgId}/huespedes/verificar-reputacion`,
      { params: { documento } }
    );
  }

  // Tenant Hotel: Reportar nueva incidencia
  reportarIncidencia(orgId: number, payload: any): Observable<any> {
    return this.http.post(`${this.base}/${orgId}/huespedes/reportar-incidencia`, payload);
  }
}
