import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrganizacionService } from './organizacion.service';
import { environment } from '../../../environments/environment';
import {
  ArticuloInventario,
  Cliente,
  Habitacion,
  Incidencia,
  MovimientoCaja,
  Reserva,
  TareaLimpieza,
} from '../models/pms.models';

@Injectable({ providedIn: 'root' })
export class PmsDataService {
  private http = inject(HttpClient);
  private orgService = inject(OrganizacionService);

  private readonly _reservas = signal<Reserva[]>([]);
  readonly cargandoReservas = signal(false);

  get hotelNombre(): string {
    return this.orgService.orgActiva()?.nombre_comercial || 'HotelPMS';
  }

  get reservas(): Reserva[] {
    return this._reservas();
  }

  constructor() {
    this.cargarReservas();
  }

  cargarReservas(force = false): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    // Solo consultar reservas si el usuario posee roles autorizados para ver reservas
    const roles = this.orgService.rolesActivos().map((r) => r.toLowerCase());
    const rolesConAcceso = ['propietario', 'gerente', 'administrador', 'supervisor', 'recepcionista', 'caja', 'openhost-super-admin', 'openhost-admin'];
    
    // Si tiene roles definidos y ninguno de ellos está autorizado, no intentar cargar reservas (evita 403)
    if (roles.length > 0 && !roles.some((r) => rolesConAcceso.includes(r))) {
      return;
    }

    if (this.cargandoReservas() && !force) return;

