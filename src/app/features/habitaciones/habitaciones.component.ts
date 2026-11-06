import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { EstablecimientoService } from '../../core/services/establecimiento.service';
import { LimpiezaService } from '../../core/services/limpieza.service';
import { MantenimientoService } from '../../core/services/mantenimiento.service';
import { AlojamientoTarjeta, EstadisticasAlojamientos, EstadoAlojamientoReal } from '../../core/models/estadisticas.models';
import { Establecimiento } from '../../core/models/establecimiento.models';
import { ReservaFormComponent } from '../reservas/reserva-form/reserva-form.component';
import { EstablecimientoFormComponent } from './establecimiento-form/establecimiento-form.component';
import { AlojamientoFormComponent } from './alojamiento-form/alojamiento-form.component';
import { ServiciosPanelComponent } from './servicios-panel/servicios-panel.component';
import { IcalModalComponent } from './ical-modal/ical-modal.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { ToastService } from '../../core/services/toast.service';

const ESTADO_META: Record<EstadoAlojamientoReal, { label: string; color: string }> = {
  disponible: { label: 'Disponible', color: '#17a34a' },
  ocupado: { label: 'Ocupada', color: '#8b5cf6' },
  reservado: { label: 'Reservada', color: '#3b6bf6' },
  en_limpieza: { label: 'Limpieza', color: '#f2a30f' },
  mantenimiento: { label: 'Mantenimiento', color: '#e0342c' },
  fuera_de_servicio: { label: 'Fuera de servicio', color: '#94a3b8' },
};

type Filtro = 'disponible' | 'ocupado' | 'reservado' | 'en_limpieza' | 'mantenimiento' | null;

@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReservaFormComponent,
    EstablecimientoFormComponent,
    AlojamientoFormComponent,
    ServiciosPanelComponent,
    IcalModalComponent,
    IconComponent,
  ],
  templateUrl: './habitaciones.component.html',
  styleUrls: ['./habitaciones.component.scss'],
})
export class HabitacionesComponent implements OnInit, OnDestroy {
  private estadisticasService = inject(EstadisticasService);
  private orgService = inject(OrganizacionService);
  private establecimientoService = inject(EstablecimientoService);
  private limpiezaService = inject(LimpiezaService);
  private mantenimientoService = inject(MantenimientoService);
  private toast = inject(ToastService);
  private pollTimer: any = null;

  constructor(public data: PmsDataService) {}

  cargando = signal(true);
  error = signal<string | null>(null);
  alojamientos = signal<AlojamientoTarjeta[]>([]);
  stats = signal<EstadisticasAlojamientos | null>(null);
  pagina = signal(1);
  totalPaginas = signal(1);
  filtro = signal<Filtro>(null);

  cargandoEstablecimientos = signal(true);
  establecimientos = signal<Establecimiento[]>([]);

  habitacionSeleccionada = signal<AlojamientoTarjeta | null>(null);
  alojamientoAEditar = signal<AlojamientoTarjeta | null>(null);
  mostrarFormEstablecimiento = signal(false);
  mostrarFormAlojamiento = signal(false);
  mostrarServicios = signal(false);
  alojamientoParaIcal = signal<AlojamientoTarjeta | null>(null);

  abrirIcal(h: AlojamientoTarjeta): void {
    this.alojamientoParaIcal.set(h);
  }

  cerrarIcal(): void {
    this.alojamientoParaIcal.set(null);
  }

  // --- Limpieza priority modal state ---
  modalLimpiezaAbierto = false;
  alojamientoParaLimpieza: AlojamientoTarjeta | null = null;
  prioridadLimpieza: 'Alta' | 'Media' | 'Baja' = 'Alta';
  notasLimpieza = '';
  enviandoLimpieza = false;

  // --- Mantenimiento modal state ---
  modalMantenimientoAbierto = false;
  alojamientoParaMantenimiento: AlojamientoTarjeta | null = null;
  motivoMantenimiento = '';
  prioridadMantenimiento: 'alta' | 'media' | 'baja' = 'media';
  enviandoMantenimiento = false;

  estadosFiltro: { key: Filtro; label: string }[] = [
    { key: null, label: 'Todos' },
    { key: 'disponible', label: 'Disponible' },
    { key: 'ocupado', label: 'Ocupada' },
    { key: 'reservado', label: 'Reservada' },
    { key: 'en_limpieza', label: 'Limpieza' },
    { key: 'mantenimiento', label: 'Mantenimiento' },
  ];

