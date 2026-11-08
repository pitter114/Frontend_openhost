import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminDataService } from '../../../core/services/superadmin-data.service';

@Component({
  selector: 'app-reservas-plataforma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas-plataforma.component.html',
  styleUrls: ['./reservas-plataforma.component.scss'],
})
export class ReservasPlataformaComponent implements OnInit {
  paginaActual = 1;
  itemsPorPagina = 8;

  constructor(public data: SuperadminDataService) {}

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.data.reservasPlataforma.length / this.itemsPorPagina));
  }

  get reservasPaginadas(): any[] {
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.data.reservasPlataforma.slice(start, start + this.itemsPorPagina);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  ngOnInit(): void {
    this.data.cargarDesdeBackend();
  }

  get comisionesGeneradas(): number {
    return this.data.reservasPlataforma.reduce((s, r) => s + r.comision, 0);
  }
  get netoHoteles(): number {
    return this.data.reservasPlataforma.reduce((s, r) => s + r.neto, 0);
  }

  estadoClass(e: string): string {
    return e === 'Confirmada' || e === 'completada' ? 'green' : 'blue';
  }
}