    this.cargandoReservas.set(true);
    this.http.get<{ data: Reserva[] }>(`${environment.apiUrl}/organizacion/${orgId}/reservas`).subscribe({
      next: (res) => {
        this.cargandoReservas.set(false);
        if (res?.data) {
          this._reservas.set(res.data);
        }
      },
      error: (err) => {
        this.cargandoReservas.set(false);
        if (err?.status !== 403) {
          console.error('Error al cargar reservas de la base de datos', err);
        }
      },
    });
  }

  cambiarEstadoReserva(reservaId: number, estado: string, callback?: () => void): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.http.patch(`${environment.apiUrl}/organizacion/${orgId}/reservas/${reservaId}/estado`, { estado }).subscribe({
      next: () => {
        this.cargarReservas(true);
        if (callback) callback();
      },
      error: (err) => console.error('Error al cambiar estado de reserva', err),
    });
  }

  eliminarReserva(reservaId: number, callback?: () => void): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.http.delete(`${environment.apiUrl}/organizacion/${orgId}/reservas/${reservaId}`).subscribe({
      next: () => {
        this.cargarReservas(true);
        if (callback) callback();
      },
      error: (err) => console.error('Error al eliminar reserva', err),
    });
  }

  actualizarReserva(reservaId: number, payload: any, callback?: () => void): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.http.put(`${environment.apiUrl}/organizacion/${orgId}/reservas/${reservaId}`, payload).subscribe({
      next: () => {
        this.cargarReservas(true);
        if (callback) callback();
      },
      error: (err) => console.error('Error al actualizar reserva', err),
    });
  }

  readonly habitaciones: Habitacion[] = [
    { numero: '101', tipo: 'Habitación Estándar', estado: 'Ocupada', precioNoche: 120 },
    { numero: '102', tipo: 'Habitación Estándar', estado: 'Disponible', precioNoche: 120 },
    { numero: '103', tipo: 'Habitación Doble', estado: 'Limpieza', precioNoche: 140 },
    { numero: '104', tipo: 'Habitación Doble', estado: 'Reservada', precioNoche: 140 },
    { numero: '201', tipo: 'Suite Junior', estado: 'Ocupada', precioNoche: 220 },
    { numero: '202', tipo: 'Suite Junior', estado: 'Disponible', precioNoche: 220 },
    { numero: '203', tipo: 'Habitación Familiar', estado: 'Ocupada', precioNoche: 180 },
    { numero: '204', tipo: 'Habitación Familiar', estado: 'Mantenimiento', precioNoche: 180 },
    { numero: '301', tipo: 'Suite Ejecutiva', estado: 'Ocupada', precioNoche: 350 },
    { numero: '302', tipo: 'Suite Ejecutiva', estado: 'Reservada', precioNoche: 350 },
    { numero: '303', tipo: 'Suite Deluxe', estado: 'Disponible', precioNoche: 420 },
    { numero: '401', tipo: 'Suite Presidencial', estado: 'Ocupada', precioNoche: 850 },
    { numero: '402', tipo: 'Suite Presidencial', estado: 'Disponible', precioNoche: 850 },
    { numero: '501', tipo: 'Ático Penthouse', estado: 'Fuera de servicio', precioNoche: 1800 },
  ];

  readonly clientes: Cliente[] = [
    { nombre: 'Alejandro Martínez', documento: '12345678A', telefono: '+34 612 345 678', correo: 'a.martinez@email.com', nacionalidad: 'ESP', estadias: 28, gastado: 45200, ultimaVisita: '2024-11-19', frecuencia: 'Alta', vip: true },
    { nombre: 'Isabela Rodrigues', documento: 'PT987654B', telefono: '+351 912 654 321', correo: 'i.rodrigues@corp.pt', nacionalidad: 'POR', estadias: 19, gastado: 31800, ultimaVisita: '2024-11-30', frecuencia: 'Alta', vip: true },
    { nombre: 'Marco Bianchi', documento: 'IT654321C', telefono: '+39 335 765 4321', correo: 'marco.b@it.com', nacionalidad: 'Italia', estadias: 12, gastado: 19400, ultimaVisita: '2024-10-14', frecuencia: 'Media' },
    { nombre: 'Sarah Johnson', documento: 'US112233D', telefono: '+1 212 555 0189', correo: 's.johnson@co.com', nacionalidad: 'EST', estadias: 7, gastado: 12600, ultimaVisita: '2024-09-29', frecuencia: 'Media' },
    { nombre: 'Carlos García', documento: '87654321E', telefono: '+34 698 765 432', correo: 'c.garcia@email.es', nacionalidad: 'ESP', estadias: 4, gastado: 5800, ultimaVisita: '2023-06-09', frecuencia: 'Baja' },
    { nombre: 'Amelia Müller', documento: 'DE445566F', telefono: '+49 176 4455 667', correo: 'a.muller@corp.de', nacionalidad: 'Alemania', estadias: 15, gastado: 24500, ultimaVisita: '2024-11-27', frecuencia: 'Alta', vip: true },
    { nombre: 'Luis Fernández', documento: '33445566G', telefono: '+34 656 334 455', correo: 'luis.f@familia.com', nacionalidad: 'ESP', estadias: 3, gastado: 4200, ultimaVisita: '2024-12-09', frecuencia: 'Baja' },
    { nombre: 'Yuki Tanaka', documento: 'JP778899H', telefono: '+81 80 7788 990', correo: 'y.tanaka@jp.com', nacionalidad: 'JAP', estadias: 9, gastado: 16800, ultimaVisita: '2024-08-21', frecuencia: 'Media' },
  ];

  readonly inventario: ArticuloInventario[] = [
    { nombre: 'Jabón de baño', categoria: 'Higiene', unidades: 450, minimo: 100, estado: 'Stock Alto', fechaLey: '14/12/2024' },
    { nombre: 'Champú', categoria: 'Higiene', unidades: 38, minimo: 80, estado: 'Stock Bajo', fechaLey: '14/12/2024' },
    { nombre: 'Acondicionador', categoria: 'Higiene', unidades: 42, minimo: 80, estado: 'Stock Bajo', fechaLey: '14/12/2024' },
    { nombre: 'Cepillos de dientes', categoria: 'Higiene', unidades: 210, minimo: 50, estado: 'Stock Alto', fechaLey: '14/12/2024' },
    { nombre: 'Toallas de baño', categoria: 'Lencería', unidades: 65, minimo: 60, estado: 'Stock Medio', fechaLey: '14/12/2024' },
    { nombre: 'Toallas de mano', categoria: 'Lencería', unidades: 128, minimo: 80, estado: 'Stock Medio', fechaLey: '14/12/2024' },
  ];

  limpieza: TareaLimpieza[] = [];

  readonly incidencias: Incidencia[] = [
    { habitacion: '204', problema: 'Aire acondicionado no enfría correctamente', prioridad: 'Alta', responsable: 'Técnico HVAC', estado: 'En Proceso', fecha: '13 de diciembre de 2024' },
    { habitacion: '101', problema: 'Grifo de baño con fuga menor', prioridad: 'Medios de comunicación', responsable: 'Fontanero', estado: 'Abierto', fecha: '14 de diciembre de 2024' },
    { habitacion: '303', problema: 'Televisor no conecta a plataformas de streaming', prioridad: 'Baja', responsable: 'Electricista', estado: 'Abierto', fecha: '12 de diciembre de 2024' },
    { habitacion: '501', problema: 'Renovación completa de instalaciones.', prioridad: 'Alta', responsable: 'Empresa Obras', estado: 'En Proceso', fecha: '31 de octubre de 2024' },
    { habitacion: '201', problema: 'Cerradura electrónica falla intermitentemente', prioridad: 'Medios de comunicación', responsable: 'Cerrajero', estado: 'Cerrado', fecha: '09 dic 2024', resuelto: '10 de diciembre de 2024' },
  ];

  readonly movimientosCaja: MovimientoCaja[] = [
    { tipo: 'Ingreso', concepto: 'Servicio Spa Huésped 301', metodo: 'Tarjeta', monto: 220, hora: '15:30', usuario: 'Gerente del spa' },
    { tipo: 'Salida', concepto: 'Servicio de mantenimiento AC', metodo: 'Efectivo', monto: -450, hora: '16:00', usuario: 'Gerente' },
    { tipo: 'Ingreso', concepto: 'Pago Reserva GPM-2024-0897', metodo: 'Efectivo', monto: 360, hora: '14:20', usuario: 'Recepción administrativa' },
    { tipo: 'Salida', concepto: 'Nómina semanal personal', metodo: 'Transferencia', monto: -3200, hora: '17:00', usuario: 'Gerente' },
    { tipo: 'Ingreso', concepto: 'Consumo minibar Hab. 401', metodo: 'Tarjeta', monto: 85, hora: '13:00', usuario: 'Recepción administrativa' },
    { tipo: 'Salida', concepto: 'Compra suministros limpieza', metodo: 'Efectivo', monto: -320, hora: '11:30', usuario: 'Jefe de limpieza' },
  ];

  readonly ocupacionMensual = [
    { mes: 'Jul', ingresos: 240, salidas: 78 },
    { mes: 'Ago', ingresos: 262, salidas: 80 },
    { mes: 'Sep', ingresos: 235, salidas: 76 },
    { mes: 'Oct', ingresos: 228, salidas: 82 },
    { mes: 'Nov', ingresos: 232, salidas: 85 },
    { mes: 'Dic', ingresos: 284, salidas: 96 },
  ];

  readonly tasaOcupacion = [
    { mes: 'Jul', valor: 80 },
    { mes: 'Ago', valor: 92 },
    { mes: 'Sep', valor: 84 },
    { mes: 'Oct', valor: 79 },
    { mes: 'Nov', valor: 72 },
    { mes: 'Dic', valor: 87 },
  ];

  readonly clientesNuevosRecurrentes = [
    { mes: 'Jul', nuevos: 40, recurrentes: 62 },
    { mes: 'Ago', nuevos: 48, recurrentes: 70 },
    { mes: 'Sep', nuevos: 44, recurrentes: 55 },
    { mes: 'Oct', nuevos: 42, recurrentes: 68 },
    { mes: 'Nov', nuevos: 38, recurrentes: 78 },
    { mes: 'Dic', nuevos: 46, recurrentes: 82 },
  ];

  readonly topHabitaciones = [
    { nombre: 'Suite Presidencial 401', ingresos: 35700, reservas: 42, pct: 100 },
    { nombre: 'Suite Ejecutiva 301', ingresos: 13300, reservas: 38, pct: 37 },
    { nombre: 'Suite Ejecutiva 302', ingresos: 12250, reservas: 35, pct: 34 },
    { nombre: 'Suite Junior 201', ingresos: 11440, reservas: 52, pct: 32 },
    { nombre: 'Suite Deluxe 303', ingresos: 12180, reservas: 29, pct: 34 },
  ];

  readonly reservasPorCanal = [
    { canal: 'Directo', pct: 34, color: '#3b6bf6' },
    { canal: 'Booking.com', pct: 28, color: '#8b5cf6' },
    { canal: 'Expedia', pct: 16, color: '#17a34a' },
    { canal: 'Airbnb', pct: 12, color: '#f2870f' },
    { canal: 'Agencias', pct: 7, color: '#ec4899' },
    { canal: 'Propiedad web', pct: 3, color: '#0ea5b7' },
  ];
}
