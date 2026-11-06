import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { PasarelaConfig, PasarelasService } from '../../../core/services/pasarelas.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pasarelas-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './pasarelas-pago.component.html',
  styleUrls: ['./pasarelas-pago.component.scss'],
})
export class PasarelasPagoComponent implements OnInit {
  private pasarelasService = inject(PasarelasService);
  private toast = inject(ToastService);

  cargando = signal(true);
  guardandoMp = signal(false);
  probandoMp = signal(false);
  testResultado = signal<{ ok: boolean; message: string; nickname?: string } | null>(null);

  mostrarToken = signal(false);
  copiadoWebhook = signal(false);

  mpConfig: PasarelaConfig = {
    id: 1,
    proveedor_id: 1,
    nombre: 'Mercado Pago',
    slug: 'mercadopago',
    public_key: '',
    access_token: '',
    sandbox: true,
    webhook_url: 'http://localhost:8000/api/webhooks/mercadopago',
    activo: true,
    auto_confirmar_reserva: true,
    comision_adicional_pct: 0,
    notas: '',
  };

  culqiConfig: PasarelaConfig | null = null;

  estadisticas = {
    monto_total: 0,
    transacciones_aprobadas: 0,
    transacciones_pendientes: 0,
  };

  ngOnInit(): void {
    this.cargarPasarelas();
  }

  cargarPasarelas(): void {
    this.cargando.set(true);
    this.pasarelasService.getPasarelas().subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.ok && res.data) {
          const mp = res.data.pasarelas.find((p) => p.slug === 'mercadopago');
          if (mp) {
            this.mpConfig = { ...mp };
          }
          const culqi = res.data.pasarelas.find((p) => p.slug === 'culqi');
          if (culqi) {
            this.culqiConfig = { ...culqi };
          }
          if (res.data.estadisticas?.mercadopago) {
            this.estadisticas = res.data.estadisticas.mercadopago;
          }
        }
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('No se pudieron cargar las configuraciones de pasarelas.');
      },
    });
  }

  guardarMercadoPago(): void {
    this.guardandoMp.set(true);
    this.testResultado.set(null);

    const payload: Partial<PasarelaConfig> = {
      public_key: this.mpConfig.public_key,
      access_token: this.mpConfig.access_token,
      sandbox: this.mpConfig.sandbox,
      activo: this.mpConfig.activo,
      auto_confirmar_reserva: this.mpConfig.auto_confirmar_reserva,
      webhook_url: this.mpConfig.webhook_url,
    };

    this.pasarelasService.actualizarPasarela(this.mpConfig.id, payload).subscribe({
      next: (res) => {
        this.guardandoMp.set(false);
        this.toast.success('Configuración de Mercado Pago guardada correctamente.');
        if (res.data) {
          this.mpConfig = { ...res.data };
        }
      },
      error: (err) => {
        this.guardandoMp.set(false);
        this.toast.error(err?.error?.message || 'Error al guardar configuración de Mercado Pago.');
      },
    });
  }

  probarConexion(): void {
    if (!this.mpConfig.access_token) {
      this.toast.error('Ingrese primero el Access Token de Mercado Pago para probar la conexión.');
      return;
    }

    this.probandoMp.set(true);
    this.testResultado.set(null);

    this.pasarelasService.testConexionMercadoPago(this.mpConfig.access_token).subscribe({
      next: (res) => {
        this.probandoMp.set(false);
        this.testResultado.set(res);
        if (res.ok) {
          this.toast.success(res.message);
        } else {
          this.toast.error(res.message);
        }
      },
      error: () => {
        this.probandoMp.set(false);
        this.testResultado.set({
          ok: false,
          message: 'Error al contactar los servidores de Mercado Pago.',
        });
        this.toast.error('Fallo en la prueba de conexión.');
      },
    });
  }

  copiarWebhook(): void {
    if (this.mpConfig.webhook_url) {
      navigator.clipboard.writeText(this.mpConfig.webhook_url).then(() => {
        this.copiadoWebhook.set(true);
        this.toast.info('URL del Webhook copiada al portapapeles.');
        setTimeout(() => this.copiadoWebhook.set(false), 3000);
      });
    }
  }

  toggleMostrarToken(): void {
    this.mostrarToken.update((v) => !v);
  }
}
