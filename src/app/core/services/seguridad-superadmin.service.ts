import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CuentaSeguridad {
  usuario_id: number;
  nombre: string;
  correo: string;
  documento: string;
  hotel_id?: number | null;
  hotel: string;
  rol: string;
  rol_slug: string;
  es_operativo: boolean;
  estado: 'activo' | 'suspendido' | 'inactivo';
  estado_id: number;
  dosfa_activo: boolean;
  dosfa_metodo: string;
  contrasena_temporal: boolean;
  sesiones_activas: number;
  ultimo_acceso: string;
  fecha_creacion: string;
}

export interface HotelIpSeguridad {
  organizacion_id: number;
  hotel: string;
  ruc: string | null;
  correo: string;
  ip_whitelist: string;
  ips_lista: string[];
  restringir_ip_operativa: boolean;
}

export interface LogSeguridad {
  id: number;
  fecha: string;
  tipo_evento: string;
  descripcion: string;
  usuario: string;
  correo: string;
  hotel: string;
  ip_origen: string;
}

@Injectable({ providedIn: 'root' })
export class SeguridadSuperadminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/superadmin/seguridad`;

  listarCuentas(filtros: { busqueda?: string; hotel_id?: number; rol?: string; estado?: string } = {}): Observable<{ data: CuentaSeguridad[] }> {
    let params = new HttpParams();
    if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros.hotel_id) params = params.set('hotel_id', filtros.hotel_id);
    if (filtros.rol) params = params.set('rol', filtros.rol);
    if (filtros.estado) params = params.set('estado', filtros.estado);

    return this.http.get<{ data: CuentaSeguridad[] }>(`${this.base}/cuentas`, { params });
  }

  resetPassword(usuarioId: number, payload: { modo: 'manual' | 'temporal'; contrasena?: string }): Observable<{ mensaje: string; clave: string; modo: string; contrasena_temporal: boolean }> {
    return this.http.post<any>(`${this.base}/cuentas/${usuarioId}/reset-password`, payload);
  }

  emergenciaRobo(usuarioId: number, suspender: boolean = false): Observable<{ mensaje: string; clave_temporal: string; sesiones_cerradas: boolean; dosfa_limpio: boolean }> {
    return this.http.post<any>(`${this.base}/cuentas/${usuarioId}/emergencia-robo`, { suspender });
  }

  cerrarSesiones(usuarioId: number): Observable<{ mensaje: string; tokens_revocados: number }> {
    return this.http.post<any>(`${this.base}/cuentas/${usuarioId}/cerrar-sesiones`, {});
  }

  toggleBloqueo(usuarioId: number): Observable<{ mensaje: string; nuevo_estado_id: number; nuevo_estado: string }> {
    return this.http.post<any>(`${this.base}/cuentas/${usuarioId}/toggle-bloqueo`, {});
  }

  listarHotelesIp(): Observable<{ data: HotelIpSeguridad[]; tu_ip_actual: string }> {
    return this.http.get<{ data: HotelIpSeguridad[]; tu_ip_actual: string }>(`${this.base}/hoteles-ip`);
  }

  guardarHotelIp(organizacionId: number, payload: { ip_whitelist: string; restringir_ip_operativa: boolean }): Observable<{ mensaje: string; data: any }> {
    return this.http.put<{ mensaje: string; data: any }>(`${this.base}/hoteles-ip/${organizacionId}`, payload);
  }

  listarAuditoria(): Observable<{ data: LogSeguridad[] }> {
    return this.http.get<{ data: LogSeguridad[] }>(`${this.base}/auditoria`);
  }
}
