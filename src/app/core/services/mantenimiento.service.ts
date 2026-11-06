import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaLaravel } from '../models/estadisticas.models';
import {
  EstadisticasMantenimiento,
  MantenimientoTarjeta,
  RegistrarMantenimientoPayload,
} from '../models/mantenimiento.models';

@Injectable({ providedIn: 'root' })
export class MantenimientoService {
  constructor(private http: HttpClient) {}

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}`;
  }

  estadisticas(orgId: number): Observable<{ data: EstadisticasMantenimiento }> {
    return this.http.get<{ data: EstadisticasMantenimiento }>(`${this.base(orgId)}/mantenimientos/estadisticas`);
  }

  listar(
    orgId: number,
    opts: { estado?: string; prioridad?: string; busqueda?: string; page?: number } = {}
  ): Observable<PaginaLaravel<MantenimientoTarjeta>> {
    let params = new HttpParams();
    if (opts.estado) params = params.set('estado', opts.estado);
    if (opts.prioridad) params = params.set('prioridad', opts.prioridad);
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.page) params = params.set('page', opts.page);
    return this.http.get<PaginaLaravel<MantenimientoTarjeta>>(`${this.base(orgId)}/mantenimientos`, { params });
  }

  iniciar(orgId: number, mantenimientoId: number): Observable<{ data: MantenimientoTarjeta }> {
    return this.http.patch<{ data: MantenimientoTarjeta }>(`${this.base(orgId)}/mantenimientos/${mantenimientoId}/iniciar`, {});
  }

  cerrar(orgId: number, mantenimientoId: number): Observable<{ data: MantenimientoTarjeta }> {
    return this.http.patch<{ data: MantenimientoTarjeta }>(`${this.base(orgId)}/mantenimientos/${mantenimientoId}/cerrar`, {});
  }

  registrar(
    orgId: number,
    alojamientoId: number,
    payload: RegistrarMantenimientoPayload
  ): Observable<{ data: MantenimientoTarjeta }> {
    return this.http.post<{ data: MantenimientoTarjeta }>(
      `${this.base(orgId)}/alojamientos/${alojamientoId}/mantenimientos`,
      payload
    );
  }
}
