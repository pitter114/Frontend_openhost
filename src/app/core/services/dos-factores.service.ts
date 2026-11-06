import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HabilitarDosFactoresResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class DosFactoresService {
  private readonly base = `${environment.apiUrl}/auth/2fa`;

  constructor(private http: HttpClient) {}

  habilitar(metodo: 'correo' | 'totp'): Observable<HabilitarDosFactoresResponse> {
    return this.http.post<HabilitarDosFactoresResponse>(`${this.base}/habilitar`, { metodo });
  }

  confirmar(codigo: string): Observable<{ codigos_recuperacion: string[] }> {
    return this.http.post<{ codigos_recuperacion: string[] }>(`${this.base}/confirmar`, { codigo });
  }

  deshabilitar(contrasena: string, codigo: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/deshabilitar`, { contrasena, codigo });
  }

  solicitarCodigo(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/solicitar-codigo`, {});
  }
}