  nuevaReservaNotificacion = signal<{ cliente: string; unidad: string } | null>(null);

  private storageListener = (e: StorageEvent) => {
    if (e.key === 'pms_nueva_reserva_publica' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        this.nuevaReservaNotificacion.set({
          cliente: payload.cliente || 'el cliente',
          unidad: payload.unidad || 'su habitación',
        });
      } catch {}
    }
  };

  ngOnInit(): void {
    this.cargarEstablecimientos();
    this.cargarStats();
    this.cargarAlojamientos();

    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  aceptarNotificacionReserva(): void {
    this.nuevaReservaNotificacion.set(null);
    this.cargarStats();
    this.cargarAlojamientos();
  }

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  cargarEstablecimientos(): void {
    const orgId = this.orgId;
    if (!orgId) return;
    this.cargandoEstablecimientos.set(true);
    this.establecimientoService.listar(orgId).subscribe({
      next: (res) => {
        this.establecimientos.set(res.data);
        this.cargandoEstablecimientos.set(false);
      },
      error: () => this.cargandoEstablecimientos.set(false),
    });
  }

  cargarStats(): void {
    const orgId = this.orgId;
    if (!orgId) return;
    this.estadisticasService.estadisticasAlojamientos(orgId).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });
  }

  cargarAlojamientos(isSilent = false): void {
    const orgId = this.orgId;
    if (!orgId) return;

    if (!isSilent) {
      this.cargando.set(true);
      this.error.set(null);
    }

    this.estadisticasService
      .alojamientos(orgId, { filtro: this.filtro() ?? undefined, page: this.pagina() })
      .subscribe({
        next: (res) => {
          this.alojamientos.set(res.data);
          this.totalPaginas.set(res.last_page);
          if (!isSilent) this.cargando.set(false);
        },
        error: (err) => {
          if (!isSilent) {
            this.cargando.set(false);
            this.error.set(
              err?.status === 403
                ? 'Tu rol no tiene acceso a los alojamientos.'
                : 'No pudimos cargar los alojamientos.'
            );
          }
        },
      });
  }

  setFiltro(f: Filtro): void {
    this.filtro.set(f);
    this.pagina.set(1);
    this.cargarAlojamientos();
  }

  irAPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.cargarAlojamientos();
  }

  estadoPrincipal(a: AlojamientoTarjeta): EstadoAlojamientoReal {
    const prioridad: EstadoAlojamientoReal[] = ['mantenimiento', 'fuera_de_servicio', 'ocupado', 'reservado', 'en_limpieza', 'disponible'];
    return prioridad.find((e) => a.estados.includes(e)) ?? 'disponible';
  }

  label(estado: EstadoAlojamientoReal): string {
    return ESTADO_META[estado].label;
  }

  color(estado: EstadoAlojamientoReal): string {
    return ESTADO_META[estado].color;
  }

  abrirReserva(a: AlojamientoTarjeta): void {
    this.habitacionSeleccionada.set(a);
  }

  cerrarReserva(): void {
    this.habitacionSeleccionada.set(null);
    this.cargarStats();
    this.cargarAlojamientos();
  }

  abrirEditarAlojamiento(a: AlojamientoTarjeta, event: Event): void {
    event.stopPropagation();
    this.alojamientoAEditar.set(a);
    this.mostrarFormAlojamiento.set(true);
  }

  // --- Limpieza modal handlers ---
  abrirModalLimpieza(a: AlojamientoTarjeta, event: Event): void {
    event.stopPropagation();
    this.alojamientoParaLimpieza = a;
    this.prioridadLimpieza = 'Alta';
    this.notasLimpieza = '';
    this.modalLimpiezaAbierto = true;
  }

  cerrarModalLimpieza(): void {
    this.modalLimpiezaAbierto = false;
    this.alojamientoParaLimpieza = null;
    this.notasLimpieza = '';
    this.enviandoLimpieza = false;
  }

  confirmarEnviarALimpieza(): void {
    if (!this.alojamientoParaLimpieza || this.enviandoLimpieza) return;
    this.enviandoLimpieza = true;

    const a = this.alojamientoParaLimpieza;
    const habNum = a.etiqueta_unidad;
    const orgId = this.orgId;

    a.estados = ['en_limpieza'];

    const existe = this.data.limpieza.find((t) => t.habitacion === habNum && t.estado !== 'Completada');
    if (!existe) {
      this.data.limpieza.unshift({
        habitacion: habNum,
        tipoAlojamiento: a.tipo_alojamiento,
        piso: 'Piso 1',
        camarera: 'Sin asignar',
        prioridad: this.prioridadLimpieza,
        estado: 'Pendiente',
        ...(this.notasLimpieza ? { notas: this.notasLimpieza } : {}),
      } as any);
    } else {
      (existe as any).prioridad = this.prioridadLimpieza;
      if (this.notasLimpieza) (existe as any).notas = this.notasLimpieza;
    }

    if (orgId) {
      this.limpiezaService
        .registrar(orgId, a.alojamiento_id, {
          notas: this.notasLimpieza || `Prioridad: ${this.prioridadLimpieza}`,
        })
        .subscribe({
          next: () => {
            this.cerrarModalLimpieza();
            this.cargarAlojamientos();
            this.cargarStats();
          },
          error: () => {
            this.cerrarModalLimpieza();
          },
        });
    } else {
      this.cerrarModalLimpieza();
    }
  }

  // --- Mantenimiento modal handlers ---
  abrirModalMantenimiento(a: AlojamientoTarjeta, event: Event): void {
    event.stopPropagation();
    this.alojamientoParaMantenimiento = a;
    this.motivoMantenimiento = '';
    this.prioridadMantenimiento = 'media';
    this.modalMantenimientoAbierto = true;
  }

  cerrarModalMantenimiento(): void {
    this.modalMantenimientoAbierto = false;
    this.alojamientoParaMantenimiento = null;
    this.motivoMantenimiento = '';
    this.enviandoMantenimiento = false;
  }

  confirmarEnviarAMantenimiento(): void {
    if (!this.alojamientoParaMantenimiento || !this.motivoMantenimiento.trim() || this.enviandoMantenimiento) return;
    this.enviandoMantenimiento = true;

    const a = this.alojamientoParaMantenimiento;
    const orgId = this.orgId;

    a.estados = ['mantenimiento'];

    if (orgId) {
      this.mantenimientoService
        .registrar(orgId, a.alojamiento_id, {
          motivo: this.motivoMantenimiento,
          prioridad: this.prioridadMantenimiento,
        })
        .subscribe({
          next: () => {
            this.cerrarModalMantenimiento();
            this.cargarAlojamientos();
            this.cargarStats();
          },
          error: () => {
            this.cerrarModalMantenimiento();
          },
        });
    } else {
      this.data.incidencias.unshift({
        habitacion: a.etiqueta_unidad,
        problema: this.motivoMantenimiento,
        prioridad: this.prioridadMantenimiento === 'alta' ? 'Alta' : 'Baja',
        responsable: 'Técnico encargado',
        estado: 'Abierto',
        fecha: new Date().toLocaleDateString('es-ES'),
      });
      this.cerrarModalMantenimiento();
    }
  }

  eliminarAlojamiento(a: AlojamientoTarjeta, event: Event): void {
    event.stopPropagation();
    const orgId = this.orgId;
    if (!orgId) return;

    if (confirm(`¿Estás seguro de eliminar el alojamiento ${a.etiqueta_unidad}?`)) {
      this.establecimientoService.eliminarAlojamiento(orgId, a.alojamiento_id).subscribe({
        next: () => {
          this.cargarAlojamientos();
          this.cargarStats();
          this.toast.success(`Alojamiento ${a.etiqueta_unidad} eliminado.`);
        },
        error: (err) => {
          this.toast.error(err?.error?.message ?? 'No se pudo eliminar el alojamiento.');
        },
      });
    }
  }

  onEstablecimientoCreado(): void {
    this.mostrarFormEstablecimiento.set(false);
    this.cargarEstablecimientos();
  }

  onAlojamientoGuardado(): void {
    this.mostrarFormAlojamiento.set(false);
    this.alojamientoAEditar.set(null);
    this.cargarAlojamientos();
    this.cargarStats();
  }

  cerrarFormAlojamiento(): void {
    this.mostrarFormAlojamiento.set(false);
    this.alojamientoAEditar.set(null);
  }

  abrirNuevoAlojamiento(): void {
    this.alojamientoAEditar.set(null);
    if (this.establecimientos().length === 0) {
      this.mostrarFormEstablecimiento.set(true);
    } else {
      this.mostrarFormAlojamiento.set(true);
    }
  }
}