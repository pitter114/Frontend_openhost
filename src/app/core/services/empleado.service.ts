import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgregarEmpleadoPayload, AgregarEmpleadoResponse, Empleado } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly base = `${environment.apiUrl}/organizacion`;

  constructor(private http: HttpClient) {}

  listar(organizacionId: number): Observable<{ data: Empleado[] }> {
    return this.http.get<{ data: Empleado[] }>(`${this.base}/${organizacionId}/empleados`);
  }

  agregar(organizacionId: number, payload: AgregarEmpleadoPayload): Observable<AgregarEmpleadoResponse> {
    return this.http.post<AgregarEmpleadoResponse>(`${this.base}/${organizacionId}/empleados`, payload);
  }
}