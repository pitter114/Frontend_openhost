import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PmsDataService } from '../../core/services/pms-data.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { EstadoHabitacion, Reserva } from '../../core/models/pms.models';
import { AlojamientoTarjeta } from '../../core/models/estadisticas.models';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';
import { ReservaFormComponent } from '../reservas/reserva-form/reserva-form.component';

export type VistaRango = '7' | '14' | 'mes';

export interface HabItem {
  id: string | number;
  nombre: string;
  tipo: string;
  precio: number;
  rawAlojamiento?: AlojamientoTarjeta;
}

export interface DiaCalendario {
  num: number;
  monthShort: string;
  isToday: boolean;
  isWeekend: boolean;
  dow: string;
  dowLong: string;
  dateStr: string;
  fullDate: Date;
}

const ESTADO_COLOR: Record<EstadoHabitacion, string> = {
  Disponible: '#10b981',
  Reservada: '#3b6bf6',
  Ocupada: '#8b5cf6',
  Limpieza: '#f59e0b',
  Mantenimiento: '#ef4444',
  'Fuera de servicio': '#64748b',
};

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    LoadingModalComponent,
    ReservaFormComponent,
  ],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
})
export class CalendarioComponent implements OnInit {
  public data = inject(PmsDataService);
  private estadisticasService = inject(EstadisticasService);
  private orgService = inject(OrganizacionService);

  viewDate = new Date();
  vistaRango = signal<VistaRango>('14'); // Por defecto 14 días: balance perfecto entre visibilidad y contexto
  filtroTexto = signal<string>('');
  alojamientos = signal<AlojamientoTarjeta[]>([]);
  cargandoAlojamientos = signal<boolean>(false);

  // Modal Detalle de Reserva
  reservaSeleccionada = signal<Reserva | null>(null);

  // Modal Nueva Reserva desde celda vacía
  habitacionParaReserva = signal<AlojamientoTarjeta | null>(null);

