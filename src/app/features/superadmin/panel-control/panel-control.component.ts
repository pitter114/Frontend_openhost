import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminDataService } from '../../../core/services/superadmin-data.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { BarChartComponent, BarSeries } from '../../../shared/charts/bar-chart/bar-chart.component';
import { AreaChartComponent, AreaSeries } from '../../../shared/charts/area-chart/area-chart.component';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [CommonModule, IconComponent, BarChartComponent, AreaChartComponent],
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss'],
})
export class PanelControlComponent implements OnInit {
  constructor(public data: SuperadminDataService) {}

  ngOnInit(): void {
    this.data.cargarDesdeBackend();
  }

  get comisionPorHotelSeries(): BarSeries[] {
    return [{ name: 'Comisión (S/)', color: '#3b6bf6', values: this.data.hoteles.filter((h) => h.estado === 'Activo').map((h) => h.comision) }];
  }

  get comisionPorHotelLabels(): string[] {
    return this.data.hoteles.filter((h) => h.estado === 'Activo').map((h) => this.shortName(h.nombre));
  }

  get evolucionSeries(): AreaSeries[] {
    return [{ name: 'Comisiones (S/)', color: '#f2870f', values: this.data.comisionEvolucion.map((d) => d.valor) }];
  }

  get evolucionLabels(): string[] {
    return this.data.comisionEvolucion.map((d) => d.mes);
  }

  shortName(nombre: string): string {
    const map: Record<string, string> = {
      'Hotel Pedro': 'H. Pedro',
      'FSDFDF (Sede Principal)': 'FSDFDF',
      'OpenHost Cloud Central': 'OpenHost',
    };
    return map[nombre] ?? nombre;
  }
}
