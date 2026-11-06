import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { MovimientoCaja } from '../../core/models/pms.models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss'],
})
export class PagosComponent {
  public data = inject(PmsDataService);
  private toast = inject(ToastService);

  Math = Math;

  mostrarModalMovimiento = signal(false);

  // Form nuevo movimiento
  tipoMovimiento: 'Ingreso' | 'Salida' = 'Ingreso';
  concepto = '';
  metodo: 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Yape / Plin' = 'Efectivo';
  monto = 0;

  get ingresosDia(): number {
    const fromReservas = this.data.reservas.reduce((acc, r) => acc + (r.total - (r.debe || 0)), 0);
    const fromMovimientos = this.data.movimientosCaja
      .filter((m) => m.tipo === 'Ingreso')
      .reduce((acc, m) => acc + m.monto, 0);
    return fromReservas + fromMovimientos;
  }

  get egresosDia(): number {
    return this.data.movimientosCaja
      .filter((m) => m.tipo === 'Salida')
      .reduce((acc, m) => acc + Math.abs(m.monto), 0);
  }

  get cajaActual(): number {
    return Math.max(0, this.ingresosDia - this.egresosDia);
  }

  get pagosPendientes(): number {
    return this.data.reservas.reduce((acc, r) => acc + (r.debe || 0), 0);
  }

  get reservasConDeuda(): number {
    return this.data.reservas.filter((r) => (r.debe || 0) > 0).length;
  }

  abrirNuevoMovimiento(): void {
    this.tipoMovimiento = 'Ingreso';
    this.concepto = '';
    this.metodo = 'Efectivo';
    this.monto = 0;
    this.mostrarModalMovimiento.set(true);
  }

  cerrarModalMovimiento(): void {
    this.mostrarModalMovimiento.set(false);
  }

  guardarMovimiento(): void {
    if (!this.concepto.trim() || this.monto <= 0) {
      this.toast.warning('Ingresa un concepto y monto válido mayor a 0.');
      return;
    }

    const nuevo: MovimientoCaja = {
      tipo: this.tipoMovimiento,
      concepto: this.concepto.trim(),
      metodo: this.metodo,
      monto: this.tipoMovimiento === 'Ingreso' ? Math.abs(this.monto) : -Math.abs(this.monto),
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      usuario: 'Recepcionista',
    };

    this.data.movimientosCaja.unshift(nuevo);
    this.toast.success(`Movimiento de ${this.tipoMovimiento.toLowerCase()} registrado con éxito.`);
    this.cerrarModalMovimiento();
  }
}
