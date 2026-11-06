import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlojamientoTarjeta,
  ClientesNuevosRecurrentesPunto,
  EstadisticasAlojamientos,
  EstadisticasPanel,
  OcupacionMensualPunto,
  PaginaLaravel,
  TopAlojamiento,
} from '../models/estadisticas.models';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  constructor(private http: HttpClient) {}

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}`;
  }

  panel(orgId: number): Observable<{ data: EstadisticasPanel }> {
    return this.http.get<{ data: EstadisticasPanel }>(`${this.base(orgId)}/estadisticas`);
  }

  clientesNuevosVsRecurrentes(orgId: number): Observable<{ data: ClientesNuevosRecurrentesPunto[] }> {
    return this.http.get<{ data: ClientesNuevosRecurrentesPunto[] }>(
      `${this.base(orgId)}/estadisticas/clientes-nuevos-recurrentes`
    );
  }

  topAlojamientos(orgId: number, limite = 5): Observable<{ data: TopAlojamiento[] }> {
    const params = new HttpParams().set('limite', limite);
    return this.http.get<{ data: TopAlojamiento[] }>(`${this.base(orgId)}/estadisticas/top-alojamientos`, { params });
  }

  ocupacionMensual(orgId: number): Observable<{ data: OcupacionMensualPunto[] }> {
    return this.http.get<{ data: OcupacionMensualPunto[] }>(`${this.base(orgId)}/estadisticas/ocupacion-mensual`);
  }

  estadisticasAlojamientos(
    orgId: number,
    desde?: string,
    hasta?: string
  ): Observable<{ data: EstadisticasAlojamientos }> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<{ data: EstadisticasAlojamientos }>(`${this.base(orgId)}/estadisticas/alojamientos`, {
      params,
    });
  }

  alojamientos(
    orgId: number,
    opts: { desde?: string; hasta?: string; filtro?: string; page?: number } = {}
  ): Observable<PaginaLaravel<AlojamientoTarjeta>> {
    let params = new HttpParams();
    if (opts.desde) params = params.set('desde', opts.desde);
    if (opts.hasta) params = params.set('hasta', opts.hasta);
    if (opts.filtro) params = params.set('filtro', opts.filtro);
    if (opts.page) params = params.set('page', opts.page);
    return this.http.get<PaginaLaravel<AlojamientoTarjeta>>(`${this.base(orgId)}/alojamientos`, { params });
  }
}