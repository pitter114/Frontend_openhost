import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { TiendaService, HorariosHotel } from '../../core/services/tienda.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { AreaChartComponent, AreaSeries } from '../../shared/charts/area-chart/area-chart.component';
import { BarChartComponent, BarSeries } from '../../shared/charts/bar-chart/bar-chart.component';
import { DonutChartComponent, DonutSegment } from '../../shared/charts/donut-chart/donut-chart.component';
import { HbarListComponent, HBarItem } from '../../shared/charts/hbar-list/hbar-list.component';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';
import {
  ClientesNuevosRecurrentesPunto,
  EstadisticasPanel,
  OcupacionMensualPunto,
  TopAlojamiento,
} from '../../core/models/estadisticas.models';

interface KpiCard {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sub?: string;
}

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    AreaChartComponent,
    BarChartComponent,
    DonutChartComponent,
    HbarListComponent,
    LoadingModalComponent,
  ],
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
})
export class PanelComponent implements OnInit {
  private estadisticasService = inject(EstadisticasService);
  private orgService = inject(OrganizacionService);
  private tiendaService = inject(TiendaService);

  cargando = signal(true);
  error = signal<string | null>(null);

  // Horarios & Check-Out Automático
  horarios = signal<HorariosHotel | null>(null);
  mostrarModalHorarios = signal(false);
  guardandoHorarios = signal(false);
  ejecutandoCheckout = signal(false);
  mensajeCheckout = signal<string | null>(null);

  formHorarios = {
    hora_check_in: '14:00',
    hora_check_out: '12:00',
    checkout_automatico: true,
    checkout_tolerancia_minutos: 30,
  };

  private stats = signal<EstadisticasPanel | null>(null);
  private clientesData = signal<ClientesNuevosRecurrentesPunto[]>([]);
  private topAlojamientosData = signal<TopAlojamiento[]>([]);
  private ocupacionMensualData = signal<OcupacionMensualPunto[]>([]);

  constructor(public data: PmsDataService) {}

  ngOnInit(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.cargarDatos(orgId);
    this.cargarHorarios(orgId);
  }

  cargarDatos(orgId: number): void {
    this.cargando.set(true);
    this.error.set(null);

    Promise.all([
      this.estadisticasService.panel(orgId).toPromise(),
      this.estadisticasService.clientesNuevosVsRecurrentes(orgId).toPromise(),
      this.estadisticasService.topAlojamientos(orgId, 5).toPromise(),
      this.estadisticasService.ocupacionMensual(orgId).toPromise(),
    ])
      .then(([panel, clientes, top, ocupacion]) => {
        this.stats.set(panel?.data ?? null);
        this.clientesData.set(clientes?.data ?? []);
        this.topAlojamientosData.set(top?.data ?? []);
        this.ocupacionMensualData.set(ocupacion?.data ?? []);
        this.cargando.set(false);
      })
      .catch((err) => {
        this.cargando.set(false);
        this.error.set(
          err?.status === 403
            ? 'Tu rol no tiene acceso a las estadísticas del panel.'
            : 'No pudimos cargar las estadísticas.'
        );
      });
  }

  cargarHorarios(orgId: number): void {
    this.tiendaService.obtenerHorarios(orgId).subscribe({
      next: (res) => {
        if (res.data) {
          this.horarios.set(res.data);
          this.formHorarios = {
            hora_check_in: res.data.hora_check_in || '14:00',
            hora_check_out: res.data.hora_check_out || '12:00',
            checkout_automatico: !!res.data.checkout_automatico,
            checkout_tolerancia_minutos: res.data.checkout_tolerancia_minutos ?? 30,
          };
        }
      },
      error: () => {},
    });
  }

  abrirModalHorarios(): void {
    const h = this.horarios();
    if (h) {
      this.formHorarios = {
        hora_check_in: h.hora_check_in || '14:00',
        hora_check_out: h.hora_check_out || '12:00',
        checkout_automatico: !!h.checkout_automatico,
        checkout_tolerancia_minutos: h.checkout_tolerancia_minutos ?? 30,
      };
    }
    this.mostrarModalHorarios.set(true);
  }

