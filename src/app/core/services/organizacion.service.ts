import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MiembroOrganizacion,
  MiOrganizacion,
  Organizacion,
  RegistrarOrganizacionPayload,
} from '../models/auth.models';
import { AsignarPlanPayload, ImpersonarResponse, LiquidacionSaas, AnuncioSaas, PlanSaas } from '../models/saas.models';

const ORG_ACTIVA_KEY = 'openhost_org_activa';
const ROLES_ACTIVOS_KEY = 'openhost_roles_activos';
const MODO_SOPORTE_KEY = 'openhost_modo_soporte';

const ROLES_OPENHOST = ['openhost-super-admin', 'openhost-admin'];

@Injectable({ providedIn: 'root' })
export class OrganizacionService {
  private readonly base = `${environment.apiUrl}/organizacion`;

  private readonly _orgActiva = signal<Organizacion | null>(this.leerOrgActiva());
  readonly orgActiva = this._orgActiva.asReadonly();
  readonly orgActivaId = () => this._orgActiva()?.id ?? null;

  private readonly _rolesActivos = signal<string[]>(this.leerRolesActivos());
  readonly rolesActivos = this._rolesActivos.asReadonly();
  readonly esOpenHostAdmin = () => this._rolesActivos().some((r) => ROLES_OPENHOST.includes(r));

  private readonly _modoSoporte = signal<boolean>(localStorage.getItem(MODO_SOPORTE_KEY) === 'true');
  readonly modoSoporte = this._modoSoporte.asReadonly();

  constructor(private http: HttpClient) {}

  misOrganizaciones(): Observable<{ data: MiOrganizacion[] }> {
    return this.http.get<{ data: MiOrganizacion[] }>(this.base);
  }

  crear(payload: RegistrarOrganizacionPayload): Observable<Organizacion> {
    return this.http.post<Organizacion>(this.base, payload);
  }

  entrar(organizacionId: number): Observable<{ organizacion: Organizacion; miembro: MiembroOrganizacion }> {
    return this.http
      .post<{ organizacion: Organizacion; miembro: MiembroOrganizacion }>(`${this.base}/${organizacionId}/entrar`, {})
      .pipe(tap((res) => this.fijarOrgActiva(res.organizacion)));
  }

  /** Todas las organizaciones de la plataforma — solo para roles openhost-*. */
  todas(estado?: string): Observable<{ data: Organizacion[] }> {
    const url = estado ? `${this.base}/todas?estado=${estado}` : `${this.base}/todas`;
    return this.http.get<{ data: Organizacion[] }>(url);
  }

  aprobar(organizacionId: number): Observable<Organizacion> {
    return this.http.patch<Organizacion>(`${this.base}/${organizacionId}/aprobar`, {});
  }

  rechazar(organizacionId: number): Observable<Organizacion> {
    return this.http.patch<Organizacion>(`${this.base}/${organizacionId}/rechazar`, {});
  }

  // --- SaaS: Gestión de Planes y Suscripciones ---
  listarPlanes(): Observable<{ data: PlanSaas[] }> {
    return this.http.get<{ data: PlanSaas[] }>(`${this.base}/planes`);
  }

  crearPlan(payload: Partial<PlanSaas>): Observable<{ mensaje: string; data: PlanSaas }> {
    return this.http.post<{ mensaje: string; data: PlanSaas }>(`${this.base}/planes`, payload);
  }

  actualizarPlan(planId: number, payload: Partial<PlanSaas>): Observable<{ mensaje: string; data: PlanSaas }> {
    return this.http.put<{ mensaje: string; data: PlanSaas }>(`${this.base}/planes/${planId}`, payload);
  }

  alternarPlan(planId: number): Observable<{ mensaje: string; activo: boolean }> {
    return this.http.delete<{ mensaje: string; activo: boolean }>(`${this.base}/planes/${planId}`);
  }

  asignarPlan(orgId: number, payload: AsignarPlanPayload): Observable<any> {
    return this.http.post(`${this.base}/${orgId}/asignar-plan`, payload);
  }

  // --- SaaS: Feature Flags (Encender / Apagar Módulos por Hotel) ---
  obtenerModulos(orgId: number): Observable<{
    data: {
      organizacion_id: number;
      nombre_comercial: string;
      plan_nombre: string;
      plan_precio: number;
      defaults_plan: any;
      overrides: any;
      modulos_activos: any;
    };
  }> {
    return this.http.get<any>(`${this.base}/${orgId}/modulos`);
  }

  actualizarModulos(
    orgId: number,
    payload: { modulos?: any; restablecer_plan?: boolean }
  ): Observable<{ mensaje: string; data: any }> {
    return this.http.put<any>(`${this.base}/${orgId}/modulos`, payload);
  }

