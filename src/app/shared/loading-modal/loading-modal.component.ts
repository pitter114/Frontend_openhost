import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-loading-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modal-overlay">
      <div class="modal-panel">
        <div class="modal-loading">
          <div class="modal-loading__icon">
            <app-icon [name]="icono" class="pms-spin" [size]="32" />
          </div>
          <h3>{{ titulo }}</h3>
          <p>{{ subtitulo }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class LoadingModalComponent {
  @Input() titulo: string = 'Cargando datos…';
  @Input() subtitulo: string = 'Por favor espere un momento';
  @Input() icono: string = 'sparkles';
}
