import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { TiendaService } from '../../core/services/tienda.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
})
export class ConfiguracionComponent implements OnInit {
  private orgService = inject(OrganizacionService);
  private tiendaService = inject(TiendaService);

  cargando = signal(true);
  guardando = signal(false);
  ejecutandoCheckout = signal(false);
  mensajeFeedback = signal<string | null>(null);
  mensajeCheckout = signal<string | null>(null);

  tuIpActual = signal('127.0.0.1');

  form = {
    nombre_comercial: '',
    telefono_contacto: '',
    ruc: '',
    correo_contacto: '',
    hora_check_in: '14:00',
    hora_check_out: '12:00',
    checkout_automatico: true,
    checkout_tolerancia_minutos: 30,
    ip_whitelist: '',
    restringir_ip_operativa: false,
  };

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const id = this.orgId;
    if (!id) return;

    this.cargando.set(true);
    this.orgService.obtenerConfiguracionSeguridad(id).subscribe({
      next: (res) => {
        const d = res.data;
        if (d) {
          this.form = {
            nombre_comercial: d.nombre_comercial || '',
            telefono_contacto: d.telefono_contacto || '',
            ruc: d.ruc || '',
            correo_contacto: d.correo_contacto || '',
            hora_check_in: d.hora_check_in || '14:00',
            hora_check_out: d.hora_check_out || '12:00',
            checkout_automatico: !!d.checkout_automatico,
            checkout_tolerancia_minutos: d.checkout_tolerancia_minutos ?? 30,
            ip_whitelist: d.ip_whitelist || '',
            restringir_ip_operativa: !!d.restringir_ip_operativa,
          };
        }
        if (res.tu_ip_actual) {
          this.tuIpActual.set(res.tu_ip_actual);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  capturarMiIp(): void {
    const actual = this.tuIpActual();
    if (!this.form.ip_whitelist) {
      this.form.ip_whitelist = actual;
    } else if (!this.form.ip_whitelist.includes(actual)) {
      this.form.ip_whitelist += `, ${actual}`;
    }
  }

  guardar(): void {
    const id = this.orgId;
    if (!id) return;

    this.guardando.set(true);
    this.orgService.guardarConfiguracionSeguridad(id, this.form).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mostrarMensaje(res.mensaje || 'Configuración guardada exitosamente.');
      },
      error: () => {
        this.guardando.set(false);
        alert('Error al guardar la configuración.');
      },
    });
  }

  forzarCheckout(): void {
    const id = this.orgId;
    if (!id) return;

    this.ejecutandoCheckout.set(true);
    this.mensajeCheckout.set(null);

    this.tiendaService.ejecutarCheckoutManual(id).subscribe({
      next: (res) => {
        this.ejecutandoCheckout.set(false);
        this.mensajeCheckout.set(res.detalle || res.mensaje || 'Check-out manual ejecutado.');
        setTimeout(() => this.mensajeCheckout.set(null), 7000);
      },
      error: (err) => {
        this.ejecutandoCheckout.set(false);
        this.mensajeCheckout.set(err?.error?.mensaje || 'Error al ejecutar check-out.');
        setTimeout(() => this.mensajeCheckout.set(null), 5000);
      },
    });
  }

  mostrarMensaje(msg: string): void {
    this.mensajeFeedback.set(msg);
    setTimeout(() => this.mensajeFeedback.set(null), 5000);
  }
}
