import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClienteBackend {
  huesped_organizacion_id: number;
  nombre: string;
  dni: string;
  telefono: string;
  correo: string;
  nacionalidad?: string;
  estadias: number;
  ultima_visita?: string;
  frecuencia: 'alta' | 'media' | 'baja' | string;
}

export interface ClientesResponse {
  data: ClienteBackend[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);

  listar(orgId: number, busqueda?: string): Observable<ClientesResponse> {
    let params = new HttpParams();
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http.get<ClientesResponse>(`${environment.apiUrl}/organizacion/${orgId}/clientes`, { params });
  }

  reportarIncidencia(payload: {
    numero_documento: string;
    nombre_completo: string;
    tipo_incidencia: string;
    severidad: string;
    monto_deuda: number;
    descripcion: string;
    reportado_por_nombre?: string;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/reputacion/reportar`, payload);
  }
}
