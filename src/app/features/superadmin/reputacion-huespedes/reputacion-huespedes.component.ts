import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { IncidenciaHuesped, ReputacionService } from '../../../core/services/reputacion.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reputacion-huespedes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './reputacion-huespedes.component.html',
  styleUrls: ['./reputacion-huespedes.component.scss'],
})
export class ReputacionHuespedesComponent implements OnInit {
  private reputacionService = inject(ReputacionService);
  private toast = inject(ToastService);

  cargando = signal(true);
  incidencias = signal<IncidenciaHuesped[]>([]);
  busqueda = signal('');
  filtroEstado = signal<'todos' | 'activa' | 'en_revision' | 'descartada'>('todos');

  totales = {
    total: 0,
    activas: 0,
    deuda_total: 0,
    casos_criticos: 0,
  };

  ngOnInit(): void {
    this.cargarIncidencias();
  }

  cargarIncidencias(): void {
    this.cargando.set(true);
    const opts: any = {};
    if (this.busqueda()) opts.busqueda = this.busqueda();
    if (this.filtroEstado() !== 'todos') opts.estado = this.filtroEstado();

    this.reputacionService.listarIncidenciasSuperadmin(opts).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.ok && res.data) {
          this.incidencias.set(res.data);
          this.totales = res.totales;
        }
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('Error al cargar la lista de reputación de huéspedes.');
      },
    });
  }

  cambiarEstado(incidencia: IncidenciaHuesped, nuevoEstado: 'activa' | 'en_revision' | 'descartada'): void {
    this.reputacionService.moderarIncidencia(incidencia.id, nuevoEstado).subscribe({
      next: () => {
        incidencia.estado = nuevoEstado;
        this.toast.success(`Incidencia marcada como "${nuevoEstado}".`);
        this.cargarIncidencias();
      },
      error: () => {
        this.toast.error('No se pudo actualizar el estado de la incidencia.');
      },
    });
  }
}
