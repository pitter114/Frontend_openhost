import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearServicioPayload, Servicio } from '../models/establecimiento.models';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  constructor(private http: HttpClient) {}

  private base(orgId: number): string {
    return `${environment.apiUrl}/organizacion/${orgId}/servicios`;
  }

  listar(orgId: number): Observable<{ data: Servicio[] }> {
    return this.http.get<{ data: Servicio[] }>(this.base(orgId));
  }

  crear(orgId: number, payload: CrearServicioPayload): Observable<Servicio> {
    return this.http.post<Servicio>(this.base(orgId), payload);
  }
}
