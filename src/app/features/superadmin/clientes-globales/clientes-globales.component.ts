import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperadminDataService } from '../../../core/services/superadmin-data.service';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-clientes-globales',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './clientes-globales.component.html',
  styleUrls: ['./clientes-globales.component.scss'],
})
export class ClientesGlobalesComponent implements OnInit {
  paginaActual = 1;
  itemsPorPagina = 8;

  constructor(public data: SuperadminDataService) {}

  search = '';

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.itemsPorPagina));
  }

  get clientesPaginados(): any[] {
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.filtered.slice(start, start + this.itemsPorPagina);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }

  onSearchChange(): void {
    this.paginaActual = 1;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  ngOnInit(): void {
    this.data.cargarDesdeBackend();
  }

  get filtered() {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.data.clientesGlobales;
    return this.data.clientesGlobales.filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.documento.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term) ||
        c.telefono.toLowerCase().includes(term)
    );
  }

  nivelClass(n: string): string {
    return n === 'VIP' ? 'amber' : n === 'Frecuente' ? 'blue' : 'gray';
  }

  initials(nombre: string): string {
    return (nombre.trim().charAt(0) || 'U').toUpperCase();
  }
}
