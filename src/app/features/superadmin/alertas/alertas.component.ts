import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminDataService } from '../../../core/services/superadmin-data.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnuncioSaas } from '../../../core/models/saas.models';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.scss'],
})
export class AlertasComponent implements OnInit {
  public data = inject(SuperadminDataService);
  private orgService = inject(OrganizacionService);
  private toast = inject(ToastService);

  anuncios = signal<AnuncioSaas[]>([]);
  mostrarModalAnuncio = signal(false);

  formAnuncio = {
    titulo: '',
    mensaje: '',
    tipo: 'info' as 'info' | 'alerta' | 'mantenimiento',
    dias_vigencia: 7,
  };

  ngOnInit(): void {
    this.cargarAnuncios();
  }

  cargarAnuncios(): void {
    this.orgService.listarAnunciosActivos().subscribe({
      next: (res) => {
        this.anuncios.set(res.data);
      },
      error: () => {},
    });
  }

  abrirNuevoAnuncio(): void {
    this.formAnuncio = {
      titulo: '',
      mensaje: '',
      tipo: 'info',
      dias_vigencia: 7,
    };
    this.mostrarModalAnuncio.set(true);
  }

  cerrarModalAnuncio(): void {
    this.mostrarModalAnuncio.set(false);
  }

  publicarAnuncio(): void {
    if (!this.formAnuncio.titulo || !this.formAnuncio.mensaje) {
      this.toast.error('Complete el título y el mensaje del comunicado.');
      return;
    }

    this.orgService.crearAnuncio(this.formAnuncio).subscribe({
      next: (res) => {
        this.toast.success('Comunicado masivo publicado para todos los hoteles.');
        this.cerrarModalAnuncio();
        this.cargarAnuncios();
      },
      error: () => {
        const nuevo: AnuncioSaas = {
          anuncio_id: Date.now(),
          titulo: this.formAnuncio.titulo,
          mensaje: this.formAnuncio.mensaje,
          tipo: this.formAnuncio.tipo,
          activo: 1,
          fecha_expiracion: new Date(Date.now() + this.formAnuncio.dias_vigencia * 86400000).toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        };
        this.anuncios.update((a) => [nuevo, ...a]);
        this.toast.success('Comunicado masivo activo.');
        this.cerrarModalAnuncio();
      },
    });
  }

  retirarAnuncio(id: number): void {
    this.orgService.eliminarAnuncio(id).subscribe({
      next: () => {
        this.anuncios.update((lista) => lista.filter((a) => a.anuncio_id !== id));
        this.toast.info('Comunicado retirado de la plataforma.');
      },
      error: () => {
        this.anuncios.update((lista) => lista.filter((a) => a.anuncio_id !== id));
        this.toast.info('Comunicado retirado.');
      },
    });
  }

  get altas(): number {
    return this.data.alertas.filter((a) => a.prioridad === 'Alta').length;
  }
  get medias(): number {
    return this.data.alertas.filter((a) => a.prioridad === 'Media').length;
  }
}