  ngOnInit(): void {
    // Si la pantalla es pequeña (móvil), iniciar en 7 días para máxima claridad
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.vistaRango.set('7');
    }
    this.data.cargarReservas();
    this.cargarAlojamientos();
  }

  setVistaRango(v: VistaRango): void {
    this.vistaRango.set(v);
  }

  cargarAlojamientos(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.cargandoAlojamientos.set(true);
    this.estadisticasService.alojamientos(orgId).subscribe({
      next: (res) => {
        this.cargandoAlojamientos.set(false);
        if (res?.data) {
          this.alojamientos.set(res.data);
        }
      },
      error: () => {
        this.cargandoAlojamientos.set(false);
      },
    });
  }

  get rangeLabel(): string {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (this.vistaRango() === 'mes') {
      return this.viewDate
        .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        .replace(/^\w/, (c) => c.toUpperCase());
    }

    const currentDays = this.days;
    if (currentDays.length === 0) return '';
    const first = currentDays[0];
    const last = currentDays[currentDays.length - 1];

    if (first.monthShort === last.monthShort) {
      return `${first.num} - ${last.num} ${monthNames[first.fullDate.getMonth()]} ${first.fullDate.getFullYear()}`;
    }
    return `${first.num} ${first.monthShort} - ${last.num} ${last.monthShort} ${last.fullDate.getFullYear()}`;
  }

  get daysInMonth(): number {
    return new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0).getDate();
  }

  get days(): DiaCalendario[] {
    const dowLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const dowLongList = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (this.vistaRango() === 'mes') {
      const year = this.viewDate.getFullYear();
      const month = this.viewDate.getMonth();
      const daysCount = this.daysInMonth;

      return Array.from({ length: daysCount }, (_, i) => {
        const dayNum = i + 1;
        const d = new Date(year, month, dayNum);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return {
          num: dayNum,
          monthShort: monthNames[month],
          isToday: dateStr === todayStr,
          isWeekend,
          dow: dowLetters[d.getDay()],
          dowLong: dowLongList[d.getDay()],
          dateStr,
          fullDate: d,
        };
      });
    } else {
      const count = this.vistaRango() === '7' ? 7 : 14;
      const baseDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), this.viewDate.getDate());

      return Array.from({ length: count }, (_, i) => {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dayNum = d.getDate();
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return {
          num: dayNum,
          monthShort: monthNames[m],
          isToday: dateStr === todayStr,
          isWeekend,
          dow: dowLetters[d.getDay()],
          dowLong: dowLongList[d.getDay()],
          dateStr,
          fullDate: d,
        };
      });
    }
  }

  shift(delta: number): void {
    if (this.vistaRango() === 'mes') {
      this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + delta, 1);
    } else {
      const step = this.vistaRango() === '7' ? 7 : 14;
      this.viewDate = new Date(
        this.viewDate.getFullYear(),
        this.viewDate.getMonth(),
        this.viewDate.getDate() + delta * step
      );
    }
  }

  irAHoy(): void {
    this.viewDate = new Date();
  }

  get habitacionesLista(): HabItem[] {
    if (this.alojamientos().length > 0) {
      return this.alojamientos().map((a) => ({
        id: a.alojamiento_id,
        nombre: a.etiqueta_unidad,
        tipo: a.tipo_alojamiento,
        precio: a.precio_base,
        rawAlojamiento: a,
      }));
    }

    return this.data.habitaciones.map((h) => ({
      id: h.numero,
      nombre: `Hab. ${h.numero}`,
      tipo: h.tipo,
      precio: h.precioNoche,
    }));
  }

  get habitacionesFiltradas(): HabItem[] {
    const query = this.filtroTexto().trim().toLowerCase();
    if (!query) return this.habitacionesLista;
    return this.habitacionesLista.filter(
      (h) => h.nombre.toLowerCase().includes(query) || h.tipo.toLowerCase().includes(query)
    );
  }

  get reservasEnRango(): number {
    const currentDays = this.days;
    if (currentDays.length === 0) return 0;
    const startStr = currentDays[0].dateStr;
    const endStr = currentDays[currentDays.length - 1].dateStr;

    return this.data.reservas.filter((r) => {
      const inDate = r.checkIn?.substring(0, 10);
      const outDate = r.checkOut?.substring(0, 10);
      if (!inDate || !outDate) return false;
      return inDate <= endStr && outDate >= startStr;
    }).length;
  }

  getReservaForCell(hab: HabItem, dateStr: string): Reserva | null {
    const reservas = this.data.reservas;
    if (!reservas || reservas.length === 0) return null;

    return (
      reservas.find((r) => {
        const inDate = r.checkIn?.substring(0, 10);
        const outDate = r.checkOut?.substring(0, 10);
        if (!inDate || !outDate) return false;
        if (dateStr < inDate || dateStr > outDate) return false;

        // Coincidencia por ID de alojamiento
        if (hab.rawAlojamiento && r.alojamiento_id && r.alojamiento_id === hab.rawAlojamiento.alojamiento_id) {
          return true;
        }

        // Coincidencia por nombre o etiqueta
        const rHab = r.habitacion?.trim().toLowerCase();
        const habNombre = hab.nombre?.trim().toLowerCase();
        const rawNombre = hab.rawAlojamiento?.etiqueta_unidad?.trim().toLowerCase();
        const habId = String(hab.id).trim().toLowerCase();

        return (
          rHab === habNombre ||
          rHab === rawNombre ||
          rHab === habId ||
          (rHab && habNombre?.includes(rHab))
        );
      }) ?? null
    );
  }

  isReservaStart(res: Reserva, dateStr: string): boolean {
    const inDate = res.checkIn?.substring(0, 10);
    const currentDays = this.days;
    const firstDate = currentDays.length > 0 ? currentDays[0].dateStr : '';
    return inDate === dateStr || dateStr === firstDate;
  }

  isReservaEnd(res: Reserva, dateStr: string): boolean {
    const outDate = res.checkOut?.substring(0, 10);
    const currentDays = this.days;
    const lastDate = currentDays.length > 0 ? currentDays[currentDays.length - 1].dateStr : '';
    return outDate === dateStr || dateStr === lastDate;
  }

  getReservaColor(res: Reserva): string {
    const estado = res.estado?.toLowerCase() || '';
    if (estado.includes('confirm') || estado.includes('reserv')) return '#3b82f6';
    if (estado.includes('casa') || estado.includes('ocup')) return '#8b5cf6';
    if (estado.includes('pagad') || estado.includes('complet')) return '#10b981';
    if (estado.includes('verific') || estado.includes('pend')) return '#f59e0b';
    if (estado.includes('cancel')) return '#ef4444';
    return '#3b82f6';
  }

  abrirDetalleReserva(res: Reserva, event: Event): void {
    event.stopPropagation();
    this.reservaSeleccionada.set(res);
  }

  cerrarDetalle(): void {
    this.reservaSeleccionada.set(null);
  }

  crearReservaEnFecha(hab: HabItem, dateStr: string): void {
    if (hab.rawAlojamiento) {
      this.habitacionParaReserva.set(hab.rawAlojamiento);
    } else {
      const mockAloj: AlojamientoTarjeta = {
        alojamiento_id: Number(hab.id) || 1,
        etiqueta_unidad: hab.nombre,
        tipo_alojamiento: hab.tipo,
        precio_base: hab.precio,
        estados: ['disponible'],
        reserva: null,
      };
      this.habitacionParaReserva.set(mockAloj);
    }
  }

  cerrarReservaForm(): void {
    this.habitacionParaReserva.set(null);
    this.data.cargarReservas(true);
    this.cargarAlojamientos();
  }

  legend = [
    { label: 'Reservada / Confirmada', color: '#3b82f6' },
    { label: 'Ocupada / En Casa', color: '#8b5cf6' },
    { label: 'Pagada / Completada', color: '#10b981' },
    { label: 'Por Verificar / Pendiente', color: '#f59e0b' },
    { label: 'Cancelada', color: '#ef4444' },
  ];
}
