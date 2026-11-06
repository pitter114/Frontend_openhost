import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { LimpiezaService } from '../../core/services/limpieza.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { Reserva } from '../../core/models/pms.models';

@Component({
  selector: 'app-verificar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './verificar.component.html',
  styleUrls: ['./verificar.component.scss'],
})
export class VerificarComponent {
  private orgService = inject(OrganizacionService);
  private limpiezaService = inject(LimpiezaService);

  constructor(public data: PmsDataService) {}

  search = '';
  selected: Reserva | null = null;

  // Modal state
  modalCheckout = false;
  procesando = false;
  checkoutExitoso = false;

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  get activos(): Reserva[] {
    const term = this.search.trim().toLowerCase();
    const list = this.data.reservas.filter((r) => r.estado === 'Verificar' || r.estado === 'Confirmada');
    if (!term) return list;
    return list.filter((r) => r.cliente.toLowerCase().includes(term) || r.codigo.toLowerCase().includes(term));
  }

  formatFecha(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  select(r: Reserva): void {
    this.selected = r;
  }

  // --- Check-out flow ---
  abrirCheckout(): void {
    if (!this.selected) return;
    this.modalCheckout = true;
    this.checkoutExitoso = false;
  }

  cerrarCheckout(): void {
    this.modalCheckout = false;
    if (this.checkoutExitoso) {
      this.selected = null;
    }
  }

  procesarCheckout(): void {
    if (!this.selected || this.procesando) return;
    const r = this.selected;

    this.procesando = true;

    if (r.reserva_id) {
      this.data.cambiarEstadoReserva(r.reserva_id, 'completada', () => {
        this.finalizarCheckout();
      });
    } else {
      this.finalizarCheckout();
    }
  }

  private finalizarCheckout(): void {
    if (this.selected) {
      const habNum = this.selected.habitacion;

      // 1. Add cleaning task to PmsDataService.limpieza so it appears in Limpieza view immediately
      const existeLimpieza = this.data.limpieza.find(t => t.habitacion === habNum && t.estado !== 'Completada');
      if (!existeLimpieza) {
        const pisoNum = habNum.charAt(0) || '1';
        this.data.limpieza.unshift({
          habitacion: habNum,
          piso: `Piso ${pisoNum}`,
          camarera: 'Sin asignar',
          prioridad: 'Alta',
          estado: 'Pendiente'
        });
      }

      // 2. Update room state in PmsDataService.habitaciones to Disponible
      const hab = this.data.habitaciones.find(h => h.numero === habNum);
      if (hab) {
        hab.estado = 'Disponible';
      }
    }
    this.procesando = false;
    this.checkoutExitoso = true;
  }
}