  cerrarModalHorarios(): void {
    this.mostrarModalHorarios.set(false);
  }

  guardarHorarios(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.guardandoHorarios.set(true);
    this.tiendaService.actualizarHorarios(orgId, this.formHorarios).subscribe({
      next: (res) => {
        this.guardandoHorarios.set(false);
        if (res.data) {
          this.horarios.set(res.data);
        }
        this.cerrarModalHorarios();
      },
      error: () => {
        this.guardandoHorarios.set(false);
      },
    });
  }

  ejecutarCheckoutManual(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.ejecutandoCheckout.set(true);
    this.mensajeCheckout.set(null);

    this.tiendaService.ejecutarCheckoutManual(orgId).subscribe({
      next: (res) => {
        this.ejecutandoCheckout.set(false);
        this.mensajeCheckout.set(res.detalle || res.mensaje || 'Check-out automático ejecutado con éxito.');
        this.cargarDatos(orgId);
        setTimeout(() => this.mensajeCheckout.set(null), 7000);
      },
      error: (err) => {
        this.ejecutandoCheckout.set(false);
        this.mensajeCheckout.set(err?.error?.mensaje || 'Error al ejecutar el check-out automático.');
        setTimeout(() => this.mensajeCheckout.set(null), 6000);
      },
    });
  }

  // --- Alertas del Sistema Reales y Dinámicas ---
  alertasSistema = computed(() => {
    const s = this.stats();
    const h = this.horarios();
    const items: {
      tipo: 'info' | 'warning' | 'alert' | 'success';
      color: 'blue' | 'purple' | 'amber' | 'red';
      icono: string;
      texto: string;
    }[] = [];

    if (!s) return items;

    // 1. Check-ins programados de hoy
    const checkins = s.reservas.checkin_hoy ?? 0;
    if (checkins > 0) {
      const horaStr = h?.hora_check_in ? ` (Ingreso estándar: ${h.hora_check_in})` : '';
      items.push({
        tipo: 'info',
        color: 'blue',
        icono: 'login',
        texto: `${checkins} Check-In${checkins > 1 ? 's' : ''} pendiente${checkins > 1 ? 's' : ''} de ingreso hoy${horaStr}.`,
      });
    }

    // 2. Check-outs pendientes de hoy
    const checkouts = s.reservas.checkout_hoy ?? 0;
    if (checkouts > 0) {
      const horaOut = h?.hora_check_out ? ` (Límite: ${h.hora_check_out})` : '';
      items.push({
        tipo: 'warning',
        color: 'purple',
        icono: 'logout',
        texto: `${checkouts} Check-Out${checkouts > 1 ? 's' : ''} por desocupar habitación hoy${horaOut}.`,
      });
    }

    // 3. Habitaciones en limpieza
    const enLimpieza = s.alojamientos.en_limpieza ?? 0;
    if (enLimpieza > 0) {
      items.push({
        tipo: 'alert',
        color: 'amber',
        icono: 'sparkles',
        texto: `${enLimpieza} habitaci${enLimpieza > 1 ? 'ones están sucias /' : 'ón está sucia /'} en espera de mucama.`,
      });
    }

    // 4. Habitaciones en mantenimiento
    const mant = s.alojamientos.mantenimiento ?? 0;
    if (mant > 0) {
      items.push({
        tipo: 'alert',
        color: 'red',
        icono: 'wrench',
        texto: `${mant} habitaci${mant > 1 ? 'ones bloqueadas' : 'ón bloqueada'} por avería o mantenimiento.`,
      });
    }

    // 5. Stock crítico de artículos o tienda
    const stockCritico = s.alertas?.stock_critico ?? [];
    if (stockCritico.length > 0) {
      const lista = stockCritico.map((p) => `${p.nombre} (${p.stock_actual} unid.)`).join(', ');
      items.push({
        tipo: 'warning',
        color: 'amber',
        icono: 'box',
        texto: `Stock crítico en productos: ${lista}.`,
      });
    }

    return items;
  });

