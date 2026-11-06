import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CanalIcal {
  id: number;
  nombre_canal: 'Booking.com' | 'Airbnb' | string;
  url_exportacion: string;
  url_importacion: string | null;
  ultima_sincronizacion: string | null;
  ultimo_error: string | null;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class IcalService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organizacion`;

  listarFeeds(orgId: number, alojamientoId: number): Observable<{ ok: boolean; unidad: string; data: CanalIcal[] }> {
    return this.http.get<{ ok: boolean; unidad: string; data: CanalIcal[] }>(
      `${this.base}/${orgId}/alojamientos/${alojamientoId}/ical`
    );
  }

  guardarFeed(
    orgId: number,
    alojamientoId: number,
    payload: { id: number; url_importacion: string | null; activo?: boolean }
  ): Observable<any> {
    return this.http.post(`${this.base}/${orgId}/alojamientos/${alojamientoId}/ical`, payload);
  }

  sincronizarAhora(orgId: number, alojamientoId: number, feedId: number): Observable<any> {
    return this.http.post(
      `${this.base}/${orgId}/alojamientos/${alojamientoId}/ical/${feedId}/sincronizar`,
      {}
    );
  }
}
