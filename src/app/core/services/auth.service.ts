import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cuenta, LoginResponse, RegistroCuentaPayload, SesionResponse } from '../models/auth.models';

const TOKEN_KEY = 'openhost_token';
const CUENTA_KEY = 'openhost_cuenta';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _cuenta = signal<Cuenta | null>(this.leerCuentaGuardada());
  readonly cuenta = this._cuenta.asReadonly();
  readonly estaAutenticado = computed(() => !!this._cuenta());

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(correo: string, contrasena: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { correo, contrasena }).pipe(
      tap((res) => {
        if (res.token && res.cuenta) this.guardarSesion(res as SesionResponse);
      })
    );
  }

  verificar2fa(reto: string, codigo: string): Observable<SesionResponse> {
    return this.http
      .post<SesionResponse>(`${this.base}/login/verificar-2fa`, { reto, codigo })
      .pipe(tap((res) => this.guardarSesion(res)));
  }

  registro(payload: RegistroCuentaPayload): Observable<Cuenta> {
    return this.http.post<Cuenta>(`${this.base}/registro`, payload);
  }

  aceptarInvitacion(token: string, contrasena: string, contrasena_confirmation: string): Observable<Cuenta> {
    return this.http.post<Cuenta>(`${this.base}/aceptar-invitacion`, {
      token,
      contrasena,
      contrasena_confirmation,
    });
  }

  cambiarContrasena(contrasenaActual: string, nuevaContrasena: string, nuevaContrasenaConfirmation: string): Observable<{ message: string; cuenta: Cuenta }> {
    return this.http
      .post<{ message: string; cuenta: Cuenta }>(`${this.base}/cambiar-contrasena`, {
        contrasena_actual: contrasenaActual,
        nueva_contrasena: nuevaContrasena,
        nueva_contrasena_confirmation: nuevaContrasenaConfirmation,
      })
      .pipe(
        tap((res) => {
          if (res.cuenta) {
            this.actualizarCuenta(res.cuenta);
          }
        })
      );
  }

  /** Refetches the account (e.g. after enabling/disabling 2FA) and updates local state. */
  me(): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${this.base}/me`).pipe(tap((cuenta) => this.actualizarCuenta(cuenta)));
  }

  actualizarCuenta(cuenta: Cuenta): void {
    localStorage.setItem(CUENTA_KEY, JSON.stringify(cuenta));
    this._cuenta.set(cuenta);
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/logout`, {}).pipe(tap(() => this.limpiarSesion()));
  }

  /** Clears local session without calling the API (e.g. on a 401). */
  limpiarSesion(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUENTA_KEY);
    this._cuenta.set(null);
  }

  private guardarSesion(res: SesionResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(CUENTA_KEY, JSON.stringify(res.cuenta));
    this._cuenta.set(res.cuenta);
  }

  private leerCuentaGuardada(): Cuenta | null {
    const raw = localStorage.getItem(CUENTA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Cuenta;
    } catch {
      return null;
    }
  }
}