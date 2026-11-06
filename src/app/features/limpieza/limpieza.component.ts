import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PmsDataService } from '../../core/services/pms-data.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { LimpiezaService } from '../../core/services/limpieza.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { LimpiezaTarjeta } from '../../core/models/limpieza.models';

export interface TareaDisplay {
  id?: number;
  apiId?: number;
  habitacion: string;
  tipoAlojamiento?: string;
  piso: string;
  camarera: string;
  prioridad: string;
  estado: 'Pendiente' | 'En Proceso' | 'Completada';
  minutos?: number;
  notas?: string;
}

@Component({
  selector: 'app-limpieza',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './limpieza.component.html',
  styleUrls: ['./limpieza.component.scss'],
})
export class LimpiezaComponent implements OnInit {
  private orgService = inject(OrganizacionService);
  private limpiezaService = inject(LimpiezaService);

  constructor(public data: PmsDataService) {}

  cargando = signal(false);
  tareas = signal<TareaDisplay[]>([]);
  completadasHoyCount = signal(0);

  // --- Modal state ---
  modalAbierto = false;
  modalAccion: 'iniciar' | 'completar' = 'iniciar';
  tareaSeleccionada: TareaDisplay | null = null;
  modalNotas = '';
  procesando = false;

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const orgId = this.orgId;
    const localTasks = this.getLocalDisplayTasks();

    if (!orgId) {
      this.tareas.set(localTasks);
      this.completadasHoyCount.set(localTasks.filter((t) => t.estado === 'Completada').length);
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);

