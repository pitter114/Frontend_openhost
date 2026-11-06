import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AlojamientoTarjeta } from '../../../core/models/estadisticas.models';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { PmsDataService } from '../../../core/services/pms-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReputacionService } from '../../../core/services/reputacion.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './reserva-form.component.html',
  styleUrls: ['./reserva-form.component.scss'],
})
export class ReservaFormComponent {
  @Input({ required: true }) habitacion!: AlojamientoTarjeta;
  @Input() hotelNombre = '';
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private orgService = inject(OrganizacionService);
  private pmsDataService = inject(PmsDataService);
  private toast = inject(ToastService);
  private reputacionService = inject(ReputacionService);

  linkCopiado = signal(false);
  guardando = signal(false);
  guardadoExitoso = signal(false);
  errorGuardar = signal<string | null>(null);
  alertaReputacion = signal<any>(null);

  private hoy = new Date().toISOString().slice(0, 10);

  form = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', [Validators.required, Validators.maxLength(15)]],
    celular: ['', [Validators.required, Validators.pattern(/^[0-9+ ]+$/), Validators.maxLength(20)]],
    numHuespedes: [1, [Validators.required, Validators.min(1)]],
    fechaIngreso: [this.hoy, [Validators.required]],
    fechaSalida: ['', [Validators.required]],
    descuento: [0, [Validators.min(0), Validators.max(100)]],
  });

  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  noches = computed(() => {
    const v = this.valores();
    const ingreso = v.fechaIngreso ? new Date(v.fechaIngreso) : null;
    const salida = v.fechaSalida ? new Date(v.fechaSalida) : null;
    if (!ingreso || !salida) return 0;
    const diff = Math.round((salida.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  });

  huespedesBase = computed(() => this.habitacion?.max_huespedes_base ?? 1);
  costoHuespedExtra = computed(() => Number(this.habitacion?.costo_huesped_extra) || 0);

  extraHuespedesCount = computed(() => {
    const total = Number(this.valores().numHuespedes) || 1;
    return Math.max(0, total - this.huespedesBase());
  });

  costoExtraTotal = computed(() => {
    return this.extraHuespedesCount() * this.costoHuespedExtra() * this.noches();
  });

  subtotal = computed(() => {
    const baseNoches = this.noches() * (this.habitacion?.precio_base ?? 0);
    return baseNoches + this.costoExtraTotal();
  });

  totalConDescuento = computed(() => {
    const descuento = Number(this.valores().descuento) || 0;
    return Math.max(0, Math.round(this.subtotal() * (1 - descuento / 100)));
  });

  consultarReputacion(): void {
    const dni = this.form.get('dni')?.value?.trim();
    const orgId = this.orgService.orgActivaId() || 1;
    if (dni && dni.length >= 6) {
      this.reputacionService.verificarReputacion(orgId, dni).subscribe({
        next: (res) => {
          if (res.tiene_alerta && res.alerta) {
            this.alertaReputacion.set(res.alerta);
          } else {
            this.alertaReputacion.set(null);
          }
        },
        error: () => this.alertaReputacion.set(null),
      });
    } else {
      this.alertaReputacion.set(null);
    }
  }

  guardarReserva(): void {
    if (this.form.invalid || this.noches() === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const celularSoloDigitos = (v.celular || '').replace(/\D/g, '') || '000000000';

    const payload = {
      alojamiento_id: this.habitacion.alojamiento_id,
      nombre_completo: v.nombreCompleto,
      dni: v.dni,
      celular: celularSoloDigitos,
      fecha_ingreso: v.fechaIngreso,
      fecha_salida: v.fechaSalida,
      num_huespedes: v.numHuespedes,
      descuento: v.descuento,
    };

    this.guardando.set(true);
    this.errorGuardar.set(null);

    const orgId = this.orgService.orgActivaId();
    const url = orgId
      ? `${environment.apiUrl}/organizacion/${orgId}/reservas`
      : `${environment.apiUrl}/publico/reservas`;

    this.http.post(url, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardadoExitoso.set(true);
        this.toast.success(`Reserva de ${this.habitacion.etiqueta_unidad} confirmada exitosamente.`);
        this.pmsDataService.cargarReservas(true);
        setTimeout(() => {
          this.cerrarModal();
        }, 800);
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err?.error?.message ?? 'No se pudo guardar la reserva.';
        this.errorGuardar.set(msg);
        this.toast.error(msg);
      },
    });
  }

  enviarBoletaWhatsapp(): void {
    if (this.form.invalid || this.noches() === 0) {
      this.form.markAllAsTouched();
      return;
    }

    // Primero guardamos en base de datos
    this.guardarReserva();

    const v = this.form.getRawValue();
    const descuento = Number(v.descuento) || 0;
    const extraCount = this.extraHuespedesCount();
    const extraCost = this.costoExtraTotal();

    const lineas = [
      `🏨 *${this.hotelNombre}*`,
      `Reserva — ${this.habitacion.etiqueta_unidad} (${this.habitacion.tipo_alojamiento})`,
      '',
      `Huésped principal: ${v.nombreCompleto}`,
      `DNI: ${v.dni}`,
      `Huéspedes totales: ${v.numHuespedes}`,
      `Check-in: ${v.fechaIngreso}`,
      `Check-out: ${v.fechaSalida}`,
      `Noches: ${this.noches()}`,
      `Precio/noche: S/ ${this.habitacion.precio_base}`,
    ];
    if (extraCount > 0) {
      lineas.push(`Huéspedes extra: ${extraCount} (+S/ ${extraCost})`);
    }
    if (descuento > 0) lineas.push(`Descuento: ${descuento}%`);
    lineas.push('', `*Total: S/ ${this.totalConDescuento()}*`, '', '¡Gracias por tu reserva!');

    const texto = encodeURIComponent(lineas.join('\n'));
    const numero = (v.celular ?? '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
  }

  generarLinkCliente(): void {
    const v = this.form.getRawValue();
    const descuento = Number(v.descuento) || 0;
    const params = new URLSearchParams();
    params.set('hotel', this.hotelNombre);
    params.set('unidad', this.habitacion.etiqueta_unidad);
    params.set('tipo', this.habitacion.tipo_alojamiento);
    params.set('precio', String(this.habitacion.precio_base));
    if (this.habitacion.max_huespedes_base) params.set('base', String(this.habitacion.max_huespedes_base));
    if (this.habitacion.costo_huesped_extra) params.set('costoExtra', String(this.habitacion.costo_huesped_extra));
    if (v.numHuespedes) params.set('huespedes', String(v.numHuespedes));
    if (
      this.habitacion.imagen_principal &&
      !this.habitacion.imagen_principal.startsWith('data:') &&
      this.habitacion.imagen_principal.length < 1000
    ) {
      params.set('imagen', this.habitacion.imagen_principal);
    }
    if (v.fechaIngreso) params.set('checkin', v.fechaIngreso);
    if (v.fechaSalida) params.set('checkout', v.fechaSalida);
    if (descuento > 0) params.set('descuento', String(descuento));

    const url = `${window.location.origin}/reservar/${this.habitacion.alojamiento_id}?${params.toString()}`;

    navigator.clipboard.writeText(url).then(() => {
      this.linkCopiado.set(true);
      setTimeout(() => this.linkCopiado.set(false), 2500);
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}