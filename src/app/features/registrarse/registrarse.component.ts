import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { Reserva } from '../../core/models/pms.models';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingModalComponent],
  templateUrl: './registrarse.component.html',
  styleUrls: ['./registrarse.component.scss'],
})
export class RegistrarseComponent {
  constructor(public data: PmsDataService) {}

  search = '';
  selected: Reserva | null = null;

  get pendientes(): Reserva[] {
    const term = this.search.trim().toLowerCase();
    const list = this.data.reservas.filter(
      (r) => r.estado === 'Registrarse' || r.estado === 'Pendiente' || r.estado === 'Confirmada'
    );
    if (!term) return list;
    return list.filter((r) => r.cliente.toLowerCase().includes(term) || r.codigo.toLowerCase().includes(term));
  }

  noches(r: Reserva): number {
    const inD = new Date(r.checkIn + 'T00:00:00');
    const outD = new Date(r.checkOut + 'T00:00:00');
    return Math.round((outD.getTime() - inD.getTime()) / 86400000);
  }

  formatFecha(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  select(r: Reserva): void {
    this.selected = r;
  }

  procesando = signal(false);
  mensajeExito = signal<string | null>(null);

  procesarCheckIn(): void {
    if (!this.selected) return;
    this.procesando.set(true);

    const r = this.selected;
    if (!r.reserva_id) {
      this.procesando.set(false);
      return;
    }

    this.data.cambiarEstadoReserva(r.reserva_id, 'en_curso', () => {
      this.procesando.set(false);
      this.mensajeExito.set(`¡Check-In completado exitosamente para ${r.cliente}!`);
      this.selected = null;
      setTimeout(() => this.mensajeExito.set(null), 3500);
    });
  }
}
