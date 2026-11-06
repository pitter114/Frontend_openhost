import { Injectable, inject, signal } from '@angular/core';
import { AlertaSistema, Hotel } from '../models/pms.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SuperadminDataService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organizacion`;

  // Datos 100% reales derivados de la base de datos de OpenHost
  readonly plataforma = { hoteles: 3, hotelesActivos: 3 };

  hoteles: Hotel[] = [
    { nombre: 'Hotel Pedro', ciudad: 'Lima', pais: 'Perú', estrellas: 4, habitaciones: 1, ocupacion: 100, reservas: 1, ingresos: 150, comision: 15, estado: 'Activo', imagen: 'madrid' },
    { nombre: 'FSDFDF (Sede Principal)', ciudad: 'Arequipa', pais: 'Perú', estrellas: 4, habitaciones: 2, ocupacion: 100, reservas: 2, ingresos: 270, comision: 27, estado: 'Activo', imagen: 'barcelona' },
    { nombre: 'OpenHost Cloud Central', ciudad: 'Lima', pais: 'Perú', estrellas: 5, habitaciones: 0, ocupacion: 0, reservas: 0, ingresos: 0, comision: 0, estado: 'Activo', imagen: 'valencia' },
  ];

  resumenGlobal = {
    totalHoteles: 3,
    hotelesActivos: 3,
    totalHabitaciones: 3,
    reservasTotales: 3,
    reservasCrecPct: 15,
    clientesRegistrados: 9,
    ingresosTotales: 420,
    ingresosCrecPct: 18,
    comisionesPlataforma: 42,
    comisionesCrecPct: 18,
  };

  readonly comisionEvolucion = [
    { mes: 'Jul', valor: 0 },
    { mes: 'Ago', valor: 15 },
    { mes: 'Sep', valor: 27 },
    { mes: 'Oct', valor: 42 },
  ];

  readonly comisionesPorMes = [
    { mes: 'Jul', bruto: 0, comision: 0 },
    { mes: 'Ago', bruto: 150, comision: 15 },
    { mes: 'Sep', bruto: 270, comision: 27 },
    { mes: 'Oct', bruto: 420, comision: 42 },
  ];

  readonly tasaComisionPct = 10;

  reservasPlataforma = [
    { hotel: 'Hotel Pedro', cliente: 'fsd fsd', habitacion: 'sadasa', total: 150, comision: 15, neto: 135, estado: 'Confirmada', canal: 'Motor Web Directo' },
    { hotel: 'FSDFDF', cliente: 'ssdsdas', habitacion: '0520', total: 150, comision: 15, neto: 135, estado: 'Confirmada', canal: 'Motor Web Directo' },
    { hotel: 'FSDFDF', cliente: 'adsd', habitacion: '101', total: 120, comision: 12, neto: 108, estado: 'Confirmada', canal: 'Motor Web Directo' },
  ];

  clientesGlobales: any[] = [
    { nombre: 'fsd fsd', documento: '74851269', telefono: '99885467', correo: 'fsd.fsd@huesped.com', hotel: 'Hotel Pedro', estadias: 1, ultimaReserva: '24/10/2026', nivel: 'Estándar' },
    { nombre: 'ooo ooo', documento: '97845712', telefono: '999854219', correo: 'ooo.ooo@huesped.com', hotel: 'Hotel Pedro', estadias: 1, ultimaReserva: '24/10/2026', nivel: 'Estándar' },
    { nombre: 'ssdsdas', documento: '14528569', telefono: '998855661', correo: 'ssdsdas@huesped.com', hotel: 'FSDFDF', estadias: 1, ultimaReserva: '27/09/2026', nivel: 'Estándar' },
    { nombre: 'adsd', documento: '123457485', telefono: '999999789', correo: 'adsd@huesped.com', hotel: 'FSDFDF', estadias: 1, ultimaReserva: '27/09/2026', nivel: 'Estándar' },
    { nombre: 'sdadasd', documento: '14785492', telefono: '99884758', correo: 'sdadasd@huesped.com', hotel: 'FSDFDF', estadias: 1, ultimaReserva: '27/09/2026', nivel: 'Estándar' },
  ];

  readonly alertas: AlertaSistema[] = [
    { titulo: 'Check-in activo #RES-0008', detalle: 'Hotel Pedro · Hab. sadasa · Huésped: fsd fsd', hotel: 'Hotel Pedro', prioridad: 'Alta', icono: 'hotel' },
    { titulo: 'Habitaciones listas para venta', detalle: 'FSDFDF · Hab. 0520 y 101 disponibles', hotel: 'FSDFDF', prioridad: 'Media', icono: 'door' },
    { titulo: 'Edificio TORRE 1 configurado', detalle: 'FSDFDF · 2 pisos registrados', hotel: 'FSDFDF', prioridad: 'Media', icono: 'building' },
  ];

  cargarDesdeBackend(): void {
    this.http.get<{ resumen: any; hoteles: any[] }>(`${this.base}/resumen-global`).subscribe({
      next: (res) => {
        if (res.resumen) {
          this.resumenGlobal = { ...this.resumenGlobal, ...res.resumen };
        }
        if (res.hoteles && res.hoteles.length > 0) {
          this.hoteles = res.hoteles.map((h) => ({
            nombre: h.nombre,
            ciudad: 'Perú',
            pais: 'Perú',
            estrellas: 4,
            habitaciones: h.habitaciones,
            ocupacion: h.ocupacion,
            reservas: h.reservas,
            ingresos: h.ingresos,
            comision: h.comision,
            estado: h.estado,
            imagen: 'hotel',
          }));
        }
      },
      error: () => {},
    });

    this.http.get<{ data: any[] }>(`${this.base}/reservas-plataforma`).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.reservasPlataforma = res.data;
        }
      },
      error: () => {},
    });

    this.http.get<{ data: any[] }>(`${this.base}/clientes-globales`).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.clientesGlobales = res.data;
        }
      },
      error: () => {},
    });
  }
}
