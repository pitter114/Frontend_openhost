import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { MantenimientoService } from '../../core/services/mantenimiento.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { ToastService } from '../../core/services/toast.service';
import { MantenimientoTarjeta, EstadisticasMantenimiento } from '../../core/models/mantenimiento.models';
import { AlojamientoTarjeta } from '../../core/models/estadisticas.models';

export interface IncidenciaDisplay {
  id?: number;
  apiId?: number;
  alojamientoId?: number;
  habitacion: string;
  problema: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  responsable: string;
  estado: 'Abierto' | 'En Proceso' | 'Cerrado';
  fecha: string;
  resuelto?: string;
}

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './mantenimiento.component.html',
  styleUrls: ['./mantenimiento.component.scss'],
})
export class MantenimientoComponent implements OnInit {
  private orgService = inject(OrganizacionService);
  private mantenimientoService = inject(MantenimientoService);
  private estadisticasService = inject(EstadisticasService);
  private toast = inject(ToastService);

  constructor(public data: PmsDataService) {}

  cargando = signal(false);
  procesando = signal(false);
  stats = signal<EstadisticasMantenimiento>({ abiertas: 0, en_proceso: 0, cerradas: 0 });
  incidencias = signal<IncidenciaDisplay[]>([]);
  alojamientosDisponibles = signal<{ id: number; nombre: string }[]>([]);

  // --- Modal Form State ---
  modalFormAbierto = false;
  selectedAlojamientoId: number | null = null;
  selectedHabitacionNombre = '';
  motivoIncidencia = '';
  prioridadIncidencia: 'Alta' | 'Media' | 'Baja' = 'Alta';
  responsableIncidencia = '';
  bloquearDisponibilidad = false;

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const orgId = this.orgId;

    if (!orgId) {
      // Mock mode
      const list: IncidenciaDisplay[] = (this.data.incidencias || []).map((i) => ({
        habitacion: i.habitacion,
        problema: i.problema,
        prioridad: i.prioridad === 'Medios de comunicación' ? 'Media' : (i.prioridad as any),
        responsable: i.responsable,
        estado: i.estado,
        fecha: i.fecha,
        resuelto: i.resuelto,
      }));
      this.incidencias.set(list);

      const abiertas = list.filter((i) => i.estado === 'Abierto').length;
      const enProceso = list.filter((i) => i.estado === 'En Proceso').length;
      const cerradas = list.filter((i) => i.estado === 'Cerrado').length;
      this.stats.set({ abiertas, en_proceso: enProceso, cerradas });
      this.cargando.set(false);
      return;
    }

    // Real organization mode
    this.cargando.set(true);

    this.mantenimientoService.estadisticas(orgId).subscribe({
      next: (res) => this.stats.set(res.data),
      error: () => {},
    });

    this.estadisticasService.alojamientos(orgId).subscribe({
      next: (res) => {
        if (res.data) {
          this.alojamientosDisponibles.set(
            res.data.map((a: AlojamientoTarjeta) => ({
              id: a.alojamiento_id,
              nombre: a.etiqueta_unidad,
            }))
          );
        }
      },
      error: () => {},
    });