  rowOne = computed<KpiCard[]>(() => {
    const a = this.stats()?.alojamientos;
    return [
      { icon: 'bed', iconBg: '#e9efff', iconColor: '#3b6bf6', value: String(a?.total ?? '—'), label: 'Alojamientos Totales' },
      { icon: 'users', iconBg: '#f2edfe', iconColor: '#8b5cf6', value: String(a?.ocupados ?? '—'), label: 'Ocupados' },
      { icon: 'calendar', iconBg: '#e9f9ef', iconColor: '#17a34a', value: String(a?.disponibles ?? '—'), label: 'Disponibles' },
      { icon: 'sparkles', iconBg: '#fdf3e0', iconColor: '#f2a30f', value: String(a?.en_limpieza ?? '—'), label: 'En Limpieza' },
      { icon: 'wrench', iconBg: '#fdecec', iconColor: '#e0342c', value: String(a?.mantenimiento ?? '—'), label: 'Mantenimiento' },
    ];
  });

  rowTwo = computed<KpiCard[]>(() => {
    const s = this.stats();
    const fmt = (n: number | undefined) => (n === undefined ? '—' : `${n.toLocaleString('es-ES')} S/`);
    return [
      { icon: 'calendar', iconBg: '#e4f7fa', iconColor: '#0ea5b7', value: String(s?.reservas.checkin_hoy ?? '—'), label: 'Check-ins de Hoy' },
      { icon: 'dollar', iconBg: '#e9f9ef', iconColor: '#17a34a', value: fmt(s?.finanzas.ingresos_dia), label: 'Ingresos del Día' },
      { icon: 'chart', iconBg: '#e9efff', iconColor: '#3b6bf6', value: fmt(s?.finanzas.ingresos_mes), label: 'Ingresos del Mes' },
      { icon: 'chart', iconBg: '#fdecec', iconColor: '#e0342c', value: fmt(s?.finanzas.egresos_mes), label: 'Egresos del Mes' },
      { icon: 'wallet', iconBg: '#f2edfe', iconColor: '#8b5cf6', value: fmt(s?.finanzas.utilidad_mes), label: 'Utilidad Neta', sub: 'Este mes' },
    ];
  });

  // ---- Reales (conectadas al backend) ----

  clientesSeries = computed<BarSeries[]>(() => [
    { name: 'Nuevos', color: '#3b6bf6', values: this.clientesData().map((d) => d.nuevos) },
    { name: 'Recurrentes', color: '#17a34a', values: this.clientesData().map((d) => d.recurrentes) },
  ]);
  clientesLabels = computed(() => this.clientesData().map((d) => d.mes));

  topAlojamientosItems = computed<HBarItem[]>(() => {
    const items = this.topAlojamientosData();
    const max = Math.max(1, ...items.map((i) => i.ingresos));
    return items.map((h) => ({
      label: h.etiqueta_unidad,
      sublabel: `${h.total_reservas} reservas`,
      value: `${h.ingresos.toLocaleString('es-ES')} S/`,
      pct: Math.round((h.ingresos / max) * 100),
      color: '#3b6bf6',
    }));
  });

  ocupacionRateSeries = computed<AreaSeries[]>(() => [
    { name: 'Ocupación', color: '#8b5cf6', values: this.ocupacionMensualData().map((d) => d.tasa_ocupacion) },
  ]);
  ocupacionRateLabels = computed(() => this.ocupacionMensualData().map((d) => d.mes));

  // ---- Todavía mock (sin endpoint en el backend) ----

  get ocupacionSeries(): AreaSeries[] {
    return [
      { name: 'Ingresos', color: '#3b6bf6', values: this.data.ocupacionMensual.map((d) => d.ingresos) },
      { name: 'Salidas', color: '#e0342c', values: this.data.ocupacionMensual.map((d) => d.salidas), fill: false },
    ];
  }
  get ocupacionLabels(): string[] {
    return this.data.ocupacionMensual.map((d) => d.mes);
  }
  get canalSegments(): DonutSegment[] {
    return this.data.reservasPorCanal.map((c) => ({ label: c.canal, pct: c.pct, color: c.color }));
  }
}