    forkJoin({
      pendientes: this.limpiezaService.pendientes(orgId).pipe(catchError(() => of(null))),
      enProceso: this.limpiezaService.enProceso(orgId).pipe(catchError(() => of(null))),
      completadas: this.limpiezaService.completadas(orgId).pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => this.cargando.set(false))
      )
      .subscribe(({ pendientes, enProceso, completadas }) => {
        const apiTasks: TareaDisplay[] = [];

        if (pendientes?.data) {
          pendientes.data.forEach((item) => {
            const mapped = this.mapApiToDisplay(item, 'Pendiente');
            if (mapped) apiTasks.push(mapped);
          });
        }

        if (enProceso?.data) {
          enProceso.data.forEach((item) => {
            const mapped = this.mapApiToDisplay(item, 'En Proceso');
            if (mapped) apiTasks.push(mapped);
          });
        }

        let completedCount = 0;
        if (completadas?.data) {
          completedCount = completadas.data.length;
          completadas.data.forEach((item) => {
            const mapped = this.mapApiToDisplay(item, 'Completada');
            if (mapped) apiTasks.push(mapped);
          });
        }
        this.completadasHoyCount.set(completedCount);

        const combined = this.mergeTasks(apiTasks, localTasks);
        this.tareas.set(combined);
      });
  }

  private getLocalDisplayTasks(): TareaDisplay[] {
    return (this.data.limpieza || []).map((t) => ({
      habitacion: t.habitacion,
      tipoAlojamiento: (t as any).tipoAlojamiento,
      piso: t.piso || 'Piso 1',
      camarera: t.camarera || 'Sin asignar',
      prioridad: t.prioridad || 'Alta',
      estado: t.estado,
      minutos: t.minutos,
    }));
  }

  private isSameRoom(roomA: string, roomB: string): boolean {
    if (!roomA || !roomB) return false;
    const a = roomA.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const b = roomB.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return a === b || a.includes(b) || b.includes(a);
  }

  private mergeTasks(apiTasks: TareaDisplay[], localTasks: TareaDisplay[]): TareaDisplay[] {
    if (apiTasks.length > 0) {
      const combined = [...apiTasks];
      localTasks.forEach((loc) => {
        const match = combined.some((a) => this.isSameRoom(a.habitacion, loc.habitacion));
        if (!match) {
          combined.push(loc);
        }
      });
      return combined;
    } else {
      return localTasks;
    }
  }

  private mapApiToDisplay(item: any, estado: 'Pendiente' | 'En Proceso' | 'Completada'): TareaDisplay | null {
    if (!item) return null;

    // Check item.etiqueta_unidad directly first (returned by pagination query)
    const roomName =
      item.etiqueta_unidad ||
      item.alojamiento?.etiqueta_unidad ||
      item.habitacion ||
      item.nombre ||
      'Habitación';

    const tipo = item.alojamiento?.tipo_alojamiento || item.tipo_alojamiento || item.tipoAlojamiento || '';
    const floor = item.alojamiento?.piso ? `Piso ${item.alojamiento.piso}` : (item.piso ? `Piso ${item.piso}` : 'Piso 1');
    const maid = item.encargado_nombre
      ? `${item.encargado_nombre} ${item.encargado_apellido || ''}`
      : (item.asignado?.nombre || item.camarera || 'Sin asignar');
    const priority = item.prioridad || 'Alta';

    let mins = item.minutos || 0;
    if (item.iniciado_en && !mins) {
      mins = Math.max(1, Math.floor((Date.now() - new Date(item.iniciado_en).getTime()) / 60000));
    }

    return {
      apiId: item.limpieza_id,
      habitacion: roomName,
      tipoAlojamiento: tipo,
      piso: floor,
      camarera: maid.trim(),
      prioridad: priority,
      estado: estado,
      minutos: mins,
      notas: item.notas || undefined,
    };
  }

  byEstado(estado: 'Pendiente' | 'En Proceso' | 'Completada'): TareaDisplay[] {
    return this.tareas().filter((t) => t.estado === estado);
  }

  prioridadClass(p: string): string {
    return p === 'Alta' ? 'red' : p === 'Baja' ? 'gray' : 'blue';
  }

  formatRoomTitle(hab: string, tipo?: string): string {
    if (!hab || hab === 'Alojamiento') return 'Habitación';
    const t = (tipo || '').toLowerCase();

    if (t.includes('departamento') || t.includes('casa') || t.includes('apartamento') || t.includes('villa')) {
      if (hab.toLowerCase().includes('completo') || hab.toLowerCase().includes('propiedad')) return hab;
      return `${hab} — Propiedad Completa`;
    }

    if (hab.includes('Hábitat')) return hab;
    if (/^\d+$/.test(hab)) {
      return `${hab} Hábitat ${hab}`;
    }
    return hab;
  }

  // --- Modal methods ---
  abrirModal(tarea: TareaDisplay, accion: 'iniciar' | 'completar'): void {
    this.tareaSeleccionada = tarea;
    this.modalAccion = accion;
    this.modalNotas = tarea.notas || '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.tareaSeleccionada = null;
    this.modalNotas = '';
    this.procesando = false;
  }

  confirmarAccion(): void {
    if (!this.tareaSeleccionada || this.procesando) return;
    this.procesando = true;

    const t = this.tareaSeleccionada;
    const orgId = this.orgId;

    if (this.modalAccion === 'iniciar') {
      t.estado = 'En Proceso';
      t.minutos = 1;

      const mockItem = this.data.limpieza.find((m) => this.isSameRoom(m.habitacion, t.habitacion));
      if (mockItem) {
        mockItem.estado = 'En Proceso';
        mockItem.minutos = 1;
      }

      if (orgId && t.apiId) {
        this.limpiezaService.iniciar(orgId, t.apiId).subscribe({
          next: () => {
            this.cerrarModal();
            this.cargarDatos();
          },
          error: () => this.cerrarModal(),
        });
      } else {
        this.cerrarModal();
      }
    } else {
      // Mark as completed: remove from active tasks board and increment completed counter
      t.estado = 'Completada';
      this.completadasHoyCount.set(this.completadasHoyCount() + 1);

      // Remove from active list so completed task disappears from Kanban
      this.tareas.set(this.tareas().filter((item) => item !== t));
      this.data.limpieza = this.data.limpieza.filter((m) => !this.isSameRoom(m.habitacion, t.habitacion));

      if (orgId && t.apiId) {
        this.limpiezaService.completar(orgId, t.apiId).subscribe({
          next: () => {
            this.cerrarModal();
            this.cargarDatos();
          },
          error: () => this.cerrarModal(),
        });
      } else {
        this.cerrarModal();
      }
    }
  }
}
