import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginaLaravel } from '../models/estadisticas.models';
import { EstadisticasLimpieza, LimpiezaTarjeta, RegistrarLimpiezaPayload } from '../models/limpieza.models';

@Injectable({ providedIn: 'root' })
export class LimpiezaService {
  constructor(private http: HttpClient) {}

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}`;
  }

  estadisticas(orgId: number): Observable<{ data: EstadisticasLimpieza }> {
    return this.http.get<{ data: EstadisticasLimpieza }>(`${this.base(orgId)}/limpiezas/estadisticas`);
  }

  pendientes(orgId: number): Observable<PaginaLaravel<LimpiezaTarjeta>> {
    return this.http.get<PaginaLaravel<LimpiezaTarjeta>>(`${this.base(orgId)}/limpiezas/pendientes`);
  }

  enProceso(orgId: number): Observable<PaginaLaravel<LimpiezaTarjeta>> {
    return this.http.get<PaginaLaravel<LimpiezaTarjeta>>(`${this.base(orgId)}/limpiezas/en-proceso`);
  }

  completadas(orgId: number): Observable<PaginaLaravel<LimpiezaTarjeta>> {
    return this.http.get<PaginaLaravel<LimpiezaTarjeta>>(`${this.base(orgId)}/limpiezas/completadas`);
  }

  iniciar(orgId: number, limpiezaId: number): Observable<{ data: LimpiezaTarjeta }> {
    return this.http.patch<{ data: LimpiezaTarjeta }>(`${this.base(orgId)}/limpiezas/${limpiezaId}/iniciar`, {});
  }

  completar(orgId: number, limpiezaId: number): Observable<{ data: LimpiezaTarjeta }> {
    return this.http.patch<{ data: LimpiezaTarjeta }>(`${this.base(orgId)}/limpiezas/${limpiezaId}/completar`, {});
  }

  registrar(orgId: number, alojamientoId: number, payload: RegistrarLimpiezaPayload = {}): Observable<{ data: LimpiezaTarjeta }> {
    return this.http.post<{ data: LimpiezaTarjeta }>(`${this.base(orgId)}/alojamientos/${alojamientoId}/limpiezas`, payload);
  }
}
