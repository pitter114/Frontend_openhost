import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuditoriaEdificioHotel, PasarelasService } from '../../../core/services/pasarelas.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-auditoria-edificios',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './auditoria-edificios.component.html',
  styleUrls: ['./auditoria-edificios.component.scss'],
})
export class AuditoriaEdificiosComponent implements OnInit {
  private pasarelasService = inject(PasarelasService);
  private toast = inject(ToastService);

  cargando = signal(true);
  hoteles = signal<AuditoriaEdificioHotel[]>([]);

  totales = {
    edificios: 0,
    habitaciones: 0,
    hoteles: 0,
    enRegla: 0,
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.pasarelasService.getAuditoriaEdificios().subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.ok && res.data) {
          this.hoteles.set(res.data);
          this.calcularTotales(res.data);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('Error al cargar la auditoría de edificios e infraestructura.');
      },
    });
  }

  calcularTotales(data: AuditoriaEdificioHotel[]): void {
    let edifs = 0;
    let habs = 0;
    let regla = 0;

    for (const h of data) {
      edifs += h.infraestructura.total_edificios;
      habs += h.infraestructura.total_habitaciones;
      if (h.infraestructura.estado_cumplimiento === 'Cumple límites') {
        regla++;
      }
    }

    this.totales = {
      edificios: edifs,
      habitaciones: habs,
      hoteles: data.length,
      enRegla: regla,
    };
  }
}
