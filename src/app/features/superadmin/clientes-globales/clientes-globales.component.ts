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
  constructor(public data: SuperadminDataService) {}

  search = '';

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
