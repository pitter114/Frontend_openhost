import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearAlojamientoPayload, CrearEstablecimientoPayload, Establecimiento } from '../models/establecimiento.models';

@Injectable({ providedIn: 'root' })
export class EstablecimientoService {
  constructor(private http: HttpClient) {}

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}/establecimientos`;
  }

  listar(orgId: number): Observable<{ data: Establecimiento[] }> {
    return this.http.get<{ data: Establecimiento[] }>(this.base(orgId));
  }

  crear(orgId: number, payload: CrearEstablecimientoPayload): Observable<Establecimiento> {
    return this.http.post<Establecimiento>(this.base(orgId), payload);
  }

  crearAlojamiento(
    orgId: number,
    establecimientoId: number,
    payload: CrearAlojamientoPayload
  ): Observable<{ alojamiento_id: number; etiqueta_unidad: string }> {
    return this.http.post<{ alojamiento_id: number; etiqueta_unidad: string }>(
      `${this.base(orgId)}/${establecimientoId}/alojamientos`,
      payload
    );
  }

  actualizarAlojamiento(
    orgId: number,
    alojamientoId: number,
    payload: Partial<CrearAlojamientoPayload>
  ): Observable<any> {
    return this.http.put(`${environment.apiUrl}/organizacion/${orgId}/alojamientos/${alojamientoId}`, payload);
  }

  eliminarAlojamiento(orgId: number, alojamientoId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/organizacion/${orgId}/alojamientos/${alojamientoId}`);
  }
}