  consultarModulosHotel(orgId: number): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.base}/${orgId}/modulos-activos`);
  }

  // --- Configuración Operativa & Seguridad de Sede (Horarios, Checkout auto e IP Whitelist) ---
  obtenerConfiguracionSeguridad(orgId: number): Observable<{ data: any; tu_ip_actual: string }> {
    return this.http.get<{ data: any; tu_ip_actual: string }>(`${this.base}/${orgId}/configuracion-seguridad`);
  }

  guardarConfiguracionSeguridad(orgId: number, payload: any): Observable<{ mensaje: string; data: any }> {
    return this.http.put<{ mensaje: string; data: any }>(`${this.base}/${orgId}/configuracion-seguridad`, payload);
  }

  // --- SaaS: Liquidaciones Mensuales (Facturación a Hoteles) ---
  listarLiquidaciones(): Observable<{ data: LiquidacionSaas[] }> {
    return this.http.get<{ data: LiquidacionSaas[] }>(`${this.base}/liquidaciones`);
  }

  generarLiquidaciones(): Observable<{ mensaje: string; periodo: string; hoteles_procesados: number }> {
    return this.http.post<{ mensaje: string; periodo: string; hoteles_procesados: number }>(`${this.base}/liquidaciones/generar`, {});
  }

  marcarLiquidacionPagada(id: number): Observable<{ mensaje: string; estado: string; fecha_pago: string }> {
    return this.http.patch<{ mensaje: string; estado: string; fecha_pago: string }>(`${this.base}/liquidaciones/${id}/pagar`, {});
  }

  // --- SaaS: Comunicados Masivos de Plataforma (Broadcast) ---
  listarAnunciosActivos(): Observable<{ data: AnuncioSaas[] }> {
    return this.http.get<{ data: AnuncioSaas[] }>(`${this.base}/anuncios/activos`);
  }

  crearAnuncio(payload: { titulo: string; mensaje: string; tipo: string; dias_vigencia: number }): Observable<{ mensaje: string; data: AnuncioSaas }> {
    return this.http.post<{ mensaje: string; data: AnuncioSaas }>(`${this.base}/anuncios`, payload);
  }

  eliminarAnuncio(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.base}/anuncios/${id}`);
  }

  // --- SaaS: Métricas Reales, Reservas, Clientes y Auditoría de Plataforma ---
  resumenGlobal(): Observable<{ resumen: any; hoteles: any[] }> {
    return this.http.get<{ resumen: any; hoteles: any[] }>(`${this.base}/resumen-global`);
  }

  reservasPlataforma(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/reservas-plataforma`);
  }

  clientesGlobales(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/clientes-globales`);
  }

  auditoriaLogs(): Observable<{ eventos: any[]; alertas: any[] }> {
    return this.http.get<{ eventos: any[]; alertas: any[] }>(`${this.base}/auditoria-logs`);
  }

  // --- SaaS: Herramienta 'Login Como' (Impersonación de Soporte) ---
  impersonar(orgId: number): Observable<ImpersonarResponse> {
    return this.http.post<ImpersonarResponse>(`${this.base}/${orgId}/impersonar`, {}).pipe(
      tap((res) => {
        this.fijarOrgActiva(res.data.organizacion);
        localStorage.setItem(MODO_SOPORTE_KEY, 'true');
        this._modoSoporte.set(true);
      })
    );
  }

  salirModoSoporte(): void {
    localStorage.removeItem(MODO_SOPORTE_KEY);
    this._modoSoporte.set(false);
  }

  fijarOrgActiva(organizacion: Organizacion): void {
    localStorage.setItem(ORG_ACTIVA_KEY, JSON.stringify(organizacion));
    this._orgActiva.set(organizacion);
  }

  /** Roles del miembro dentro de la organización activa — vienen de misOrganizaciones(). */
  fijarRolesActivos(roles: string[]): void {
    localStorage.setItem(ROLES_ACTIVOS_KEY, JSON.stringify(roles));
    this._rolesActivos.set(roles);
  }

  obtenerNotificacionesInteligentes(orgId: number): Observable<{
    ok: boolean;
    hotel: string;
    total_alertas: number;
    resumen: {
      limpieza_pendientes: number;
      mantenimiento_pendientes: number;
      checkins_hoy: number;
      checkouts_hoy: number;
      stock_critico_count: number;
    };
    notificaciones: {
      id: string;
      categoria: string;
      tipo: string;
      titulo: string;
      detalle: string;
      icono: string;
      color: string;
      ruta: string;
      accion: string;
    }[];
  }> {
    return this.http.get<any>(`${this.base}/${orgId}/notificaciones-inteligentes`);
  }

  consultarEstadoSuscripcion(orgId: number): Observable<{
    ok: boolean;
    data: {
      bloqueado: boolean;
      en_periodo_gracia: boolean;
      horas_restantes_gracia: number;
      estado: string;
      plan_nombre: string;
      precio_mensual: number;
      fecha_fin: string | null;
    };
  }> {
    return this.http.get<any>(`${this.base}/${orgId}/estado-suscripcion`);
  }

  limpiarOrgActiva(): void {
    localStorage.removeItem(ORG_ACTIVA_KEY);
    localStorage.removeItem(ROLES_ACTIVOS_KEY);
    localStorage.removeItem(MODO_SOPORTE_KEY);
    this._orgActiva.set(null);
    this._rolesActivos.set([]);
    this._modoSoporte.set(false);
  }

  private leerOrgActiva(): Organizacion | null {
    const raw = localStorage.getItem(ORG_ACTIVA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Organizacion;
    } catch {
      return null;
    }
  }

  private leerRolesActivos(): string[] {
    const raw = localStorage.getItem(ROLES_ACTIVOS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
}