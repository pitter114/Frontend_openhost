import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ArticuloTarjeta,
  CategoriaArticulo,
  CrearArticuloPayload,
  CrearCategoriaPayload,
  EstadisticasInventario,
  PaginaResource,
} from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  constructor(private http: HttpClient) {}

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}/inventario`;
  }

  estadisticas(orgId: number): Observable<{ data: EstadisticasInventario }> {
    return this.http.get<{ data: EstadisticasInventario }>(`${this.base(orgId)}/estadisticas`);
  }

  categorias(orgId: number): Observable<{ data: CategoriaArticulo[] }> {
    return this.http.get<{ data: CategoriaArticulo[] }>(`${this.base(orgId)}/categorias`);
  }

  crearCategoria(orgId: number, payload: CrearCategoriaPayload): Observable<CategoriaArticulo> {
    return this.http.post<CategoriaArticulo>(`${this.base(orgId)}/categorias`, payload);
  }

  crearArticulo(orgId: number, payload: CrearArticuloPayload): Observable<{ articulo_id: number; nombre: string }> {
    return this.http.post<{ articulo_id: number; nombre: string }>(`${this.base(orgId)}/articulos`, payload);
  }

  articulos(
    orgId: number,
    opts: { busqueda?: string; categoria_articulo_id?: number; tipo_articulo_id?: number; page?: number } = {}
  ): Observable<PaginaResource<ArticuloTarjeta>> {
    let params = new HttpParams();
    if (opts.busqueda) params = params.set('busqueda', opts.busqueda);
    if (opts.categoria_articulo_id) params = params.set('categoria_articulo_id', opts.categoria_articulo_id);
    if (opts.tipo_articulo_id) params = params.set('tipo_articulo_id', opts.tipo_articulo_id);
    if (opts.page) params = params.set('page', opts.page);
    return this.http.get<PaginaResource<ArticuloTarjeta>>(`${this.base(orgId)}/articulos`, { params });
  }

  actualizarArticulo(
    orgId: number,
    articuloId: number,
    payload: Partial<CrearArticuloPayload>
  ): Observable<{ articulo_id: number; nombre: string }> {
    return this.http.put<{ articulo_id: number; nombre: string }>(`${this.base(orgId)}/articulos/${articuloId}`, payload);
  }

  ajustarStock(orgId: number, articuloId: number, cantidad: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base(orgId)}/articulos/${articuloId}/stock`, { cantidad });
  }
}