    this.mantenimientoService.listar(orgId).subscribe({
      next: (res) => {
        if (res.data) {
          const list: IncidenciaDisplay[] = res.data.map((item: any) => this.mapApiToDisplay(item));
          this.incidencias.set(list);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  private mapApiToDisplay(item: any): IncidenciaDisplay {
    const roomName =
      item.etiqueta_unidad ||
      item.alojamiento?.etiqueta_unidad ||
      item.habitacion ||
      `Habitación ${item.alojamiento_id || ''}`;

    let estadoNorm: 'Abierto' | 'En Proceso' | 'Cerrado' = 'Abierto';
    const rawEstado = (item.estado || '').toLowerCase();
    if (rawEstado === 'en_proceso') estadoNorm = 'En Proceso';
    else if (rawEstado === 'cerrada' || rawEstado === 'cerrado') estadoNorm = 'Cerrado';

    let prio: 'Alta' | 'Media' | 'Baja' = 'Media';
    const rawPrio = (item.prioridad || '').toLowerCase();
    if (rawPrio === 'alta') prio = 'Alta';
    else if (rawPrio === 'baja') prio = 'Baja';

    return {
      apiId: item.mantenimiento_id,
      alojamientoId: item.alojamiento_id || item.alojamiento?.alojamiento_id,
      habitacion: roomName,
      problema: item.motivo || item.problema || 'Incidencia de mantenimiento',
      prioridad: prio,
      responsable: item.responsable || 'Técnico encargado',
      estado: estadoNorm,
      fecha: item.fecha_incidente || item.fecha || new Date().toLocaleDateString('es-ES'),
      resuelto: item.cerrado_en ? new Date(item.cerrado_en).toLocaleDateString('es-ES') : item.resuelto,
    };
  }

  countByEstado(estado: 'Abierto' | 'En Proceso' | 'Cerrado'): number {
    return this.incidencias().filter((i) => i.estado === estado).length;
  }

  prioridadClass(p: string): string {
    return p === 'Alta' ? 'red' : p === 'Baja' ? 'gray' : 'amber';
  }

  estadoClass(e: string): string {
    return e === 'Cerrado' ? 'green' : e === 'En Proceso' ? 'blue' : 'red';
  }

  actionLabel(i: IncidenciaDisplay): string {
    return i.estado === 'Cerrado' ? '' : i.estado === 'En Proceso' ? 'Resolutor' : 'Iniciar';
  }

  // --- Modal Form Actions ---
  abrirFormNueva(): void {
    this.selectedAlojamientoId = this.alojamientosDisponibles().length > 0 ? this.alojamientosDisponibles()[0].id : null;
    this.selectedHabitacionNombre = '';
    this.motivoIncidencia = '';
    this.prioridadIncidencia = 'Alta';
    this.responsableIncidencia = '';
    this.bloquearDisponibilidad = false;
    this.modalFormAbierto = true;
  }

  cerrarFormNueva(): void {
    this.modalFormAbierto = false;
  }

  guardarIncidencia(): void {
    if (!this.motivoIncidencia.trim()) {
      this.toast.warning('Describe la incidencia o problema técnico.');
      return;
    }

    const orgId = this.orgId;
    this.procesando.set(true);

    const roomObj = this.alojamientosDisponibles().find((a) => a.id === this.selectedAlojamientoId);
    const roomName = roomObj ? roomObj.nombre : (this.selectedHabitacionNombre || 'Habitación 101');

    if (orgId && this.selectedAlojamientoId) {
      this.mantenimientoService
        .registrar(orgId, this.selectedAlojamientoId, {
          motivo: this.motivoIncidencia,
          prioridad: this.prioridadIncidencia.toLowerCase() as any,
          responsable: this.responsableIncidencia || 'Técnico encargado',
          ...(this.bloquearDisponibilidad
            ? {
                cierre: {
                  fecha_inicio: new Date().toISOString().split('T')[0],
                },
              }
            : {}),
        })
        .subscribe({
          next: () => {
            this.procesando.set(false);
            this.cerrarFormNueva();
            this.cargarDatos();
            this.toast.success('Incidencia registrada con éxito.');
          },
          error: (err) => {
            this.procesando.set(false);
            this.toast.error(err?.error?.message ?? 'No se pudo guardar la incidencia.');
          },
        });
    } else {
      // Local fallback
      const nueva: IncidenciaDisplay = {
        habitacion: roomName,
        problema: this.motivoIncidencia,
        prioridad: this.prioridadIncidencia,
        responsable: this.responsableIncidencia || 'Técnico encargado',
        estado: 'Abierto',
        fecha: new Date().toLocaleDateString('es-ES'),
      };
      this.incidencias.set([nueva, ...this.incidencias()]);
      this.procesando.set(false);
      this.cerrarFormNueva();
    }
  }

  ejecutarAccion(i: IncidenciaDisplay): void {
    const orgId = this.orgId;

    if (i.estado === 'Abierto') {
      i.estado = 'En Proceso';
      if (orgId && i.apiId) {
        this.mantenimientoService.iniciar(orgId, i.apiId).subscribe({
          next: () => this.cargarDatos(),
          error: () => {},
        });
      }
    } else if (i.estado === 'En Proceso') {
      i.estado = 'Cerrado';
      i.resuelto = new Date().toLocaleDateString('es-ES');
      if (orgId && i.apiId) {
        this.mantenimientoService.cerrar(orgId, i.apiId).subscribe({
          next: () => this.cargarDatos(),
          error: () => {},
        });
      }
    }
  }
}
