import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { CanalIcal, IcalService } from '../../../core/services/ical.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ical-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './ical-modal.component.html',
  styleUrls: ['./ical-modal.component.scss'],
})
export class IcalModalComponent implements OnInit {
  @Input({ required: true }) alojamientoId!: number;
  @Input() etiquetaUnidad = '';
  @Output() cerrar = new EventEmitter<void>();

  private icalService = inject(IcalService);
  private orgService = inject(OrganizacionService);
  private toast = inject(ToastService);

  cargando = signal(true);
  sincronizandoId = signal<number | null>(null);
  guardandoId = signal<number | null>(null);
  copiadoFeedId = signal<number | null>(null);

  feeds = signal<CanalIcal[]>([]);

  ngOnInit(): void {
    this.cargarFeeds();
  }

  cargarFeeds(): void {
    this.cargando.set(true);
    const orgId = this.orgService.orgActivaId() || 1;

    this.icalService.listarFeeds(orgId, this.alojamientoId).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.ok && res.data) {
          this.feeds.set(res.data);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.toast.error('Error al cargar la configuración de sincronización iCal.');
      },
    });
  }

  copiarEnlace(feed: CanalIcal): void {
    navigator.clipboard.writeText(feed.url_exportacion).then(() => {
      this.copiadoFeedId.set(feed.id);
      this.toast.info(`Enlace iCal de ${feed.nombre_canal} copiado al portapapeles.`);
      setTimeout(() => this.copiadoFeedId.set(null), 3000);
    });
  }

  guardarFeed(feed: CanalIcal): void {
    this.guardandoId.set(feed.id);
    const orgId = this.orgService.orgActivaId() || 1;

    this.icalService.guardarFeed(orgId, this.alojamientoId, {
      id: feed.id,
      url_importacion: feed.url_importacion,
      activo: feed.activo,
    }).subscribe({
      next: (res) => {
        this.guardandoId.set(null);
        this.toast.success(`URL de ${feed.nombre_canal} guardada correctamente.`);
        if (res.sync?.ok) {
          this.toast.success(res.sync.message);
        }
        this.cargarFeeds();
      },
      error: (err) => {
        this.guardandoId.set(null);
        this.toast.error(err?.error?.message || 'Error al guardar la URL de sincronización.');
      },
    });
  }

  sincronizarAhora(feed: CanalIcal): void {
    if (!feed.url_importacion) {
      this.toast.error('Pegue primero la URL de importación provista por la OTA.');
      return;
    }

    this.sincronizandoId.set(feed.id);
    const orgId = this.orgService.orgActivaId() || 1;

    this.icalService.sincronizarAhora(orgId, this.alojamientoId, feed.id).subscribe({
      next: (res) => {
        this.sincronizandoId.set(null);
        if (res.ok) {
          this.toast.success(res.message);
          this.cargarFeeds();
        } else {
          this.toast.error(res.message);
        }
      },
      error: () => {
        this.sincronizandoId.set(null);
        this.toast.error('Fallo al conectar con el servidor externo de la OTA.');
      },
    });
  }
}
