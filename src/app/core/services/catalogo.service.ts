import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogoItem } from '../models/establecimiento.models';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly base = `${environment.apiUrl}/catalogos`;

  constructor(private http: HttpClient) {}

  tiposEstablecimiento(): Observable<{ data: CatalogoItem[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/tipos-establecimiento`).pipe(
      map((res) => ({
        data: (res.data || []).map((t: any) => ({
          id: t.id ?? t.tipo_establecimiento_id,
          nombre: t.nombre,
        })),
      }))
    );
  }

  tiposAlojamiento(): Observable<{ data: CatalogoItem[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/tipos-alojamiento`).pipe(
      map((res) => ({
        data: (res.data || []).map((t: any) => ({
          id: t.id ?? t.tipo_alojamiento_id,
          nombre: t.nombre,
        })),
      }))
    );
  }


  ciudades(): Observable<{ data: CatalogoItem[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/ciudades`).pipe(
      map((res) => ({
        data: (res.data || []).map((c: any) => ({
          id: c.id ?? c.ciudad_id,
          nombre: c.nombre ?? c.nombre_ciudad,
        })),
      }))
    );
  }

  tiposArticulo(): Observable<{ data: CatalogoItem[] }> {
    return this.http.get<{ data: CatalogoItem[] }>(`${this.base}/tipos-articulo`);
  }
}

